import prisma from './prisma';

// Password policy actions
export const PASSWORD_ACTIONS = {
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_EXPIRED: 'PASSWORD_EXPIRED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  FORCE_CHANGE: 'FORCE_CHANGE',
  PASSWORD_LOCKOUT: 'PASSWORD_LOCKOUT',
  PASSWORD_UNLOCKED: 'PASSWORD_UNLOCKED',
} as const;

// Get password policy for a role
export async function getPasswordPolicy(role: string): Promise<any> {
  const policy = await prisma.passwordPolicy.findUnique({
    where: { role: role.toUpperCase() },
  });

  // Return default policy if none exists
  if (!policy) {
    return {
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
      isActive: true,
    };
  }

  return policy;
}

// Validate password against policy
export function validatePassword(password: string, policy: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Check if password is in history (prevents reuse)
export async function isPasswordInHistory(userId: string, passwordHash: string, historyCount: number): Promise<boolean> {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { changedAt: 'desc' },
    take: historyCount,
  });

  return history.some((entry: { passwordHash: string }) => entry.passwordHash === passwordHash);
}

// Add password to history
export async function addToPasswordHistory(userId: string, passwordHash: string, historyCount: number): Promise<void> {
  // Add new entry
  await prisma.passwordHistory.create({
    data: {
      userId,
      passwordHash,
    },
  });

  // Clean up old entries (keep only historyCount)
  const count = await prisma.passwordHistory.count({
    where: { userId },
  });

  if (count > historyCount) {
    const oldEntries = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'asc' },
      take: count - historyCount,
    });

    const ids = oldEntries.map((e: { id: string }) => e.id);
    await prisma.passwordHistory.deleteMany({
      where: { id: { in: ids } },
    });
  }
}

// Record password change audit
export async function recordPasswordAudit(
  userId: string,
  action: string,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await prisma.passwordChangeAudit.create({
    data: {
      userId,
      action,
      ipAddress,
      userAgent,
      reason,
    },
  });
}

// Check if password is expired
export async function isPasswordExpired(userId: string): Promise<{ expired: boolean; expiresAt?: Date; daysUntilExpiry?: number; inGracePeriod?: boolean; graceDaysRemaining?: number; graceAttemptsRemaining?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordExpiresAt: true, mustChangePassword: true, graceLoginAllowed: true, graceLoginUsed: true },
  });

  if (!user) {
    return { expired: false };
  }

  // Check if password change is forced
  if (user.mustChangePassword) {
    return { expired: true, expiresAt: undefined, daysUntilExpiry: 0, inGracePeriod: false };
  }

  if (!user.passwordExpiresAt) {
    return { expired: false };
  }

  const now = new Date();
  const expiresAt = user.passwordExpiresAt;
  const isExpired = expiresAt < now;

  // Get policy for grace login settings
  const userRole = (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role || 'BUYER';
  const policy = await getPasswordPolicy(userRole);

  if (!isExpired) {
    // Not expired yet
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      expired: false,
      expiresAt,
      daysUntilExpiry: daysUntilExpiry < 0 ? 0 : daysUntilExpiry,
    };
  }

  // Password is expired - check grace period
  if (policy.graceLoginEnabled && user.graceLoginAllowed) {
    const graceEndDate = new Date(expiresAt);
    graceEndDate.setDate(graceEndDate.getDate() + policy.graceLoginDays);
    
    if (now < graceEndDate) {
      // In grace period
      const graceDaysRemaining = Math.ceil((graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const graceAttemptsRemaining = policy.graceLoginAttempts - (user.graceLoginUsed || 0);
      
      return {
        expired: true,
        expiresAt,
        daysUntilExpiry: 0,
        inGracePeriod: true,
        graceDaysRemaining: isNaN(graceDaysRemaining) ? 0 : graceDaysRemaining,
        graceAttemptsRemaining,
      };
    }
  }

  // Grace period expired
  return {
    expired: true,
    expiresAt,
    daysUntilExpiry: 0,
    inGracePeriod: false,
  };
}

// Get users with expiring passwords (for notifications)
export async function getUsersWithExpiringPasswords(daysThreshold: number = 7): Promise<any[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysThreshold);

  const users = await prisma.user.findMany({
    where: {
      passwordExpiresAt: {
        lte: futureDate,
        gte: new Date(),
      },
      suspended: false,
      deleted: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      passwordExpiresAt: true,
    },
  });

  return users.map((user) => ({
    ...user,
    daysUntilExpiry: Math.ceil(
      (user.passwordExpiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

// Set password expiry for user
export async function setPasswordExpiry(userId: string, role: string): Promise<Date> {
  const policy = await getPasswordPolicy(role);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + policy.maxAgeDays);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordChangedAt: new Date(),
      passwordExpiresAt: expiresAt,
      mustChangePassword: false,
    },
  });

  return expiresAt;
}

// Force password change for user
export async function forcePasswordChange(userId: string, reason?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mustChangePassword: true,
    },
  });

  await recordPasswordAudit(userId, PASSWORD_ACTIONS.FORCE_CHANGE, undefined, undefined, reason);
}

// Check minimum age requirement (prevent rapid password changes)
export async function canChangePassword(userId: string): Promise<{ canChange: boolean; daysSinceChange?: number; message?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true },
  });

  if (!user?.passwordChangedAt) {
    return { canChange: true };
  }

  const policy = await getPasswordPolicy((await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role || 'BUYER');
  
  const daysSinceChange = Math.floor(
    (new Date().getTime() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceChange < policy.minAgeDays) {
    return {
      canChange: false,
      daysSinceChange,
      message: `You must wait ${policy.minAgeDays - daysSinceChange} more day(s) before changing your password`,
    };
  }

  return { canChange: true, daysSinceChange };
}
