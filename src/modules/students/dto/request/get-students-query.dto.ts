import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto, toOptionalText } from '@common/dto';

import { CourseType, StudentStatus } from '@prisma/client';

export class GetStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CourseType, example: CourseType.express })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StudentStatus, example: StudentStatus.active })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
