import * as bcrypt from 'bcrypt';

import {
  CourseType,
  PaymentField,
  PaymentMethod,
  PrismaClient,
  Role,
  StudentResult,
  StudentStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_PHONE = '+998900000000';
const AUDIT_MANAGER_PHONE = '+998905555555';
const AUDIT_MANAGER_PASSWORD = 'audit123';

function calculateDebt(totalPrice: number, paidAmount: number): number {
  return Math.max(totalPrice - paidAmount, 0);
}

function calculatePaymentStatus(paidAmount: number, debt: number) {
  if (debt === 0) {
    return 'paid';
  }

  if (paidAmount > 0) {
    return 'partial';
  }

  return 'pending';
}

async function upsertAuditBranch(name: string, address: string, phone: string) {
  return prisma.branch.upsert({
    where: { name },
    update: {
      address,
      phone,
      deletedAt: null,
      isActive: true,
    },
    create: {
      name,
      address,
      phone,
    },
  });
}

async function resetBranchData(branchId: string) {
  await prisma.paymentLog.deleteMany({
    where: {
      student: {
        branchId,
      },
    },
  });

  await prisma.student.deleteMany({
    where: {
      branchId,
    },
  });

  await prisma.group.deleteMany({
    where: {
      branchId,
    },
  });
}

async function main() {
  const owner = await prisma.user.findFirst({
    where: {
      phone: OWNER_PHONE,
      role: Role.owner,
      deletedAt: null,
    },
  });

  if (!owner) {
    throw new Error(`Owner ${OWNER_PHONE} not found. Run prisma/seed.ts first.`);
  }

  const auditBranch = await upsertAuditBranch(
    'Audit Sandbox',
    'Audit sandbox branch',
    '+998712009999',
  );
  await upsertAuditBranch('Audit Empty', 'Empty branch for zero-state checks', '+998712009998');

  const auditManagerPasswordHash = await bcrypt.hash(AUDIT_MANAGER_PASSWORD, 10);
  const auditManager = await prisma.user.upsert({
    where: { phone: AUDIT_MANAGER_PHONE },
    update: {
      fullName: 'Audit Manager',
      password: auditManagerPasswordHash,
      role: Role.manager,
      branchId: auditBranch.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      fullName: 'Audit Manager',
      phone: AUDIT_MANAGER_PHONE,
      password: auditManagerPasswordHash,
      role: Role.manager,
      branchId: auditBranch.id,
    },
  });

  await resetBranchData(auditBranch.id);

  const [groupA, groupB] = await Promise.all([
    prisma.group.create({
      data: {
        name: 'AUD-STD-1',
        branchId: auditBranch.id,
        courseType: CourseType.standard,
      },
    }),
    prisma.group.create({
      data: {
        name: 'AUD-STD-2',
        branchId: auditBranch.id,
        courseType: CourseType.standard,
      },
    }),
  ]);

  const students = [
    {
      firstName: 'Audit',
      lastName: 'ExpressPaid',
      phone: '+998960500001',
      courseType: CourseType.express,
      totalPrice: 650000,
      amountPaid: 650000,
      paymentMethod: PaymentMethod.card,
      hasDocument: true,
      result: StudentResult.passed,
      status: StudentStatus.completed,
      notes: 'Audit express paid',
      createdAt: new Date('2026-01-10T10:00:00.000Z'),
    },
    {
      firstName: 'Audit',
      lastName: 'ExpressPartial',
      phone: '+998960500002',
      courseType: CourseType.express,
      totalPrice: 650000,
      amountPaid: 250000,
      paymentMethod: PaymentMethod.cash,
      hasDocument: false,
      result: StudentResult.pending,
      status: StudentStatus.active,
      notes: 'Audit express partial',
      createdAt: new Date('2026-02-10T10:00:00.000Z'),
    },
    {
      firstName: 'Audit',
      lastName: 'ExpressPending',
      phone: '+998960500003',
      courseType: CourseType.express,
      totalPrice: 650000,
      amountPaid: 0,
      paymentMethod: PaymentMethod.transfer,
      hasDocument: true,
      result: StudentResult.failed,
      status: StudentStatus.dropped,
      notes: 'Audit express pending',
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      firstName: 'Audit',
      lastName: 'StandardPaid',
      phone: '+998960500004',
      courseType: CourseType.standard,
      totalPrice: 6000000,
      initialPayment: 2000000,
      secondPayment: 2000000,
      thirdPayment: 2000000,
      groupId: groupA.id,
      contractNumber: 'AUD-001',
      o83: true,
      hasDocument: true,
      result: StudentResult.passed,
      status: StudentStatus.completed,
      notes: 'Audit standard paid',
      createdAt: new Date('2026-01-15T10:00:00.000Z'),
    },
    {
      firstName: 'Audit',
      lastName: 'StandardPartial',
      phone: '+998960500005',
      courseType: CourseType.standard,
      totalPrice: 6000000,
      initialPayment: 1000000,
      secondPayment: 500000,
      thirdPayment: 0,
      groupId: groupA.id,
      contractNumber: 'AUD-002',
      o83: false,
      hasDocument: false,
      result: StudentResult.pending,
      status: StudentStatus.active,
      notes: 'Audit standard partial',
      createdAt: new Date('2026-02-15T10:00:00.000Z'),
    },
    {
      firstName: 'Audit',
      lastName: 'StandardPending',
      phone: '+998960500006',
      courseType: CourseType.standard,
      totalPrice: 6000000,
      initialPayment: 0,
      secondPayment: 0,
      thirdPayment: 0,
      groupId: groupB.id,
      contractNumber: 'AUD-003',
      o83: false,
      hasDocument: true,
      result: StudentResult.failed,
      status: StudentStatus.dropped,
      notes: 'Audit standard pending',
      createdAt: new Date('2026-03-15T10:00:00.000Z'),
    },
  ];

  for (const studentSeed of students) {
    const totalPaid =
      studentSeed.courseType === CourseType.express
        ? studentSeed.amountPaid ?? 0
        : (studentSeed.initialPayment ?? 0) +
          (studentSeed.secondPayment ?? 0) +
          (studentSeed.thirdPayment ?? 0);
    const debt = calculateDebt(studentSeed.totalPrice, totalPaid);

    const student = await prisma.student.create({
      data: {
        ...studentSeed,
        branchId: auditBranch.id,
        registeredBy: auditManager.id,
        debt,
        paymentStatus: calculatePaymentStatus(totalPaid, debt),
        completionDate:
          studentSeed.courseType === CourseType.standard &&
          studentSeed.status === StudentStatus.completed
            ? new Date('2026-04-01T10:00:00.000Z')
            : null,
      },
    });

    if (studentSeed.courseType === CourseType.express && (studentSeed.amountPaid ?? 0) > 0) {
      await prisma.paymentLog.create({
        data: {
          studentId: student.id,
          changedBy: auditManager.id,
          paymentField: PaymentField.amountPaid,
          amount: studentSeed.amountPaid ?? 0,
          previousAmount: 0,
          newAmount: studentSeed.amountPaid ?? 0,
          createdAt: studentSeed.createdAt,
        },
      });
    }

    if (studentSeed.courseType === CourseType.standard) {
      const changes = [
        {
          paymentField: PaymentField.initialPayment,
          amount: studentSeed.initialPayment ?? 0,
        },
        {
          paymentField: PaymentField.secondPayment,
          amount: studentSeed.secondPayment ?? 0,
        },
        {
          paymentField: PaymentField.thirdPayment,
          amount: studentSeed.thirdPayment ?? 0,
        },
      ].filter((change) => change.amount > 0);

      if (changes.length > 0) {
        await prisma.paymentLog.createMany({
          data: changes.map((change) => ({
            studentId: student.id,
            changedBy: auditManager.id,
            paymentField: change.paymentField,
            amount: change.amount,
            previousAmount: 0,
            newAmount: change.amount,
            createdAt: studentSeed.createdAt,
          })),
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        auditBranch: auditBranch.name,
        auditManagerPhone: AUDIT_MANAGER_PHONE,
        auditManagerPassword: AUDIT_MANAGER_PASSWORD,
        groups: [groupA.name, groupB.name],
        studentsSeeded: students.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
