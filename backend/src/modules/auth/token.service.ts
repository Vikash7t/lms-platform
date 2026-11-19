import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Response } from 'express';
import { User } from '../users/entities/user.entity';
import { EnvironmentVariables } from '../../config/env.validation';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn: '15m',
    });
  }

  generateRawRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  getRefreshCookieOptions() {
    const isProd =
      this.configService.get('NODE_ENV', { infer: true }) === 'production';

    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  setRefreshCookie(res: Response, rawToken: string): void {
    res.cookie(
      REFRESH_COOKIE_NAME,
      rawToken,
      this.getRefreshCookieOptions(),
    );
  }

  clearRefreshCookie(res: Response): void {
    const options = this.getRefreshCookieOptions();
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: options.path,
      secure: options.secure,
      sameSite: options.sameSite,
      httpOnly: options.httpOnly,
    });
  }
}
