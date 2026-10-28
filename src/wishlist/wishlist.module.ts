import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wishlist } from './wishlist.entity';
import { WishlistItem } from './wishlist-item.entity';

import { Product } from '../products/product.entity';

import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wishlist,
      WishlistItem,
      Product,
    ]),

    AuthModule,
  ],

  controllers: [
    WishlistController,
  ],

  providers: [
    WishlistService,
  ],

  exports: [
    WishlistService,
  ],
})
export class WishlistModule {}