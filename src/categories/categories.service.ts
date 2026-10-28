import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';
import { StorageService } from '../storage/storage.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SearchCategoriesDto } from './dto/search-categories.dto';
import { createPaginationResponse } from '../utils/response.util';
import { applyPagination } from '../utils/pagination.util';
import { applySearch } from '../utils/search.util';
import { applySort } from '../utils/sort.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,

    private readonly storageService: StorageService,
  ) {}

  // CREATE
  async create(
    data: CreateCategoryDto,
    image?: any,
  ) {
    const existing = await this.repo.findOne({
      where: {
        name: data.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Category with this name already exists',
      );
    }

    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.storageService.uploadFile(image);
    }

    const category = this.repo.create({
      name: data.name,
      description: data.description ?? null,
      imageUrl,
    });

    return this.repo.save(category);
  }



async findAll(query: SearchCategoriesDto = {}) {
  const qb = this.repo
    .createQueryBuilder('category')
    .loadRelationCountAndMap(
      'category.productCount',
      'category.products',
    );

  // SEARCH
  applySearch(
    qb,
    query,
    [
      'category.name',
      'category.description',
      'category.id',
    ],
  );

  // SORT
  const { sortBy, sortOrder } =
    applySort(
      qb,
      query,
      {
        id: 'category.id',
        name: 'category.name',
      },
    );

  // PAGINATION
  applyPagination(qb, query);

  // DATABASE
  const [categories, total] =
    await qb.getManyAndCount();

  // RESPONSE
  return createPaginationResponse(
    categories,
    total,
    query,
    sortBy,
    sortOrder,
  );
}
  // GET ONE
  async findOne(id: number) {
    const category = await this.repo.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // UPDATE
  async update(
    id: number,
    data: UpdateCategoryDto,
    image?: any,
  ) {
    const existing = await this.repo.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Check duplicate name
    if (
      data.name &&
      data.name.toLowerCase() !== existing.name.toLowerCase()
    ) {
      const duplicate = await this.repo.findOne({
        where: {
          name: data.name,
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'Category with this name already exists',
        );
      }
    }

    const updateData: Partial<Category> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    // New image
    if (image) {
      const newImageUrl =
        await this.storageService.uploadFile(image);

      updateData.imageUrl = newImageUrl;
    }

    await this.repo.update(id, updateData);

    // Delete old image AFTER new image uploaded successfully
    if (image && existing.imageUrl) {
      await this.storageService.deleteFile(
        existing.imageUrl,
      );
    }

    return this.findOne(id);
  }

  // DELETE
  async remove(id: number) {
    const existing = await this.repo.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.repo.delete(id);

    // Delete category image from Blob Storage
    if (existing.imageUrl) {
      await this.storageService.deleteFile(
        existing.imageUrl,
      );
    }

    return {
      message: 'Category deleted successfully',
    };
  }
}