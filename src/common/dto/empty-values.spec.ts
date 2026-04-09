import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';

import { GetGroupsQueryDto } from '@/modules/groups';
import {
  SsrDashboardQueryDto,
  SsrManagersQueryDto,
  SsrReportsQueryDto,
  SsrStudentsQueryDto,
} from '@/modules/pages';
import { GetRevenueQueryDto } from '@/modules/reports';
import {
  CreateStudentDto,
  GetStudentsQueryDto,
  UpdatePaymentDto,
  UpdateStudentDto,
} from '@/modules/students';
import { GetUsersQueryDto, UpdateUserDto } from '@/modules/users';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
});

async function transformValue<T>(
  metatype: new () => T,
  value: Record<string, unknown>,
  type: ArgumentMetadata['type'] = 'body',
): Promise<T> {
  return pipe.transform(value, {
    type,
    metatype,
    data: '',
  } as ArgumentMetadata);
}

describe('Empty value normalization', () => {
  it('normalizes empty strings in API query DTOs', async () => {
    const students = await transformValue(
      GetStudentsQueryDto,
      {
        courseType: '',
        branchId: '',
        status: '',
        search: '   ',
        page: '',
        limit: '',
      },
      'query',
    );

    expect(students.courseType).toBeUndefined();
    expect(students.branchId).toBeUndefined();
    expect(students.status).toBeUndefined();
    expect(students.search).toBeUndefined();
    expect(students.page).toBeUndefined();
    expect(students.limit).toBeUndefined();

    const users = await transformValue(
      GetUsersQueryDto,
      {
        branchId: '',
        search: '   ',
      },
      'query',
    );

    expect(users.branchId).toBeUndefined();
    expect(users.search).toBeUndefined();

    const groups = await transformValue(
      GetGroupsQueryDto,
      {
        branchId: '',
      },
      'query',
    );

    expect(groups.branchId).toBeUndefined();

    const revenue = await transformValue(
      GetRevenueQueryDto,
      {
        branchId: '',
        courseType: '',
        startDate: '',
        endDate: '',
      },
      'query',
    );

    expect(revenue.branchId).toBeUndefined();
    expect(revenue.courseType).toBeUndefined();
    expect(revenue.startDate).toBeUndefined();
    expect(revenue.endDate).toBeUndefined();
  });

  it('normalizes empty strings in SSR query DTOs', async () => {
    const dashboard = await transformValue(
      SsrDashboardQueryDto,
      {
        branchId: '',
        status: '',
        search: '   ',
        courseType: '',
      },
      'query',
    );

    expect(dashboard.branchId).toBeUndefined();
    expect(dashboard.status).toBeUndefined();
    expect(dashboard.search).toBeUndefined();
    expect(dashboard.courseType).toBeUndefined();

    const students = await transformValue(
      SsrStudentsQueryDto,
      {
        branchId: '',
        status: '',
        search: '   ',
        courseType: '',
        page: '',
        limit: '',
      },
      'query',
    );

    expect(students.branchId).toBeUndefined();
    expect(students.status).toBeUndefined();
    expect(students.search).toBeUndefined();
    expect(students.courseType).toBeUndefined();
    expect(students.page).toBeUndefined();
    expect(students.limit).toBeUndefined();

    const managers = await transformValue(
      SsrManagersQueryDto,
      {
        branchId: '',
        search: '   ',
      },
      'query',
    );

    expect(managers.branchId).toBeUndefined();
    expect(managers.search).toBeUndefined();

    const reports = await transformValue(
      SsrReportsQueryDto,
      {
        branchId: '',
        courseType: '',
        startDate: '',
        endDate: '',
      },
      'query',
    );

    expect(reports.branchId).toBeUndefined();
    expect(reports.courseType).toBeUndefined();
    expect(reports.startDate).toBeUndefined();
    expect(reports.endDate).toBeUndefined();
  });

  it('keeps invalid query params rejected', async () => {
    await expect(
      transformValue(
        GetStudentsQueryDto,
        {
          courseType: 'INVALID',
        },
        'query',
      ),
    ).rejects.toThrow();

    await expect(
      transformValue(
        GetStudentsQueryDto,
        {
          branchId: 'not-a-uuid',
        },
        'query',
      ),
    ).rejects.toThrow();

    await expect(
      transformValue(
        GetStudentsQueryDto,
        {
          page: '-5',
        },
        'query',
      ),
    ).rejects.toThrow();
  });

  it('normalizes empty strings in body DTOs without losing valid updates', async () => {
    const createStudent = await transformValue(CreateStudentDto, {
      firstName: 'Ali',
      lastName: 'Valiyev',
      phone: '+998901010101',
      courseType: 'standard',
      totalPrice: 6000000,
      groupId: '',
      contractNumber: '',
      completionDate: '',
      o83: '',
      hasDocument: '',
      paymentMethod: '',
      result: '',
      notes: '   ',
      branchId: '',
    });

    expect(createStudent.groupId).toBeUndefined();
    expect(createStudent.contractNumber).toBeUndefined();
    expect(createStudent.completionDate).toBeUndefined();
    expect(createStudent.o83).toBeUndefined();
    expect(createStudent.hasDocument).toBeUndefined();
    expect(createStudent.paymentMethod).toBeUndefined();
    expect(createStudent.result).toBeUndefined();
    expect(createStudent.notes).toBeUndefined();
    expect(createStudent.branchId).toBeUndefined();

    const updateStudent = await transformValue(UpdateStudentDto, {
      firstName: 'Ali',
      groupId: '',
      contractNumber: '',
      completionDate: '',
      o83: '',
      hasDocument: '',
      paymentMethod: '',
      result: '',
      notes: '   ',
    });

    expect(updateStudent.firstName).toBe('Ali');
    expect(updateStudent.groupId).toBeUndefined();
    expect(updateStudent.contractNumber).toBeUndefined();
    expect(updateStudent.completionDate).toBeUndefined();
    expect(updateStudent.o83).toBeUndefined();
    expect(updateStudent.hasDocument).toBeUndefined();
    expect(updateStudent.paymentMethod).toBeUndefined();
    expect(updateStudent.result).toBeUndefined();
    expect(updateStudent.notes).toBeUndefined();

    const updatePayment = await transformValue(UpdatePaymentDto, {
      initialPayment: '',
      secondPayment: '250000',
      thirdPayment: '',
    });

    expect(updatePayment.initialPayment).toBeUndefined();
    expect(updatePayment.secondPayment).toBe(250000);
    expect(updatePayment.thirdPayment).toBeUndefined();

    const updateUser = await transformValue(UpdateUserDto, {
      fullName: '  Test User  ',
      phone: '  +998901234567  ',
      branchId: '',
    });

    expect(updateUser.fullName).toBe('Test User');
    expect(updateUser.phone).toBe('+998901234567');
    expect(updateUser.branchId).toBeUndefined();
  });
});
