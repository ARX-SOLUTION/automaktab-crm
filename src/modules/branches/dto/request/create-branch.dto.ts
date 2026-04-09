import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Minor' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Minor, Toshkent' })
  @IsString()
  @MinLength(3)
  address: string;

  @ApiPropertyOptional({ example: '+998712000001' })
  @IsOptional()
  @IsString()
  @MinLength(7)
  phone?: string;
}
