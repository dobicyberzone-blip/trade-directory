/**
 * Seed Industries & Sectors into the database.
 * Run: node scripts/seed-master-data.mjs
 * (No TypeScript compilation needed — plain ESM)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MASTER_DATA = {
  'Agriculture, Forestry & Fishing': [
    'Crop Production (Tea, Coffee, Maize, Wheat, Rice, Sugarcane)',
    'Horticulture (Flowers, Fruits, Vegetables)',
    'Livestock Production (Dairy, Beef, Poultry)',
    'Mixed Farming',
    'Agricultural Support Services',
    'Forestry & Logging',
    'Fishing & Aquaculture',
  ],
  'Mining & Quarrying': [
    'Extraction of Minerals (Titanium, Gold, Fluorspar)',
    'Stone Quarrying',
    'Sand Harvesting',
    'Salt Production',
    'Soda Ash Mining',
  ],
  'Manufacturing': [
    'Meat Processing', 'Dairy Processing', 'Grain Milling', 'Sugar Manufacturing',
    'Beverage Production (Soft Drinks, Alcohol)', 'Spinning, Weaving & Garment Production',
    'Leather Processing', 'Pharmaceuticals', 'Fertilizers', 'Paints, Soaps & Cosmetics',
    'Cement Production', 'Steel & Metal Fabrication', 'Machinery & Equipment',
    'Plastics & Rubber', 'Paper & Printing', 'Furniture Production',
  ],
  'Electricity, Gas, Steam & Air Conditioning Supply': [
    'Power Generation (Hydro, Geothermal, Wind, Solar)',
    'Transmission & Distribution',
    'Gas Production & Distribution',
  ],
  'Water Supply, Sewerage & Waste Management': [
    'Water Collection & Distribution', 'Sewerage Systems',
    'Waste Collection & Disposal', 'Recycling Activities',
  ],
  'Construction': [
    'Residential Construction', 'Commercial Construction',
    'Civil Engineering (Roads, Bridges)', 'Specialized Construction (Plumbing, Electrical Works)',
  ],
  'Wholesale & Retail Trade': [
    'Wholesale Trade (Bulk Distribution)', 'Retail Trade (Shops, Supermarkets)',
    'Motor Vehicle Sales & Repair', 'E-Commerce',
  ],
  'Transportation & Storage': [
    'Road Transport (Matatus, Trucks, Taxis)', 'Rail Transport', 'Air Transport',
    'Maritime & Inland Water Transport', 'Warehousing & Logistics', 'Courier & Postal Services',
  ],
  'Accommodation & Food Service Activities': [
    'Hotels & Resorts', 'Restaurants & Cafes', 'Catering Services', 'Bars & Clubs',
  ],
  'Information & Communication (ICT)': [
    'Telecommunications', 'Software Development', 'IT Consulting',
    'Data Processing & Hosting', 'Media (TV, Radio, Publishing)', 'Digital Platforms & Fintech',
  ],
  'Financial & Insurance Activities': [
    'Commercial Banking', 'Microfinance', 'SACCOs',
    'Insurance (Life & General)', 'Pension Funds', 'Investment Services',
  ],
  'Real Estate Activities': [
    'Property Development', 'Renting & Leasing', 'Property Management', 'Land Sales',
  ],
  'Professional, Scientific & Technical Activities': [
    'Legal Services', 'Accounting & Auditing', 'Management Consulting',
    'Architecture & Engineering', 'Scientific Research', 'Advertising & Market Research',
  ],
  'Administrative & Support Service Activities': [
    'Security Services', 'Cleaning Services', 'Travel Agencies',
    'Call Centers (BPO)', 'Employment Agencies',
  ],
  'Public Administration & Defence': [
    'National Government', 'County Governments', 'Defense Services', 'Social Security Administration',
  ],
  'Education': [
    'Early Childhood Education', 'Primary & Secondary Schools',
    'TVET Institutions', 'Universities', 'Private Training Institutions',
  ],
  'Human Health & Social Work Activities': [
    'Hospitals & Clinics', 'Nursing Care', 'Medical Laboratories',
    'Public Health Programs', 'NGOs in Health & Social Work',
  ],
  'Arts, Entertainment & Recreation': [
    'Film & Music Production', 'Sports Activities', 'Gaming & Betting',
    'Cultural Activities', 'Event Management',
  ],
  'Other Service Activities': [
    'Salons & Beauty Services', 'Repair Services (Electronics, Appliances)',
    'Laundry Services', 'Religious Organizations', 'NGOs & Community-Based Organizations',
  ],
  'Households as Employers': [
    'Domestic Workers', 'Home-Based Services', 'Household Staff Employment',
  ],
  'Extraterritorial Organizations': [
    'Embassies', 'International Organizations (UN Agencies, NGOs)',
  ],
  'Informal Sector (Jua Kali)': [
    'Small-Scale Traders', 'Artisans', 'Street Vendors', 'Small Workshops',
  ],
};

async function main() {
  const industries = Object.keys(MASTER_DATA);
  console.log(`Seeding ${industries.length} industries…`);

  for (let i = 0; i < industries.length; i++) {
    const industryName = industries[i];
    const sectors = MASTER_DATA[industryName];

    const industry = await prisma.industry.upsert({
      where: { name: industryName },
      update: { sortOrder: i, isActive: true },
      create: { name: industryName, sortOrder: i, isActive: true },
    });

    for (let j = 0; j < sectors.length; j++) {
      await prisma.sector.upsert({
        where: { name_industryId: { name: sectors[j], industryId: industry.id } },
        update: { sortOrder: j, isActive: true },
        create: { name: sectors[j], industryId: industry.id, sortOrder: j, isActive: true },
      });
    }

    console.log(`  ✓ ${industryName} (${sectors.length} sectors)`);
  }

  const totalSectors = Object.values(MASTER_DATA).flat().length;
  console.log(`\nDone. ${industries.length} industries, ${totalSectors} sectors seeded.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
