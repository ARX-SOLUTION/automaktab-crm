import { ApiProperty } from '@nestjs/swagger';

import { Role, User } from '@prisma/client';

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ nullable: true })
  branchId: string | null;

  @ApiProperty({ nullable: true })
  branchName: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(user: User, branchName: string | null = null): UserResponse {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      branchId: user.branchId,
      branchName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
