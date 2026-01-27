import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BehaviorModule } from './behavior/behavior.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { CommonModule } from './common/common.module';
import { CoursesModule } from './courses/courses.module';
import { AdaptiveModule } from './modules/adaptive/adaptive.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DebugModule } from './modules/debug/debug.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { NudgeModule } from './modules/nudge/nudge.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { SocialModule } from './modules/social/social.module';
import { StoreModule } from './modules/store/store.module';
import { AiTutorModule } from './modules/ai-tutor/ai-tutor.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { MarketSimulatorModule } from './modules/market-simulator/market-simulator.module';
import { DocumentAnalyzerModule } from './modules/document-analyzer/document-analyzer.module';
import { QuizModule } from './modules/quiz/quiz.module'; // Phase 1 MVP: Quiz System
import { CertificateModule } from './modules/certificates/certificate.module'; // Phase 1 MVP: Certificate System
import { PaymentModule } from './modules/payment/payment.module'; // Phase 1 MVP: Payment System
import { KyselyModule } from './database/kysely.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    KyselyModule,
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    CoursesModule,
    BehaviorModule,
    StorageModule,
    AiModule,
    AiTutorModule,
    PredictionModule,
    RecommendationModule,
    MarketSimulatorModule,
    DocumentAnalyzerModule,
    ChecklistsModule,
    LeaderboardModule,
    StoreModule,
    NudgeModule,
    AnalyticsModule,
    AdaptiveModule,
    SimulationModule,
    SocialModule,
    QuizModule, // Phase 1 MVP: Quiz System
    CertificateModule, // Phase 1 MVP: Certificate System
    PaymentModule, // Phase 1 MVP: Payment System
    DebugModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
