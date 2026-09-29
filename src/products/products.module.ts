// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';

// import { ProductsController } from './products.controller';
// import { ProductsService } from './products.service';
// import { Product } from './product.entity';

// import { RedisModule } from '../redis/redis.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Product]),
//     RedisModule,
//   ],
//   controllers: [ProductsController],
//   providers: [ProductsService],
// })
// export class ProductsModule {}




import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';

import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    RedisModule,
    StorageModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

