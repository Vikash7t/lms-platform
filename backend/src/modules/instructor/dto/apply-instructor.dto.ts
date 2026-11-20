import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ApplyInstructorDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Headline must be at least 5 characters long' })
  @MaxLength(100, { message: 'Headline cannot exceed 100 characters' })
  headline: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'Bio must be at least 30 characters long to demonstrate your background' })
  @MaxLength(2000, { message: 'Bio cannot exceed 2000 characters' })
  bio: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Website URL must be a valid HTTP or HTTPS URL' },
  )
  @MaxLength(255)
  websiteUrl?: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Twitter URL must be a valid HTTP or HTTPS URL' },
  )
  @MaxLength(255)
  twitterUrl?: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'LinkedIn URL must be a valid HTTP or HTTPS URL' },
  )
  @MaxLength(255)
  linkedinUrl?: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'GitHub URL must be a valid HTTP or HTTPS URL' },
  )
  @MaxLength(255)
  githubUrl?: string;
}
