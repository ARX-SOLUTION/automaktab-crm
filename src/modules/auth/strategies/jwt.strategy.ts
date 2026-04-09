import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';
import { UserCacheService } from '@infra/redis';

interface JwtPayload {
  id: string;
  role: CurrentUserPayload['role'];
  branchId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userCache: UserCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    let cachedUser = await this.userCache.get(payload.id);

    if (!cachedUser) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.userCache.set(user);
      cachedUser = await this.userCache.get(user.id);
    }

    if (!cachedUser || cachedUser.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (!cachedUser.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }

    return {
      id: cachedUser.id,
      role: cachedUser.role as CurrentUserPayload['role'],
      branchId: cachedUser.branchId,
    };
  }
}
