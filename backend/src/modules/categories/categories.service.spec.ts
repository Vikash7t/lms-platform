import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: jest.Mocked<Partial<Repository<Category>>>;

  const mockCategory: Category = {
    id: 'cat-uuid-1',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Learn modern web engineering',
    iconName: 'Code',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    categoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepo,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      (categoryRepo.find as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
      expect(categoryRepo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findBySlug', () => {
    it('should return a category if it exists', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.findBySlug('web-development');
      expect(result).toEqual(mockCategory);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'web-development' },
      });
    });

    it('should throw NotFoundException if category does not exist', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should successfully create a category with auto-generated slug', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(null);
      (categoryRepo.create as jest.Mock).mockReturnValue(mockCategory);
      (categoryRepo.save as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.create({
        name: 'Web Development',
        description: 'Learn modern web engineering',
        iconName: 'Code',
      });

      expect(result).toEqual(mockCategory);
      expect(categoryRepo.create).toHaveBeenCalledWith({
        name: 'Web Development',
        slug: 'web-development',
        description: 'Learn modern web engineering',
        iconName: 'Code',
      });
    });

    it('should throw ConflictException if category name already exists', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValueOnce(mockCategory);

      await expect(
        service.create({ name: 'Web Development' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if category slug already exists', async () => {
      (categoryRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // name check passes
        .mockResolvedValueOnce(mockCategory); // slug check fails

      await expect(
        service.create({ name: 'New Web Dev', slug: 'web-development' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should successfully update category fields', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(mockCategory);
      (categoryRepo.save as jest.Mock).mockResolvedValue({
        ...mockCategory,
        description: 'Updated description',
      });

      const result = await service.update(mockCategory.id, {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
      expect(categoryRepo.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should successfully remove category', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(mockCategory);
      (categoryRepo.remove as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.delete(mockCategory.id);
      expect(result).toEqual({ deleted: true, id: mockCategory.id });
      expect(categoryRepo.remove).toHaveBeenCalledWith(mockCategory);
    });
  });
});
