import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Order } from '../orders/order.entity';
import { AuthModule } from '../auth/auth.module';

import { OrderTracking } from './order-tracking.entity';
import { OrderLiveLocation } from './order-live-location.entity';
import { AzureMapsService } from './azure-maps.service';
import { OrderTrackingService } from './order-tracking.service';
import { OrderTrackingController } from './order-tracking.controller';
import { AdminOrderTrackingController } from './admin-order-tracking.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([
      Order,
      OrderTracking,
      OrderLiveLocation,
    ]),
  ],
  controllers: [
    OrderTrackingController,
    AdminOrderTrackingController,
  ],
  providers: [
    OrderTrackingService,
    AzureMapsService,
  ],
  exports: [OrderTrackingService],
})
export class OrderTrackingModule {}