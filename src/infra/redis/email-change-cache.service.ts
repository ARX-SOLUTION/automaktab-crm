import { Injectable } from '@nestjs/common';

import { RedisService } from './redis.service';

interface EmailChangeData {
  userId: string;
  currentEmail: string;
  newEmail: string;
  code: string;
}

@Injectable()
export class EmailChangeCacheService {
  private readonly PREFIX = 'email-change';
  private readonly TTL_SECONDS = 10 * 60; // 10 minutes

  constructor(private redis: RedisService) {}

  private getKeyByUserId(userId: string): string {
    return `${this.PREFIX}:user:${userId}`;
  }

  private getKeyByCode(code: string): string {
    return `${this.PREFIX}:code:${code}`;
  }

  async set(userId: string, currentEmail: string, newEmail: string, code: string): Promise<void> {
    const data: EmailChangeData = { userId, currentEmail, newEmail, code };
    const jsonData = JSON.stringify(data);

    await Promise.all([
      this.redis.set(this.getKeyByUserId(userId), jsonData, this.TTL_SECONDS),
      this.redis.set(this.getKeyByCode(code), jsonData, this.TTL_SECONDS),
    ]);
  }

  async getByCode(code: string): Promise<EmailChangeData | null> {
    const cached = await this.redis.get(this.getKeyByCode(code));

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as EmailChangeData;
  }

  async getByUserId(userId: string): Promise<EmailChangeData | null> {
    const cached = await this.redis.get(this.getKeyByUserId(userId));

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as EmailChangeData;
  }

  async invalidate(userId: string, code: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.getKeyByUserId(userId)),
      this.redis.del(this.getKeyByCode(code)),
    ]);
  }

  async invalidateByUserId(userId: string): Promise<void> {
    const data = await this.getByUserId(userId);
    if (data) {
      await this.invalidate(userId, data.code);
    }
  }
}
