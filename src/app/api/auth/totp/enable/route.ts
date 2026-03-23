import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user's TOTP secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user?.totpSecret) {
      return NextResponse.json(
        { error: 'TOTP not set up for this user. Please setup first.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (user.totpEnabled) {
      return NextResponse.json(
        { error: 'TOTP is already enabled for this user' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the token
    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Enable TOTP
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    return NextResponse.json(
      {
        message: 'Authenticator enabled successfully',
        enabled: true,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to enable authenticator' },
      { status: 500, headers: corsHeaders }
    );
  }
}
