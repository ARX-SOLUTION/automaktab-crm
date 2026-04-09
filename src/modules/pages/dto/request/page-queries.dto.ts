import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaginationQueryDto } from '@common/dto';

import { CourseType } from '@prisma/client';

export class SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  success?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}

export class SsrDashboardQueryDto extends SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: ['paid', 'unpaid'] })
  @IsOptional()
  @IsIn(['paid', 'unpaid'])
  status?: 'paid' | 'unpaid';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;
}

export class SsrStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: ['paid', 'unpaid'] })
  @IsOptional()
  @IsIn(['paid', 'unpaid'])
  status?: 'paid' | 'unpaid';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  success?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}

export class SsrManagersQueryDto extends SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class SsrReportsQueryDto extends SsrBaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
