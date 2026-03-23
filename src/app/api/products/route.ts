import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Use centralized Prisma client for Vercel serverless
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { sendAdminAlert, AdminAlertType, AlertPriority } from '@/lib/admin-alerts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string(),
  imageUrl: z.string().optional(),
  price: z.number().optional(),
  unit: z.string().optional(),
  minOrder: z.number().optional(),
  availability: z.boolean().optional(),
});

// GET all products with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');
    const verified = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    
    if (category) where.category = category;
    if (businessId) where.businessId = businessId;
    if (verified === 'true') where.verified = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch products and total count in parallel for better performance
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: limit,
        skip: page * limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          imageUrl: true,
          price: true,
          unit: true,
          minOrder: true,
          availability: true,
          verified: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          businessId: true,
          userId: true,
          business: {
            select: {
              id: true,
              name: true,
              location: true,
              sector: true,
              verificationStatus: true,
              logoUrl: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ 
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Only exporters can create products
    if (user.role !== 'EXPORTER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only exporters can create products' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: user.userId },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business profile not found. Please create your business profile first.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        businessId: business.id,
        userId: user.userId,
        verified: false,
      },
      include: {
        business: true,
      },
    });

    // Notify admins — new product pending verification
    void sendAdminAlert({
      type: AdminAlertType.NEW_EXPORTER_PROFILE,
      priority: AlertPriority.MEDIUM,
      title: 'New Product Submitted for Verification',
      message: `A new product "${product.name}" has been submitted by ${product.business?.name || 'an exporter'} and is pending verification.`,
      details: {
        productId: product.id,
        productName: product.name,
        businessId: business.id,
        businessName: business.name,
        category: product.category,
        action: 'Product requires review and verification',
      },
    }).catch(() => {});

    return NextResponse.json(
      { message: 'Product created successfully', product },
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
      { error: 'Failed to create product' },
      { status: 500, headers: corsHeaders }
    );
  }
}
