import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { ApplyInstructorDto } from './dto/apply-instructor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async apply(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyInstructorDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.instructorService.apply(userId, dto);
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser('id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.instructorService.getProfileForUser(userId);
  }
}
