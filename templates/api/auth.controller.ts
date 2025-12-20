import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

interface RegisterDto {
  email: string;
  password: string;
  preferredLocale: string;
}

interface LoginDto {
  email: string;
  password: string;
}
