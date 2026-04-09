import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

import { PrismaClient, Role } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const OWNER = {
  fullName: 'System Owner',
  phone: '+998901234567',
  password: 'owner123',
} as const;

const BRANCHES = [
  {
    name: 'Minor',
    address: 'Minor branch',
    manager: {
      fullName: 'Minor Manager',
      phone: '+998901111111',
      password: 'manager123',
    },
  },
  {
    name: 'Chorsu',
    address: 'Chorsu branch',
    manager: {
      fullName: 'Chorsu Manager',
      phone: '+998902222222',
      password: 'manager123',
    },
  },
  {
    name: 'Novza',
    address: 'Novza branch',
    manager: {
      fullName: 'Novza Manager',
      phone: '+998903333333',
      password: 'manager123',
    },
  },
  {
    name: 'Samarqand',
    address: 'Samarqand branch',
    manager: {
      fullName: 'Samarqand Manager',
      phone: '+998904444444',
      password: 'manager123',
    },
  },
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

async function upsertBranch(name: string, address: string) {
  return prisma.branch.upsert({
    where: { name },
    update: {
      address,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name,
      address,
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

async function main() {
  const owner = await upsertOwner();
  console.log(`Owner ready: ${owner.phone}`);

  for (const branchSeed of BRANCHES) {
    const branch = await upsertBranch(branchSeed.name, branchSeed.address);

    const manager = await upsertManager({
      ...branchSeed.manager,
      branchId: branch.id,
    });

    console.log(`Branch ready: ${branch.name}`);
    console.log(`Manager ready: ${manager.phone} -> ${branch.name}`);
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
