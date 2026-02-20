import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

async function run() {
  const now = new Date();
  const activationApiKey = 'ACT-' + crypto.randomBytes(18).toString('hex');
  const employeePin = '123456';
  const adminEmail = 'audit-admin-pos-rbac@example.com';
  const employeeEmail = 'audit-employee-a-pos-rbac@example.com';

  const branchA = await prisma.pickupBranch.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000a1' },
    update: {
      name: 'Branch A Audit', city: 'Audit City A', address: 'Audit Address A', latitude: '19.432600', longitude: '-99.133200'
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000a1',
      name: 'Branch A Audit', city: 'Audit City A', address: 'Audit Address A', latitude: '19.432600', longitude: '-99.133200'
    }
  });

  const branchB = await prisma.pickupBranch.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000b2' },
    update: {
      name: 'Branch B Audit', city: 'Audit City B', address: 'Audit Address B', latitude: '20.659700', longitude: '-103.349600'
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000b2',
      name: 'Branch B Audit', city: 'Audit City B', address: 'Audit Address B', latitude: '20.659700', longitude: '-103.349600'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', status: 'ACTIVE', displayName: 'Audit Admin' },
    create: { email: adminEmail, role: 'ADMIN', status: 'ACTIVE', displayName: 'Audit Admin', firstName: 'Audit', lastName: 'Admin' }
  });

  const employee = await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {
      role: 'EMPLOYEE', status: 'ACTIVE', displayName: 'Audit Employee A', branchId: branchA.id,
      pinHash: hash(employeePin), pinUpdatedAt: now, failedPinAttempts: 0, pinLockedUntil: null
    },
    create: {
      email: employeeEmail, role: 'EMPLOYEE', status: 'ACTIVE', displayName: 'Audit Employee A', firstName: 'Audit', lastName: 'Employee',
      branchId: branchA.id, pinHash: hash(employeePin), pinUpdatedAt: now, failedPinAttempts: 0
    }
  });

  const terminal = await prisma.terminal.create({
    data: {
      name: 'Terminal B Audit', branchId: branchB.id, status: 'PENDING', activationApiKeyHash: hash(activationApiKey),
      deviceFingerprintHash: null, currentDeviceTokenHash: null, previousDeviceTokenHash: null, previousTokenGraceValidUntil: null,
      revokedAt: null, revokedByAdminId: null
    }
  });

  process.stdout.write(JSON.stringify({
    branchAId: branchA.id,
    branchBId: branchB.id,
    adminUserId: admin.id,
    employeeUserId: employee.id,
    terminalBId: terminal.id,
    terminalBActivationApiKey: activationApiKey,
    employeePin
  }, null, 2));
}

run().catch((error) => {
  process.stderr.write(String(error));
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
