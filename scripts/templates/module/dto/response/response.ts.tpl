import { ApiProperty } from '@nestjs/swagger';

import { {{PascalSingular}} } from '@prisma/client';

export class {{PascalSingular}}Response {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: {{PascalSingular}}): {{PascalSingular}}Response {
    return {
      id: entity.id,
      title: entity.title,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
