import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { MailService } from '@infra/mail';
import { PrismaService } from '@infra/prisma';
import { EmailChangeCacheService, UserCacheService } from '@infra/redis';

import { RequestEmailChangeDto, VerifyEmailChangeDto } from './dto';

@Injectable()
export class EmailChangeService {
  private readonly logger = new Logger(EmailChangeService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private emailChangeCache: EmailChangeCacheService,
    private userCache: UserCacheService,
  ) {}

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestEmailChange(userId: string, dto: RequestEmailChangeDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValidPassword = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (user.email === dto.newEmail) {
      throw new BadRequestException('New email must be different from current email');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.newEmail, deletedAt: null },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    await this.emailChangeCache.invalidateByUserId(userId);

    const code = this.generateVerificationCode();

    await this.emailChangeCache.set(userId, user.email, dto.newEmail, code);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`Email change code for ${dto.newEmail}: ${code}`);
    }

    await this.mailService.sendEmailChangeVerification(dto.newEmail, code);
  }

  async verifyEmailChange(userId: string, dto: VerifyEmailChangeDto): Promise<void> {
    const data = await this.emailChangeCache.getByCode(dto.code);

    if (!data) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (data.userId !== userId) {
      throw new BadRequestException('Invalid verification code');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.newEmail, deletedAt: null },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: data.newEmail },
    });

    await this.emailChangeCache.invalidate(userId, data.code);
    await this.userCache.invalidate(userId);

    await this.mailService.sendEmailChangeNotification(data.currentEmail, data.newEmail);
  }
}
