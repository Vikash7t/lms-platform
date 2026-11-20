import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  InstructorProfile,
  InstructorStatus,
} from './entities/instructor-profile.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyInstructorDto } from './dto/apply-instructor.dto';
import { RejectInstructorDto } from './dto/reject-instructor.dto';
import { QueryInstructorDto } from './dto/query-instructor.dto';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async apply(
    userId: string,
    dto: ApplyInstructorDto,
  ): Promise<InstructorProfile> {
    const existing = await this.instructorProfileRepository.findOne({
      where: { userId },
    });

    if (existing) {
      if (existing.status === InstructorStatus.PENDING) {
        throw new ConflictException(
          'Your instructor application is already pending administrator review.',
        );
      }

      if (existing.status === InstructorStatus.APPROVED) {
        throw new BadRequestException(
          'You are already an approved instructor.',
        );
      }

      // If status is REJECTED, allow re-application by updating fields & resetting to PENDING
      existing.headline = dto.headline.trim();
      existing.bio = dto.bio.trim();
      existing.websiteUrl = dto.websiteUrl?.trim();
      existing.twitterUrl = dto.twitterUrl?.trim();
      existing.linkedinUrl = dto.linkedinUrl?.trim();
      existing.githubUrl = dto.githubUrl?.trim();
      existing.status = InstructorStatus.PENDING;
      existing.rejectionReason = undefined;
      existing.approvedAt = undefined;

      return this.instructorProfileRepository.save(existing);
    }

    try {
      const profile = this.instructorProfileRepository.create({
        userId,
        headline: dto.headline.trim(),
        bio: dto.bio.trim(),
        websiteUrl: dto.websiteUrl?.trim(),
        twitterUrl: dto.twitterUrl?.trim(),
        linkedinUrl: dto.linkedinUrl?.trim(),
        githubUrl: dto.githubUrl?.trim(),
        status: InstructorStatus.PENDING,
      });

      return await this.instructorProfileRepository.save(profile);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'An instructor profile already exists for this account.',
        );
      }
      throw error;
    }
  }

  async getProfileForUser(userId: string): Promise<InstructorProfile | null> {
    return this.instructorProfileRepository.findOne({
      where: { userId },
    });
  }

  async findById(id: string): Promise<InstructorProfile> {
    const profile = await this.instructorProfileRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(
        `Instructor application with ID '${id}' not found`,
      );
    }

    return profile;
  }

  async findAll(query: QueryInstructorDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.instructorProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .select([
        'profile.id',
        'profile.userId',
        'profile.headline',
        'profile.bio',
        'profile.websiteUrl',
        'profile.twitterUrl',
        'profile.linkedinUrl',
        'profile.githubUrl',
        'profile.status',
        'profile.rejectionReason',
        'profile.approvedAt',
        'profile.createdAt',
        'profile.updatedAt',
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatarUrl',
        'user.roles',
        'user.createdAt',
      ])
      .orderBy('profile.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      queryBuilder.where('profile.status = :status', { status: query.status });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async approve(id: string): Promise<InstructorProfile> {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(InstructorProfile, {
        where: { id },
        relations: { user: true },
      });

      if (!profile) {
        throw new NotFoundException(
          `Instructor application with ID '${id}' not found`,
        );
      }

      if (profile.status === InstructorStatus.APPROVED) {
        return profile; // Idempotent return
      }

      profile.status = InstructorStatus.APPROVED;
      profile.approvedAt = new Date();
      profile.rejectionReason = undefined;
      const updatedProfile = await manager.save(InstructorProfile, profile);

      const user = profile.user;
      if (user && !user.roles.includes(UserRole.INSTRUCTOR)) {
        user.roles = [...user.roles, UserRole.INSTRUCTOR];
        await manager.save(User, user);
      }

      return updatedProfile;
    });
  }

  async reject(id: string, dto: RejectInstructorDto): Promise<InstructorProfile> {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(InstructorProfile, {
        where: { id },
        relations: { user: true },
      });

      if (!profile) {
        throw new NotFoundException(
          `Instructor application with ID '${id}' not found`,
        );
      }

      profile.status = InstructorStatus.REJECTED;
      profile.rejectionReason = dto.reason.trim();
      profile.approvedAt = undefined;
      const updatedProfile = await manager.save(InstructorProfile, profile);

      const user = profile.user;
      if (user && user.roles.includes(UserRole.INSTRUCTOR)) {
        user.roles = user.roles.filter((r) => r !== UserRole.INSTRUCTOR);
        await manager.save(User, user);
      }

      return updatedProfile;
    });
  }
}
