import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';
import { UserCacheService } from '@infra/redis';

import { AuthResponse, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userCache: UserCacheService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone, deletedAt: null },
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

    return {
      accessToken: await this.signToken({
        id: user.id,
        role: user.role,
        branchId: user.branchId,
      }),
    };
  }

  private signToken(payload: CurrentUserPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '1d'),
    });
  }
}
