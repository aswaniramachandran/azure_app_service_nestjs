


import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis?: Redis;
  private redisUnavailableLogged = false;

  async onModuleInit(): Promise<void> {
    const host = process.env.REDIS_HOST?.trim();
    const port = Number(process.env.REDIS_PORT || 10000);
    const username = process.env.REDIS_USERNAME?.trim() || 'default';
    const password = process.env.REDIS_PASSWORD;

    // Validate Redis configuration
    if (!host) {
      throw new Error('REDIS_HOST must be configured');
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('REDIS_PORT must be a valid port number');
    }

    if (!password) {
      throw new Error('REDIS_PASSWORD must be configured');
    }

    // Connect to Azure Managed Redis using access-key authentication
    this.redis = new Redis({
      host,
      port,
      username,
      password,
      tls: {
        servername: host,
      },
      connectTimeout: 10000,
      retryStrategy: (attempt: number) => {
        return Math.min(attempt * 1000, 10000);
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connecting to Azure Redis...');
    });

    this.redis.on('error', (error: Error) => {
      if (this.redisUnavailableLogged) {
        return;
      }

      this.redisUnavailableLogged = true;

      this.logger.warn(
        `Redis connection unavailable; reconnecting: ${error.message}`,
      );
    });

    this.redis.on('ready', () => {
      this.redisUnavailableLogged = false;
      this.logger.log('Redis connection restored and ready');
    });

    try {
      await this.redis.ping();
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.error(
        'Initial Redis connection failed. Check the host, network, and authentication settings.',
      );

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        this.logger.log('Redis connection closed');
      } catch {
        this.redis.disconnect();
      }
    }
  }

  getClient(): Redis {
    if (!this.redis) {
      throw new Error('Redis client is not initialized');
    }

    return this.redis;
  }
}
