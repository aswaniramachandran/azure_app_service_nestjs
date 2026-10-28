import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './category.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    StorageModule,
    AuthModule,
  ],

  controllers: [
    CategoriesController,
  ],

  providers: [
    CategoriesService,
  ],

  exports: [
    CategoriesService,
  ],
})
export class CategoriesModule {}