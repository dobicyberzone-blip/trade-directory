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
      where: { settingKey: 'home_benefits' }
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

    // Return default benefits
    const defaultBenefits = [
      {
        id: '1',
        title: 'Verified Exporters',
        description: 'All businesses are verified for quality and reliability',
        icon: 'shield-check',
      },
      {
        id: '2',
        title: 'Direct Connection',
        description: 'Connect directly with exporters without intermediaries',
        icon: 'link',
      },
      {
        id: '3',
        title: 'Wide Selection',
        description: 'Access to diverse products across multiple sectors',
        icon: 'grid',
      },
      {
        id: '4',
        title: 'Secure Platform',
        description: 'Safe and secure communication and transactions',
        icon: 'lock',
      },
    ];

    return NextResponse.json(
      { 
        success: true,
        benefits: defaultBenefits
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    // Return default benefits even on error
    const defaultBenefits = [
      { id: '1', title: 'Verified Exporters', description: 'All businesses are verified for quality and reliability', icon: 'shield-check' },
      { id: '2', title: 'Direct Connection', description: 'Connect directly with exporters without intermediaries', icon: 'link' },
      { id: '3', title: 'Wide Selection', description: 'Access to diverse products across multiple sectors', icon: 'grid' },
      { id: '4', title: 'Secure Platform', description: 'Safe and secure communication and transactions', icon: 'lock' },
    ];
    return NextResponse.json(
      { 
        success: true,
        benefits: defaultBenefits
      },
      { headers: corsHeaders }
    );
  }
}
