import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

import { TemplateUserContext } from '@infra/templates';

import { Role } from '@prisma/client';

import { ROLES_KEY } from './roles.guard';

@Injectable()
export class SsrRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: TemplateUserContext }>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user;

    if (user && requiredRoles.includes(user.role)) {
      return true;
    }

    response.redirect(302, '/app/students');
    return false;
  }
}
