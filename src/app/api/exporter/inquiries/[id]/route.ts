import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendInquiryResponseEmail } from '@/lib/email-templates';

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

// Validation schema for responding to inquiry
const respondInquirySchema = z.object({
  message: z.string().min(10),
  status: z.enum(['PENDING', 'RESPONDED', 'CANCELLED', 'CLOSED']).optional(),
});

// POST - Respond to inquiry
export async function POST(
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

    if (decoded.role !== 'EXPORTER') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Exporter role required.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const validatedData = respondInquirySchema.parse(body);

    // Get exporter's business
    const business = await prisma.business.findFirst({
      where: { ownerId: decoded.userId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify inquiry belongs to this business
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    if (inquiry.businessId !== business.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update inquiry with response
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: {
        response: validatedData.message,
        status: validatedData.status || 'RESPONDED',
        respondedAt: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: inquiry.buyerId,
        type: 'INQUIRY_RESPONSE',
        title: 'Inquiry Response Received',
        message: `${business.name} has responded to your inquiry about ${inquiry.product.name}`,
        link: `/dashboard/inquiries/${inquiry.id}`,
      },
    });

    // Send email to buyer
    if (inquiry.buyer?.email) {
      void sendInquiryResponseEmail(
        inquiry.buyer.email,
        `${inquiry.buyer.firstName} ${inquiry.buyer.lastName}`,
        business.name,
        inquiry.product.name
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Response sent successfully',
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
