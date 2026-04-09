import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

import { toOptionalText } from '@common/dto';

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'B-2' })
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;
}
