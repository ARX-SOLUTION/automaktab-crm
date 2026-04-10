import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

import { toOptionalText } from '@common/dto';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search by full name or phone' })
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by branch id' })
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], description: 'Filter by user status' })
  @IsOptional()
  @Transform(toOptionalText)
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
