import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaginationMetaDto } from '@common/dto';
import { CurrentUserPayload } from '@common/types';
import { PrismaService } from '@infra/prisma';

import {
  CourseType,
  PaymentField,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';

import {
  CreateStudentDto,
  GetStudentsQueryDto,
  PaymentLogResponse,
  StudentResponse,
  UpdatePaymentDto,
  UpdateStudentDto,
} from './dto';

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

type SsrStudentQuery = {
  page?: number;
  limit?: number;
  branchId?: string;
  search?: string;
  courseType?: CourseType;
  status?: 'paid' | 'unpaid';
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto, currentUser: CurrentUserPayload): Promise<StudentResponse> {
    const branchId = await this.resolveBranchId(currentUser, dto.branchId);
    const studentData = await this.buildCreateStudentData(dto, currentUser.id, branchId);

    const student = await this.prisma.student.create({
      data: studentData,
      include: this.studentInclude,
    });

    return StudentResponse.fromEntity(student);
  }

  async findAll(query: GetStudentsQueryDto, currentUser: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const courseType = query.courseType ?? CourseType.express;

    const where = this.buildStudentWhere(
      {
        branchId: query.branchId,
        search: query.search,
        courseType,
      },
      currentUser,
      query.status ? { status: query.status } : {},
    );

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.studentInclude,
      }),
      this.prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const meta: PaginationMetaDto = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      data: students.map((student) => StudentResponse.fromEntity(student)),
      meta,
    };
  }

  async findAllForSsr(query: SsrStudentQuery, currentUser: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildStudentWhere(
      {
        branchId: query.branchId,
        search: query.search,
        courseType: query.courseType,
      },
      currentUser,
      query.status === 'paid'
        ? { debt: { lte: 0 } }
        : query.status === 'unpaid'
          ? { debt: { gt: 0 } }
          : {},
    );

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.studentInclude,
      }),
      this.prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      students: students.map((student) =>
        this.toSsrStudentRow(StudentResponse.fromEntity(student)),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getDashboardStats(
    currentUser: CurrentUserPayload,
    query: Omit<SsrStudentQuery, 'page' | 'limit'> = {},
  ): Promise<{
    totalStudents: number;
    paidCount: number;
    debtCount: number;
    totalPaid: number;
    totalDebt: number;
    branchDebt: number;
  }> {
    const where = this.buildStudentWhere(
      {
        branchId: query.branchId,
        search: query.search,
        courseType: query.courseType,
      },
      currentUser,
      query.status === 'paid'
        ? { debt: { lte: 0 } }
        : query.status === 'unpaid'
          ? { debt: { gt: 0 } }
          : {},
    );

    const students = await this.prisma.student.findMany({
      where,
      select: {
        totalPrice: true,
        debt: true,
      },
    });

    return students.reduce(
      (acc, student) => {
        const debt = Number(student.debt);
        const totalPrice = Number(student.totalPrice);

        acc.totalStudents += 1;
        acc.totalDebt += debt;
        acc.branchDebt += debt;
        acc.totalPaid += totalPrice - debt;

        if (debt > 0) {
          acc.debtCount += 1;
        } else {
          acc.paidCount += 1;
        }

        return acc;
      },
      {
        totalStudents: 0,
        paidCount: 0,
        debtCount: 0,
        totalPaid: 0,
        totalDebt: 0,
        branchDebt: 0,
      },
    );
  }

  calculateSummary(
    students: Array<{
      totalPrice: number;
      initialPayment: number;
      secondPayment: number;
      thirdPayment: number;
      debt: number;
    }>,
  ) {
    return students.reduce(
      (summary, student) => {
        summary.totalPrices += student.totalPrice;
        summary.totalInitial += student.initialPayment;
        summary.totalSecond += student.secondPayment;
        summary.totalThird += student.thirdPayment;
        summary.totalPaid +=
          student.initialPayment + student.secondPayment + student.thirdPayment;
        summary.totalDebt += student.debt;

        return summary;
      },
      {
        totalPrices: 0,
        totalInitial: 0,
        totalSecond: 0,
        totalThird: 0,
        totalPaid: 0,
        totalDebt: 0,
      },
    );
  }

  async findOne(id: string, currentUser: CurrentUserPayload): Promise<StudentResponse> {
    const student = await this.findStudentOrThrow(id);
    this.ensureStudentAccess(student, currentUser);
    return StudentResponse.fromEntity(student);
  }

  async getPaymentHistory(
    id: string,
    currentUser: CurrentUserPayload,
  ): Promise<PaymentLogResponse[]> {
    const student = await this.findStudentOrThrow(id);
    this.ensureStudentAccess(student, currentUser);

    const logs = await this.prisma.paymentLog.findMany({
      where: {
        studentId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        changedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return logs.map((log) => PaymentLogResponse.fromEntity(log));
  }

  async update(
    id: string,
    dto: UpdateStudentDto,
    currentUser: CurrentUserPayload,
  ): Promise<StudentResponse> {
    const student = await this.findStudentOrThrow(id);
    this.ensureStudentAccess(student, currentUser);
    const data = await this.buildUpdateStudentData(student, dto);

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data,
      include: this.studentInclude,
    });

    return StudentResponse.fromEntity(updatedStudent);
  }

  async updatePayment(
    id: string,
    dto: UpdatePaymentDto,
    currentUser: CurrentUserPayload,
  ): Promise<StudentResponse> {
    const student = await this.findStudentOrThrow(id);
    this.ensureStudentAccess(student, currentUser);
    this.ensurePaymentUpdateAllowed(student);

    const { studentData, paymentLogs } = this.buildPaymentUpdateData(student, dto, currentUser.id);
    const updatedStudent = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: studentData,
        include: this.studentInclude,
      });

      if (paymentLogs.length > 0) {
        await tx.paymentLog.createMany({
          data: paymentLogs,
        });
      }

      return updated;
    });

    return StudentResponse.fromEntity(updatedStudent);
  }

  async remove(id: string, currentUser: CurrentUserPayload): Promise<void> {
    const student = await this.findStudentOrThrow(id);
    this.ensureStudentAccess(student, currentUser);

    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private async resolveBranchId(
    currentUser: CurrentUserPayload,
    branchId?: string,
  ): Promise<string> {
    const resolvedBranchId =
      currentUser.role === Role.manager ? currentUser.branchId : branchId;

    if (!resolvedBranchId) {
      throw new BadRequestException('branchId is required');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: resolvedBranchId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return resolvedBranchId;
  }

  private async findStudentOrThrow(id: string): Promise<StudentEntity> {
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: this.studentInclude,
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  private ensureStudentAccess(student: StudentEntity, currentUser: CurrentUserPayload): void {
    if (currentUser.role === Role.manager && currentUser.branchId !== student.branchId) {
      throw new ForbiddenException('You can only access students in your branch');
    }
  }

  private async buildCreateStudentData(
    dto: CreateStudentDto,
    registeredBy: string,
    branchId: string,
  ): Promise<Prisma.StudentUncheckedCreateInput> {
    if (dto.courseType === CourseType.express) {
      const amountPaid = dto.amountPaid ?? 0;
      const debt = this.calculateDebt(dto.totalPrice, amountPaid);

      return {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        courseType: CourseType.express,
        totalPrice: dto.totalPrice,
        amountPaid,
        debt,
        paymentMethod: dto.paymentMethod,
        hasDocument: dto.hasDocument ?? false,
        notes: dto.notes,
        result: dto.result,
        paymentStatus: this.calculatePaymentStatus(amountPaid, debt),
        branchId,
        registeredBy,
      };
    }

    const initialPayment = dto.initialPayment ?? 0;
    const secondPayment = dto.secondPayment ?? 0;
    const thirdPayment = dto.thirdPayment ?? 0;
    const totalPaid = this.calculateInstallmentTotal(initialPayment, secondPayment, thirdPayment);
    const debt = this.calculateDebt(dto.totalPrice, totalPaid);
    const groupId = await this.resolveGroupId(dto.groupId, branchId);

    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      courseType: CourseType.standard,
      totalPrice: dto.totalPrice,
      initialPayment,
      secondPayment,
      thirdPayment,
      debt,
      paymentMethod: dto.paymentMethod,
      groupId,
      contractNumber: dto.contractNumber,
      completionDate: dto.completionDate,
      o83: dto.o83 ?? false,
      hasDocument: dto.hasDocument ?? false,
      notes: dto.notes,
      result: dto.result,
      paymentStatus: this.calculatePaymentStatus(totalPaid, debt),
      branchId,
      registeredBy,
    };
  }

  private async buildUpdateStudentData(
    student: StudentEntity,
    dto: UpdateStudentDto,
  ): Promise<Prisma.StudentUncheckedUpdateInput> {
    const commonData: Prisma.StudentUncheckedUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      totalPrice: dto.totalPrice,
      paymentMethod: dto.paymentMethod,
      hasDocument: dto.hasDocument,
      result: dto.result,
      status: dto.status,
      notes: dto.notes,
    };

    if (student.courseType === CourseType.express) {
      this.ensureNoExpressInvalidFields(dto);

      const totalPrice = dto.totalPrice ?? Number(student.totalPrice);
      const amountPaid = dto.amountPaid ?? Number(student.amountPaid ?? 0);
      const debt = this.calculateDebt(totalPrice, amountPaid);

      return {
        ...commonData,
        amountPaid: dto.amountPaid,
        debt,
        paymentStatus: this.calculatePaymentStatus(amountPaid, debt),
      };
    }

    this.ensureNoStandardInvalidFields(dto);

    const totalPrice = dto.totalPrice ?? Number(student.totalPrice);
    const initialPayment = dto.initialPayment ?? Number(student.initialPayment ?? 0);
    const secondPayment = dto.secondPayment ?? Number(student.secondPayment ?? 0);
    const thirdPayment = dto.thirdPayment ?? Number(student.thirdPayment ?? 0);
    const totalPaid = this.calculateInstallmentTotal(
      initialPayment,
      secondPayment,
      thirdPayment,
    );
    const debt = this.calculateDebt(totalPrice, totalPaid);
    const groupId =
      dto.groupId === undefined
        ? student.groupId
        : await this.resolveGroupId(dto.groupId, student.branchId);

    return {
      ...commonData,
      initialPayment: dto.initialPayment,
      secondPayment: dto.secondPayment,
      thirdPayment: dto.thirdPayment,
      groupId,
      contractNumber: dto.contractNumber,
      completionDate: dto.completionDate,
      o83: dto.o83,
      debt,
      paymentStatus: this.calculatePaymentStatus(totalPaid, debt),
    };
  }

  private buildPaymentUpdateData(
    student: StudentEntity,
    dto: UpdatePaymentDto,
    changedBy: string,
  ): {
    studentData: Prisma.StudentUncheckedUpdateInput;
    paymentLogs: Prisma.PaymentLogUncheckedCreateInput[];
  } {
    if (student.courseType === CourseType.express) {
      this.ensureNoExpressInvalidFields(dto);

      if (dto.amountPaid === undefined) {
        throw new BadRequestException('amountPaid is required for express students');
      }

      const totalPrice = Number(student.totalPrice);
      const debt = this.calculateDebt(totalPrice, dto.amountPaid);
      const paymentLogs = this.buildPaymentLogs(student.id, changedBy, [
        {
          paymentField: PaymentField.amountPaid,
          previousAmount: Number(student.amountPaid ?? 0),
          newAmount: dto.amountPaid,
        },
      ]);

      return {
        studentData: {
          amountPaid: dto.amountPaid,
          debt,
          paymentStatus: this.calculatePaymentStatus(dto.amountPaid, debt),
        },
        paymentLogs,
      };
    }

    this.ensureNoStandardInvalidFields(dto);

    const totalPrice = Number(student.totalPrice);
    const initialPayment = dto.initialPayment ?? Number(student.initialPayment ?? 0);
    const secondPayment = dto.secondPayment ?? Number(student.secondPayment ?? 0);
    const thirdPayment = dto.thirdPayment ?? Number(student.thirdPayment ?? 0);
    const totalPaid = this.calculateInstallmentTotal(initialPayment, secondPayment, thirdPayment);
    const debt = this.calculateDebt(totalPrice, totalPaid);
    const paymentLogs = this.buildPaymentLogs(student.id, changedBy, [
      {
        paymentField: PaymentField.initialPayment,
        previousAmount: Number(student.initialPayment ?? 0),
        newAmount: dto.initialPayment,
      },
      {
        paymentField: PaymentField.secondPayment,
        previousAmount: Number(student.secondPayment ?? 0),
        newAmount: dto.secondPayment,
      },
      {
        paymentField: PaymentField.thirdPayment,
        previousAmount: Number(student.thirdPayment ?? 0),
        newAmount: dto.thirdPayment,
      },
    ]);

    return {
      studentData: {
        initialPayment: dto.initialPayment,
        secondPayment: dto.secondPayment,
        thirdPayment: dto.thirdPayment,
        debt,
        paymentStatus: this.calculatePaymentStatus(totalPaid, debt),
      },
      paymentLogs,
    };
  }

  private ensurePaymentUpdateAllowed(student: StudentEntity): void {
    if (
      student.paymentStatus !== PaymentStatus.pending &&
      student.paymentStatus !== PaymentStatus.partial
    ) {
      throw new BadRequestException(
        'Payments can only be updated for pending or partial students',
      );
    }
  }

  private async resolveGroupId(groupId: string | undefined, branchId: string): Promise<string | undefined> {
    if (!groupId) {
      return undefined;
    }

    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        branchId,
        courseType: CourseType.standard,
        isActive: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group.id;
  }

  private ensureNoExpressInvalidFields(
    payload: Pick<
      UpdateStudentDto & UpdatePaymentDto,
      | 'groupId'
      | 'contractNumber'
      | 'completionDate'
      | 'initialPayment'
      | 'secondPayment'
      | 'thirdPayment'
      | 'o83'
    >,
  ): void {
    const invalidFields = [
      'groupId',
      'contractNumber',
      'completionDate',
      'initialPayment',
      'secondPayment',
      'thirdPayment',
      'o83',
    ].filter((field) => payload[field as keyof typeof payload] !== undefined);

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Express students cannot include: ${invalidFields.join(', ')}`,
      );
    }
  }

  private ensureNoStandardInvalidFields(
    payload: Pick<UpdateStudentDto & UpdatePaymentDto, 'amountPaid'>,
  ): void {
    if (payload.amountPaid !== undefined) {
      throw new BadRequestException('Standard students cannot include amountPaid');
    }
  }

  private calculateInstallmentTotal(
    initialPayment: number,
    secondPayment: number,
    thirdPayment: number,
  ): number {
    return initialPayment + secondPayment + thirdPayment;
  }

  private buildPaymentLogs(
    studentId: string,
    changedBy: string,
    changes: Array<{
      paymentField: PaymentField;
      previousAmount: number;
      newAmount: number | undefined;
    }>,
  ): Prisma.PaymentLogCreateManyInput[] {
    return changes
      .filter(
        (change) =>
          change.newAmount !== undefined && change.newAmount !== change.previousAmount,
      )
      .map((change) => ({
        studentId,
        changedBy,
        paymentField: change.paymentField,
        amount: Number(change.newAmount) - change.previousAmount,
        previousAmount: change.previousAmount,
        newAmount: Number(change.newAmount),
      }));
  }

  private calculateDebt(totalPrice: number, paidAmount: number): number {
    const debt = totalPrice - paidAmount;

    if (debt < 0) {
      throw new BadRequestException('Payment exceeds total price');
    }

    return debt;
  }

  private calculatePaymentStatus(amountPaid: number, debt: number): PaymentStatus {
    if (debt === 0) {
      return PaymentStatus.paid;
    }

    if (amountPaid > 0) {
      return PaymentStatus.partial;
    }

    return PaymentStatus.pending;
  }

  private buildStudentWhere(
    filters: {
      branchId?: string;
      search?: string;
      courseType?: CourseType;
    },
    currentUser: CurrentUserPayload,
    extraWhere: Prisma.StudentWhereInput,
  ): Prisma.StudentWhereInput {
    return {
      deletedAt: null,
      ...(filters.courseType ? { courseType: filters.courseType } : {}),
      ...(currentUser.role === Role.manager && currentUser.branchId
        ? { branchId: currentUser.branchId }
        : {}),
      ...(currentUser.role === Role.owner && filters.branchId
        ? { branchId: filters.branchId }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search } },
            ],
          }
        : {}),
      ...extraWhere,
    };
  }

  private toSsrStudentRow(student: StudentResponse) {
    const initialPayment = student.installments?.initialPayment ?? student.amountPaid ?? 0;
    const secondPayment = student.installments?.secondPayment ?? 0;
    const thirdPayment = student.installments?.thirdPayment ?? 0;

    return {
      ...student,
      initialPayment,
      secondPayment,
      thirdPayment,
    };
  }

  private readonly studentInclude = {
    branch: true,
    group: {
      select: {
        id: true,
        name: true,
      },
    },
    registrar: {
      select: {
        id: true,
        fullName: true,
      },
    },
  } satisfies Prisma.StudentInclude;
}
