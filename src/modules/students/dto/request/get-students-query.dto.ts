import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@common/dto';

import { CourseType, StudentStatus } from '@prisma/client';

export class GetStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CourseType, example: CourseType.express })
  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StudentStatus, example: StudentStatus.active })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
