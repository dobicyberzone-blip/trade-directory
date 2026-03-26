/**
 * Centralized Constants for KEPROBA Trade Directory
 * 
 * This file contains all static data used across the application
 * to ensure consistency and make updates easier.
 */

// ============================================
// INDUSTRIES (Top-level numbered categories)
// ============================================
export const INDUSTRIES = [
  'Agriculture, Forestry & Fishing',
  'Mining & Quarrying',
  'Manufacturing',
  'Electricity, Gas, Steam & Air Conditioning Supply',
  'Water Supply, Sewerage & Waste Management',
  'Construction',
  'Wholesale & Retail Trade',
  'Transportation & Storage',
  'Accommodation & Food Service Activities',
  'Information & Communication (ICT)',
  'Financial & Insurance Activities',
  'Real Estate Activities',
  'Professional, Scientific & Technical Activities',
  'Administrative & Support Service Activities',
  'Public Administration & Defence',
  'Education',
  'Human Health & Social Work Activities',
  'Arts, Entertainment & Recreation',
  'Other Service Activities',
  'Households as Employers',
  'Extraterritorial Organizations',
  'Informal Sector (Jua Kali)',
] as const;

export const INDUSTRY_OPTIONS = INDUSTRIES.map(industry => ({
  value: industry,
  label: industry,
}));

// ============================================
// SECTORS BY INDUSTRY (dependent dropdown)
// ============================================
export const SECTORS_BY_INDUSTRY: Record<string, string[]> = {
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
    'Meat Processing',
    'Dairy Processing',
    'Grain Milling',
    'Sugar Manufacturing',
    'Beverage Production (Soft Drinks, Alcohol)',
    'Spinning, Weaving & Garment Production',
    'Leather Processing',
    'Pharmaceuticals',
    'Fertilizers',
    'Paints, Soaps & Cosmetics',
    'Cement Production',
    'Steel & Metal Fabrication',
    'Machinery & Equipment',
    'Plastics & Rubber',
    'Paper & Printing',
    'Furniture Production',
  ],
  'Electricity, Gas, Steam & Air Conditioning Supply': [
    'Power Generation (Hydro, Geothermal, Wind, Solar)',
    'Transmission & Distribution',
    'Gas Production & Distribution',
  ],
  'Water Supply, Sewerage & Waste Management': [
    'Water Collection & Distribution',
    'Sewerage Systems',
    'Waste Collection & Disposal',
    'Recycling Activities',
  ],
  'Construction': [
    'Residential Construction',
    'Commercial Construction',
    'Civil Engineering (Roads, Bridges)',
    'Specialized Construction (Plumbing, Electrical Works)',
  ],
  'Wholesale & Retail Trade': [
    'Wholesale Trade (Bulk Distribution)',
    'Retail Trade (Shops, Supermarkets)',
    'Motor Vehicle Sales & Repair',
    'E-Commerce',
  ],
  'Transportation & Storage': [
    'Road Transport (Matatus, Trucks, Taxis)',
    'Rail Transport',
    'Air Transport',
    'Maritime & Inland Water Transport',
    'Warehousing & Logistics',
    'Courier & Postal Services',
  ],
  'Accommodation & Food Service Activities': [
    'Hotels & Resorts',
    'Restaurants & Cafes',
    'Catering Services',
    'Bars & Clubs',
  ],
  'Information & Communication (ICT)': [
    'Telecommunications',
    'Software Development',
    'IT Consulting',
    'Data Processing & Hosting',
    'Media (TV, Radio, Publishing)',
    'Digital Platforms & Fintech',
  ],
  'Financial & Insurance Activities': [
    'Commercial Banking',
    'Microfinance',
    'SACCOs',
    'Insurance (Life & General)',
    'Pension Funds',
    'Investment Services',
  ],
  'Real Estate Activities': [
    'Property Development',
    'Renting & Leasing',
    'Property Management',
    'Land Sales',
  ],
  'Professional, Scientific & Technical Activities': [
    'Legal Services',
    'Accounting & Auditing',
    'Management Consulting',
    'Architecture & Engineering',
    'Scientific Research',
    'Advertising & Market Research',
  ],
  'Administrative & Support Service Activities': [
    'Security Services',
    'Cleaning Services',
    'Travel Agencies',
    'Call Centers (BPO)',
    'Employment Agencies',
  ],
  'Public Administration & Defence': [
    'National Government',
    'County Governments',
    'Defense Services',
    'Social Security Administration',
  ],
  'Education': [
    'Early Childhood Education',
    'Primary & Secondary Schools',
    'TVET Institutions',
    'Universities',
    'Private Training Institutions',
  ],
  'Human Health & Social Work Activities': [
    'Hospitals & Clinics',
    'Nursing Care',
    'Medical Laboratories',
    'Public Health Programs',
    'NGOs in Health & Social Work',
  ],
  'Arts, Entertainment & Recreation': [
    'Film & Music Production',
    'Sports Activities',
    'Gaming & Betting',
    'Cultural Activities',
    'Event Management',
  ],
  'Other Service Activities': [
    'Salons & Beauty Services',
    'Repair Services (Electronics, Appliances)',
    'Laundry Services',
    'Religious Organizations',
    'NGOs & Community-Based Organizations',
  ],
  'Households as Employers': [
    'Domestic Workers',
    'Home-Based Services',
    'Household Staff Employment',
  ],
  'Extraterritorial Organizations': [
    'Embassies',
    'International Organizations (UN Agencies, NGOs)',
  ],
  'Informal Sector (Jua Kali)': [
    'Small-Scale Traders',
    'Artisans',
    'Street Vendors',
    'Small Workshops',
  ],
};

// Flat list of all sectors across all industries
export const ALL_SECTORS = Object.values(SECTORS_BY_INDUSTRY).flat();

// Backward compat alias
export const INDUSTRY_CATEGORIES = INDUSTRIES as unknown as string[];

export const INDUSTRY_CATEGORY_OPTIONS = INDUSTRIES.map(ind => ({
  value: ind,
  label: ind,
}));

// ============================================
// KENYAN COUNTIES
// ============================================
export const COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Kiambu',
  'Machakos',
  'Kajiado',
  'Meru',
  'Nyeri',
  'Murang\'a',
  'Kirinyaga',
  'Embu',
  'Tharaka-Nithi',
  'Kitui',
  'Makueni',
  'Nyandarua',
  'Laikipia',
  'Samburu',
  'Trans Nzoia',
  'Uasin Gishu',
  'Elgeyo-Marakwet',
  'Nandi',
  'Baringo',
  'Kericho',
  'Bomet',
  'Kakamega',
  'Vihiga',
  'Bungoma',
  'Busia',
  'Siaya',
  'Kisii',
  'Nyamira',
  'Migori',
  'Homa Bay',
  'Turkana',
  'West Pokot',
  'Marsabit',
  'Isiolo',
  'Garissa',
  'Wajir',
  'Mandera',
  'Kwale',
  'Kilifi',
  'Tana River',
  'Lamu',
  'Taita-Taveta',
] as const;

export const COUNTY_OPTIONS = COUNTIES.map(county => ({
  value: county,
  label: county,
}));

// ============================================
// CERTIFICATIONS
// ============================================
export const CERTIFICATIONS = [
  'ISO 9001',
  'ISO 14001',
  'ISO 22000',
  'HACCP',
  'GlobalGAP',
  'Fair Trade',
  'Organic',
  'Rainforest Alliance',
  'UTZ Certified',
  'Fairtrade International',
  'Kenya Bureau of Standards (KEBS)',
  'Export Processing Zones (EPZ)',
  'Other',
] as const;

export const CERTIFICATION_OPTIONS = CERTIFICATIONS.map(cert => ({
  value: cert,
  label: cert,
}));

// ============================================
// EXPORT MARKETS
// ============================================
export const EXPORT_MARKETS = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Belgium',
  'Italy',
  'Spain',
  'China',
  'Japan',
  'South Korea',
  'India',
  'UAE',
  'Saudi Arabia',
  'Egypt',
  'South Africa',
  'Tanzania',
  'Uganda',
  'Rwanda',
  'Burundi',
  'Ethiopia',
  'Somalia',
  'Other',
] as const;

export const EXPORT_MARKET_OPTIONS = EXPORT_MARKETS.map(market => ({
  value: market,
  label: market,
}));

// ============================================
// BUSINESS VERIFICATION STATUS
// ============================================
export const VERIFICATION_STATUS = [
  'PENDING',
  'VERIFIED',
  'APPROVED',
  'REJECTED',
] as const;

export const VERIFICATION_STATUS_OPTIONS = VERIFICATION_STATUS.map(status => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = [
  'ADMIN',
  'EXPORTER',
  'BUYER',
] as const;

export const USER_ROLE_OPTIONS = USER_ROLES.map(role => ({
  value: role,
  label: role.charAt(0) + role.slice(1).toLowerCase(),
}));

// ============================================
// PARTNER TYPES (for Buyer role)
// ============================================
export const PARTNER_TYPES = [
  'Development Partners',
  "TSI's",
  'Kenya Government Ministries & State Department',
  'Kenya Missions Abroad',
  'Other',
] as const;

export const PARTNER_TYPE_OPTIONS = PARTNER_TYPES.map(type => ({
  value: type,
  label: type,
}));

// ============================================
// PRODUCT CATEGORIES
// ============================================
export const PRODUCT_CATEGORIES = [
  'Fresh Produce',
  'Processed Foods',
  'Beverages',
  'Textiles',
  'Handicrafts',
  'Leather Goods',
  'Minerals',
  'Services',
  'Technology',
  'Other',
] as const;

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map(category => ({
  value: category,
  label: category,
}));

// ============================================
// RATING FILTERS
// ============================================
export const RATING_FILTERS = [
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
  { value: '1', label: '1+ Stars' },
] as const;

// ============================================
// BOOLEAN FILTERS
// ============================================
export const BOOLEAN_FILTERS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;

// ============================================
// LEGAL STRUCTURES
// ============================================
export const LEGAL_STRUCTURES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Company (LLC)',
  'Private Limited Company (Ltd)',
  'Public Limited Company (PLC)',
  'Corporation',
  'Co-operative Society',
  'Non-Governmental Organization (NGO)',
  'State Corporation',
  'Joint Venture',
  'Franchise',
  'Other',
] as const;

export const LEGAL_STRUCTURE_OPTIONS = LEGAL_STRUCTURES.map(structure => ({
  value: structure,
  label: structure,
}));

// ============================================
// SERVICE OFFERINGS
// ============================================
export const SERVICE_OFFERINGS = [
  'Export Trading',
  'Import Trading',
  'Logistics & Freight Forwarding',
  'Customs Clearing',
  'Quality Inspection',
  'Certification Services',
  'Market Research',
  'Business Consulting',
  'Finance & Insurance',
  'Legal Services',
  'Manufacturing',
  'Processing & Packaging',
  'Warehouse & Storage',
  'Transportation',
  'Other',
] as const;

export const SERVICE_OFFERING_OPTIONS = SERVICE_OFFERINGS.map(service => ({
  value: service,
  label: service,
}));

// ============================================
// KENYAN CITIES
// ============================================
export const KENYAN_CITIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Kisumu',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Nyeri',
  'Meru',
  'Machakos',
  'Lamu',
  'Naivasha',
  'Nanyuki',
  'Migori',
  'Eldama Ravine',
  'Narok',
  'Kajiado',
  'Kericho',
  'Kakamega',
  'Bungoma',
  'Busia',
  'Siaya',
  'Homa Bay',
  'Mombasa',
  'Kilifi',
  'Kwale',
  'Tana River',
  'Lamu',
  'Taita-Taveta',
  'Marsabit',
  'Isiolo',
  'Meru',
  'Tharaka-Nithi',
  'Embu',
  'Kitui',
  'Makueni',
  'Machakos',
  'Mwingi',
  'Nyandarua',
  'Laikipia',
  'Samburu',
  'Trans Nzoia',
  'Uasin Gishu',
  'Elgeyo-Marakwet',
  'Nandi',
  'Baringo',
  'Kericho',
  'Bomet',
  'Nyamira',
  'Migori',
  'Kisii',
  'Other',
] as const;

export const CITY_OPTIONS = KENYAN_CITIES.map(city => ({
  value: city,
  label: city,
}));

// ============================================
// HS CODES (Common Export Product Codes)
// ============================================
export const HS_CODES = [
  // Chapter 1-5: Live animals, Animal products
  '01 - Live Animals',
  '02 - Meat',
  '03 - Fish & Crustaceans',
  '04 - Dairy Products',
  '05 - Other Animal Products',
  // Chapter 6-14: Plants, Vegetables
  '06 - Live Plants',
  '07 - Edible Vegetables',
  '08 - Edible Fruits & Nuts',
  '09 - Coffee, Tea & Spices',
  '10 - Cereals',
  '11 - Milling Products',
  '12 - Oil Seeds & Oleaginous Fruits',
  '13 - Lac, Gums, Resins',
  '14 - Vegetable Plaiting Materials',
  // Chapter 15-24: Fats, Foods, Beverages
  '15 - Fats & Oils',
  '16 - Preparations of Meat/Fish',
  '17 - Sugars & Sugar Confectionery',
  '18 - Cocoa & Cocoa Preparations',
  '19 - Preparations of Cereals',
  '20 - Preparations of Vegetables',
  '21 - Miscellaneous Edible Preparations',
  '22 - Beverages, Spirits & Vinegar',
  '23 - Residues from Food Industries',
  '24 - Tobacco',
  // Chapter 25-27: Minerals, Fuels
  '25 - Salt, Sulfur, Stone',
  '26 - Ores, Slag, Ash',
  '27 - Mineral Fuels & Oils',
  // Chapter 28-38: Chemicals
  '28 - Inorganic Chemicals',
  '29 - Organic Chemicals',
  '30 - Pharmaceutical Products',
  '31 - Fertilizers',
  '32 - Tanning/Dyeing Extracts',
  '33 - Essential Oils & Resinoids',
  '34 - Soap, Waxes, Candles',
  '35 - Albuminoidal Substances',
  '36 - Explosives, Matches',
  '37 - Photographic Goods',
  '38 - Miscellaneous Chemical Products',
  // Chapter 39-40: Plastics, Rubber
  '39 - Plastics & Articles',
  '40 - Rubber & Articles',
  // Chapter 41-43: Leather
  '41 - Raw Hides & Leather',
  '42 - Articles of Leather',
  '43 - Furskins & Articles',
  // Chapter 44-49: Wood, Paper
  '44 - Wood & Articles',
  '45 - Cork & Articles',
  '46 - Manufactures of Straw',
  '47 - Pulp, Paper & Paperboard',
  '48 - Paper & Paperboard',
  '49 - Printed Books & Newspapers',
  // Chapter 50-63: Textiles
  '50 - Silk',
  '51 - Wool & Fine Animal Hair',
  '52 - Cotton',
  '53 - Other Vegetable Fibers',
  '54 - Man-Made Filaments',
  '55 - Man-Made Staple Fibers',
  '56 - Wadding, Nonwovens',
  '57 - Carpets & Floor Coverings',
  '58 - Special Woven Fabrics',
  '59 - Impregnated/Coated Textiles',
  '60 - Knitted/Crocheted Fabrics',
  '61 - Articles of Apparel (Knitted)',
  '62 - Articles of Apparel (Not Knitted)',
  '63 - Other Made-Up Textile Articles',
  // Chapter 64-67: Footwear, Headwear
  '64 - Footwear & Parts',
  '65 - Headwear & Parts',
  '66 - Umbrellas & Walking Sticks',
  '67 - Prepared Feathers & Articles',
  // Chapter 68-70: Stone, Ceramics, Glass
  '68 - Stone, Cement & Asbestos',
  '69 - Ceramic Products',
  '70 - Glass & Glassware',
  // Chapter 71: Precious Stones, Metals
  '71 - Pearls, Precious Stones & Metals',
  // Chapter 72-83: Base Metals
  '72 - Iron & Steel',
  '73 - Articles of Iron/Steel',
  '74 - Copper & Articles',
  '75 - Nickel & Articles',
  '76 - Aluminum & Articles',
  '78 - Lead & Articles',
  '79 - Zinc & Articles',
  '80 - Tin & Articles',
  '81 - Other Base Metals',
  '82 - Tools & Cutlery',
  '83 - Miscellaneous Base Metal Articles',
  // Chapter 84-85: Machinery
  '84 - Nuclear Reactors & Parts',
  '85 - Electrical Machinery',
  // Chapter 86-89: Vehicles, Aircraft, Ships
  '86 - Railway/Tramway Vehicles',
  '87 - Vehicles (Not Railway)',
  '88 - Aircraft & Parts',
  '89 - Ships & Boats',
  // Chapter 90-92: Optical, Medical, Musical
  '90 - Optical & Medical Instruments',
  '91 - Clocks & Watches',
  '92 - Musical Instruments',
  // Chapter 93-97: Arms, Miscellaneous
  '93 - Arms & Ammunition',
  '94 - Furniture & Bedding',
  '95 - Toys & Games',
  '96 - Miscellaneous Manufactured Articles',
  '97 - Works of Art & Antiques',
  'Other',
] as const;

export const HS_CODE_OPTIONS = HS_CODES.map(code => ({
  value: code,
  label: code,
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type Industry = typeof INDUSTRIES[number];
export type IndustrySector = string; // dynamic based on selected industry
export type County = typeof COUNTIES[number];
export type Certification = typeof CERTIFICATIONS[number];
export type ExportMarket = typeof EXPORT_MARKETS[number];
export type VerificationStatus = typeof VERIFICATION_STATUS[number];
export type UserRole = typeof USER_ROLES[number];
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type PartnerType = typeof PARTNER_TYPES[number];
export type LegalStructure = typeof LEGAL_STRUCTURES[number];
export type ServiceOffering = typeof SERVICE_OFFERINGS[number];
export type KenyanCity = typeof KENYAN_CITIES[number];
export type HsCode = typeof HS_CODES[number];
