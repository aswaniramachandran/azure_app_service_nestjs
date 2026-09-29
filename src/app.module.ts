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
import { RedisService } from './redis/redis.service';
import { KeyVaultService } from './key-vault/key-vault.service';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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

        // Azure PostgreSQL requires SSL/TLS
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),

    ProductsModule,
    StorageModule,
    AuthModule,

    UsersModule,

    KeyVaultModule,
  ],
  providers: [RedisService, KeyVaultService],
})
export class AppModule {}