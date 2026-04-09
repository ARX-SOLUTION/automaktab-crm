import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

import {
  CourseType,
  PaymentField,
  PaymentMethod,
  PrismaClient,
  Role,
  StudentResult,
  StudentStatus,
} from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const LEGACY_OWNER_PHONE = '+998901234567';
const STANDARD_TOTAL_PRICE = 6_000_000;
const EXPRESS_TOTAL_PRICE = 650_000;

const OWNER = {
  fullName: 'Admin Boss',
  phone: '+998900000000',
  password: 'admin123',
} as const;

const BRANCHES = [
  {
    name: 'Minor',
    address: 'Minor, Toshkent',
    phone: '+998712000001',
    manager: {
      fullName: 'Minor Manager',
      phone: '+998901111111',
      password: 'manager123',
    },
  },
  {
    name: 'Chorsu',
    address: 'Chorsu, Toshkent',
    phone: '+998712000002',
    manager: {
      fullName: 'Chorsu Manager',
      phone: '+998902222222',
      password: 'manager123',
    },
  },
  {
    name: 'Novza',
    address: 'Novza, Toshkent',
    phone: '+998712000003',
    manager: {
      fullName: 'Novza Manager',
      phone: '+998903333333',
      password: 'manager123',
    },
  },
  {
    name: 'Samarqand',
    address: 'Samarqand shahri',
    phone: '+998662000004',
    manager: {
      fullName: 'Samarqand Manager',
      phone: '+998904444444',
      password: 'manager123',
    },
  },
] as const;

const GROUP_NAMES = ['B-1', 'B-2', 'B-3'] as const;

const STANDARD_PAYMENT_PROFILES = [
  { initialPayment: 2_500_000, secondPayment: 2_000_000, thirdPayment: 1_500_000 },
  { initialPayment: 1_500_000, secondPayment: 500_000, thirdPayment: 0 },
  { initialPayment: 0, secondPayment: 0, thirdPayment: 0 },
  { initialPayment: 3_000_000, secondPayment: 1_000_000, thirdPayment: 0 },
  { initialPayment: 1_000_000, secondPayment: 2_000_000, thirdPayment: 2_000_000 },
] as const;

const EXPRESS_PAYMENT_PROFILES = [
  { amountPaid: 650_000 },
  { amountPaid: 200_000 },
  { amountPaid: 0 },
  { amountPaid: 500_000 },
  { amountPaid: 650_000 },
] as const;

const STATUS_CYCLE = [
  StudentStatus.active,
  StudentStatus.active,
  StudentStatus.completed,
  StudentStatus.active,
  StudentStatus.dropped,
] as const;

const RESULT_CYCLE = [
  StudentResult.pending,
  StudentResult.pending,
  StudentResult.passed,
  StudentResult.pending,
  StudentResult.failed,
] as const;

const PAYMENT_METHOD_CYCLE = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer,
] as const;

async function upsertOwner() {
  const hashedPassword = await bcrypt.hash(OWNER.password, SALT_ROUNDS);

  return prisma.user.upsert({
    where: { phone: OWNER.phone },
    update: {
      fullName: OWNER.fullName,
      password: hashedPassword,
      role: Role.owner,
      branchId: null,
      isActive: true,
      deletedAt: null,
    },
    create: {
      fullName: OWNER.fullName,
      phone: OWNER.phone,
      password: hashedPassword,
      role: Role.owner,
    },
  });
}

async function upsertBranch(name: string, address: string, phone: string) {
  return prisma.branch.upsert({
    where: { name },
    update: {
      address,
      phone,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name,
      address,
      phone,
    },
  });
}

async function upsertManager(input: {
  fullName: string;
  phone: string;
  password: string;
  branchId: string;
}) {
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.user.upsert({
    where: { phone: input.phone },
    update: {
      fullName: input.fullName,
      password: hashedPassword,
      role: Role.manager,
      branchId: input.branchId,
      isActive: true,
      deletedAt: null,
    },
    create: {
      fullName: input.fullName,
      phone: input.phone,
      password: hashedPassword,
      role: Role.manager,
      branchId: input.branchId,
    },
  });
}

function calculateDebt(totalPrice: number, paidAmount: number): number {
  return totalPrice - paidAmount;
}

function calculatePaymentStatus(paidAmount: number, debt: number) {
  if (debt === 0) {
    return 'paid' as const;
  }

  if (paidAmount > 0) {
    return 'partial' as const;
  }

  return 'pending' as const;
}

async function resetDemoData() {
  await prisma.paymentLog.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
}

async function seedGroups(branchId: string) {
  const groups = [];

  for (const groupName of GROUP_NAMES) {
    const group = await prisma.group.create({
      data: {
        name: groupName,
        branchId,
        courseType: CourseType.standard,
        isActive: true,
      },
    });

    groups.push(group);
  }

  return groups;
}

async function createStandardStudent(input: {
  branchId: string;
  managerId: string;
  groupId: string;
  studentIndex: number;
  branchIndex: number;
  groupIndex: number;
}) {
  const profile = STANDARD_PAYMENT_PROFILES[input.studentIndex % STANDARD_PAYMENT_PROFILES.length];
  const totalPaid = profile.initialPayment + profile.secondPayment + profile.thirdPayment;
  const debt = calculateDebt(STANDARD_TOTAL_PRICE, totalPaid);
  const paymentStatus = calculatePaymentStatus(totalPaid, debt);
  const status = STATUS_CYCLE[input.studentIndex % STATUS_CYCLE.length];
  const result = RESULT_CYCLE[input.studentIndex % RESULT_CYCLE.length];
  const createdAt = new Date(
    Date.UTC(2026, 0, 5 + input.branchIndex * 8 + input.groupIndex * 2 + input.studentIndex),
  );

  const student = await prisma.student.create({
    data: {
      firstName: `Standard${input.branchIndex + 1}${input.groupIndex + 1}${input.studentIndex + 1}`,
      lastName: `Student${input.branchIndex + 1}${input.groupIndex + 1}`,
      phone: `+99895${String(input.branchIndex + 1).padStart(2, '0')}${String(
        input.groupIndex + 1,
      )}${String(input.studentIndex + 1).padStart(4, '0')}`,
      courseType: CourseType.standard,
      status,
      paymentStatus,
      totalPrice: STANDARD_TOTAL_PRICE,
      initialPayment: profile.initialPayment,
      secondPayment: profile.secondPayment,
      thirdPayment: profile.thirdPayment,
      debt,
      paymentMethod:
        PAYMENT_METHOD_CYCLE[(input.groupIndex + input.studentIndex) % PAYMENT_METHOD_CYCLE.length],
      groupId: input.groupId,
      completionDate:
        status === StudentStatus.completed
          ? new Date(Date.UTC(2026, 2, 1 + input.groupIndex + input.studentIndex))
          : null,
      contractNumber: `C-${input.branchIndex + 1}${input.groupIndex + 1}${String(
        input.studentIndex + 1,
      ).padStart(3, '0')}`,
      o83: input.studentIndex % 2 === 0,
      hasDocument: input.studentIndex % 3 !== 0,
      result,
      notes: `Seeded standard student for ${GROUP_NAMES[input.groupIndex]}`,
      branchId: input.branchId,
      registeredBy: input.managerId,
      createdAt,
      updatedAt: createdAt,
    },
  });

  const paymentLogs = [
    {
      paymentField: PaymentField.initialPayment,
      amount: profile.initialPayment,
      previousAmount: 0,
      newAmount: profile.initialPayment,
    },
    {
      paymentField: PaymentField.secondPayment,
      amount: profile.secondPayment,
      previousAmount: 0,
      newAmount: profile.secondPayment,
    },
    {
      paymentField: PaymentField.thirdPayment,
      amount: profile.thirdPayment,
      previousAmount: 0,
      newAmount: profile.thirdPayment,
    },
  ].filter((log) => log.amount > 0);

  if (paymentLogs.length > 0) {
    await prisma.paymentLog.createMany({
      data: paymentLogs.map((log, index) => ({
        studentId: student.id,
        changedBy: input.managerId,
        paymentField: log.paymentField,
        amount: log.amount,
        previousAmount: log.previousAmount,
        newAmount: log.newAmount,
        createdAt: new Date(createdAt.getTime() + (index + 1) * 60_000),
      })),
    });
  }
}

async function createExpressStudent(input: {
  branchId: string;
  managerId: string;
  studentIndex: number;
  branchIndex: number;
}) {
  const profile = EXPRESS_PAYMENT_PROFILES[input.studentIndex % EXPRESS_PAYMENT_PROFILES.length];
  const debt = calculateDebt(EXPRESS_TOTAL_PRICE, profile.amountPaid);
  const paymentStatus = calculatePaymentStatus(profile.amountPaid, debt);
  const status = STATUS_CYCLE[(input.studentIndex + 1) % STATUS_CYCLE.length];
  const result = RESULT_CYCLE[(input.studentIndex + 2) % RESULT_CYCLE.length];
  const createdAt = new Date(Date.UTC(2026, 1, 10 + input.branchIndex * 6 + input.studentIndex));

  const student = await prisma.student.create({
    data: {
      firstName: `Express${input.branchIndex + 1}${input.studentIndex + 1}`,
      lastName: `Student${input.branchIndex + 1}`,
      phone: `+99896${String(input.branchIndex + 1).padStart(2, '0')}${String(
        input.studentIndex + 1,
      ).padStart(5, '0')}`,
      courseType: CourseType.express,
      status,
      paymentStatus,
      totalPrice: EXPRESS_TOTAL_PRICE,
      amountPaid: profile.amountPaid,
      debt,
      paymentMethod: PAYMENT_METHOD_CYCLE[input.studentIndex % PAYMENT_METHOD_CYCLE.length],
      hasDocument: input.studentIndex % 2 === 0,
      result,
      notes: 'Seeded express student',
      branchId: input.branchId,
      registeredBy: input.managerId,
      createdAt,
      updatedAt: createdAt,
    },
  });

  if (profile.amountPaid > 0) {
    await prisma.paymentLog.create({
      data: {
        studentId: student.id,
        changedBy: input.managerId,
        paymentField: PaymentField.amountPaid,
        amount: profile.amountPaid,
        previousAmount: 0,
        newAmount: profile.amountPaid,
        createdAt: new Date(createdAt.getTime() + 30_000),
      },
    });
  }
}

async function seedBranchData(input: {
  branchId: string;
  branchIndex: number;
  managerId: string;
}) {
  const groups = await seedGroups(input.branchId);

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    for (let studentIndex = 0; studentIndex < 5; studentIndex += 1) {
      await createStandardStudent({
        branchId: input.branchId,
        managerId: input.managerId,
        groupId: groups[groupIndex].id,
        studentIndex,
        branchIndex: input.branchIndex,
        groupIndex,
      });
    }
  }

  for (let studentIndex = 0; studentIndex < 5; studentIndex += 1) {
    await createExpressStudent({
      branchId: input.branchId,
      managerId: input.managerId,
      studentIndex,
      branchIndex: input.branchIndex,
    });
  }

  console.log(`Seeded demo groups and students for branch ${input.branchIndex + 1}`);
}

async function main() {
  await prisma.user.deleteMany({
    where: { phone: LEGACY_OWNER_PHONE },
  });

  await resetDemoData();

  const owner = await upsertOwner();
  console.log(`Owner ready: ${owner.phone}`);

  for (let branchIndex = 0; branchIndex < BRANCHES.length; branchIndex += 1) {
    const branchSeed = BRANCHES[branchIndex];
    const branch = await upsertBranch(branchSeed.name, branchSeed.address, branchSeed.phone);
    const manager = await upsertManager({
      ...branchSeed.manager,
      branchId: branch.id,
    });

    console.log(`Branch ready: ${branch.name}`);
    console.log(`Manager ready: ${manager.phone} -> ${branch.name}`);

    await seedBranchData({
      branchId: branch.id,
      branchIndex,
      managerId: manager.id,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
