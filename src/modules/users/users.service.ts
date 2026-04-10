import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';
import { UserCacheService } from '@infra/redis';

import { Role } from '@prisma/client';

import {
  CreateUserDto,
  GetUsersQueryDto,
  ResetUserPasswordDto,
  UpdateUserDto,
  UserResponse,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userCache: UserCacheService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    await this.ensurePhoneAvailable(dto.phone);
    const branch = await this.findBranchOrThrow(dto.branchId);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        password: await bcrypt.hash(dto.password, 10),
        role: Role.manager,
        branchId: dto.branchId,
      },
    });

    return UserResponse.fromEntity(user, branch.name);
  }

  async findAll(query: GetUsersQueryDto): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: Role.manager,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.status ? { isActive: query.status === 'active' } : {}),
        ...(query.search
          ? {
              OR: [
                { fullName: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
              ],
            }
          : {}),
      },
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => UserResponse.fromEntity(user, user.branch?.name ?? null));
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.findManagerOrThrow(id);
    return UserResponse.fromEntity(user, user.branch?.name ?? null);
  }

  async findMe(currentUser: CurrentUserPayload): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.id,
        deletedAt: null,
      },
      include: {
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserResponse.fromEntity(user, user.branch?.name ?? null);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.findManagerOrThrow(id);

    if (dto.phone && dto.phone !== user.phone) {
      await this.ensurePhoneAvailable(dto.phone, user.id);
    }

    let branchName = user.branch?.name ?? null;
    if (dto.branchId && dto.branchId !== user.branchId) {
      const branch = await this.findBranchOrThrow(dto.branchId);
      branchName = branch.name;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        branch: true,
      },
    });

    await this.userCache.invalidate(id);

    return UserResponse.fromEntity(updatedUser, updatedUser.branch?.name ?? branchName);
  }

  async deactivate(id: string): Promise<UserResponse> {
    await this.findManagerOrThrow(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        branch: true,
      },
    });

    await this.userCache.invalidate(id);

    return UserResponse.fromEntity(updatedUser, updatedUser.branch?.name ?? null);
  }

  async activate(id: string): Promise<UserResponse> {
    await this.findManagerOrThrow(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
      },
      include: {
        branch: true,
      },
    });

    await this.userCache.invalidate(id);

    return UserResponse.fromEntity(updatedUser, updatedUser.branch?.name ?? null);
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto): Promise<void> {
    await this.findManagerOrThrow(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
      },
    });

    await this.userCache.invalidate(id);
  }

  private async findManagerOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.manager,
        deletedAt: null,
      },
      include: {
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Manager not found');
    }

    return user;
  }

  private async findBranchOrThrow(branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  private async ensurePhoneAvailable(phone: string, excludeUserId?: string): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone,
        deletedAt: null,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    });

    if (existingUser) {
      throw new ConflictException('Phone already exists');
    }
  }
}
