




import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KeyVaultModule } from './key-vault/key-vault.module';
import { ProductsModule } from './products/products.module';
import { Product } from './products/product.entity';
import { User } from './users/user.entity';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { PaymentModule } from './payment/payment.module';
import { OrderTrackingModule } from './order-tracking/order-tracking.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { VisualSearchModule } from './visual-search/visual-search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Product, User],
        autoLoadEntities: true,
        synchronize: true,
        ssl: { 
          rejectUnauthorized: false
         },
      }),
    }),

    ProductsModule,
    StorageModule,
    AuthModule,
    UsersModule,
    KeyVaultModule,
    AdminModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    OrdersModule,
    WishlistModule,
    PaymentModule,
    OrderTrackingModule,
    ChatbotModule,
    AdminDashboardModule,
    RecommendationsModule,
    VisualSearchModule,
  ],
})
export class AppModule {}