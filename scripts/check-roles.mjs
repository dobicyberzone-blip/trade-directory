import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: { id: true, email: true, role: true },
  orderBy: { createdAt: 'asc' },
});

console.log('\nAll users and their roles:\n');
users.forEach(u => {
  console.log(`  ${u.email.padEnd(40)} role=${u.role}`);
});

const roleCounts = users.reduce((acc, u) => {
  acc[u.role] = (acc[u.role] || 0) + 1;
  return acc;
}, {});

console.log('\nRole counts:');
Object.entries(roleCounts).forEach(([role, count]) => {
  console.log(`  ${role}: ${count}`);
});

await prisma.$disconnect();
