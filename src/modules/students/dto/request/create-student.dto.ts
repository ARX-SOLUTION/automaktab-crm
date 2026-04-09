import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { toOptionalBoolean, toOptionalDate, toOptionalNumber, toOptionalText } from '@common/dto';

import { CourseType, PaymentMethod, StudentResult } from '@prisma/client';

@ValidatorConstraint({ name: 'studentCourseFields', async: false })
class StudentCourseFieldsConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as CreateStudentDto;

    if (dto.courseType === CourseType.express) {
      return !this.getExpressOnlyFields(dto).length;
    }

    if (dto.courseType === CourseType.standard) {
      return dto.amountPaid === undefined;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CreateStudentDto;

    if (dto.courseType === CourseType.express) {
      return `Express students cannot include: ${this.getExpressOnlyFields(dto).join(', ')}`;
    }

    if (dto.courseType === CourseType.standard) {
      return 'Standard students cannot include amountPaid';
    }

    return 'Invalid student payload';
  }

  private getExpressOnlyFields(dto: CreateStudentDto): string[] {
    return [
      'groupId',
      'contractNumber',
      'initialPayment',
      'secondPayment',
      'thirdPayment',
      'completionDate',
      'o83',
    ].filter((field) => dto[field as keyof CreateStudentDto] !== undefined);
  }
}

export class CreateStudentDto {
  @ApiProperty({ example: 'Manager' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Student' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '+998901010101' })
  @IsString()
  @MinLength(7)
  phone: string;

  @ApiProperty({ enum: CourseType, example: CourseType.express })
  @IsEnum(CourseType)
  courseType: CourseType;

  @ApiProperty({ example: 650000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPrice: number;

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

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  o83?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hasDocument?: boolean;

  @ApiPropertyOptional({ enum: StudentResult, example: StudentResult.pending })
  @IsOptional()
  @Transform(toOptionalText)
  @IsEnum(StudentResult)
  result?: StudentResult;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalText)
  @IsUUID()
  branchId?: string;

  @Validate(StudentCourseFieldsConstraint)
  private readonly courseTypeFieldsValidation: boolean;
}
