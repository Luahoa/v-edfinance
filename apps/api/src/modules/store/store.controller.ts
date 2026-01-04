import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StoreService } from './store.service';

@Controller('store')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('items')
  async getItems() {
    return this.storeService.getStoreItems();
  }

  @Post('buy/streak-freeze')
  async buyStreakFreeze(@Request() req: { user: { id: string } }) {
    return this.storeService.buyStreakFreeze(req.user.id);
  }
}
