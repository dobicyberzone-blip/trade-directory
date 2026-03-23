import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { sendAccountSuspendedEmail, sendAccountUnsuspendedEmail } from '@/lib/email-templates';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PATCH - Suspend/Unsuspend user (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { suspended } = body;

    if (typeof suspended !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid suspended value - must be boolean' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Prevent admin from suspending themselves
    if (id === user.userId) {
      return NextResponse.json(
        { error: 'Cannot suspend your own account' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update user suspension status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { suspended },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        suspended: true,
        updatedAt: true,
      },
    });

    // Send email notification to the user (fire-and-forget)
    if (suspended) {
      void sendAccountSuspendedEmail(updatedUser.email, updatedUser.firstName).catch(() => {});
    } else {
      void sendAccountUnsuspendedEmail(updatedUser.email, updatedUser.firstName).catch(() => {});
    }

    return NextResponse.json(
      {
        message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
        user: updatedUser,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user suspension status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
