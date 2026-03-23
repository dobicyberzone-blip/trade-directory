import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { z } from 'zod';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const updatePhoneSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
});

// POST - Update user's phone number
export async function POST(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    
    if (!tokenPayload?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { phoneNumber } = updatePhoneSchema.parse(body);

    // Check if phone number is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber,
        id: { not: tokenPayload.userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number is already in use' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update user's phone number
    const updatedUser = await prisma.user.update({
      where: { id: tokenPayload.userId },
      data: { phoneNumber },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Phone number updated successfully',
        phoneNumber: updatedUser.phoneNumber,
        user: updatedUser,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update phone number' },
      { status: 500, headers: corsHeaders }
    );
  }
}
