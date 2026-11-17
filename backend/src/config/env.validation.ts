import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return 8000;
    return parseInt(value, 10);
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 8000;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/\/+$/, ''); // Strip trailing slashes
    }
    return value || 'http://localhost:3000';
  })
  @IsUrl({ require_tld: false })
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string =
    process.env.NODE_ENV === 'test'
      ? 'postgresql://test:test@localhost:5432/test_db'
      : '';

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters for 256-bit entropy',
  })
  JWT_SECRET: string =
    process.env.NODE_ENV === 'test'
      ? 'test_jwt_access_secret_min_32_characters_long'
      : '';

  @IsString()
  @MinLength(32, {
    message:
      'JWT_REFRESH_SECRET must be at least 32 characters for 256-bit entropy',
  })
  JWT_REFRESH_SECRET: string =
    process.env.NODE_ENV === 'test'
      ? 'test_jwt_refresh_secret_min_32_characters_long'
      : '';

  // Optional External Services (Phase 7 & Phase 13)
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  CLOUDINARY_API_KEY?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  CLOUDINARY_API_SECRET?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  RAZORPAY_KEY_ID?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  RAZORPAY_KEY_SECRET?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  RAZORPAY_WEBHOOK_SECRET?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map(
        (err) =>
          `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`,
      )
      .join(' | ');
    throw new Error(`[Configuration Validation Error]: ${errorMessages}`);
  }

  if (validatedConfig.JWT_SECRET === validatedConfig.JWT_REFRESH_SECRET) {
    throw new Error(
      '[Configuration Security Error]: JWT_SECRET and JWT_REFRESH_SECRET must be distinct keys',
    );
  }

  return validatedConfig;
}
