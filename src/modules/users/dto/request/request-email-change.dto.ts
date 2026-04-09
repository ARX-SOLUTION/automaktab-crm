import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({ description: 'New email address' })
  @IsEmail()
  newEmail: string;

  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  currentPassword: string;
}
