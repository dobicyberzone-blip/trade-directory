import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

// GET - Fetch single certification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const certification = await prisma.certification.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { businessCertifications: true },
        },
      },
    });

    if (!certification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ certification });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch certification' },
      { status: 500 }
    );
  }
}

// PUT - Update certification
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, logoUrl, isActive, sortOrder } = body;

    // Check if certification exists
    const existing = await prisma.certification.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.certification.findUnique({
        where: { name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Certification with this name already exists' },
          { status: 400 }
        );
      }
    }

    const certification = await prisma.certification.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ certification });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Check if certification exists
    const existing = await prisma.certification.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { businessCertifications: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    // Check if certification is in use
    if (existing._count.businessCertifications > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete certification. It is currently used by ${existing._count.businessCertifications} business(es).`,
        },
        { status: 400 }
      );
    }

    await prisma.certification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete certification' },
      { status: 500 }
    );
  }
}
