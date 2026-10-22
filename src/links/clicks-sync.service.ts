import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from './link.entity.js';
import { Repository } from 'typeorm';
import { REDIS } from '../redis/redis.module.js';
import { Redis } from 'ioredis';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ClicksSyncService {
  private readonly logger = new Logger(ClicksSyncService.name);

  constructor(
    @InjectRepository(Link) private readonly repo: Repository<Link>,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sync() {
    const stream = this.redis.scanStream({ match: 'clicks:*', count: 100 });

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        const total = Number(await this.redis.getdel(key));
        if (!total) continue;

        const code = key.replace('clicks:', '');
        await this.repo.increment({ code }, 'clicks', total);
        this.logger.log(`${total} clique(s) salvos para ${code}`);
      }
    }
  }
}
