/**
 * Seed Industries, Sectors, and Business Organizations from constants.ts
 * Run: npx ts-node scripts/seed-master-data.ts
 */
import { PrismaClient } from '@prisma/client';
import { INDUSTRIES, SECTORS_BY_INDUSTRY } from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding master data...');

  for (let i = 0; i < INDUSTRIES.length; i++) {
    const industryName = INDUSTRIES[i];

    const industry = await prisma.industry.upsert({
      where: { name: industryName },
      update: { sortOrder: i, isActive: true },
      create: { name: industryName, sortOrder: i, isActive: true },
    });

    const sectors = SECTORS_BY_INDUSTRY[industryName] || [];
    for (let j = 0; j < sectors.length; j++) {
      const sectorName = sectors[j];
      await prisma.sector.upsert({
        where: { name_industryId: { name: sectorName, industryId: industry.id } },
        update: { sortOrder: j, isActive: true },
        create: { name: sectorName, industryId: industry.id, sortOrder: j, isActive: true },
      });
    }

    console.log(`  ✓ ${industryName} (${sectors.length} sectors)`);
  }

  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
