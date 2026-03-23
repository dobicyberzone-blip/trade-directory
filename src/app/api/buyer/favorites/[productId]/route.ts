import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

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

// DELETE - Remove product from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    // Find and delete favorite
    const favorite = await prisma.productFavorite.findFirst({
      where: {
        userId: decoded.userId,
        productId: params.productId,
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { success: false, error: 'Favorite not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    await prisma.productFavorite.delete({
      where: { id: favorite.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product removed from favorites',
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
