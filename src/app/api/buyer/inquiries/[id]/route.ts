import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Validation schema for updating inquiry
const updateInquirySchema = z.object({
  status: z.enum(['PENDING', 'RESPONDED', 'CANCELLED', 'CLOSED']).optional(),
  message: z.string().optional(),
});

// GET - Get single inquiry details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            description: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Inquiry not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify ownership
    if (inquiry.buyerId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(inquiry, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH - Update inquiry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateInquirySchema.parse(body);

    // Verify ownership
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Inquiry not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (inquiry.buyerId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update inquiry
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry updated successfully',
      inquiry: updatedInquiry,
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
