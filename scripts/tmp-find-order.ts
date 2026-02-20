import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const order = await prisma.onlineOrder.findFirst({
    select: { id: true, pickupBranchId: true, orderCode: true },
    orderBy: { createdAt: 'desc' }
  });
  process.stdout.write(JSON.stringify(order || {}, null, 2));
}
run().finally(async()=>{await prisma.$disconnect();});
