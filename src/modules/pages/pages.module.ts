import { Module } from '@nestjs/common';

import { PrismaModule } from '@infra/prisma';
import { RedisModule } from '@infra/redis';
import { TemplatesModule } from '@infra/templates';

import { AuthModule } from '../auth';
import { BranchesModule } from '../branches';
import { GroupsModule } from '../groups';
import { ReportsModule } from '../reports';
import { StudentsModule } from '../students';
import { UsersModule } from '../users';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [
    TemplatesModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    StudentsModule,
    BranchesModule,
    UsersModule,
    GroupsModule,
    ReportsModule,
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
