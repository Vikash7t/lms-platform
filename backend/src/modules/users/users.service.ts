import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: {
    email: string;
    passwordHash?: string;
    googleId?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    isEmailVerified?: boolean;
    roles?: UserRole[];
  }): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: userData.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepository.create({
      ...userData,
      email: userData.email.toLowerCase(),
      roles: userData.roles || [UserRole.LEARNER],
    });

    return this.userRepository.save(user);
  }

  async findByEmail(
    email: string,
    includePasswordHash: boolean = false,
  ): Promise<User | null> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email });

    if (includePasswordHash) {
      query.addSelect('user.passwordHash');
    }

    return query.getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async linkGoogleId(userId: string, googleId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.googleId = googleId;
    user.isEmailVerified = true;
    return this.userRepository.save(user);
  }

  async updateRoles(userId: string, roles: UserRole[]): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.roles = Array.from(new Set(roles));
    return this.userRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
