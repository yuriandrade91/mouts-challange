import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  @Get()
  async check() {
    const result: any = { db: false, redis: false };
    try {
      await this.dataSource.query('SELECT 1');
      result.db = true;
    } catch (e: any) {
      result.db = false;
    }

    try {
      if (this.redisClient && typeof this.redisClient.ping === 'function') {
        const p = await this.redisClient.ping();
        result.redis = p === 'PONG' || p === 'OK' || !!p;
      } else if (this.redisClient && typeof this.redisClient.get === 'function') {
        // fallback for ioredis versions
        const ok = await this.redisClient.set('__health__', '1', 'EX', 3);
        result.redis = !!ok;
      }
    } catch (e: any) {
      result.redis = false;
    }

    const status = result.db && result.redis ? 'ok' : 'fail';
    return { status, checks: result };
  }
}
