import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';
import { UserCacheService } from '@infra/redis';
import { TemplateUserContext } from '@infra/templates';

import { Prisma } from '@prisma/client';

import { AuthResponse, LoginDto } from './dto';

type AuthenticatedUser = Prisma.UserGetPayload<{
  include: {
    branch: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userCache: UserCacheService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authenticate(dto);

    return {
      accessToken: await this.signToken({
        id: user.id,
        role: user.role,
        branchId: user.branchId,
      }),
    };
  }

  async loginForSsr(
    dto: LoginDto,
  ): Promise<{ token: string; user: TemplateUserContext }> {
    const user = await this.authenticate(dto);

    return {
      token: await this.signToken({
        id: user.id,
        role: user.role,
        branchId: user.branchId,
      }),
      user: this.toTemplateUser(user),
    };
  }

  getAccessTokenMaxAgeMs(): number {
    return this.parseDurationToMs(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    );
  }

  private signToken(payload: CurrentUserPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '1d'),
    });
  }

  private async authenticate(dto: LoginDto): Promise<AuthenticatedUser> {
    const normalizedPhone = dto.phone.replace(/\s+/g, '');

    const user = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone, deletedAt: null },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    await this.userCache.set(user);

    return user;
  }

  private toTemplateUser(user: AuthenticatedUser): TemplateUserContext {
    return {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      fullName: user.fullName,
      branchName: user.branch?.name ?? null,
      isOwner: user.role === 'owner',
      isManager: user.role === 'manager',
    };
  }

  private parseDurationToMs(value: string): number {
    const normalized = value.trim();
    const numericMatch = normalized.match(/^(\d+)(ms|s|m|h|d)?$/);

    if (!numericMatch) {
      return 15 * 60 * 1000;
    }

    const amount = Number(numericMatch[1]);
    const unit = numericMatch[2] ?? 'ms';

    switch (unit) {
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 's':
        return amount * 1000;
      default:
        return amount;
    }
  }
}
