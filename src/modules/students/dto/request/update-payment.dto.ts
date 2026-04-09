import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { toOptionalNumber } from '@common/dto';

@ValidatorConstraint({ name: 'studentPaymentFields', async: false })
class StudentPaymentFieldsConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdatePaymentDto;

    return (
      dto.amountPaid !== undefined ||
      dto.initialPayment !== undefined ||
      dto.secondPayment !== undefined ||
      dto.thirdPayment !== undefined
    );
  }

  defaultMessage(): string {
    return 'At least one payment field is required';
  }
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ example: 500000 })
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

  @Validate(StudentPaymentFieldsConstraint)
  private readonly paymentFieldsValidation: boolean;
}
