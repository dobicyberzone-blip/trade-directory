import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Disable TOTP and clear secrets
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpBackupCodes: null,
        totpEnabled: false,
      },
    });

    return NextResponse.json(
      {
        message: 'Authenticator disabled successfully',
        enabled: false,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to disable authenticator' },
      { status: 500, headers: corsHeaders }
    );
  }
}
