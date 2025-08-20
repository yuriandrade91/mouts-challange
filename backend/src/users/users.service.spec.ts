import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Partial<Repository<User>>>;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => dto as any),
      save: jest.fn().mockImplementation((u) => ({ id: '1', ...u })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      preload: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(null),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('create should hash password, save and clear cache', async () => {
    const dto: any = { name: 'n', email: 'e@e.com', password: 'pass' };
    const res = await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalled();
    expect((res as any).password).toBeUndefined();
  });

  it('create should throw ConflictException on duplicate email', async () => {
    const dto: any = { name: 'n', email: 'dup@e.com', password: 'pass' };
    (repo.save as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }));
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll returns cached when present', async () => {
    const cached = JSON.stringify([{ id: '1', name: 'n' }]);
    (redis.get as jest.Mock).mockResolvedValueOnce(cached);
    const res = await service.findAll();
    expect(res).toEqual(JSON.parse(cached));
  });

  it('findOne throws NotFoundException when missing', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update throws NotFoundException when preload null', async () => {
    (repo.preload as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.update('1', { name: 'x' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove throws NotFoundException when user not found', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.remove('1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
