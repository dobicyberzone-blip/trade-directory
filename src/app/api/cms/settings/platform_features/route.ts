import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Try to get from database using Prisma
    const content = await prisma.siteSettings.findFirst({
      where: { settingKey: 'platform_features' }
    });

    if (content) {
      return NextResponse.json(
        { 
          success: true,
          setting: content
        },
        { headers: corsHeaders }
      );
    }

    // Return default platform features
    const defaultFeatures = [
      { id: '1', title: 'Business Directory', description: 'Comprehensive directory of verified Kenyan exporters', icon: 'building' },
      { id: '2', title: 'Product Catalog', description: 'Browse thousands of products across multiple categories', icon: 'package' },
      { id: '3', title: 'Direct Messaging', description: 'Communicate directly with exporters in real-time', icon: 'message-circle' },
      { id: '4', title: 'Inquiry System', description: 'Send detailed inquiries and receive quick responses', icon: 'mail' },
      { id: '5', title: 'Ratings & Reviews', description: 'Read reviews and ratings from other buyers', icon: 'star' },
      { id: '6', title: 'Advanced Search', description: 'Find exactly what you need with powerful filters', icon: 'search' },
    ];

    return NextResponse.json(
      { 
        success: true,
        features: defaultFeatures
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    // Return default features even on error
    const defaultFeatures = [
      { id: '1', title: 'Business Directory', description: 'Comprehensive directory of verified Kenyan exporters', icon: 'building' },
      { id: '2', title: 'Product Catalog', description: 'Browse thousands of products across multiple categories', icon: 'package' },
      { id: '3', title: 'Direct Messaging', description: 'Communicate directly with exporters in real-time', icon: 'message-circle' },
      { id: '4', title: 'Inquiry System', description: 'Send detailed inquiries and receive quick responses', icon: 'mail' },
      { id: '5', title: 'Ratings & Reviews', description: 'Read reviews and ratings from other buyers', icon: 'star' },
      { id: '6', title: 'Advanced Search', description: 'Find exactly what you need with powerful filters', icon: 'search' },
    ];
    return NextResponse.json(
      { 
        success: true,
        features: defaultFeatures
      },
      { headers: corsHeaders }
    );
  }
}
