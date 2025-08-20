import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
  const hashed = (user as any).password || '';
  const match = await bcrypt.compare(pass, hashed);
    if (match) {
      // remove password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user as any;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }
}
