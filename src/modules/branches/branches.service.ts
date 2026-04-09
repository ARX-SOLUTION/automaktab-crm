import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';

import { Role } from '@prisma/client';

import { BranchResponse, CreateBranchDto, UpdateBranchDto } from './dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: CurrentUserPayload): Promise<BranchResponse[]> {
    const branches = await this.prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(user.role === Role.manager && user.branchId ? { id: user.branchId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return branches.map((branch) => BranchResponse.fromEntity(branch));
  }

  async findOne(id: string, user: CurrentUserPayload): Promise<BranchResponse> {
    const branch = await this.findActiveBranchOrThrow(id);

    if (user.role === Role.manager && user.branchId !== branch.id) {
      throw new ForbiddenException('You can only access your own branch');
    }

    return BranchResponse.fromEntity(branch);
  }

  async create(dto: CreateBranchDto): Promise<BranchResponse> {
    await this.ensureNameAvailable(dto.name);

    const branch = await this.prisma.branch.create({
      data: dto,
    });

    return BranchResponse.fromEntity(branch);
  }

  async update(id: string, dto: UpdateBranchDto): Promise<BranchResponse> {
    const branch = await this.findActiveBranchOrThrow(id);

    if (dto.name && dto.name !== branch.name) {
      await this.ensureNameAvailable(dto.name);
    }

    const updatedBranch = await this.prisma.branch.update({
      where: { id },
      data: dto,
    });

    return BranchResponse.fromEntity(updatedBranch);
  }

  async remove(id: string): Promise<void> {
    await this.findActiveBranchOrThrow(id);

    await this.prisma.branch.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  private async findActiveBranchOrThrow(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  private async ensureNameAvailable(name: string): Promise<void> {
    const existingBranch = await this.prisma.branch.findUnique({
      where: { name },
    });

    if (existingBranch && !existingBranch.deletedAt) {
      throw new ConflictException('Branch name already exists');
    }

    if (existingBranch && existingBranch.deletedAt) {
      throw new ConflictException('Branch name belongs to a deleted branch');
    }
  }
}
