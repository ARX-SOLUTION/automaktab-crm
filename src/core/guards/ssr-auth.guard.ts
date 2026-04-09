import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

import { PrismaService } from '@infra/prisma';
import { UserCacheService } from '@infra/redis';
import { TemplateUserContext } from '@infra/templates';

import { Role } from '@prisma/client';

type JwtPayload = {
  id: string;
  role: Role;
  branchId: string | null;
};

@Injectable()
export class SsrAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userCache: UserCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: TemplateUserContext }>();
    const response = context.switchToHttp().getResponse<Response>();
    const token = request.cookies?.jwt;

    if (!token) {
      response.redirect(302, '/app/login');
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

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

      if (!cachedUser || cachedUser.deletedAt || !cachedUser.isActive) {
        throw new UnauthorizedException('Account is not available');
      }

      const branch = cachedUser.branchId
        ? await this.prisma.branch.findFirst({
            where: {
              id: cachedUser.branchId,
              deletedAt: null,
            },
          })
        : null;

      request.user = {
        id: cachedUser.id,
        role: cachedUser.role as Role,
        branchId: cachedUser.branchId,
        fullName: cachedUser.fullName,
        branchName: branch?.name ?? null,
        isOwner: cachedUser.role === Role.owner,
        isManager: cachedUser.role === Role.manager,
      };

      return true;
    } catch {
      response.clearCookie('jwt', {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'strict',
      });
      response.redirect(302, '/app/login?error=expired');
      return false;
    }
  }
}
