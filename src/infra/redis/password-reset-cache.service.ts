import { Injectable } from '@nestjs/common';

import { RedisService } from './redis.service';

interface PasswordResetData {
  userId: string;
  email: string;
  token: string;
}

@Injectable()
export class PasswordResetCacheService {
  private readonly PREFIX = 'password-reset';
  private readonly TTL_SECONDS = 15 * 60;

  constructor(private redis: RedisService) {}

  private getKeyByUserId(userId: string): string {
    return `${this.PREFIX}:user:${userId}`;
  }

  private getKeyByToken(token: string): string {
    return `${this.PREFIX}:token:${token}`;
  }

  async set(userId: string, email: string, token: string): Promise<void> {
    const data: PasswordResetData = { userId, email, token };
    const jsonData = JSON.stringify(data);

    await Promise.all([
      this.redis.set(this.getKeyByUserId(userId), jsonData, this.TTL_SECONDS),
      this.redis.set(this.getKeyByToken(token), jsonData, this.TTL_SECONDS),
    ]);
  }

  async getByToken(token: string): Promise<PasswordResetData | null> {
    const cached = await this.redis.get(this.getKeyByToken(token));

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as PasswordResetData;
  }

  async getByUserId(userId: string): Promise<PasswordResetData | null> {
    const cached = await this.redis.get(this.getKeyByUserId(userId));

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as PasswordResetData;
  }

  async invalidate(userId: string, token: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.getKeyByUserId(userId)),
      this.redis.del(this.getKeyByToken(token)),
    ]);
  }

  async invalidateByUserId(userId: string): Promise<void> {
    const data = await this.getByUserId(userId);
    if (data) {
      await this.invalidate(userId, data.token);
    }
  }
}
