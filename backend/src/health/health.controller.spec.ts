import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;

  const mockDataSource: Partial<DataSource> = {
    query: jest.fn(),
  };

  const mockRedisClient = {
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockDataSource },
        { provide: 'REDIS_CLIENT', useValue: mockRedisClient },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should report ok when db and redis healthy (ping returns PONG)', async () => {
  (mockDataSource.query as jest.Mock).mockResolvedValue([1]);
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await controller.check();
    expect(res.status).toBe('ok');
    expect(res.checks.db).toBe(true);
    expect(res.checks.redis).toBe(true);
  });

  it('should report fail when db query throws', async () => {
  (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('db down'));
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await controller.check();
    expect(res.status).toBe('fail');
    expect(res.checks.db).toBe(false);
    expect(res.checks.redis).toBe(true);
  });

  it('should report redis false when ping throws and set fallback returns falsy', async () => {
  (mockDataSource.query as jest.Mock).mockResolvedValue([1]);
    mockRedisClient.ping.mockRejectedValue(new Error('redis down'));
    mockRedisClient.set.mockResolvedValue(null);

    const res = await controller.check();
    expect(res.status).toBe('fail');
    expect(res.checks.db).toBe(true);
    expect(res.checks.redis).toBe(false);
  });
});
