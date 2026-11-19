import { User, UserRole } from '../../users/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  roles: UserRole[];
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    roles: user.roles || [UserRole.LEARNER],
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}
