/**
 * Product Verification API v2 - Production Ready
 * Correctly mapped to Prisma Product schema
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch products for verification with correct schema mapping
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const publishedParam = searchParams.get('published');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by verification status
    if (status && status !== 'all') {
      where.verified = status === 'VERIFIED';
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    if (publishedParam !== null && publishedParam !== undefined && publishedParam !== '') {
      where.published = publishedParam === 'true';
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Optimized query - prevent N+1, include business and user relations
    const products = await prisma.product.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sortField]: sortOrder },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            verificationStatus: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: products,
      total,
      page,
      pageSize,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Update product verification status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject', 'togglePublish'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve", "reject", or "togglePublish"' },
        { status: 400 }
      );
    }

    // Handle togglePublish action
    if (action === 'togglePublish') {
      const { published } = body;
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { published: published === true, updatedAt: new Date() },
        select: { id: true, name: true, published: true },
      });
      return NextResponse.json({
        success: true,
        message: updatedProduct.published ? 'Product published successfully' : 'Product unpublished successfully',
        product: updatedProduct,
      });
    }

    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update verification status
    const verified = action === 'approve';
    const updateData: any = {
      verified,
      updatedAt: new Date(),
    };

    // Add verification notes if provided
    if (notes) {
      updateData.verificationNotes = notes;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for product owner
    await prisma.notification.create({
      data: {
        userId: currentProduct.business.ownerId,
        title: `Product ${action === 'approve' ? 'Verified' : 'Rejected'}`,
        message: action === 'approve'
          ? `Congratulations! Your product "${currentProduct.name}" has been verified and is now visible in the directory.${notes ? ` Note: ${notes}` : ''}`
          : `Your product "${currentProduct.name}" verification was rejected.${notes ? ` Reason: ${notes}` : ' Please review and update your information.'}`,
        type: 'PRODUCT_VERIFICATION',
        urgency: action === 'approve' ? 'MEDIUM' : 'HIGH',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product ${action === 'approve' ? 'verified' : 'rejected'} successfully`,
      product: updatedProduct,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete product
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully' 
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
