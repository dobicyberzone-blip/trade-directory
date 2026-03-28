import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

// Default policies for each role
const DEFAULT_POLICIES = [
  { 
    role: 'ADMIN', 
    maxAgeDays: 30, 
    minAgeDays: 1, 
    minLength: 12, 
    requireUppercase: true, 
    requireLowercase: true, 
    requireNumbers: true, 
    requireSpecialChars: true, 
    historyCount: 10, 
    warnDays: 7, 
    lockoutMinutes: 30, 
    maxFailedAttempts: 3,
    graceLoginEnabled: true,
    graceLoginDays: 3,
    graceLoginAttempts: 2,
    notifyBeforeExpiry: true,
    notifyOnExpiry: true,
    notifyOnGraceExpiry: true,
    enforceOnLogin: false,
    maxConsecutiveExpired: 3
  },
  { 
    role: 'EXPORTER', 
    maxAgeDays: 90, 
    minAgeDays: 1, 
    minLength: 8, 
    requireUppercase: true, 
    requireLowercase: true, 
    requireNumbers: true, 
    requireSpecialChars: true, 
    historyCount: 5, 
    warnDays: 7, 
    lockoutMinutes: 30, 
    maxFailedAttempts: 5,
    graceLoginEnabled: true,
    graceLoginDays: 3,
    graceLoginAttempts: 2,
    notifyBeforeExpiry: true,
    notifyOnExpiry: true,
    notifyOnGraceExpiry: true,
    enforceOnLogin: false,
    maxConsecutiveExpired: 3
  },
  { 
    role: 'BUYER', 
    maxAgeDays: 90, 
    minAgeDays: 1, 
    minLength: 8, 
    requireUppercase: true, 
    requireLowercase: true, 
    requireNumbers: true, 
    requireSpecialChars: false, 
    historyCount: 5, 
    warnDays: 7, 
    lockoutMinutes: 30, 
    maxFailedAttempts: 5,
    graceLoginEnabled: true,
    graceLoginDays: 3,
    graceLoginAttempts: 2,
    notifyBeforeExpiry: true,
    notifyOnExpiry: true,
    notifyOnGraceExpiry: true,
    enforceOnLogin: false,
    maxConsecutiveExpired: 3
  },
];

// GET - Get all password policies or specific policy
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Auto-seed defaults if table is empty
    const count = await prisma.passwordPolicy.count();
    if (count === 0) {
      await prisma.passwordPolicy.createMany({
        data: DEFAULT_POLICIES.map(p => ({
          role: p.role,
          maxAgeDays: p.maxAgeDays,
          minAgeDays: p.minAgeDays,
          minLength: p.minLength,
          requireUppercase: p.requireUppercase,
          requireLowercase: p.requireLowercase,
          requireNumbers: p.requireNumbers,
          requireSpecialChars: p.requireSpecialChars,
          historyCount: p.historyCount,
          warnDays: p.warnDays,
          lockoutMinutes: p.lockoutMinutes,
          maxFailedAttempts: p.maxFailedAttempts,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role) {
      // Get specific policy
      const policy = await prisma.passwordPolicy.findUnique({
        where: { role: role.toUpperCase() },
      });

      if (!policy) {
        return NextResponse.json({ error: 'Policy not found for role' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: policy });
    }

    // Get all policies
    const policies = await prisma.passwordPolicy.findMany({
      orderBy: { role: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    console.error('Error fetching password policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch password policies', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or initialize default policies
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { role, maxAgeDays, minAgeDays, minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, historyCount, warnDays, lockoutMinutes, maxFailedAttempts } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['ADMIN', 'EXPORTER', 'BUYER'];
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid role. Must be ADMIN, EXPORTER, or BUYER' }, { status: 400 });
    }

    // Validate numeric ranges
    if (maxAgeDays !== undefined && (maxAgeDays < 1 || maxAgeDays > 365)) {
      return NextResponse.json({ error: 'maxAgeDays must be between 1 and 365' }, { status: 400 });
    }
    if (minAgeDays !== undefined && (minAgeDays < 0 || minAgeDays > 30)) {
      return NextResponse.json({ error: 'minAgeDays must be between 0 and 30' }, { status: 400 });
    }
    if (minLength !== undefined && (minLength < 6 || minLength > 128)) {
      return NextResponse.json({ error: 'minLength must be between 6 and 128' }, { status: 400 });
    }

    // Check if policy already exists
    const existing = await prisma.passwordPolicy.findUnique({
      where: { role: role.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Policy already exists for this role. Use PUT to update.' },
        { status: 400 }
      );
    }

    const policy = await prisma.passwordPolicy.create({
      data: {
        role: role.toUpperCase(),
        maxAgeDays: maxAgeDays || 90,
        minAgeDays: minAgeDays || 1,
        minLength: minLength || 8,
        requireUppercase: requireUppercase ?? true,
        requireLowercase: requireLowercase ?? true,
        requireNumbers: requireNumbers ?? true,
        requireSpecialChars: requireSpecialChars ?? true,
        historyCount: historyCount || 5,
        warnDays: warnDays || 7,
        lockoutMinutes: lockoutMinutes || 30,
        maxFailedAttempts: maxFailedAttempts || 5,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    console.error('Error creating password policy:', error);
    return NextResponse.json(
      { error: 'Failed to create password policy', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update password policy
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { role, maxAgeDays, minAgeDays, minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, historyCount, warnDays, lockoutMinutes, maxFailedAttempts, isActive } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Validate numeric ranges
    if (maxAgeDays !== undefined && (maxAgeDays < 1 || maxAgeDays > 365)) {
      return NextResponse.json({ error: 'maxAgeDays must be between 1 and 365' }, { status: 400 });
    }
    if (minAgeDays !== undefined && (minAgeDays < 0 || minAgeDays > 30)) {
      return NextResponse.json({ error: 'minAgeDays must be between 0 and 30' }, { status: 400 });
    }
    if (minAgeDays !== undefined && maxAgeDays !== undefined && minAgeDays >= maxAgeDays) {
      return NextResponse.json({ error: 'minAgeDays must be less than maxAgeDays' }, { status: 400 });
    }
    if (minLength !== undefined && (minLength < 6 || minLength > 128)) {
      return NextResponse.json({ error: 'minLength must be between 6 and 128' }, { status: 400 });
    }
    if (warnDays !== undefined && maxAgeDays !== undefined && warnDays >= maxAgeDays) {
      return NextResponse.json({ error: 'warnDays must be less than maxAgeDays' }, { status: 400 });
    }

    // Upsert policy
    const policy = await prisma.passwordPolicy.upsert({
      where: { role: role.toUpperCase() },
      update: {
        ...(maxAgeDays !== undefined && { maxAgeDays }),
        ...(minAgeDays !== undefined && { minAgeDays }),
        ...(minLength !== undefined && { minLength }),
        ...(requireUppercase !== undefined && { requireUppercase }),
        ...(requireLowercase !== undefined && { requireLowercase }),
        ...(requireNumbers !== undefined && { requireNumbers }),
        ...(requireSpecialChars !== undefined && { requireSpecialChars }),
        ...(historyCount !== undefined && { historyCount }),
        ...(warnDays !== undefined && { warnDays }),
        ...(lockoutMinutes !== undefined && { lockoutMinutes }),
        ...(maxFailedAttempts !== undefined && { maxFailedAttempts }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      create: {
        role: role.toUpperCase(),
        maxAgeDays: maxAgeDays || 90,
        minAgeDays: minAgeDays || 1,
        minLength: minLength || 8,
        requireUppercase: requireUppercase ?? true,
        requireLowercase: requireLowercase ?? true,
        requireNumbers: requireNumbers ?? true,
        requireSpecialChars: requireSpecialChars ?? true,
        historyCount: historyCount || 5,
        warnDays: warnDays || 7,
        lockoutMinutes: lockoutMinutes || 30,
        maxFailedAttempts: maxFailedAttempts || 5,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    console.error('Error updating password policy:', error);
    return NextResponse.json(
      { error: 'Failed to update password policy', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete password policy
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    await prisma.passwordPolicy.delete({
      where: { role: role.toUpperCase() },
    });

    return NextResponse.json({ success: true, message: 'Policy deleted' });
  } catch (error: any) {
    console.error('Error deleting password policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete password policy', details: error.message },
      { status: 500 }
    );
  }
}
