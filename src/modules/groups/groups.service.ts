import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';

import { CourseType, Prisma, Role, StudentStatus } from '@prisma/client';

import {
  CreateGroupDto,
  GetGroupsQueryDto,
  GroupOverviewResponse,
  GroupResponse,
  UpdateGroupDto,
} from './dto';

type GroupEntity = Prisma.GroupGetPayload<{
  include: {
    branch: true;
    _count: {
      select: {
        students: true;
      };
    };
    students: {
      select: {
        id: true;
      };
    };
  };
}>;

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto): Promise<GroupResponse> {
    await this.ensureBranchExists(dto.branchId);
    await this.ensureGroupNameAvailable(dto.name, dto.branchId);

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        branchId: dto.branchId,
        courseType: CourseType.standard,
      },
      include: this.groupInclude,
    });

    return GroupResponse.fromEntity(group);
  }

  async findAll(
    query: GetGroupsQueryDto,
    currentUser: CurrentUserPayload,
  ): Promise<GroupResponse[]> {
    const branchId =
      currentUser.role === Role.manager ? currentUser.branchId : query.branchId;

    const groups = await this.prisma.group.findMany({
      where: {
        isActive: true,
        ...(branchId ? { branchId } : {}),
        ...(query.search
          ? {
              name: {
                contains: query.search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }],
      include: this.groupInclude,
    });

    return groups.map((group) => GroupResponse.fromEntity(group));
  }

  async findOne(id: string, currentUser: CurrentUserPayload): Promise<GroupResponse> {
    const group = await this.findGroupOrThrow(id);
    this.ensureGroupAccess(group, currentUser);

    return GroupResponse.fromEntity(group);
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupResponse> {
    const group = await this.findGroupOrThrow(id);

    const branchId = dto.branchId ?? group.branchId;
    const name = dto.name ?? group.name;

    if (dto.branchId && dto.branchId !== group.branchId) {
      await this.ensureBranchExists(dto.branchId);
    }

    if (name !== group.name || branchId !== group.branchId) {
      await this.ensureGroupNameAvailable(name, branchId, group.id);
    }

    const updatedGroup = await this.prisma.group.update({
      where: { id },
      data: {
        name: dto.name,
        branchId: dto.branchId,
      },
      include: this.groupInclude,
    });

    return GroupResponse.fromEntity(updatedGroup);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findGroupOrThrow(id);

    if (group._count.students > 0) {
      throw new BadRequestException('Group has students');
    }

    await this.prisma.group.delete({
      where: { id },
    });
  }

  async getOverview(): Promise<GroupOverviewResponse[]> {
    const branches = await this.prisma.branch.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        groups: {
          where: {
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                students: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
            students: {
              where: {
                deletedAt: null,
                status: StudentStatus.active,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    return branches.map((branch) => ({
      branch: {
        id: branch.id,
        name: branch.name,
      },
      groups: branch.groups.map((group) => ({
        id: group.id,
        name: group.name,
        totalStudents: group._count.students,
        activeStudents: group.students.length,
      })),
    }));
  }

  private async findGroupOrThrow(id: string): Promise<GroupEntity> {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: this.groupInclude,
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  private ensureGroupAccess(group: GroupEntity, currentUser: CurrentUserPayload): void {
    if (currentUser.role === Role.manager && currentUser.branchId !== group.branchId) {
      throw new ForbiddenException('You can only access groups in your branch');
    }
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
  }

  private async ensureGroupNameAvailable(
    name: string,
    branchId: string,
    excludeId?: string,
  ): Promise<void> {
    const existingGroup = await this.prisma.group.findFirst({
      where: {
        name,
        branchId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existingGroup) {
      throw new ConflictException('Group name already exists in this branch');
    }
  }

  private readonly groupInclude = {
    branch: true,
    _count: {
      select: {
        students: {
          where: {
            deletedAt: null,
          },
        },
      },
    },
    students: {
      where: {
        deletedAt: null,
        status: StudentStatus.active,
      },
      select: {
        id: true,
      },
    },
  } satisfies Prisma.GroupInclude;
}
