import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive a JWT access token' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, password: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Successful login', schema: { example: { access_token: 'eyJhbGciOiJIUzI1Ni...' } } })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return { status: 'error', message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }
}
