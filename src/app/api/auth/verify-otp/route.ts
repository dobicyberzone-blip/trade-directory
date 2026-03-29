import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';

// Use centralized Prisma client for Vercel serverless
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
      window: 2, // Allow 2 time steps before/after current time
    });
  } catch (error) {

    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, method, type = 'LOGIN', userId } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate method
    if (!['EMAIL', 'SMS', 'TOTP'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid OTP method. Must be EMAIL, SMS, or TOTP' },
        { status: 400, headers: corsHeaders }
      );
    }

    // For TOTP verification
    if (method === 'TOTP') {
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required for TOTP verification' },
          { status: 400, headers: corsHeaders }
        );
      }

      const isValid = await verifyTotpToken(userId, code);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired authenticator code' },
          { status: 401, headers: corsHeaders }
        );
      }

      // Get user data and update emailVerified status
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true, // Mark email as verified after successful TOTP
        },
        include: {
          business: true,
        },
      }) as any;

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
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

      return NextResponse.json(
        {
          message: 'Authenticator code verified successfully',
          verified: true,
          method: 'TOTP',
          token,
          user: userWithoutPassword,
        },
        { headers: corsHeaders }
      );
    }

    // For EMAIL and SMS verification
    const whereClause: Record<string, unknown> = {
      email,
      code,
      type,
      method,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    };

    const otpRecord = await prisma.otpCode.findFirst({
      where: whereClause,
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Get user data and update emailVerified status
    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true, // Mark email as verified after successful OTP
      },
      include: {
        business: true,
      },
    }) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
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

    return NextResponse.json(
      {
        message: 'OTP verified successfully',
        verified: true,
        method,
        token,
        user: userWithoutPassword,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500, headers: corsHeaders }
    );
  }
}
