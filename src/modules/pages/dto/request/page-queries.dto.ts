import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto, toOptionalDate, toOptionalText } from '@common/dto';

import { CourseType } from '@prisma/client';

export class SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  success?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  error?: string;
}

export class SsrDashboardQueryDto extends SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: ['paid', 'unpaid'] })
  @IsOptional()
  @Transform(toOptionalText)
  @IsIn(['paid', 'unpaid'])
  status?: 'paid' | 'unpaid';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(CourseType)
  courseType?: CourseType;
}

export class SsrStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: ['paid', 'unpaid'] })
  @IsOptional()
  @Transform(toOptionalText)
  @IsIn(['paid', 'unpaid'])
  status?: 'paid' | 'unpaid';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  success?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  error?: string;
}

export class SsrManagersQueryDto extends SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;
}

export class SsrReportsQueryDto extends SsrBaseQueryDto {
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
