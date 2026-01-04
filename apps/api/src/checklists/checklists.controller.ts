import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChecklistsService } from './checklists.service';

@Controller('checklists')
@UseGuards(JwtAuthGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  create(
    @Request() req: any,
    @Body() body: { title: string; category: string; items: any[] },
  ) {
    return this.checklistsService.create(
      req.user.userId,
      body.title,
      body.category,
      body.items,
    );
  }

  @Get()
  findAll(@Request() req: any) {
    return this.checklistsService.findAll(req.user.userId);
  }

  @Patch(':id/items/:index')
  updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: { completed: boolean },
  ) {
    return this.checklistsService.updateItem(
      req.user.userId,
      id,
      Number.parseInt(index),
      body.completed,
    );
  }
}
