


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';

import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';  
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';


@Module({
  imports: [

    TypeOrmModule.forFeature([
       Category,  
      Product,
      Brand,
    ]),
    RedisModule,
    StorageModule,
    AuthModule, 
   
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
  
})
export class ProductsModule {}

