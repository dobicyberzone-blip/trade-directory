// Migrate isSuperAdmin=true users to role='SUPER_ADMIN' before dropping the column
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Use raw SQL since isSuperAdmin may not be in the Prisma schema anymore
const result = await prisma.$executeRaw`
  UPDATE "users" 
  SET role = 'SUPER_ADMIN' 
  WHERE "isSuperAdmin" = true AND role = 'ADMIN'
`;

console.log(`✓ Migrated ${result} users from isSuperAdmin=true to role='SUPER_ADMIN'`);

// Show who got promoted
const promoted = await prisma.$queryRaw`
  SELECT email, role FROM "users" WHERE role = 'SUPER_ADMIN'
`;
console.log('\nSUPER_ADMIN users:');
promoted.forEach(u => console.log(`  ${u.email}`));

await prisma.$disconnect();
