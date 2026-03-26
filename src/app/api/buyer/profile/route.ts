import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendProfileUpdateEmail } from '@/lib/email-templates';

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

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phoneNumber: z.string().min(10).optional(),
  company: z.string().optional(),
  country: z.string().optional(),
});

// GET - Get buyer profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.role !== 'BUYER') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Buyer role required.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        company: true,
        country: true,
        location: true,
        isVerified: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(user, { status: 200, headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT - Update buyer profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.role !== 'BUYER') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Buyer role required.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        company: true,
        country: true,
        location: true,
        isVerified: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    // Send profile update email + in-app notification
    const updatedFieldNames = Object.keys(validatedData).map(k =>
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
    );
    void sendProfileUpdateEmail(
      updatedUser.email,
      updatedUser.firstName,
      updatedFieldNames
    ).catch(() => {});

    void prisma.notification.create({
      data: {
        userId: decoded.userId,
        title: 'Profile Updated Successfully',
        message: `Your profile was updated on ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}. The following details were saved: ${updatedFieldNames.join(', ')}.`,
        type: 'PROFILE_UPDATE',
        urgency: 'LOW',
        link: '/dashboard/settings/profile',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
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
