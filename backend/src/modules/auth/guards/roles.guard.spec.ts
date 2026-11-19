import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  const createMockContext = (roles: UserRole[] = []): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            roles,
          },
        }),
      }),
    }) as any;

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext([UserRole.LEARNER]);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.INSTRUCTOR]);

    const context = createMockContext([UserRole.LEARNER, UserRole.INSTRUCTOR]);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.INSTRUCTOR]);

    const context = createMockContext([UserRole.LEARNER]);
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow administrator access if ADMIN role is in required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext([UserRole.LEARNER, UserRole.ADMIN]);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });
});
