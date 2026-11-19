import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly gracePeriodMs = 15000; // 15-second grace window for concurrent requests

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(
    registerDto: RegisterDto,
    res: Response,
  ): Promise<{ user: UserResponseDto; accessToken: string }> {
    const passwordHash = await this.passwordService.hashPassword(
      registerDto.password,
    );

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      roles: [UserRole.LEARNER],
    });

    const accessToken = this.tokenService.generateAccessToken(user);
    await this.issueAndSetRefreshToken(user.id, res);

    return {
      user: toUserResponse(user),
      accessToken,
    };
  }

  async login(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{ user: UserResponseDto; accessToken: string }> {
    const user = await this.usersService.findByEmail(loginDto.email, true);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.tokenService.generateAccessToken(user);
    await this.issueAndSetRefreshToken(user.id, res);

    return {
      user: toUserResponse(user),
      accessToken,
    };
  }

  async rotateRefreshToken(
    rawOldToken: string | undefined,
    res: Response,
  ): Promise<{ accessToken: string }> {
    if (!rawOldToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.tokenService.hashRefreshToken(rawOldToken);
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid session');
    }

    // Reuse detection check with 15-second grace window for concurrent client requests
    if (existingToken.isRevoked) {
      const isWithinGraceWindow =
        existingToken.revokedAt &&
        Date.now() - existingToken.revokedAt.getTime() < this.gracePeriodMs;

      if (isWithinGraceWindow) {
        this.logger.debug(
          `Concurrent token rotation detected within grace window for user ${existingToken.userId}`,
        );
        const accessToken = this.tokenService.generateAccessToken(
          existingToken.user,
        );
        return { accessToken };
      }

      // Beyond grace window: Replay attack detected. Revoke entire session family!
      this.logger.warn(
        `Token replay attack detected for family ${existingToken.familyId}! Revoking all sessions.`,
      );
      await this.refreshTokenRepository.update(
        { familyId: existingToken.familyId },
        { isRevoked: true, revokedAt: new Date() },
      );
      this.tokenService.clearRefreshCookie(res);
      throw new UnauthorizedException(
        'Session security violation detected. Please log in again.',
      );
    }

    // Verify expiration
    if (existingToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.update(
        { id: existingToken.id },
        { isRevoked: true, revokedAt: new Date() },
      );
      this.tokenService.clearRefreshCookie(res);
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // Revoke old token
    existingToken.isRevoked = true;
    existingToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(existingToken);

    // Issue rotated token within same family
    const newRawToken = this.tokenService.generateRawRefreshToken();
    const newTokenHash = this.tokenService.hashRefreshToken(newRawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newRefreshToken = this.refreshTokenRepository.create({
      userId: existingToken.userId,
      tokenHash: newTokenHash,
      familyId: existingToken.familyId,
      expiresAt,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    this.tokenService.setRefreshCookie(res, newRawToken);

    const accessToken = this.tokenService.generateAccessToken(
      existingToken.user,
    );
    return { accessToken };
  }

  async logout(rawToken: string | undefined, res: Response): Promise<{ success: boolean }> {
    if (rawToken) {
      const tokenHash = this.tokenService.hashRefreshToken(rawToken);
      await this.refreshTokenRepository.update(
        { tokenHash },
        { isRevoked: true, revokedAt: new Date() },
      );
    }

    this.tokenService.clearRefreshCookie(res);
    return { success: true };
  }

  async handleGoogleCallback(
    profile: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      emailVerified: boolean;
    },
    res: Response,
    frontendUrl: string,
  ): Promise<void> {
    if (!profile.emailVerified) {
      throw new BadRequestException('Unverified Google email address rejected');
    }

    let user = await this.usersService.findByGoogleId(profile.id);

    if (!user) {
      // Check if email already registered locally
      const existingEmailUser = await this.usersService.findByEmail(
        profile.email,
      );

      if (existingEmailUser) {
        user = await this.usersService.linkGoogleId(
          existingEmailUser.id,
          profile.id,
        );
      } else {
        user = await this.usersService.create({
          email: profile.email,
          googleId: profile.id,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          avatarUrl: profile.avatarUrl,
          isEmailVerified: true,
          roles: [UserRole.LEARNER],
        });
      }
    }

    await this.issueAndSetRefreshToken(user.id, res);

    // Redirect to frontend auth callback without any tokens in the URL
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  private async issueAndSetRefreshToken(
    userId: string,
    res: Response,
  ): Promise<void> {
    const rawToken = this.tokenService.generateRawRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(rawToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      familyId,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
    this.tokenService.setRefreshCookie(res, rawToken);
  }
}
