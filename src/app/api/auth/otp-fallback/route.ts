/**
 * OTP Fallback — returns the latest valid OTP from DB when email delivery fails.
 * Only works in non-production OR when OTP_FALLBACK_ENABLED=true.
 * Used as a temporary measure when SendGrid is misconfigured.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  // Only allow in non-production or when explicitly enabled
  const isEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.OTP_FALLBACK_ENABLED === 'true';

  if (!isEnabled) {
    return NextResponse.json({ error: 'Not available' }, { status: 404, headers: corsHeaders });
  }

  try {
    const { email, type = 'LOGIN' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400, headers: corsHeaders });
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        type,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { code: true, expiresAt: true, method: true },
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'No valid OTP found. Please request a new code.' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { code: otp.code, method: otp.method, expiresAt: otp.expiresAt },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch OTP' }, { status: 500, headers: corsHeaders });
  }
}
