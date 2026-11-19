import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Headers,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';
import { REFRESH_COOKIE_NAME } from './token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { EnvironmentVariables } from '../../config/env.validation';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto; accessToken: string }> {
    return this.authService.register(registerDto, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto; accessToken: string }> {
    return this.authService.login(loginDto, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-lms-client') clientHeader?: string,
  ): Promise<{ accessToken: string }> {
    // CSRF defense: verify application-specific client header on cookie endpoint
    if (!clientHeader || clientHeader !== 'web') {
      throw new UnauthorizedException(
        'Access denied: Missing or invalid X-LMS-Client application header',
      );
    }

    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    return this.authService.rotateRefreshToken(rawRefreshToken, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    return this.authService.logout(rawRefreshToken, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return toUserResponse(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport redirects to Google consent
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', {
      infer: true,
    });
    return this.authService.handleGoogleCallback(req.user, res, frontendUrl);
  }
}
