import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole, User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let passwordService: Partial<Record<keyof PasswordService, jest.Mock>>;
  let tokenService: Partial<Record<keyof TokenService, jest.Mock>>;
  let refreshTokenRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      linkGoogleId: jest.fn(),
    };

    passwordService = {
      hashPassword: jest.fn().mockResolvedValue('hashed_pw_xyz'),
      comparePassword: jest.fn(),
    };

    tokenService = {
      generateAccessToken: jest.fn().mockReturnValue('mock.jwt.access_token'),
      generateRawRefreshToken: jest.fn().mockReturnValue('mock_raw_refresh_token'),
      hashRefreshToken: jest.fn().mockReturnValue('mock_sha256_hash'),
      setRefreshCookie: jest.fn(),
      clearRefreshCookie: jest.fn(),
    };

    refreshTokenRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      create: jest.fn().mockImplementation((item) => item),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PasswordService, useValue: passwordService },
        { provide: TokenService, useValue: tokenService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should hash password, create user with LEARNER role, and issue tokens', async () => {
      const mockCreatedUser: User = {
        id: 'user-123',
        email: 'learner@example.com',
        roles: [UserRole.LEARNER],
        firstName: 'Jane',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.create!.mockResolvedValue(mockCreatedUser);

      const result = await authService.register(
        {
          email: 'learner@example.com',
          password: 'Password123!',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        mockRes,
      );

      expect(passwordService.hashPassword).toHaveBeenCalledWith('Password123!');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'learner@example.com',
          passwordHash: 'hashed_pw_xyz',
          roles: [UserRole.LEARNER],
        }),
      );
      expect(tokenService.setRefreshCookie).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock.jwt.access_token');
      expect(result.user.email).toBe('learner@example.com');
    });
  });

  describe('login', () => {
    it('should verify password and return user with access token', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'learner@example.com',
        passwordHash: 'stored_hash',
        roles: [UserRole.LEARNER],
        firstName: 'Jane',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail!.mockResolvedValue(mockUser);
      passwordService.comparePassword!.mockResolvedValue(true);

      const result = await authService.login(
        { email: 'learner@example.com', password: 'Password123!' },
        mockRes,
      );

      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        'Password123!',
        'stored_hash',
      );
      expect(result.accessToken).toBe('mock.jwt.access_token');
      expect(result.user.email).toBe('learner@example.com');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'learner@example.com',
        passwordHash: 'stored_hash',
        roles: [UserRole.LEARNER],
        firstName: 'Jane',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail!.mockResolvedValue(mockUser);
      passwordService.comparePassword!.mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'learner@example.com', password: 'WrongPassword!' },
          mockRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate valid refresh token and set new cookie', async () => {
      const existingToken: RefreshToken = {
        id: 'token-1',
        userId: 'user-123',
        tokenHash: 'mock_sha256_hash',
        familyId: 'family-abc',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          roles: [UserRole.LEARNER],
        } as User,
      };

      refreshTokenRepository.findOne.mockResolvedValue(existingToken);

      const result = await authService.rotateRefreshToken('raw_old_token', mockRes);

      expect(existingToken.isRevoked).toBe(true);
      expect(tokenService.setRefreshCookie).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock.jwt.access_token');
    });

    it('should allow concurrent rotation within 15s grace window', async () => {
      const revokedWithinGracePeriodToken: RefreshToken = {
        id: 'token-1',
        userId: 'user-123',
        tokenHash: 'mock_sha256_hash',
        familyId: 'family-abc',
        isRevoked: true,
        revokedAt: new Date(Date.now() - 3000), // 3 seconds ago (within 15s)
        expiresAt: new Date(Date.now() + 100000),
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          roles: [UserRole.LEARNER],
        } as User,
      };

      refreshTokenRepository.findOne.mockResolvedValue(revokedWithinGracePeriodToken);

      const result = await authService.rotateRefreshToken('raw_old_token', mockRes);

      expect(result.accessToken).toBe('mock.jwt.access_token');
      // Should NOT revoke family
      expect(refreshTokenRepository.update).not.toHaveBeenCalledWith(
        { familyId: 'family-abc' },
        expect.any(Object),
      );
    });

    it('should detect replay attack beyond grace window and revoke entire family', async () => {
      const expiredRevokedToken: RefreshToken = {
        id: 'token-1',
        userId: 'user-123',
        tokenHash: 'mock_sha256_hash',
        familyId: 'family-abc',
        isRevoked: true,
        revokedAt: new Date(Date.now() - 25000), // 25 seconds ago (beyond 15s)
        expiresAt: new Date(Date.now() + 100000),
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          roles: [UserRole.LEARNER],
        } as User,
      };

      refreshTokenRepository.findOne.mockResolvedValue(expiredRevokedToken);

      await expect(
        authService.rotateRefreshToken('stolen_raw_token', mockRes),
      ).rejects.toThrow(UnauthorizedException);

      // Entire family must be revoked
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { familyId: 'family-abc' },
        expect.objectContaining({ isRevoked: true }),
      );
      expect(tokenService.clearRefreshCookie).toHaveBeenCalled();
    });
  });
});
