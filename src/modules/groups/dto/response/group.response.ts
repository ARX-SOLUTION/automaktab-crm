import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

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

export class GroupResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  activeStudents: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(group: GroupEntity): GroupResponse {
    return {
      id: group.id,
      name: group.name,
      branchId: group.branchId,
      branchName: group.branch.name,
      isActive: group.isActive,
      totalStudents: group._count.students,
      activeStudents: group.students.length,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
