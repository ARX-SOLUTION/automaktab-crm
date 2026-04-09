import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

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
  @ApiProperty({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiProperty({ example: 1000000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialPayment?: number;

  @ApiProperty({ example: 200000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  secondPayment?: number;

  @ApiProperty({ example: 400000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  thirdPayment?: number;

  @Validate(StudentPaymentFieldsConstraint)
  private readonly paymentFieldsValidation: boolean;
}
