import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

// GET - Get all settings or specific setting
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const category = searchParams.get('category');

    if (key) {
      // Get specific setting
      const setting = await prisma.siteSettings.findUnique({
        where: { settingKey: key },
      });

      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: setting });
    }

    // Get all settings or by category
    const where = category ? { category } : {};

    const settings = await prisma.siteSettings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { settingKey: 'asc' }],
    });

    // Group by category
    const grouped = settings.reduce((acc: Record<string, any[]>, setting: any) => {
      const cat = setting.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(setting);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: settings,
      grouped,
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new setting
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, type, category, description } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Check if setting already exists
    const existing = await prisma.siteSettings.findUnique({
      where: { settingKey: key },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Setting with this key already exists' },
        { status: 400 }
      );
    }

    const setting = await prisma.siteSettings.create({
      data: {
        settingKey: key,
        settingValue: value || '',
        category: category || 'general',
        description,
      },
    });

    // TODO: Log this action when SystemLog model is added
    // await prisma.systemLog.create({ ... });

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to create setting', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update setting
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, type, category, description } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const setting = await prisma.siteSettings.upsert({
      where: { settingKey: key },
      update: {
        ...(value !== undefined && { settingValue: value }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      },
      create: {
        settingKey: key,
        settingValue: value || '',
        category: category || 'general',
        description,
      },
    });

    // TODO: Log this action when SystemLog model is added
    // await prisma.systemLog.create({ ... });

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to update setting', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete setting
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await prisma.siteSettings.delete({
      where: { settingKey: key },
    });

    // TODO: Log this action when SystemLog model is added
    // await prisma.systemLog.create({ ... });

    return NextResponse.json({ success: true, message: 'Setting deleted' });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to delete setting', details: error.message },
      { status: 500 }
    );
  }
}

