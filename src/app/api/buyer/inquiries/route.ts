import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendInquirySentEmail, sendInquiryReceivedEmail } from '@/lib/email-templates';

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

// Validation schema for creating inquiry
const createInquirySchema = z.object({
  productId: z.string(),
  message: z.string().min(10),
  quantity: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
});

// GET - Get buyer inquiries
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

    const inquiries = await prisma.inquiry.findMany({
      where: { buyerId: decoded.userId },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      inquiries,
    }, { status: 200, headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create inquiry
export async function POST(request: NextRequest) {
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
    const validatedData = createInquirySchema.parse(body);

    // Get product and business info
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: {
        business: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        buyerId: decoded.userId,
        productId: validatedData.productId,
        businessId: product.businessId,
        message: validatedData.message,
        quantity: validatedData.quantity,
        targetPrice: validatedData.targetPrice,
        status: 'PENDING',
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
        business: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });

    // Create notification for exporter
    await prisma.notification.create({
      data: {
        userId: product.business.ownerId,
        type: 'INQUIRY_RECEIVED',
        title: 'New Product Inquiry',
        message: `You have received a new inquiry for ${product.name}`,
        link: `/dashboard/inquiries/${inquiry.id}`,
      },
    });

    // Get buyer and exporter details for emails
    const buyer = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { firstName: true, lastName: true, email: true },
    });

    const exporter = await prisma.user.findUnique({
      where: { id: product.business.ownerId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (buyer && exporter) {
      // Send confirmation email to buyer (async, don't wait)
      void sendInquirySentEmail(
        buyer.email,
        `${buyer.firstName} ${buyer.lastName}`,
        product.business.name,
        product.name
      ).catch(err => console.error('[Inquiry] Failed to send buyer email:', err));

      // Send notification email to exporter (async, don't wait)
      void sendInquiryReceivedEmail(
        exporter.email,
        `${exporter.firstName} ${exporter.lastName}`,
        `${buyer.firstName} ${buyer.lastName}`,
        product.name,
        validatedData.message
      ).catch(err => console.error('[Inquiry] Failed to send exporter email:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent successfully',
      inquiry,
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
