import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import {
  InstructorProfile,
  InstructorStatus,
} from './entities/instructor-profile.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('InstructorService', () => {
  let service: InstructorService;
  let profileRepo: jest.Mocked<Partial<Repository<InstructorProfile>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'learner@example.com',
    roles: [UserRole.LEARNER],
    firstName: 'Jane',
    lastName: 'Doe',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfile: InstructorProfile = {
    id: 'profile-uuid-1',
    userId: 'user-uuid-1',
    user: mockUser,
    headline: 'Senior Full Stack Engineer',
    bio: 'Over 10 years of experience building scalable distributed web applications.',
    websiteUrl: 'https://janedoe.dev',
    status: InstructorStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    profileRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorService,
        {
          provide: getRepositoryToken(InstructorProfile),
          useValue: profileRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<InstructorService>(InstructorService);
  });

  describe('apply', () => {
    const applyDto = {
      headline: 'Senior Full Stack Engineer',
      bio: 'Over 10 years of experience building scalable distributed web applications.',
      websiteUrl: 'https://janedoe.dev',
    };

    it('should create a fresh application with PENDING status', async () => {
      (profileRepo.findOne as jest.Mock).mockResolvedValue(null);
      (profileRepo.create as jest.Mock).mockReturnValue(mockProfile);
      (profileRepo.save as jest.Mock).mockResolvedValue(mockProfile);

      const result = await service.apply(mockUser.id, applyDto);
      expect(result).toEqual(mockProfile);
      expect(profileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          status: InstructorStatus.PENDING,
        }),
      );
    });

    it('should throw ConflictException if an application is already PENDING', async () => {
      (profileRepo.findOne as jest.Mock).mockResolvedValue(mockProfile);

      await expect(service.apply(mockUser.id, applyDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if applicant is already APPROVED', async () => {
      (profileRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockProfile,
        status: InstructorStatus.APPROVED,
      });

      await expect(service.apply(mockUser.id, applyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow re-application and reset status to PENDING if previously REJECTED', async () => {
      const rejectedProfile: InstructorProfile = {
        ...mockProfile,
        status: InstructorStatus.REJECTED,
        rejectionReason: 'Bio too brief',
      };
      (profileRepo.findOne as jest.Mock).mockResolvedValue(rejectedProfile);
      (profileRepo.save as jest.Mock).mockImplementation((item) =>
        Promise.resolve(item),
      );

      const result = await service.apply(mockUser.id, {
        ...applyDto,
        bio: 'Comprehensive rewritten bio explaining technical credentials in deep detail.',
      });

      expect(result.status).toBe(InstructorStatus.PENDING);
      expect(result.rejectionReason).toBeUndefined();
    });
  });

  describe('approve', () => {
    it('should atomically update status to APPROVED and add INSTRUCTOR role to user', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          ...mockProfile,
          user: { ...mockUser, roles: [UserRole.LEARNER] },
        }),
        save: jest.fn().mockImplementation((_entity, item) => Promise.resolve(item)),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      const result = await service.approve(mockProfile.id);

      expect(result.status).toBe(InstructorStatus.APPROVED);
      expect(result.approvedAt).toBeInstanceOf(Date);
      expect(mockManager.save).toHaveBeenCalledTimes(2); // saves profile and user
    });

    it('should return immediately if profile is already APPROVED (idempotent)', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          ...mockProfile,
          status: InstructorStatus.APPROVED,
        }),
        save: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      const result = await service.approve(mockProfile.id);
      expect(result.status).toBe(InstructorStatus.APPROVED);
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.approve('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('should atomically update status to REJECTED, store reason, and revoke INSTRUCTOR role', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          ...mockProfile,
          status: InstructorStatus.PENDING,
          user: { ...mockUser, roles: [UserRole.LEARNER, UserRole.INSTRUCTOR] },
        }),
        save: jest.fn().mockImplementation((_entity, item) => Promise.resolve(item)),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      const result = await service.reject(mockProfile.id, {
        reason: 'Insufficient portfolio experience provided.',
      });

      expect(result.status).toBe(InstructorStatus.REJECTED);
      expect(result.rejectionReason).toBe(
        'Insufficient portfolio experience provided.',
      );
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });
  });
});
