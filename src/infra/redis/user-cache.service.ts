import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { RedisService } from './redis.service';

export interface CachedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  refreshToken: string | null;
  deletedAt: Date | null;
}

@Injectable()
export class UserCacheService {
  private readonly PREFIX = 'user';
  private readonly TTL_SECONDS = 300;

  constructor(private redis: RedisService) {}

  private getKey(userId: string): string {
    return `${this.PREFIX}:${userId}`;
  }

  async get(userId: string): Promise<CachedUser | null> {
    const cached = await this.redis.get(this.getKey(userId));

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as CachedUser;
  }

  async set(user: User): Promise<void> {
    const cached: CachedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      refreshToken: user.refreshToken,
      deletedAt: user.deletedAt,
    };

    await this.redis.set(this.getKey(user.id), JSON.stringify(cached), this.TTL_SECONDS);
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.getKey(userId));
  }
}
