
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { OrderTrackingModule } from '../order-tracking/order-tracking.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ProductsModule,
    OrdersModule,
    OrderTrackingModule,
     AuthModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
