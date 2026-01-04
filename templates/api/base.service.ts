import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BaseService {
  constructor(protected readonly prisma: PrismaService) {}

  async findAll() {
    // Implementation
  }

  async findOne(id: string) {
    // Implementation
  }

  async create(data: any) {
    // Implementation
  }

  async update(id: string, data: any) {
    // Implementation
  }

  async delete(id: string) {
    // Implementation
  }
}
