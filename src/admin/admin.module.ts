// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from '../users/user.entity';
// import { AuthModule } from '../auth/auth.module';
// import { AdminsController } from './admin.controller';
// import { AdminsService } from './admin.service';


// @Module({
//   imports: [TypeOrmModule.forFeature([User]), AuthModule],
//   controllers: [AdminsController],
//   providers: [AdminsService],
// })
// export class AdminModule {}



import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';

import { Order } from '../orders/order.entity';

import { AuthModule } from '../auth/auth.module';

import { AdminsController } from './admin.controller';

import { AdminsService } from './admin.service';

import { AdminOrdersController } from './admin-orders.controller';

import { AdminOrdersService } from './admin-orders.service';
import { OrderTrackingModule } from '../order-tracking/order-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Order,
       
    ]),
    AuthModule,
    OrderTrackingModule,
  ],

  controllers: [
    AdminsController,
    AdminOrdersController,
  ],

  providers: [
    AdminsService,
    AdminOrdersService,
  ],
})
export class AdminModule {}