import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

import { toOptionalText } from '@common/dto';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional({ example: '+998905555555' })
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(7)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;
}
