import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseType, Prisma } from '@prisma/client';

const decimalToNumber = (value: Prisma.Decimal | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

type StudentEntity = Prisma.StudentGetPayload<{
  include: {
    branch: true;
    group: {
      select: {
        id: true;
        name: true;
      };
    };
    registrar: {
      select: {
        id: true;
        fullName: true;
      };
    };
  };
}>;

export class StudentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  courseType: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalPrice: number;

  @ApiPropertyOptional({ nullable: true })
  amountPaid?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: {
      initialPayment: 1000000,
      secondPayment: 200000,
      thirdPayment: 400000,
    },
  })
  installments?: {
    initialPayment: number;
    secondPayment: number;
    thirdPayment: number;
  };

  @ApiProperty()
  debt: number;

  @ApiPropertyOptional({ nullable: true })
  paymentMethod: string | null;

  @ApiProperty()
  hasDocument: boolean;

  @ApiProperty()
  result: string;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ nullable: true })
  contractNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  completionDate?: Date | null;

  @ApiPropertyOptional()
  o83?: boolean;

  @ApiProperty()
  paymentStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    type: Object,
    example: {
      id: 'branch-id',
      name: 'Minor',
    },
  })
  branch: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({
    nullable: true,
    type: Object,
    example: {
      id: 'group-id',
      name: 'B-1',
    },
  })
  group?: {
    id: string;
    name: string;
  } | null;

  @ApiProperty({
    type: Object,
    example: {
      id: 'user-id',
      fullName: 'Minor Manager',
    },
  })
  registrar: {
    id: string;
    fullName: string;
  };

  static fromEntity(student: StudentEntity): StudentResponse {
    const response: StudentResponse = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      courseType: student.courseType,
      status: student.status,
      totalPrice: Number(student.totalPrice),
      debt: Number(student.debt),
      paymentMethod: student.paymentMethod ?? null,
      hasDocument: student.hasDocument,
      result: student.result,
      notes: student.notes ?? null,
      contractNumber: undefined,
      completionDate: undefined,
      o83: undefined,
      paymentStatus: student.paymentStatus,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      branch: {
        id: student.branch.id,
        name: student.branch.name,
      },
      group: undefined,
      registrar: {
        id: student.registrar.id,
        fullName: student.registrar.fullName,
      },
    };

    if (student.courseType === CourseType.express) {
      response.amountPaid = decimalToNumber(student.amountPaid);
      return response;
    }

    response.installments = {
      initialPayment: decimalToNumber(student.initialPayment) ?? 0,
      secondPayment: decimalToNumber(student.secondPayment) ?? 0,
      thirdPayment: decimalToNumber(student.thirdPayment) ?? 0,
    };
    response.group = student.group
      ? {
          id: student.group.id,
          name: student.group.name,
        }
      : null;
    response.contractNumber = student.contractNumber ?? null;
    response.completionDate = student.completionDate ?? null;
    response.o83 = student.o83;

    return response;
  }
}
