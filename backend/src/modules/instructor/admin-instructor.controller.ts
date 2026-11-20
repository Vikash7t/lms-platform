import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { QueryInstructorDto } from './dto/query-instructor.dto';
import { RejectInstructorDto } from './dto/reject-instructor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminInstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get()
  async findAll(@Query() query: QueryInstructorDto) {
    return this.instructorService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.instructorService.findById(id);
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.instructorService.approve(id);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectInstructorDto,
  ) {
    return this.instructorService.reject(id, dto);
  }
}
