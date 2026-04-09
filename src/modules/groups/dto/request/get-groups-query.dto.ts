import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

import { toOptionalText } from '@common/dto';

export class GetGroupsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;
}
