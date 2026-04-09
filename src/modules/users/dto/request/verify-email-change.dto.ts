import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyEmailChangeDto {
  @ApiProperty({ description: '6-digit verification code' })
  @IsString()
  @Length(6, 6)
  code: string;
}
