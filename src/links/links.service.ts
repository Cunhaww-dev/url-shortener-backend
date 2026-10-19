import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Redis } from 'ioredis';
import { QueryFailedError, Repository } from 'typeorm';
import { REDIS } from '../redis/redis.module.js';
import { Link } from './link.entity.js';

const CACHE_TTL_SECONDS = 60 * 60;
const MAX_TENTATIVAS = 3;

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link) private readonly repo: Repository<Link>,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async create(url: string) {
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      const code = randomBytes(5).toString('base64url');
      try {
        await this.repo.insert({ code, url });
        return { code, shortUrl: `${this.config.get('BASE_URL')}/${code}` };
      } catch (error) {
        const codigoRepetido =
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string }).code === '23505';
        if (!codigoRepetido || tentativa === MAX_TENTATIVAS) throw error;
      }
    }
    throw new Error('Não foi possível gerar um código único');
  }

  async resolve(code: string): Promise<string> {
    const cached = await this.redis.get(`link:${code}`);
    const url = cached ?? (await this.repo.findOneBy({ code }))?.url;
    if (!url) throw new NotFoundException('Link não encontrado');

    if (!cached)
      await this.redis.set(`link:${code}`, url, 'EX', CACHE_TTL_SECONDS);
    await this.repo.increment({ code }, 'clicks', 1);
    return url;
  }

  async stats(code: string) {
    const link = await this.repo.findOneBy({ code });
    if (!link) throw new NotFoundException('Link não encontrado');

    return {
      code: link.code,
      url: link.url,
      clicks: link.clicks,
      createdAt: link.createdAt,
    };
  }
}
