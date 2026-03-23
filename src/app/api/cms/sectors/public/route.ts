import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all businesses grouped by sector with counts
    const businessesBySector = await prisma.business.groupBy({
      by: ['sector'],
      where: {
        verificationStatus: 'VERIFIED',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Map sectors to the expected format
    const sectors = businessesBySector
      .filter(item => item.sector) // Filter out null sectors
      .map((item, index) => {
        const sectorName = item.sector || 'Other';
        
        // Determine icon based on sector name
        let icon = 'Building';
        let description = '';
        let products = '';
        
        if (sectorName.toLowerCase().includes('horticulture') || sectorName.toLowerCase().includes('flower') || sectorName.toLowerCase().includes('vegetable')) {
          icon = 'Leaf';
          description = 'Fresh flowers, vegetables, and fruits';
          products = 'Roses, Carnations, French Beans, Avocados';
        } else if (sectorName.toLowerCase().includes('tea') || sectorName.toLowerCase().includes('coffee')) {
          icon = 'Utensils';
          description = 'Premium tea and coffee exports';
          products = 'Black Tea, Green Tea, Arabica Coffee';
        } else if (sectorName.toLowerCase().includes('textile') || sectorName.toLowerCase().includes('apparel')) {
          icon = 'Palette';
          description = 'Textiles, garments, and fashion';
          products = 'T-Shirts, Dresses, Fabrics, Workwear';
        } else if (sectorName.toLowerCase().includes('mineral') || sectorName.toLowerCase().includes('mining')) {
          icon = 'Factory';
          description = 'Minerals and mining products';
          products = 'Soda Ash, Titanium, Fluorspar';
        } else if (sectorName.toLowerCase().includes('fish') || sectorName.toLowerCase().includes('aqua')) {
          icon = 'Utensils';
          description = 'Fish and seafood products';
          products = 'Nile Perch, Tilapia, Tuna, Prawns';
        } else if (sectorName.toLowerCase().includes('food') || sectorName.toLowerCase().includes('processed')) {
          icon = 'Utensils';
          description = 'Processed foods and beverages';
          products = 'Juices, Nuts, Snacks, Spices';
        } else if (sectorName.toLowerCase().includes('leather')) {
          icon = 'Palette';
          description = 'Leather goods and footwear';
          products = 'Shoes, Bags, Belts, Wallets';
        } else if (sectorName.toLowerCase().includes('construction')) {
          icon = 'Building';
          description = 'Construction materials';
          products = 'Cement, Steel, Tiles, Blocks';
        } else if (sectorName.toLowerCase().includes('automotive')) {
          icon = 'Factory';
          description = 'Automotive parts and accessories';
          products = 'Bus Bodies, Auto Parts, Batteries';
        } else if (sectorName.toLowerCase().includes('pharmaceutical')) {
          icon = 'Factory';
          description = 'Medicines and healthcare products';
          products = 'Generic Medicines, OTC Products';
        }

        return {
          id: `sector-${index}`,
          name: sectorName,
          icon,
          description,
          products,
          exporters: item._count.id,
          productCategories: [],
          sampleBusinesses: [],
        };
      });

    return NextResponse.json({ sectors });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch sectors' },
      { status: 500 }
    );
  }
}
