import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// In-memory token storage (zero persistent storage leaks)
let inMemoryAccessToken: string | null = null;
let isLoggingOut = false;
let onLogoutCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => inMemoryAccessToken;

export const setLoggingOut = (val: boolean) => {
  isLoggingOut = val;
};

export const setOnLogout = (cb: () => void) => {
  onLogoutCallback = cb;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-lms-client': 'web',
  },
});

// Request Interceptor: Attach in-memory access token & CSRF defense header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    if (config.headers) {
      config.headers['x-lms-client'] = 'web';
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Concurrency subscriber queue state
let isRefreshing = false;
interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: 401 handling with Subscriber Queue & Circuit Breaker
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If currently logging out, do not attempt to refresh
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    const is401 = error.response?.status === 401;
    const isRefreshCall = originalRequest.url?.includes('/auth/refresh');

    // Circuit Breaker: never attempt to refresh if the refresh call itself failed or if already retried
    if (is401 && (isRefreshCall || originalRequest._retry)) {
      setAccessToken(null);
      if (onLogoutCallback) {
        onLogoutCallback();
      }
      return Promise.reject(error);
    }

    if (is401 && !originalRequest._retry) {
      // If a refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post<{ accessToken: string }>(
          '/auth/refresh',
        );
        const newAccessToken = refreshResponse.data.accessToken;

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (onLogoutCallback) {
          onLogoutCallback();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Normalizes error messages from API responses, validation errors, or network failures.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      // Handle class-validator error array: { message: string[] }
      if (Array.isArray(data.message) && data.message.length > 0) {
        return data.message.join('; ');
      }
      // Handle standard NestJS HttpException: { message: string }
      if (typeof data.message === 'string') {
        return data.message;
      }
      // Handle error object string
      if (typeof data.error === 'string') {
        return data.error;
      }
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
