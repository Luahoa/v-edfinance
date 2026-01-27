import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatService } from './chat.service';
import { CommunityStatsService } from './community-stats.service';
import { SharingService } from './sharing.service';
import { SocialController } from './social.controller';
import { SocialGateway } from './social.gateway';
import { SocialService } from './social.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    SocialService,
    SocialGateway,
    ChatService,
    CommunityStatsService,
    SharingService,
  ],
  controllers: [SocialController],
  exports: [
    SocialService,
    SocialGateway,
    ChatService,
    CommunityStatsService,
    SharingService,
  ],
})
export class SocialModule {}
