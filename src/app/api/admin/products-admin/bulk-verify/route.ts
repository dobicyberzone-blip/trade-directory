/**
 * Admin Bulk Product Verification API
 * Verify multiple products at once
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productIds, verified } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Verified status (boolean) is required' },
        { status: 400 }
      );
    }

    // Update all products
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: {
        verified,
        updatedAt: new Date(),
      },
    });

    // Create notifications for product owners
    if (verified) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          business: {
            select: {
              ownerId: true,
              name: true,
            },
          },
        },
      });

      const notifications = products.map(product => ({
        userId: product.business.ownerId,
        title: 'Product Verified',
        message: `Your product "${product.name}" has been verified and is now visible to buyers.`,
        type: 'PRODUCT_VERIFICATION',
        urgency: 'MEDIUM',
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} products ${verified ? 'verified' : 'unverified'} successfully`,
      count: result.count,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to bulk verify products' },
      { status: 500 }
    );
  }
}

