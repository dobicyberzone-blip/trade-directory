import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Set these emails as SUPER_ADMIN
const superAdmins = [
  'george.okello@eiti.tech',
  'gokello081@gmail.com',
];

for (const email of superAdmins) {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN' },
    select: { email: true, role: true },
  });
  console.log(`✓ ${user.email} → ${user.role}`);
}

await prisma.$disconnect();
