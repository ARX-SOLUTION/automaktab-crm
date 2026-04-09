import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { validateEnv } from '@config';
import { JwtAuthGuard } from '@core/guards';
import { CorrelationIdMiddleware } from '@core/middleware';
import { LoggerModule } from '@infra/logger/logger.module';
import { MailModule } from '@infra/mail/mail.module';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { RedisModule } from '@infra/redis/redis.module';
import { StorageModule } from '@infra/storage';

import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { GroupsModule } from './modules/groups/groups.module';
import { HealthModule } from './modules/health/health.module';
import { PagesModule } from './modules/pages/pages.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StudentsModule } from './modules/students/students.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    LoggerModule,
    PrismaModule,
    RedisModule,
    MailModule,
    StorageModule,
    HealthModule,
    AuthModule,
    BranchesModule,
    GroupsModule,
    PagesModule,
    ReportsModule,
    StudentsModule,
    UsersModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
