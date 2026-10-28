
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VisualSearchService } from './visual-search.service';
import { VisualSearchController } from './visual-search.controller';
import { ProductImageEmbedding } from './product-image-embedding.entity';
import { Product } from '../products/product.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImageEmbedding,
    ]),
     StorageModule,
  ],
  controllers: [VisualSearchController],
  providers: [VisualSearchService],
  exports: [VisualSearchService],
})
export class VisualSearchModule {}
