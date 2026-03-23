import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

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

const inquirySchema = z.object({
  productId: z.string(),
  message: z.string().min(10),
  quantity: z.string().optional(),
  buyerId: z.string().optional(), // Will be set from auth token in production
});

// GET all inquiries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');

    const where: Record<string, unknown> = {};
    
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        product: {
          include: {
            business: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ inquiries }, { headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST create inquiry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = inquirySchema.parse(body);

    // Get product to find the seller
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: { business: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        productId: validatedData.productId,
        buyerId: validatedData.buyerId || 'temp-buyer-id', // TODO: Get from auth
        sellerId: product.business.ownerId,
        message: validatedData.message,
        quantity: validatedData.quantity,
        status: 'PENDING',
      },
      include: {
        product: {
          include: {
            business: true,
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

    return NextResponse.json(
      { message: 'Inquiry sent successfully', inquiry },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500, headers: corsHeaders }
    );
  }
}
