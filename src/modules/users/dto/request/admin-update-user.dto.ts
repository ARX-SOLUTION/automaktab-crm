import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { toOptionalText } from '@common/dto';

import { Role } from '@prisma/client';

export class AdminUpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(Role)
  role?: Role;
}
