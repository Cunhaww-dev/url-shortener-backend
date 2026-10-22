import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Readable } from 'node:stream';
import { REDIS } from '../redis/redis.module.js';
import { ClicksSyncService } from './clicks-sync.service.js';
import { Link } from './link.entity.js';

describe('ClicksSyncService', () => {
  let service: ClicksSyncService;

  const repo = { increment: vi.fn() };
  const redis = { scanStream: vi.fn(), getdel: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ClicksSyncService,
        { provide: getRepositoryToken(Link), useValue: repo },
        { provide: REDIS, useValue: redis },
      ],
    }).compile();
    service = module.get(ClicksSyncService);
  });

  it('move os cliques do Redis para o banco', async () => {
    redis.scanStream.mockReturnValue(
      Readable.from([['clicks:abc1234', 'clicks:xyz9876']]),
    );
    redis.getdel.mockResolvedValueOnce('4').mockResolvedValueOnce(null);

    await service.sync();

    expect(repo.increment).toHaveBeenCalledTimes(1);
    expect(repo.increment).toHaveBeenCalledWith(
      { code: 'abc1234' },
      'clicks',
      4,
    );
  });
});
