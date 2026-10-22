import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { REDIS } from '../redis/redis.module.js';
import { Link } from './link.entity.js';
import { LinksService } from './links.service.js';

describe('LinksService', () => {
  let service: LinksService;

  const repo = { insert: vi.fn(), findOneBy: vi.fn() };
  const redis = { get: vi.fn(), set: vi.fn(), incr: vi.fn() };
  const config = { get: vi.fn().mockReturnValue('http://localhost:3000') };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: getRepositoryToken(Link), useValue: repo },
        { provide: REDIS, useValue: redis },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(LinksService);
  });

  describe('create', () => {
    it('cria o link e devolve um código de 7 caracteres', async () => {
      const result = await service.create('https://github.com');

      expect(result.code).toHaveLength(7);
      expect(result.shortUrl).toBe(`http://localhost:3000/${result.code}`);
      expect(repo.insert).toHaveBeenCalledWith({
        code: result.code,
        url: 'https://github.com',
      });
    });

    it('tenta de novo quando o código já existe', async () => {
      const duplicado = new QueryFailedError('INSERT', [], {
        code: '23505',
      } as never);
      repo.insert
        .mockRejectedValueOnce(duplicado)
        .mockResolvedValueOnce(undefined);

      await service.create('https://github.com');

      expect(repo.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolve', () => {
    it('usa o cache quando o link já está no Redis', async () => {
      redis.get.mockResolvedValue('https://github.com');

      const url = await service.resolve('abc1234');

      expect(url).toBe('https://github.com');
      expect(repo.findOneBy).not.toHaveBeenCalled();
      expect(redis.incr).toHaveBeenCalledWith('clicks:abc1234');
    });

    it('busca no banco e salva no cache quando não está no Redis', async () => {
      redis.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue({ url: 'https://github.com' });

      const url = await service.resolve('abc1234');

      expect(url).toBe('https://github.com');
      expect(redis.set).toHaveBeenCalledWith(
        'link:abc1234',
        'https://github.com',
        'EX',
        3600,
      );
    });

    it('lança NotFoundException quando o código não existe', async () => {
      redis.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.resolve('naoexiste')).rejects.toThrow(
        NotFoundException,
      );
      expect(redis.incr).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('soma os cliques do banco com os que ainda estão no Redis', async () => {
      repo.findOneBy.mockResolvedValue({
        code: 'abc1234',
        url: 'https://github.com',
        clicks: 5,
        createdAt: new Date(),
      });
      redis.get.mockResolvedValue('3');

      const result = await service.stats('abc1234');

      expect(result.clicks).toBe(8);
    });
  });
});
