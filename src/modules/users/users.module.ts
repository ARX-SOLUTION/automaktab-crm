import { Module } from '@nestjs/common';

import { MailModule } from '@infra/mail';

import { EmailChangeService } from './email-change.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [UsersService, EmailChangeService],
  exports: [UsersService],
})
export class UsersModule {}
