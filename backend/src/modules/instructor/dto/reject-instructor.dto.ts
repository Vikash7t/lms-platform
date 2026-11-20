import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RejectInstructorDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required for administrative clarity' })
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters long' })
  @MaxLength(500, { message: 'Rejection reason cannot exceed 500 characters' })
  reason: string;
}
