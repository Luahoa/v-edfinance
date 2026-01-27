import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import type { LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';
import type { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ValidationPipe())
  @Throttle({ short: { limit: 5, ttl: 900000 } })
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  @Post('register')
  @UsePipes(new ValidationPipe())
  @Throttle({ short: { limit: 3, ttl: 3600000 } })
  signUp(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 429, description: 'Too many refresh attempts' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @UsePipes(new ValidationPipe())
  @Throttle({ short: { limit: 10, ttl: 3600000 } })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken) {
      throw new (require('@nestjs/common').BadRequestException)(
        'Refresh token is required',
      );
    }
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Logout (revoke current token)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout(req);
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'All tokens revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(@Req() req: Request) {
    return this.authService.logoutAll(req);
  }
}
