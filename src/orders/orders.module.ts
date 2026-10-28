import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';

import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';

import { Product } from '../products/product.entity';

import { User } from '../users/user.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Cart,
      CartItem,
      Product,
      User,
    ]),

    AuthModule,
  ],

  controllers: [
    OrdersController,
  ],

  providers: [
    OrdersService,
  ],

  exports: [
    OrdersService,
  ],
})
export class OrdersModule {}