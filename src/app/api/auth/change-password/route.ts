import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';
import {
  getPasswordPolicy,
  validatePassword,
  isPasswordInHistory,
  addToPasswordHistory,
  recordPasswordAudit,
  setPasswordExpiry,
  canChangePassword,
  PASSWORD_ACTIONS,
} from '@/lib/password-policy';

// POST - Change password
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirmation are required' },
        { status: 400 }
      );
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        password: true,
        role: true,
        mustChangePassword: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValidPassword) {
      // Record failed attempt
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Get password policy
    const policy = await getPasswordPolicy(dbUser.role);

    // Check if minimum age requirement is met
    const canChange = await canChangePassword(dbUser.id);
    if (!canChange.canChange) {
      return NextResponse.json(
        { error: canChange.message || 'Cannot change password yet' },
        { status: 400 }
      );
    }

    // Validate new password against policy
    const validation = validatePassword(newPassword, policy);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Check if password is in history (prevent reuse)
    const inHistory = await isPasswordInHistory(dbUser.id, newPasswordHash, policy.historyCount);
    if (inHistory) {
      return NextResponse.json(
        { error: `Password has been used recently. Please choose a different password (history: ${policy.historyCount})` },
        { status: 400 }
      );
    }

    // Update password and set expiry
    const expiresAt = await setPasswordExpiry(dbUser.id, dbUser.role);

    // Update password hash
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        password: newPasswordHash,
        failedLoginAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Unlock if locked
      },
    });

    // Add to password history
    await addToPasswordHistory(dbUser.id, newPasswordHash, policy.historyCount);

    // Record audit
    await recordPasswordAudit(
      dbUser.id,
      PASSWORD_ACTIONS.PASSWORD_CHANGED,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') ?? undefined,
      'User initiated password change'
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      expiresAt,
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get password policy for current user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        role: true,
        passwordChangedAt: true,
        passwordExpiresAt: true,
        mustChangePassword: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const policy = await getPasswordPolicy(dbUser.role);
    
    // Calculate days until expiry
    let daysUntilExpiry = null;
    if (dbUser.passwordExpiresAt) {
      daysUntilExpiry = Math.ceil(
        (dbUser.passwordExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Check if warning should be shown
    const showWarning = daysUntilExpiry !== null && daysUntilExpiry <= policy.warnDays && daysUntilExpiry > 0;

    return NextResponse.json({
      success: true,
      data: {
        policy,
        passwordChangedAt: dbUser.passwordChangedAt,
        passwordExpiresAt: dbUser.passwordExpiresAt,
        mustChangePassword: dbUser.mustChangePassword,
        daysUntilExpiry,
        showWarning,
      },
    });
  } catch (error: any) {
    console.error('Error fetching password policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch password policy', details: error.message },
      { status: 500 }
    );
  }
}
