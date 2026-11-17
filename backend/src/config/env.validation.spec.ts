import { validate, Environment } from './env.validation';

describe('Environment Validation', () => {
  const validConfig = {
    NODE_ENV: 'development',
    PORT: '8000',
    FRONTEND_URL: 'http://localhost:3000/',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'access_secret_with_more_than_32_characters_length',
    JWT_REFRESH_SECRET: 'refresh_secret_with_more_than_32_characters_length',
  };

  it('should validate and normalize valid configuration', () => {
    const config = validate(validConfig);
    expect(config.NODE_ENV).toBe(Environment.Development);
    expect(config.PORT).toBe(8000);
    // Trailing slash must be stripped
    expect(config.FRONTEND_URL).toBe('http://localhost:3000');
    expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
  });

  it('should throw if JWT_SECRET is shorter than 32 characters', () => {
    const invalidConfig = {
      ...validConfig,
      JWT_SECRET: 'too_short_secret',
    };
    expect(() => validate(invalidConfig)).toThrow(
      '[Configuration Validation Error]: JWT_SECRET: JWT_SECRET must be at least 32 characters for 256-bit entropy',
    );
  });

  it('should throw if JWT_SECRET and JWT_REFRESH_SECRET are identical', () => {
    const identicalSecret = 'identically_shared_secret_key_exceeding_32_characters';
    const invalidConfig = {
      ...validConfig,
      JWT_SECRET: identicalSecret,
      JWT_REFRESH_SECRET: identicalSecret,
    };
    expect(() => validate(invalidConfig)).toThrow(
      '[Configuration Security Error]: JWT_SECRET and JWT_REFRESH_SECRET must be distinct keys',
    );
  });

  it('should throw if PORT is outside 1-65535 range', () => {
    const invalidConfig = {
      ...validConfig,
      PORT: '70000',
    };
    expect(() => validate(invalidConfig)).toThrow(
      '[Configuration Validation Error]: PORT: PORT must not be greater than 65535',
    );
  });

  it('should convert empty string optional fields to undefined', () => {
    const configWithEmpty = {
      ...validConfig,
      CLOUDINARY_API_KEY: '',
      RAZORPAY_KEY_ID: '',
    };
    const config = validate(configWithEmpty);
    expect(config.CLOUDINARY_API_KEY).toBeUndefined();
    expect(config.RAZORPAY_KEY_ID).toBeUndefined();
  });
});
