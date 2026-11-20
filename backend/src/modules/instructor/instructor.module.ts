import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorProfile } from './entities/instructor-profile.entity';
import { User } from '../users/entities/user.entity';
import { InstructorService } from './instructor.service';
import { InstructorController } from './instructor.controller';
import { AdminInstructorController } from './admin-instructor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InstructorProfile, User])],
  controllers: [InstructorController, AdminInstructorController],
  providers: [InstructorService],
  exports: [InstructorService],
})
export class InstructorModule {}
