import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    const existingBrand = await this.brandRepo.findOne({
      where: {
        name: createBrandDto.name,
      },
    });

    if (existingBrand) {
      throw new ConflictException('Brand already exists');
    }

    const brand = this.brandRepo.create({
      name: createBrandDto.name,
    });

    return this.brandRepo.save(brand);
  }

  async findAll() {
    return this.brandRepo.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const brand = await this.brandRepo.findOne({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const brand = await this.findOne(id);

    if (updateBrandDto.name) {
      const existingBrand = await this.brandRepo.findOne({
        where: {
          name: updateBrandDto.name,
        },
      });

      if (existingBrand && existingBrand.id !== id) {
        throw new ConflictException('Brand already exists');
      }

      brand.name = updateBrandDto.name;
    }

    return this.brandRepo.save(brand);
  }

  async remove(id: number) {
    const brand = await this.findOne(id);

    await this.brandRepo.remove(brand);

    return {
      message: 'Brand deleted successfully',
    };
  }
}