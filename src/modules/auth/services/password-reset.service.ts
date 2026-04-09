import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { MailService } from '@infra/mail';
import { PrismaService } from '@infra/prisma';
import { PasswordResetCacheService } from '@infra/redis';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private passwordResetCache: PasswordResetCacheService,
  ) {}

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return;
    }

    await this.passwordResetCache.invalidateByUserId(user.id);

    const token = this.generateResetToken();

    await this.passwordResetCache.set(user.id, user.email, token);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`Password reset token for ${user.email}: ${token}`);
    }

    await this.mailService.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const data = await this.passwordResetCache.getByToken(token);

    if (!data) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: data.userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        refreshToken: null,
      },
    });

    await this.passwordResetCache.invalidate(data.userId, data.token);
  }
}
