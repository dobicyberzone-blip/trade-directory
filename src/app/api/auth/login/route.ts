import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import { sendLoginEmail } from '@/lib/email-templates';

// Use centralized Prisma client for Vercel serverless
import prisma from '@/lib/prisma';
import { isOTPBypassEnabled, logBypassAttempt } from '@/lib/auth/otpBypass';
import { logAuditAction } from '@/lib/audit-logger';
import { isPasswordExpired, getPasswordPolicy, forcePasswordChange, recordPasswordAudit, PASSWORD_ACTIONS } from '@/lib/password-policy';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  otpCode: z.string().optional(),
  otpMethod: z.enum(['EMAIL', 'SMS', 'TOTP']).optional(),
});

// Verify TOTP token
async function verifyTotpToken(userId: string, token: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totpSecret: true,
        totpEnabled: true,
        totpBackupCodes: true,
      },
    });

    if (!user?.totpEnabled || !user.totpSecret) {
      return false;
    }

    // Parse backup codes from JSON
    const backupCodes = user.totpBackupCodes ? JSON.parse(user.totpBackupCodes) : [];

    // Check if it's a backup code
    if (backupCodes.includes(token)) {
      // Remove used backup code
      const updatedBackupCodes = backupCodes.filter((code: string) => code !== token);
      await prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: JSON.stringify(updatedBackupCodes) },
      });
      return true;
    }

    // Verify TOTP token
    return speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });
  } catch (error) {

    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      include: {
        business: true,
      },
    }) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      // Record failed login attempt
      const policy = await getPasswordPolicy(user.role);
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get password policy and check expiry
    const policy = await getPasswordPolicy(user.role);
    const expiryCheck = await isPasswordExpired(user.id);
    
    // Reset failed attempts on successful password verification (only if not in grace period)
    if (!expiryCheck.inGracePeriod) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0 },
      });
    }

    // Check if password is expired or force change is required
    if (expiryCheck.expired) {
      // Check if in grace period
      if (expiryCheck.inGracePeriod && expiryCheck.graceAttemptsRemaining && expiryCheck.graceAttemptsRemaining > 0) {
        // Use grace login - increment counter
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            graceLoginUsed: { increment: 1 },
            lastPasswordExpiry: user.passwordExpiresAt,
          },
        });
        
        // Record the grace login
        await recordPasswordAudit(
          user.id,
          'GRACE_LOGIN_USED',
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent'),
          `Grace login used. ${expiryCheck.graceAttemptsRemaining - 1} attempts remaining.`
        );
        
        // Allow login but require password change
        const limitedToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role, passwordChangeOnly: true, graceLogin: true },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '1h' }
        );
        
        return NextResponse.json(
          {
            success: true,
            requiresPasswordChange: true,
            token: limitedToken,
            passwordExpired: true,
            inGracePeriod: true,
            graceDaysRemaining: expiryCheck.graceDaysRemaining,
            graceAttemptsRemaining: expiryCheck.graceAttemptsRemaining - 1,
            message: `Your password has expired. You are in the grace period. Please change your password now (${expiryCheck.graceAttemptsRemaining - 1} grace attempts remaining).`,
          },
          { status: 200, headers: corsHeaders }
        );
      }
      
      // Grace period exhausted - lock account
      // Check if max consecutive expired passwords exceeded
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { expiredPasswordCount: true },
      });
      
      const consecutiveExpired = (userRecord?.expiredPasswordCount || 0) + 1;
      
      if (consecutiveExpired >= policy.maxConsecutiveExpired) {
        // Permanent lockout due to repeated password expiration
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: null, // Permanent lock
            suspended: true,
            suspendedAt: new Date(),
            suspendedReason: 'Account locked due to repeated password expiration violations',
          },
        });
        
        return NextResponse.json(
          {
            success: false,
            error: 'Your account has been locked due to repeated password expiration violations. Please contact support.',
            passwordExpired: true,
            accountLocked: true,
          },
          { status: 403, headers: corsHeaders }
        );
      }
      
      // Temporary lockout
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockedUntil: new Date(Date.now() + policy.lockoutMinutes * 60 * 1000),
          expiredPasswordCount: consecutiveExpired,
          graceLoginAllowed: false,
        },
      });
      
      // Record expired password event
      await recordPasswordAudit(
        user.id,
        PASSWORD_ACTIONS.PASSWORD_EXPIRED,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent'),
        `Password expired. Grace period exhausted. Consecutive expiries: ${consecutiveExpired}`
      );
      
      return NextResponse.json(
        {
          success: false,
          error: 'Your password has expired and the grace period has ended. Please contact support to reset your password.',
          passwordExpired: true,
          gracePeriodExpired: true,
          lockedUntil: new Date(Date.now() + policy.lockoutMinutes * 60 * 1000),
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if force password change is required
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mustChangePassword: true },
    });
    
    if (userData?.mustChangePassword) {
      // Generate limited token that only allows password change
      const limitedToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, passwordChangeOnly: true },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );
      
      return NextResponse.json(
        {
          success: true,
          requiresPasswordChange: true,
          token: limitedToken,
          message: 'You are required to change your password before continuing.',
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Check if OTP bypass is enabled (for testing only)
    if (isOTPBypassEnabled()) {
      logBypassAttempt(user.id, user.email, user.role);
      
      // Generate JWT token directly without OTP
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(payload, jwtSecret, {
        expiresIn: '7d'
      });

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;

      // Check for password expiry warning
      const passwordExpiryWarning = expiryCheck.daysUntilExpiry != null && expiryCheck.daysUntilExpiry <= policy.warnDays && expiryCheck.daysUntilExpiry > 0
        ? { daysUntilExpiry: expiryCheck.daysUntilExpiry, message: `Your password will expire in ${expiryCheck.daysUntilExpiry} days. Please consider changing it.` }
        : null;

      return NextResponse.json({
        success: true,
        message: 'Login successful (OTP bypassed for testing)',
        token,
        user: userWithoutPassword,
        bypassActive: true,
        passwordWarning: passwordExpiryWarning
      }, { status: 200, headers: corsHeaders });
    }

    // MANDATORY OTP for ALL users - no exceptions
    // Always default to EMAIL if not set, NEVER allow NONE
    const preferredMethod = user.preferredOtpMethod === 'NONE' ? 'EMAIL' : (user.preferredOtpMethod || 'EMAIL');
    
    if (!validatedData.otpCode) {
      // Password is correct, but OTP is MANDATORY for all users
      return NextResponse.json(
        {
          requiresOtp: true,
          otpMethod: preferredMethod,
          userId: user.id,
          email: user.email,
          message: 'OTP verification required. Please check your ' + preferredMethod.toLowerCase(),
          passwordWarning: expiryCheck.daysUntilExpiry != null && expiryCheck.daysUntilExpiry <= policy.warnDays && expiryCheck.daysUntilExpiry > 0
            ? { daysUntilExpiry: expiryCheck.daysUntilExpiry, message: `Your password will expire in ${expiryCheck.daysUntilExpiry} days` }
            : null
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // If OTP code is provided, verify it
    if (validatedData.otpCode) {
      const otpMethod = validatedData.otpMethod || preferredMethod;
      
      if (otpMethod === 'TOTP') {
        // Verify TOTP
        const isValidTotp = await verifyTotpToken(user.id, validatedData.otpCode);
        if (!isValidTotp) {
          return NextResponse.json(
            { success: false, error: 'Invalid authenticator code' },
            { status: 401, headers: corsHeaders }
          );
        }
        
        // Mark email as verified after successful TOTP
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            emailVerified: true,
          },
        });
      } else {
        // Verify EMAIL or SMS OTP
        const otpRecord = await prisma.otpCode.findFirst({
          where: {
            email: validatedData.email.toLowerCase(),
            code: validatedData.otpCode,
            type: 'LOGIN',
            method: otpMethod,
            used: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (!otpRecord) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired OTP code' },
            { status: 401, headers: corsHeaders }
          );
        }

        // Mark OTP as used and update user's emailVerified status
        await Promise.all([
          prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { used: true },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { 
              emailVerified: true,
            },
          }),
        ]);
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '7d'
    });

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    // Normalize legacy BUYER+partnerType users to PARTNER role
    if (userWithoutPassword.role === 'BUYER' && userWithoutPassword.partnerType) {
      (userWithoutPassword as any).role = 'PARTNER';
    }

    // Send login notification email (async, don't wait)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    void sendLoginEmail(
      user.email,
      user.firstName,
      ipAddress,
      userAgent
    ).catch(err => console.error('[Login] Failed to send email:', err));

    // Log login activity
    void logAuditAction({
      userId: user.id,
      action: 'USER_LOGIN',
      description: `User logged in successfully`,
      ipAddress,
      userAgent,
      metadata: {
        email: user.email,
        role: user.role,
        otpMethod: validatedData.otpMethod || preferredMethod,
      },
    }).catch(err => console.error('[Login] Failed to log activity:', err));

    // Check for password expiry warning
    const passwordExpiryWarning = expiryCheck.daysUntilExpiry != null && expiryCheck.daysUntilExpiry <= policy.warnDays && expiryCheck.daysUntilExpiry > 0
      ? { daysUntilExpiry: expiryCheck.daysUntilExpiry, message: `Your password will expire in ${expiryCheck.daysUntilExpiry} days. Please consider changing it.` }
      : null;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
      passwordWarning: passwordExpiryWarning,
    }, { status: 200, headers: corsHeaders });

  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}