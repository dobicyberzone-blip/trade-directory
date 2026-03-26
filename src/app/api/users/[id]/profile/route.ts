import { NextRequest, NextResponse } from 'next/server';
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

// Validation schema for profile update
const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedIn: z.string().optional(),
  twitter: z.string().optional(),
  profileImage: z.string().optional(),
});

// PUT update user profile with extended fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Map phone to phoneNumber if provided
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.phone) {
      updateData.phoneNumber = validatedData.phone;
      delete updateData.phone;
    }

    // Update user with profile data
    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        business: true,
      },
    });
    
    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    // Send profile update email (async, don't wait)
    const updatedFields = Object.keys(validatedData).map(key => {
      const fieldNames: Record<string, string> = {
        firstName: 'First Name',
        lastName: 'Last Name',
        phoneNumber: 'Phone Number',
        phone: 'Phone Number',
        location: 'Location',
        bio: 'Bio',
        company: 'Company',
        position: 'Position',
        website: 'Website',
        linkedIn: 'LinkedIn',
        twitter: 'Twitter',
        profileImage: 'Profile Image',
      };
      return fieldNames[key] || key;
    });
    
    void sendProfileUpdateEmail(
      updatedUser.email,
      updatedUser.firstName,
      updatedFields
    ).catch(err => console.error('[Profile Update] Failed to send email:', err));

    // In-app notification for all roles (Buyer, Exporter, Partner)
    void prisma.notification.create({
      data: {
        userId: resolvedParams.id,
        title: 'Profile Updated Successfully',
        message: `Your profile was updated on ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}. Changes saved: ${updatedFields.join(', ')}.`,
        type: 'PROFILE_UPDATE',
        urgency: 'LOW',
        link: '/dashboard/settings/profile',
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: userWithoutPassword,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      include: {
        business: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}
