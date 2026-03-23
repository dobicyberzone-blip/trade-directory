import { Business, User, BusinessCertification, Certification } from '@prisma/client';

export type BusinessWithRelations = Business & {
  owner: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumber'>;
  certifications: (BusinessCertification & {
    certification?: Certification | null;
  })[];
};

export interface BusinessFormData {
  // Basic Details
  kenyanNationalId: string;
  name?: string;           // read-only from registration
  logoUrl: string;
  
  // Business Details
  typeOfBusiness?: string;
  businessPurpose?: string;
  dateOfIncorporation?: string;
  legalStructure?: string;
  numberOfEmployees: string;
  companySize?: string;
  kraPin: string;
  registrationNumber?: string;
  exportLicense?: string;
  sector?: string;         // read-only from registration
  industry?: string;       // read-only from registration
  productHsCode?: string;
  serviceOffering?: string; // read-only from registration
  businessUserOrganisation?: string;
  shareholders?: string;
  managementTeam?: string;
  
  // Primary Contact
  primaryContactFirstName?: string;
  primaryContactLastName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  
  // Documents
  registrationCertificateUrl: string;
  pinCertificateUrl: string;
  kenyanNationalIdUrl?: string;
  incorporationCertificateUrl?: string;
  exportLicenseUrl?: string;
  
  // Location & Contact — read-only fields optional
  licenceNumber?: string;
  town?: string;           // read-only from registration
  county?: string;         // read-only from registration
  physicalAddress?: string; // read-only from registration
  website?: string;
  contactPhone?: string;   // read-only from registration
  mobileNumber?: string;
  companyEmail?: string;   // read-only from registration
  whatsappNumber?: string;
  
  // Social Media
  twitterUrl?: string;
  instagramUrl?: string;
  
  // Location GPS
  coordinates?: string;
  
  // Company Capacity
  exportVolumePast3Years?: string;
  currentExportMarkets?: string[];
  productionCapacityPast3?: string;
  
  // Company Story
  companyStory?: string;
  
  // Certifications (optional, for loading existing data)
  certifications?: CertificationFormData[];
}

export interface CertificationFormData {
  certificationId?: string | null;
  name: string;
  issuer: string;
  validUntil?: Date | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
}

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
}

export interface UploadMode {
  type: 'url' | 'upload';
}

export const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Company',
  'Public Limited Company',
  'Cooperative Society',
  'Non-Governmental Organization',
  'Other'
];

export const LEGAL_STRUCTURES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Company (LLC)',
  'Public Limited Company (PLC)',
  'Cooperative Society',
  'Non-Governmental Organization (NGO)',
  'Trust',
  'Association',
  'Other'
];

export const BUSINESS_SECTORS = [
  'Horticulture - Fresh Flowers & Vegetables',
  'Agriculture - Grains & Cereals',
  'Agriculture - Fruits',
  'Livestock & Animal Products',
  'Fisheries & Aquaculture',
  'Manufacturing',
  'Textiles & Apparel',
  'Handicrafts & Arts',
  'Technology & Software',
  'Services',
  'Other'
];

import { COUNTRIES } from '@/lib/countries';

export const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
  'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

export const EXPORT_MARKETS = [
  // Africa
  { value: 'Algeria', label: 'Algeria', region: 'Africa' },
  { value: 'Angola', label: 'Angola', region: 'Africa' },
  { value: 'Benin', label: 'Benin', region: 'Africa' },
  { value: 'Botswana', label: 'Botswana', region: 'Africa' },
  { value: 'Burkina Faso', label: 'Burkina Faso', region: 'Africa' },
  { value: 'Burundi', label: 'Burundi', region: 'Africa' },
  { value: 'Cameroon', label: 'Cameroon', region: 'Africa' },
  { value: 'Cape Verde', label: 'Cape Verde', region: 'Africa' },
  { value: 'Central African Republic', label: 'Central African Republic', region: 'Africa' },
  { value: 'Chad', label: 'Chad', region: 'Africa' },
  { value: 'Comoros', label: 'Comoros', region: 'Africa' },
  { value: 'Congo', label: 'Congo', region: 'Africa' },
  { value: 'DR Congo', label: 'DR Congo', region: 'Africa' },
  { value: 'Djibouti', label: 'Djibouti', region: 'Africa' },
  { value: 'Egypt', label: 'Egypt', region: 'Africa' },
  { value: 'Equatorial Guinea', label: 'Equatorial Guinea', region: 'Africa' },
  { value: 'Eritrea', label: 'Eritrea', region: 'Africa' },
  { value: 'Eswatini', label: 'Eswatini', region: 'Africa' },
  { value: 'Ethiopia', label: 'Ethiopia', region: 'Africa' },
  { value: 'Gabon', label: 'Gabon', region: 'Africa' },
  { value: 'Gambia', label: 'Gambia', region: 'Africa' },
  { value: 'Ghana', label: 'Ghana', region: 'Africa' },
  { value: 'Guinea', label: 'Guinea', region: 'Africa' },
  { value: 'Guinea-Bissau', label: 'Guinea-Bissau', region: 'Africa' },
  { value: 'Ivory Coast', label: 'Ivory Coast', region: 'Africa' },
  { value: 'Kenya', label: 'Kenya', region: 'Africa' },
  { value: 'Lesotho', label: 'Lesotho', region: 'Africa' },
  { value: 'Liberia', label: 'Liberia', region: 'Africa' },
  { value: 'Libya', label: 'Libya', region: 'Africa' },
  { value: 'Madagascar', label: 'Madagascar', region: 'Africa' },
  { value: 'Malawi', label: 'Malawi', region: 'Africa' },
  { value: 'Mali', label: 'Mali', region: 'Africa' },
  { value: 'Mauritania', label: 'Mauritania', region: 'Africa' },
  { value: 'Mauritius', label: 'Mauritius', region: 'Africa' },
  { value: 'Morocco', label: 'Morocco', region: 'Africa' },
  { value: 'Mozambique', label: 'Mozambique', region: 'Africa' },
  { value: 'Namibia', label: 'Namibia', region: 'Africa' },
  { value: 'Niger', label: 'Niger', region: 'Africa' },
  { value: 'Nigeria', label: 'Nigeria', region: 'Africa' },
  { value: 'Rwanda', label: 'Rwanda', region: 'Africa' },
  { value: 'Sao Tome and Principe', label: 'Sao Tome and Principe', region: 'Africa' },
  { value: 'Senegal', label: 'Senegal', region: 'Africa' },
  { value: 'Seychelles', label: 'Seychelles', region: 'Africa' },
  { value: 'Sierra Leone', label: 'Sierra Leone', region: 'Africa' },
  { value: 'Somalia', label: 'Somalia', region: 'Africa' },
  { value: 'South Africa', label: 'South Africa', region: 'Africa' },
  { value: 'South Sudan', label: 'South Sudan', region: 'Africa' },
  { value: 'Sudan', label: 'Sudan', region: 'Africa' },
  { value: 'Tanzania', label: 'Tanzania', region: 'Africa' },
  { value: 'Togo', label: 'Togo', region: 'Africa' },
  { value: 'Tunisia', label: 'Tunisia', region: 'Africa' },
  { value: 'Uganda', label: 'Uganda', region: 'Africa' },
  { value: 'Zambia', label: 'Zambia', region: 'Africa' },
  { value: 'Zimbabwe', label: 'Zimbabwe', region: 'Africa' },
  
  // Europe
  { value: 'Albania', label: 'Albania', region: 'Europe' },
  { value: 'Andorra', label: 'Andorra', region: 'Europe' },
  { value: 'Austria', label: 'Austria', region: 'Europe' },
  { value: 'Belarus', label: 'Belarus', region: 'Europe' },
  { value: 'Belgium', label: 'Belgium', region: 'Europe' },
  { value: 'Bosnia and Herzegovina', label: 'Bosnia and Herzegovina', region: 'Europe' },
  { value: 'Bulgaria', label: 'Bulgaria', region: 'Europe' },
  { value: 'Croatia', label: 'Croatia', region: 'Europe' },
  { value: 'Cyprus', label: 'Cyprus', region: 'Europe' },
  { value: 'Czech Republic', label: 'Czech Republic', region: 'Europe' },
  { value: 'Denmark', label: 'Denmark', region: 'Europe' },
  { value: 'Estonia', label: 'Estonia', region: 'Europe' },
  { value: 'Finland', label: 'Finland', region: 'Europe' },
  { value: 'France', label: 'France', region: 'Europe' },
  { value: 'Germany', label: 'Germany', region: 'Europe' },
  { value: 'Greece', label: 'Greece', region: 'Europe' },
  { value: 'Hungary', label: 'Hungary', region: 'Europe' },
  { value: 'Iceland', label: 'Iceland', region: 'Europe' },
  { value: 'Ireland', label: 'Ireland', region: 'Europe' },
  { value: 'Italy', label: 'Italy', region: 'Europe' },
  { value: 'Kosovo', label: 'Kosovo', region: 'Europe' },
  { value: 'Latvia', label: 'Latvia', region: 'Europe' },
  { value: 'Liechtenstein', label: 'Liechtenstein', region: 'Europe' },
  { value: 'Lithuania', label: 'Lithuania', region: 'Europe' },
  { value: 'Luxembourg', label: 'Luxembourg', region: 'Europe' },
  { value: 'Malta', label: 'Malta', region: 'Europe' },
  { value: 'Moldova', label: 'Moldova', region: 'Europe' },
  { value: 'Monaco', label: 'Monaco', region: 'Europe' },
  { value: 'Montenegro', label: 'Montenegro', region: 'Europe' },
  { value: 'Netherlands', label: 'Netherlands', region: 'Europe' },
  { value: 'North Macedonia', label: 'North Macedonia', region: 'Europe' },
  { value: 'Norway', label: 'Norway', region: 'Europe' },
  { value: 'Poland', label: 'Poland', region: 'Europe' },
  { value: 'Portugal', label: 'Portugal', region: 'Europe' },
  { value: 'Romania', label: 'Romania', region: 'Europe' },
  { value: 'Russia', label: 'Russia', region: 'Europe' },
  { value: 'San Marino', label: 'San Marino', region: 'Europe' },
  { value: 'Serbia', label: 'Serbia', region: 'Europe' },
  { value: 'Slovakia', label: 'Slovakia', region: 'Europe' },
  { value: 'Slovenia', label: 'Slovenia', region: 'Europe' },
  { value: 'Spain', label: 'Spain', region: 'Europe' },
  { value: 'Sweden', label: 'Sweden', region: 'Europe' },
  { value: 'Switzerland', label: 'Switzerland', region: 'Europe' },
  { value: 'Ukraine', label: 'Ukraine', region: 'Europe' },
  { value: 'United Kingdom', label: 'United Kingdom', region: 'Europe' },
  { value: 'Vatican City', label: 'Vatican City', region: 'Europe' },
  
  // Asia
  { value: 'Afghanistan', label: 'Afghanistan', region: 'Asia' },
  { value: 'Armenia', label: 'Armenia', region: 'Asia' },
  { value: 'Azerbaijan', label: 'Azerbaijan', region: 'Asia' },
  { value: 'Bahrain', label: 'Bahrain', region: 'Asia' },
  { value: 'Bangladesh', label: 'Bangladesh', region: 'Asia' },
  { value: 'Bhutan', label: 'Bhutan', region: 'Asia' },
  { value: 'Brunei', label: 'Brunei', region: 'Asia' },
  { value: 'Cambodia', label: 'Cambodia', region: 'Asia' },
  { value: 'China', label: 'China', region: 'Asia' },
  { value: 'Georgia', label: 'Georgia', region: 'Asia' },
  { value: 'India', label: 'India', region: 'Asia' },
  { value: 'Indonesia', label: 'Indonesia', region: 'Asia' },
  { value: 'Iran', label: 'Iran', region: 'Asia' },
  { value: 'Iraq', label: 'Iraq', region: 'Asia' },
  { value: 'Israel', label: 'Israel', region: 'Asia' },
  { value: 'Japan', label: 'Japan', region: 'Asia' },
  { value: 'Jordan', label: 'Jordan', region: 'Asia' },
  { value: 'Kazakhstan', label: 'Kazakhstan', region: 'Asia' },
  { value: 'Kuwait', label: 'Kuwait', region: 'Asia' },
  { value: 'Kyrgyzstan', label: 'Kyrgyzstan', region: 'Asia' },
  { value: 'Laos', label: 'Laos', region: 'Asia' },
  { value: 'Lebanon', label: 'Lebanon', region: 'Asia' },
  { value: 'Malaysia', label: 'Malaysia', region: 'Asia' },
  { value: 'Maldives', label: 'Maldives', region: 'Asia' },
  { value: 'Mongolia', label: 'Mongolia', region: 'Asia' },
  { value: 'Myanmar', label: 'Myanmar', region: 'Asia' },
  { value: 'Nepal', label: 'Nepal', region: 'Asia' },
  { value: 'North Korea', label: 'North Korea', region: 'Asia' },
  { value: 'Oman', label: 'Oman', region: 'Asia' },
  { value: 'Pakistan', label: 'Pakistan', region: 'Asia' },
  { value: 'Palestine', label: 'Palestine', region: 'Asia' },
  { value: 'Philippines', label: 'Philippines', region: 'Asia' },
  { value: 'Qatar', label: 'Qatar', region: 'Asia' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia', region: 'Asia' },
  { value: 'Singapore', label: 'Singapore', region: 'Asia' },
  { value: 'South Korea', label: 'South Korea', region: 'Asia' },
  { value: 'Sri Lanka', label: 'Sri Lanka', region: 'Asia' },
  { value: 'Syria', label: 'Syria', region: 'Asia' },
  { value: 'Taiwan', label: 'Taiwan', region: 'Asia' },
  { value: 'Tajikistan', label: 'Tajikistan', region: 'Asia' },
  { value: 'Thailand', label: 'Thailand', region: 'Asia' },
  { value: 'Timor-Leste', label: 'Timor-Leste', region: 'Asia' },
  { value: 'Turkey', label: 'Turkey', region: 'Asia' },
  { value: 'Turkmenistan', label: 'Turkmenistan', region: 'Asia' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates', region: 'Asia' },
  { value: 'Uzbekistan', label: 'Uzbekistan', region: 'Asia' },
  { value: 'Vietnam', label: 'Vietnam', region: 'Asia' },
  { value: 'Yemen', label: 'Yemen', region: 'Asia' },
  
  // Americas
  { value: 'Antigua and Barbuda', label: 'Antigua and Barbuda', region: 'Americas' },
  { value: 'Argentina', label: 'Argentina', region: 'Americas' },
  { value: 'Bahamas', label: 'Bahamas', region: 'Americas' },
  { value: 'Barbados', label: 'Barbados', region: 'Americas' },
  { value: 'Belize', label: 'Belize', region: 'Americas' },
  { value: 'Bolivia', label: 'Bolivia', region: 'Americas' },
  { value: 'Brazil', label: 'Brazil', region: 'Americas' },
  { value: 'Canada', label: 'Canada', region: 'Americas' },
  { value: 'Chile', label: 'Chile', region: 'Americas' },
  { value: 'Colombia', label: 'Colombia', region: 'Americas' },
  { value: 'Costa Rica', label: 'Costa Rica', region: 'Americas' },
  { value: 'Cuba', label: 'Cuba', region: 'Americas' },
  { value: 'Dominica', label: 'Dominica', region: 'Americas' },
  { value: 'Dominican Republic', label: 'Dominican Republic', region: 'Americas' },
  { value: 'Ecuador', label: 'Ecuador', region: 'Americas' },
  { value: 'El Salvador', label: 'El Salvador', region: 'Americas' },
  { value: 'Grenada', label: 'Grenada', region: 'Americas' },
  { value: 'Guatemala', label: 'Guatemala', region: 'Americas' },
  { value: 'Guyana', label: 'Guyana', region: 'Americas' },
  { value: 'Haiti', label: 'Haiti', region: 'Americas' },
  { value: 'Honduras', label: 'Honduras', region: 'Americas' },
  { value: 'Jamaica', label: 'Jamaica', region: 'Americas' },
  { value: 'Mexico', label: 'Mexico', region: 'Americas' },
  { value: 'Nicaragua', label: 'Nicaragua', region: 'Americas' },
  { value: 'Panama', label: 'Panama', region: 'Americas' },
  { value: 'Paraguay', label: 'Paraguay', region: 'Americas' },
  { value: 'Peru', label: 'Peru', region: 'Americas' },
  { value: 'Saint Kitts and Nevis', label: 'Saint Kitts and Nevis', region: 'Americas' },
  { value: 'Saint Lucia', label: 'Saint Lucia', region: 'Americas' },
  { value: 'Saint Vincent and the Grenadines', label: 'Saint Vincent and the Grenadines', region: 'Americas' },
  { value: 'Suriname', label: 'Suriname', region: 'Americas' },
  { value: 'Trinidad and Tobago', label: 'Trinidad and Tobago', region: 'Americas' },
  { value: 'United States', label: 'United States', region: 'Americas' },
  { value: 'Uruguay', label: 'Uruguay', region: 'Americas' },
  { value: 'Venezuela', label: 'Venezuela', region: 'Americas' },
  
  // Oceania
  { value: 'Australia', label: 'Australia', region: 'Oceania' },
  { value: 'Fiji', label: 'Fiji', region: 'Oceania' },
  { value: 'Kiribati', label: 'Kiribati', region: 'Oceania' },
  { value: 'Marshall Islands', label: 'Marshall Islands', region: 'Oceania' },
  { value: 'Micronesia', label: 'Micronesia', region: 'Oceania' },
  { value: 'Nauru', label: 'Nauru', region: 'Oceania' },
  { value: 'New Zealand', label: 'New Zealand', region: 'Oceania' },
  { value: 'Palau', label: 'Palau', region: 'Oceania' },
  { value: 'Papua New Guinea', label: 'Papua New Guinea', region: 'Oceania' },
  { value: 'Samoa', label: 'Samoa', region: 'Oceania' },
  { value: 'Solomon Islands', label: 'Solomon Islands', region: 'Oceania' },
  { value: 'Tonga', label: 'Tonga', region: 'Oceania' },
  { value: 'Tuvalu', label: 'Tuvalu', region: 'Oceania' },
  { value: 'Vanuatu', label: 'Vanuatu', region: 'Oceania' },
];

export const VERIFICATION_STATUSES = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  VERIFIED: { label: 'Verified', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  NEEDS_VERIFICATION: { label: 'Needs Re-verification', color: 'bg-orange-100 text-orange-800' }
};