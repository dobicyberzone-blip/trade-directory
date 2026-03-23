import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

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

// Validation schema for adding favorite
const addFavoriteSchema = z.object({
  productId: z.string(),
});

// GET - Get buyer favorites
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

    const favorites = await prisma.productFavorite.findMany({
      where: { userId: decoded.userId },
      include: {
        product: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      favorites,
    }, { status: 200, headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Add product to favorites
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
    const validatedData = addFavoriteSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.productFavorite.findFirst({
      where: {
        userId: decoded.userId,
        productId: validatedData.productId,
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, error: 'Product already in favorites' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Add to favorites
    const favorite = await prisma.productFavorite.create({
      data: {
        userId: decoded.userId,
        productId: validatedData.productId,
      },
      include: {
        product: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product added to favorites',
      favorite,
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
