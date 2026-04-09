import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { MailService } from '@infra/mail';
import { PrismaService } from '@infra/prisma';
import { EmailVerificationCacheService } from '@infra/redis';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private emailVerificationCache: EmailVerificationCacheService,
  ) {}

  private generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.emailVerificationCache.invalidateByUserId(userId);

    const code = this.generateVerificationCode();

    await this.emailVerificationCache.set(userId, user.email, code);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`Verification code for ${user.email}: ${code}`);
    }

    await this.mailService.sendEmailVerification(user.email, code);
  }

  async verifyEmail(code: string): Promise<void> {
    const data = await this.emailVerificationCache.getByCode(code);

    if (!data) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: data.userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await this.emailVerificationCache.invalidate(data.userId, data.code);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return;
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.sendVerificationEmail(user.id);
  }
}
