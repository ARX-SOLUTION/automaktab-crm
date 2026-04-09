import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'B-1' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;
}
