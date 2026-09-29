// import { Injectable } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Repository } from "typeorm";
// import { Product } from "./product.entity";
// import { RedisService } from "../redis/redis.service";

// @Injectable()
// export class ProductsService {
//   constructor(
//     @InjectRepository(Product)
//     private repo: Repository<Product>,

//     private redisService: RedisService,
//   ) {}

//   create(data: any) {
//     return this.repo.save(data);
//   }

//   async findAll() {
//     const redis = this.redisService.getClient();

//     // 1. Check Redis
//     const cachedProducts = await redis.get("products");

//     if (cachedProducts) {
//       console.log("Products returned from Redis");

//       return JSON.parse(cachedProducts);
//     }

//     // 2. Redis miss → get from PostgreSQL
//     console.log("Products returned from PostgreSQL");

//     const products = await this.repo.find();

//     // 3. Store result in Redis for 60 seconds
//     await redis.set(
//       "products",
//       JSON.stringify(products),
//       "EX",
//       60,
//     );

//     return products;
//   }

//   findOne(id: number) {
//     return this.repo.findOneBy({
//       id,
//     });
//   }

//   async update(id: number, data: any) {
//     const result = await this.repo.update(id, data);

//     // Remove old cached product list
//     await this.redisService.getClient().del("products");

//     return result;
//   }

//   async remove(id: number) {
//     const result = await this.repo.delete(id);

//     // Remove old cached product list
//     await this.redisService.getClient().del("products");

//     return result;
//   }
// }












import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './product.entity';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,

    private redisService: RedisService,

    private storageService: StorageService,
  ) {}

  async create(data: any, image?: any) {
    // Upload image to Azure Blob Storage
    if (image) {
      const imageUrl =
        await this.storageService.uploadFile(image);

      data.imageUrl = imageUrl;
    }

    // Save product to PostgreSQL
    const product = await this.repo.save(data);

    // Clear Redis cache
    await this.redisService
      .getClient()
      .del('products');

    return product;
  }

  async findAll() {
    const redis = this.redisService.getClient();

    // Check Redis
    const cachedProducts =
      await redis.get('products');

    if (cachedProducts) {
      console.log(
        'Products returned from Redis',
      );

      return JSON.parse(cachedProducts);
    }

    // Redis miss → PostgreSQL
    console.log(
      'Products returned from PostgreSQL',
    );

    const products =
      await this.repo.find();

    // Store in Redis for 60 seconds
    await redis.set(
      'products',
      JSON.stringify(products),
      'EX',
      60,
    );

    return products;
  }

  findOne(id: number) {
    return this.repo.findOneBy({
      id,
    });
  }

  async update(
    id: number,
    data: any,
  ) {
    const result =
      await this.repo.update(
        id,
        data,
      );

    // Remove old cached product list
    await this.redisService
      .getClient()
      .del('products');

    return result;
  }

  async remove(id: number) {
    const result =
      await this.repo.delete(id);

    // Remove old cached product list
    await this.redisService
      .getClient()
      .del('products');

    return result;
  }
}

