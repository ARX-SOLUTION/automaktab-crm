import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsUUID } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '+998901111111' })
  @IsString()
  @MinLength(7)
  phone: string;

  @ApiProperty({ example: 'manager123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;
}
