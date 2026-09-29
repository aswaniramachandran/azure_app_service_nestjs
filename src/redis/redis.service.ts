
// import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import Redis from 'ioredis';
// import { DefaultAzureCredential } from '@azure/identity';

// @Injectable()
// export class RedisService implements OnModuleInit, OnModuleDestroy {
//   private redis!: Redis;

//   async onModuleInit() {
//     const credential = new DefaultAzureCredential();
//     const token = await credential.getToken('https://redis.azure.com/.default');

//     this.redis = new Redis({
//       host: process.env.REDIS_HOST,
//       port: Number(process.env.REDIS_PORT),
//       username: process.env.REDIS_USERNAME?.trim(),
//       password: token.token,
//       tls: { servername: process.env.REDIS_HOST },
//     });

//     this.redis.on('error', (err) => console.error('Redis error:', err.message));

//     await this.redis.ping();
//     console.log('Redis connected successfully');
//   }

//   async onModuleDestroy() {
//     await this.redis.quit();
//   }

//   getClient() {
//     return this.redis;
//   }
// }



import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cluster } from 'ioredis';
import { DefaultAzureCredential } from '@azure/identity';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis!: Cluster;

  async onModuleInit() {
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://redis.azure.com/.default');

    this.redis = new Cluster(
      [
        {
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT),
        },
      ],
      {
        redisOptions: {
          username: process.env.REDIS_USERNAME?.trim(),
          password: token.token,
          tls: { servername: process.env.REDIS_HOST },
        },
        dnsLookup: (address, cb) => cb(null, address), // keep the hostname for TLS
        slotsRefreshTimeout: 5000,
      },
    );

    this.redis.on('error', (err) => console.error('Redis error:', err.message));

    await this.redis.ping();
    console.log('Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  getClient() {
    return this.redis;
  }
}