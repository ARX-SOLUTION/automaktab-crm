import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

import { toOptionalBoolean, toOptionalDate, toOptionalNumber, toOptionalText } from '@common/dto';

import { PaymentMethod, StudentResult, StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  @MinLength(7)
  phone?: string;

  @ApiPropertyOptional({ example: 650000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  initialPayment?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  secondPayment?: number;

  @ApiPropertyOptional({ example: 400000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  thirdPayment?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  contractNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalDate)
  @IsDate()
  completionDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  o83?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hasDocument?: boolean;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ enum: StudentResult })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(StudentResult)
  result?: StudentResult;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  notes?: string;
}
