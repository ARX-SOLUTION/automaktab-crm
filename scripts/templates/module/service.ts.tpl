import { Injectable, NotFoundException } from '@nestjs/common';

import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma/prisma.service';

import {
  Create{{PascalSingular}}Dto,
  Get{{PascalPlural}}QueryDto,
  Update{{PascalSingular}}Dto,
} from './dto';

@Injectable()
export class {{PascalPlural}}Service {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Get{{PascalPlural}}QueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search && {
        title: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.{{camelSingular}}.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.{{camelSingular}}.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(dto: Create{{PascalSingular}}Dto, currentUser: CurrentUserPayload) {
    return this.prisma.{{camelSingular}}.create({
      data: {
        title: dto.title,
      },
    });
  }

  async findById(id: string) {
    const {{camelSingular}} = await this.prisma.{{camelSingular}}.findFirst({
      where: { id, deletedAt: null },
    });

    if (!{{camelSingular}}) {
      throw new NotFoundException('{{PascalSingular}} not found');
    }

    return {{camelSingular}};
  }

  async update(id: string, dto: Update{{PascalSingular}}Dto) {
    await this.findById(id);

    return this.prisma.{{camelSingular}}.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.{{camelSingular}}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
