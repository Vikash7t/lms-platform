import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateSlug } from './utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug: slug.toLowerCase().trim() },
    });
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    return category;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const name = dto.name.trim();
    const slug = dto.slug ? generateSlug(dto.slug) : generateSlug(name);

    const existingName = await this.categoryRepository.findOne({
      where: { name },
    });
    if (existingName) {
      throw new ConflictException(`Category with name '${name}' already exists`);
    }

    const existingSlug = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    const category = this.categoryRepository.create({
      name,
      slug,
      description: dto.description?.trim(),
      iconName: dto.iconName?.trim(),
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (dto.name && dto.name.trim() !== category.name) {
      const existingName = await this.categoryRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException(
          `Category with name '${dto.name.trim()}' already exists`,
        );
      }
      category.name = dto.name.trim();

      if (!dto.slug) {
        category.slug = generateSlug(category.name);
      }
    }

    if (dto.slug) {
      const newSlug = generateSlug(dto.slug);
      if (newSlug !== category.slug) {
        const existingSlug = await this.categoryRepository.findOne({
          where: { slug: newSlug },
        });
        if (existingSlug && existingSlug.id !== id) {
          throw new ConflictException(
            `Category with slug '${newSlug}' already exists`,
          );
        }
        category.slug = newSlug;
      }
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim();
    }

    if (dto.iconName !== undefined) {
      category.iconName = dto.iconName?.trim();
    }

    return this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    const category = await this.findById(id);
    await this.categoryRepository.remove(category);
    return { deleted: true, id };
  }
}
