import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Branch } from '@prisma/client';

export class BranchResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(branch: Branch): BranchResponse {
    return {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      isActive: branch.isActive,
      createdAt: branch.createdAt,
    };
  }
}
