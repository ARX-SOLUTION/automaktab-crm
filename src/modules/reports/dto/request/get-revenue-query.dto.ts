import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { toOptionalDate, toOptionalText } from '@common/dto';

import { CourseType } from '@prisma/client';

export class GetRevenueQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalDate)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalDate)
  @IsDate()
  endDate?: Date;
}
