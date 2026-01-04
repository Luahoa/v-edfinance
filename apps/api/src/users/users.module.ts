import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersProfileController } from './users-profile.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [UsersService],
  controllers: [UsersController, UsersProfileController],
  exports: [UsersService],
})
export class UsersModule {}
