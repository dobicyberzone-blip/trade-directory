'use client';

import { Business, Product } from '@/lib/api';
import { A4ExportWrapper } from './a4-export-wrapper';
import { Orientation } from '@/lib/a4-export-utils';

interface ExporterProfileExportLayoutSimpleProps {
  business: Business & {
    latitude?: number;
    longitude?: number;
    email?: string;
    websiteUrl?: string;
  };
  businessRating?: number;
  orientation: Orientation;
  quality?: 'screen' | 'print' | 'high';
}

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '22px', height: '22px' }} xmlns="http://www.w3.org/2000/svg">
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

const truncate = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
};

export function ExporterProfileExportLayoutSimple({
  business,
  businessRating,
  orientation,
  quality = 'print',
}: ExporterProfileExportLayoutSimpleProps) {
  const products = business.products || [];
  const isPortrait = orientation === 'portrait';
  const maxProducts = isPortrait ? 8 : 6;

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span>{'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)} {rating.toFixed(1)}</span>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div style={{ display: 'flex', gap: '4px', marginBottom: '5px', fontSize: '11px', lineHeight: '1.4' }}>
        <span style={{ fontWeight: 700, color: '#4b5563', whiteSpace: 'nowrap' }}>{label}:</span>
        <span style={{ color: '#111827' }}>{value}</span>
      </div>
    ) : null;

  const SectionTitle = ({ children }: { children: string }) => (
    <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', borderBottom: '2px solid #111827', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </div>
  );

  const locationParts = [business.town, business.county, business.location]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const locationStr = [...new Set([...locationParts, 'Kenya'])].join(', ');

  // Inline styles for full-page fill
  const pageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    padding: isPortrait ? '32px 36px' : '28px 36px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: isPortrait ? '1fr' : '1fr 1fr',
    gap: '24px',
    minHeight: 0,
  };

  const colStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
  };

  // Stretch the last section in each column to fill remaining space
  const stretchStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <A4ExportWrapper orientation={orientation} quality={quality}>
      <div style={pageStyle}>

        {/* ── HEADER ── */}
        <div style={{ borderBottom: '3px solid #111827', paddingBottom: '12px', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            {/* Logo + name */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '60px', height: '60px', border: '2px solid #111827', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
                {business.logoUrl
                  ? <img src={business.logoUrl} alt={business.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                  : <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{business.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{business.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{locationStr}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {[business.sector, business.industry].filter(Boolean).join(' · ')}
                  {business.dateOfIncorporation && ` · Inc. ${business.dateOfIncorporation}`}
                </div>
                {businessRating && (
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 700, marginTop: '2px' }}>{renderStars(businessRating)}</div>
                )}
              </div>
            </div>
            {/* Badge */}
            <div style={{ flexShrink: 0, border: '2px solid #111827', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <VerifiedBadge />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {business.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={mainStyle}>

          {/* LEFT COLUMN */}
          <div style={colStyle}>

            {/* Products & Services */}
            <div>
              <SectionTitle>Products & Services</SectionTitle>
              {business.serviceOffering && (
                <p style={{ fontSize: '11px', color: '#374151', fontStyle: 'italic', marginBottom: '6px' }}>
                  {truncate(business.serviceOffering, 25)}
                </p>
              )}
              {Array.isArray(products) && products.length > 0 ? (
                <ul style={{ paddingLeft: '14px', margin: 0 }}>
                  {products.slice(0, maxProducts).map((p: Product, i: number) => (
                    <li key={i} style={{ fontSize: '11px', color: '#111827', marginBottom: '4px' }}>{p.name}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Premium quality products for export markets</p>
              )}
              {business.productHsCode && (
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                  <strong>HS Code:</strong> {business.productHsCode}
                </p>
              )}
            </div>

            {/* Business Information — stretches to fill remaining left column */}
            <div style={stretchStyle}>
              <SectionTitle>Business Information</SectionTitle>
              <div style={{ flex: 1 }}>
                <InfoRow label="Type of Business" value={business.typeOfBusiness} />
                <InfoRow label="Legal Structure" value={(business as any).legalStructure} />
                <InfoRow label="Date of Incorporation" value={business.dateOfIncorporation} />
                <InfoRow label="Registration No." value={business.registrationNumber} />
                <InfoRow label="KRA PIN" value={business.kraPin} />
                <InfoRow label="Company Size" value={business.companySize} />
                <InfoRow label="Employees" value={business.numberOfEmployees} />
                <InfoRow label="Export Markets" value={business.currentExportMarkets} />
                <InfoRow label="Export Volume (3 yrs)" value={business.exportVolumePast3Years} />
                <InfoRow label="Production Capacity (3 yrs)" value={business.productionCapacityPast3} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={colStyle}>

            {/* Contact Information */}
            <div>
              <SectionTitle>Contact Information</SectionTitle>
              <InfoRow label="Email" value={business.contactEmail || business.email} />
              <InfoRow label="Phone" value={business.contactPhone} />
              <InfoRow label="Mobile" value={business.mobileNumber} />
              <InfoRow label="WhatsApp" value={business.whatsappNumber} />
              <InfoRow label="Website" value={business.websiteUrl || business.website} />
              <InfoRow label="Address" value={business.physicalAddress} />
            </div>

            {/* About — stretches to fill, capped at 80 words */}
            <div style={stretchStyle}>
              <SectionTitle>About</SectionTitle>
              <p style={{ fontSize: '11px', color: '#374151', lineHeight: '1.6', flex: 1 }}>
                {business.companyStory
                  ? truncate(business.companyStory, 80)
                  : 'No company description provided.'}
              </p>
            </div>

            {/* Certifications */}
            {business.certifications && business.certifications.length > 0 && (
              <div>
                <SectionTitle>Certifications</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {business.certifications.map((cert: any, i: number) => (
                    <span key={i} style={{ fontSize: '10px', fontWeight: 600, color: '#111827', border: '1px solid #374151', padding: '2px 6px' }}>
                      {cert.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: '2px solid #111827', paddingTop: '8px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Kenya Export Promotion & Branding Agency</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>E-Trade Directory • www.keproba.go.ke</div>
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </A4ExportWrapper>
  );
}
