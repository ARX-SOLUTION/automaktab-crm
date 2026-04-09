import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class Create{{PascalSingular}}Dto {
  @ApiProperty({ example: 'Sample title' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;
}
