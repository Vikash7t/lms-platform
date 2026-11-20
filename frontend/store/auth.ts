import { create } from 'zustand';
import { api, setAccessToken, setLoggingOut, setOnLogout } from '@/lib/api';

export type UserRole = 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';

export interface UserResponseDto {
  id: string;
  email: string;
  roles: UserRole[];
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: UserResponseDto | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  setAuth: (user: UserResponseDto, accessToken: string) => void;
  clearAuth: () => void;
  restoreSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Register logout callback with api client for automated 401 circuit-breaker evictions
  setOnLogout(() => {
    set({ user: null, accessToken: null });
  });

  return {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,

    setAuth: (user, accessToken) => {
      setAccessToken(accessToken);
      set({ user, accessToken, isInitialized: true, isLoading: false });
    },

    clearAuth: () => {
      setAccessToken(null);
      set({ user: null, accessToken: null, isInitialized: true, isLoading: false });
    },

    restoreSession: async (): Promise<boolean> => {
      set({ isLoading: true });
      try {
        // Silent refresh: sends HttpOnly cookie automatically
        const refreshRes = await api.post<{ accessToken: string }>(
          '/auth/refresh',
        );
        const accessToken = refreshRes.data.accessToken;

        setAccessToken(accessToken);

        // Fetch current authenticated profile
        const userRes = await api.get<UserResponseDto>('/auth/me');

        set({
          user: userRes.data,
          accessToken,
          isInitialized: true,
          isLoading: false,
        });
        return true;
      } catch {
        setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isInitialized: true,
          isLoading: false,
        });
        return false;
      }
    },

    logout: async () => {
      setLoggingOut(true);
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore network errors on logout
      } finally {
        setAccessToken(null);
        setLoggingOut(false);
        set({ user: null, accessToken: null, isInitialized: true, isLoading: false });
      }
    },
  };
});
