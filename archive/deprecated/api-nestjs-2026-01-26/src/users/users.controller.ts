import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import type { UpdateInvestmentProfileDto } from './dto/investment-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile information.' })
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('investment-profile')
  @ApiOperation({ summary: 'Get user investment profile' })
  @ApiResponse({ status: 200, description: 'Return investment profile.' })
  getInvestmentProfile(@Request() req: any) {
    return this.usersService.getInvestmentProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('investment-profile')
  @ApiOperation({ summary: 'Update user investment profile' })
  @ApiResponse({
    status: 200,
    description: 'Investment profile updated successfully.',
  })
  updateInvestmentProfile(
    @Request() req: any,
    @Body() dto: UpdateInvestmentProfileDto,
  ) {
    return this.usersService.updateInvestmentProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Return dashboard stats.' })
  getDashboardStats(@Request() req: any) {
    return this.usersService.getDashboardStats(req.user.userId);
  }

  // VED-IU3: Admin endpoint to unlock locked accounts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/unlock/:userId')
  @ApiOperation({ summary: 'Admin: Unlock a locked user account' })
  @ApiResponse({ status: 200, description: 'Account unlocked successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  unlockAccount(@Param('userId') userId: string) {
    return this.usersService.unlockAccount(userId);
  }
}
