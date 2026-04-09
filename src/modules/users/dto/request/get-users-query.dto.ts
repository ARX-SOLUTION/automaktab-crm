import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search by full name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by branch id' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
