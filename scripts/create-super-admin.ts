/**
 * Super Admin Creation Script
 * Run with: npx tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🚀 Creating Super Admin Account...\n');

  const email = 'admin@keproba.go.ke';
  const password = 'Admin@2024!'; // Change this password after first login
  const firstName = 'Super';
  const lastName = 'Admin';

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      
      // Update to super admin role
      const updated = await prisma.user.update({
        where: { email },
        data: { 
          role: 'ADMIN',
        },
      });
      
      console.log('✅ Updated existing user to ADMIN');
      console.log(`   Email: ${updated.email}`);
      console.log(`   Role: ${updated.role}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin (using existing schema fields)
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
        isVerified: true,
      },
    });

    console.log('✅ Admin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('\n🔗 Login URL: http://localhost:3000/login');
    console.log('\n📝 Note: To enable SUPER_ADMIN role, run database migration first:');
    console.log('   npx prisma generate');
    console.log('   npx prisma db push');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
