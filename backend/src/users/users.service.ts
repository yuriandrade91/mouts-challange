import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  private cacheKeyAll = 'users:all';

  async create(createDto: CreateUserDto) {
    const user = this.usersRepo.create(createDto as any);
    if ((user as any).password) {
      (user as any).password = await bcrypt.hash((user as any).password, 10);
    }
    try {
  const saved = (await this.usersRepo.save(user)) as unknown as User;
      await this.redisClient.del(this.cacheKeyAll);
      await this.redisClient.del(`users:${saved.id}`);
  const { password, ...rest } = saved as any;
  return rest as User;
    } catch (e: any) {
      if (e && e.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw e;
    }
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findAll() {
    const cached = await this.redisClient.get(this.cacheKeyAll);
    if (cached) return JSON.parse(cached) as User[];
    const users = await this.usersRepo.find();
    const sanitized = users.map((u) => {
      const { password, ...rest } = u as any;
      return rest;
    });
    await this.redisClient.set(this.cacheKeyAll, JSON.stringify(sanitized), 'EX', 60);
    return sanitized as User[];
  }

  async findOne(id: string) {
    const key = `users:${id}`;
    const cached = await this.redisClient.get(key);
    if (cached) return JSON.parse(cached) as User;
    const user = await this.usersRepo.findOne({ where: { id } });
  if (!user) throw new NotFoundException('User not found');
  const { password, ...rest } = user as any;
  await this.redisClient.set(key, JSON.stringify(rest), 'EX', 60);
  return rest as User;
  }

  async update(id: string, updateDto: UpdateUserDto) {
    const user = await this.usersRepo.preload({ id, ...(updateDto as any) });
    if (!user) throw new NotFoundException('User not found');
  const saved = await this.usersRepo.save(user);
  await this.redisClient.del(this.cacheKeyAll);
  await this.redisClient.del(`users:${id}`);
  const { password, ...rest } = saved as any;
  return rest as User;
  }

  async remove(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.remove(user);
    await this.redisClient.del(this.cacheKeyAll);
    await this.redisClient.del(`users:${id}`);
    return { deleted: true };
  }
}
