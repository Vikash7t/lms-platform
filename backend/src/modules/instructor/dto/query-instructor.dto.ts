import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InstructorStatus } from '../entities/instructor-profile.entity';

export class QueryInstructorDto {
  @IsOptional()
  @IsEnum(InstructorStatus, {
    message: 'Status must be one of PENDING, APPROVED, or REJECTED',
  })
  status?: InstructorStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
