import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockService = {
  create: jest.fn().mockResolvedValue({ id: '1', name: 'Alice', email: 'alice@alice.com' }),
  findAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Alice', email: 'alice@alice.com' }]),
  findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Alice', email: 'alice@alice.com' }),
  update: jest.fn().mockResolvedValue({ id: '1', name: 'Alice Updated', email: 'alice@alice.com' }),
  remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should forward dto to service.create', async () => {
    const dto = { name: 'a', email: 'a@a.com' } as any;
    const res = await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  expect(res).toEqual({ id: '1', name: 'Alice', email: 'alice@alice.com' });
  });

  it('findAll should call service.findAll', async () => {
    await controller.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('findOne should call service.findOne with id', async () => {
    const res = await controller.findOne('1');
    expect(mockService.findOne).toHaveBeenCalledWith('1');
  expect(res).toEqual({ id: '1', name: 'Alice', email: 'alice@alice.com' });
  });

  it('update should call service.update and return updated', async () => {
    const res = await controller.update('1', { name: 'b' } as any);
    expect(mockService.update).toHaveBeenCalledWith('1', { name: 'b' });
  expect(res).toEqual({ id: '1', name: 'Alice Updated', email: 'alice@alice.com' });
  });

  it('remove should call service.remove and return deletion result', async () => {
    const res = await controller.remove('2');
    expect(mockService.remove).toHaveBeenCalledWith('2');
    expect(res).toEqual({ deleted: true });
  });

  it('me should return req.user', () => {
    const fakeReq = { user: { id: '1', email: 'alice@alice.com' } } as any;
    // call controller.me directly
    // @ts-ignore
    const me = (controller as any).me(fakeReq);
    expect(me).toEqual({ id: '1', email: 'alice@alice.com' });
  });
});
