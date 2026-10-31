import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const logger = new Logger('Redis');
        const redis = new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 5000,
          commandTimeout: 3000,
          maxRetriesPerRequest: 2,
        });
        redis.on('error', (err) => logger.error(err.message));

        // Atômico: só define se ainda não existir
        await redis.set('url_id_counter', 80000, 'NX');

        return redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
