import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

const decimalToNumber = (value: Prisma.Decimal | number): number => Number(value);

type PaymentLogEntity = Prisma.PaymentLogGetPayload<{
  include: {
    changedByUser: {
      select: {
        id: true;
        fullName: true;
      };
    };
  };
}>;

export class PaymentLogResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentField: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  previousAmount: number;

  @ApiProperty()
  newAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: Object,
    example: {
      id: 'user-id',
      fullName: 'Minor Manager',
    },
  })
  changedBy: {
    id: string;
    fullName: string;
  };

  static fromEntity(log: PaymentLogEntity): PaymentLogResponse {
    return {
      id: log.id,
      paymentField: log.paymentField,
      amount: decimalToNumber(log.amount),
      previousAmount: decimalToNumber(log.previousAmount),
      newAmount: decimalToNumber(log.newAmount),
      createdAt: log.createdAt,
      changedBy: {
        id: log.changedByUser.id,
        fullName: log.changedByUser.fullName,
      },
    };
  }
}
