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

// GET - Get product analytics
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

    if (decoded.role !== 'EXPORTER') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Exporter role required.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get exporter's business
    const business = await prisma.business.findFirst({
      where: { ownerId: decoded.userId },
    });

    if (!business) {
      return NextResponse.json({
        analytics: {
          totalProducts: 0,
          totalViews: 0,
          totalInquiries: 0,
          products: [],
        },
      }, { status: 200, headers: corsHeaders });
    }

    // Get all products with their stats
    const products = await prisma.product.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        views: true,
        verified: true,
        availability: true,
        createdAt: true,
        _count: {
          select: {
            inquiries: true,
            productFavorites: true,
          },
        },
      },
      orderBy: { views: 'desc' },
    });

    // Calculate totals
    const totalProducts = products.length;
    const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalInquiries = products.reduce((sum, p) => sum + p._count.inquiries, 0);
    const totalFavorites = products.reduce((sum, p) => sum + p._count.productFavorites, 0);

    // Format products with analytics
    const productsWithAnalytics = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      views: product.views || 0,
      inquiries: product._count.inquiries,
      favorites: product._count.productFavorites,
      verified: product.verified,
      availability: product.availability,
      createdAt: product.createdAt,
    }));

    return NextResponse.json({
      analytics: {
        totalProducts,
        totalViews,
        totalInquiries,
        totalFavorites,
        averageViewsPerProduct: totalProducts > 0 ? Math.round(totalViews / totalProducts) : 0,
        products: productsWithAnalytics,
      },
    }, { status: 200, headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
