import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  const mockUsersService = {
    findByEmail: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate and return user without password when credentials match', async () => {
    const password = 'secret';
    const hashed = await bcrypt.hash(password, 8);
    const user = { id: '1', email: 'a@b.com', password };
    mockUsersService.findByEmail.mockResolvedValue({ ...user, password: hashed });

    const result = await service.validateUser(user.email, password);
    expect(result).toBeDefined();
    expect((result as any).password).toBeUndefined();
    expect((result as any).email).toBe(user.email);
  });

  it('should return null when user not found or password mismatch', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    expect(await service.validateUser('x@y.com', 'nope')).toBeNull();

    const hashed = await bcrypt.hash('other', 8);
    mockUsersService.findByEmail.mockResolvedValue({ id: '2', email: 'x@y.com', password: hashed });
    expect(await service.validateUser('x@y.com', 'wrong')).toBeNull();
  });

  it('login should return an access_token', async () => {
    const user = { id: '1', email: 'a@b.com' };
    const res = await service.login(user as any);
    expect(res).toEqual({ access_token: 'signed-token' });
    expect(mockJwtService.sign).toHaveBeenCalled();
  });
});
