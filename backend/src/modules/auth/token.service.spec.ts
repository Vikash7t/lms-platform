import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService, REFRESH_COOKIE_NAME } from './token.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    jwtService = new JwtService();
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET')
          return 'test_jwt_access_secret_min_32_characters_long';
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      }),
    } as any;

    tokenService = new TokenService(jwtService, configService as any);
  });

  it('should generate a valid JWT access token', () => {
    const mockUser = {
      id: 'uuid-123',
      email: 'student@example.com',
      roles: [UserRole.LEARNER],
    } as User;

    const token = tokenService.generateAccessToken(mockUser);
    expect(token).toBeDefined();

    const decoded = jwtService.decode(token) as any;
    expect(decoded.sub).toBe('uuid-123');
    expect(decoded.email).toBe('student@example.com');
    expect(decoded.roles).toContain(UserRole.LEARNER);
  });

  it('should generate high-entropy raw refresh tokens', () => {
    const token1 = tokenService.generateRawRefreshToken();
    const token2 = tokenService.generateRawRefreshToken();

    expect(token1).toHaveLength(128); // 64 bytes = 128 hex chars
    expect(token2).toHaveLength(128);
    expect(token1).not.toEqual(token2);
  });

  it('should hash refresh tokens deterministically using SHA-256', () => {
    const raw = 'sample_raw_token';
    const hash1 = tokenService.hashRefreshToken(raw);
    const hash2 = tokenService.hashRefreshToken(raw);

    expect(hash1).toHaveLength(64); // SHA-256 hex length
    expect(hash1).toEqual(hash2);
  });

  it('should produce secure cookie options', () => {
    const options = tokenService.getRefreshCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe('/api/auth');
    expect(options.sameSite).toBe('lax');
    expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should set and clear refresh cookie on response object', () => {
    const mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as any;

    tokenService.setRefreshCookie(mockRes, 'raw_token_xyz');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      'raw_token_xyz',
      expect.objectContaining({ httpOnly: true, path: '/api/auth' }),
    );

    tokenService.clearRefreshCookie(mockRes);
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: '/api/auth' }),
    );
  });
});
