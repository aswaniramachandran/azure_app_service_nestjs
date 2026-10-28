import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './payment.entity';

import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../products/product.entity';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Order,
      OrderItem,
      Product,
    ]),

    AuthModule,
  ],

  controllers: [
    PaymentController,
  ],

  providers: [
    PaymentService,
  ],

  exports: [
    PaymentService,
  ],
})
export class PaymentModule {}