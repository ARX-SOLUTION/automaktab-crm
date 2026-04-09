import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @ApiProperty({ example: 'manager456' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
