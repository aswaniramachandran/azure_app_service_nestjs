import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';

import { CartController } from './cart.controller';
import { CartService } from './cart.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      Product,
    ]),

    AuthModule,
  ],

  controllers: [CartController],

  providers: [CartService],

  exports: [CartService],
})
export class CartModule {}