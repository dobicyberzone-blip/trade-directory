'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, FileText, CheckCircle, XCircle, Clock, Star, StarOff, Trash2, Award, Calendar, Eye, File } from 'lucide-react';
import { useState } from 'react';
import { useCenteredDialog } from '@/hooks/useCenteredDialog';
import { openPdfInNewWindow } from '@/lib/pdf-viewer';

// Helper function to check if a URL is a PDF
const isPdfUrl = (url: string): boolean => {
  if (!url) return false;
  // Check for .pdf extension in the URL
  return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
};

// Helper function to get the correct file extension from URL
const getFileExtension = (url: string): string => {
  if (isPdfUrl(url)) return 'pdf';
  // Default to jpg for images
  return 'jpg';
};

// Helper function to convert relative URLs to absolute URLs
const getAbsoluteUrl = (url: string): string => {
  if (!url) return '';

  // Already absolute or data URL — return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Rewrite legacy /uploads/ paths to go through the API file server
  if (url.startsWith('/uploads/')) {
    const apiUrl = `/api/files${url}`;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${apiUrl}`;
    }
    return apiUrl;
  }

  // Already using /api/files/ path
  if (url.startsWith('/api/files/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url}`;
    }
    return url;
  }

  // Other relative URLs
  if (url.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${url}`;
  }

  return url;
};

interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  business: any;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onToggleFeatured?: (id: string, currentStatus: boolean) => void;
  onDelete?: (id: string) => void;
}

export function DocumentPreviewDialog({ 
  open, 
  onClose, 
  business,
  onApprove,
  onReject,
  onToggleFeatured,
  onDelete
}: DocumentPreviewDialogProps) {
  const dialogStyle = useCenteredDialog();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [featureConfirmOpen, setFeatureConfirmOpen] = useState(false);

  // Debug: Log the business object

  if (!business) {

    return null;
  }

  // Validate business has required fields
  if (!business.id || !business.name) {

    return null;
  }

  // Business documents (PDFs only)
  const documents = [
    { 
      label: 'Registration Certificate', 
      url: business.registrationCertificateUrl,
      field: 'registrationCertificateUrl',
      isPdf: true
    },
    { 
      label: 'PIN Certificate', 
      url: business.pinCertificateUrl,
      field: 'pinCertificateUrl',
      isPdf: true
    },
    { 
      label: 'Kenya Certificate of Incorporation', 
      url: business.incorporationCertificateUrl,
      field: 'incorporationCertificateUrl',
      isPdf: true
    },
    { 
      label: 'Export License', 
      url: business.exportLicenseUrl,
      field: 'exportLicenseUrl',
      isPdf: true
    },
    { 
      label: 'Tax Certificate', 
      url: business.taxCertificateUrl,
      field: 'taxCertificateUrl',
      isPdf: true
    },
  ].filter(doc => doc.url);

  // Company logo (separate from documents)
  const companyLogo = business.logoUrl;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Safe data access with fallbacks
  const businessData = {
    name: business?.name || 'N/A',
    contactEmail: business?.contactEmail || 'N/A',
    verificationStatus: business?.verificationStatus || 'UNKNOWN',
    location: business?.location || 'N/A',
    county: business?.county || 'N/A',
    town: business?.town || 'N/A',
    sector: business?.sector || 'N/A',
    companySize: business?.companySize || 'N/A',
    numberOfEmployees: business?.numberOfEmployees || 'N/A',
    dateOfIncorporation: business?.dateOfIncorporation || 'N/A',
    registrationNumber: business?.registrationNumber || 'N/A',
    kraPin: business?.kraPin || 'N/A',
    taxId: business?.taxId || 'N/A',
    licenceNumber: business?.licenceNumber || business?.exportLicense || 'N/A',
    kenyanNationalId: business?.kenyanNationalId || 'N/A',
    rating: business?.rating ? `${business.rating}/5` : 'N/A',
    description: business?.description || null,
    companyStory: business?.companyStory || null,
    companyEmail: business?.companyEmail || 'N/A',
    contactPhone: business?.contactPhone || 'N/A',
    mobileNumber: business?.mobileNumber || 'N/A',
    whatsappNumber: business?.whatsappNumber || 'N/A',
    website: business?.website || 'N/A',
    physicalAddress: business?.physicalAddress || 'N/A',
    coordinates: business?.coordinates || 'N/A',
    currentExportMarkets: business?.currentExportMarkets || 'N/A',
    exportVolumePast3Years: business?.exportVolumePast3Years || 'N/A',
    productionCapacityPast3: business?.productionCapacityPast3 || 'N/A',
    businessUserOrganisation: business?.businessUserOrganisation || 'N/A',
    instagramUrl: business?.instagramUrl || null,
    twitterUrl: business?.twitterUrl || null,
    owner: business?.owner || null,
    verificationNotes: business?.verificationNotes || null,
    featured: business?.featured || false,
    id: business?.id || '',
    certifications: business?.certifications || [],
    industry: business?.industry || null,
    productHsCode: business?.productHsCode || null,
    serviceOffering: business?.serviceOffering || null,
    typeOfBusiness: business?.typeOfBusiness || business?.legalStructure || 'N/A',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-5xl w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6"
          style={{
            ...dialogStyle,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed'
          }}
        >
          <DialogHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm sm:text-base md:text-lg leading-tight">{businessData.name}</DialogTitle>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{businessData.contactEmail}</p>
              </div>
              <Badge className={`${getStatusColor(businessData.verificationStatus)} shrink-0 text-[10px] sm:text-xs`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(businessData.verificationStatus)}
                  <span className="hidden xs:inline">{businessData.verificationStatus}</span>
                </span>
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Business Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
              <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs">
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Location:</span>
                  <span className="font-medium truncate">{businessData.location}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">County:</span>
                  <span className="font-medium truncate">{businessData.county}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Town:</span>
                  <span className="font-medium truncate">{businessData.town}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Sector:</span>
                  <span className="font-medium truncate">{businessData.sector}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Type of Business:</span>
                  <span className="font-medium truncate">{businessData.typeOfBusiness}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Company Size:</span>
                  <span className="font-medium truncate">{businessData.companySize}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Employees:</span>
                  <span className="font-medium truncate">{businessData.numberOfEmployees}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Incorporated:</span>
                  <span className="font-medium truncate">{businessData.dateOfIncorporation}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Reg #:</span>
                  <span className="font-medium truncate">{businessData.registrationNumber}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">KRA PIN:</span>
                  <span className="font-medium truncate">{businessData.kraPin}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">License #:</span>
                  <span className="font-medium truncate">{businessData.licenceNumber}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">National ID:</span>
                  <span className="font-medium truncate">{businessData.kenyanNationalId}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Rating:</span>
                  <span className="font-medium truncate">{businessData.rating}</span>
                </div>
                {businessData.industry && (
                  <div className="flex gap-1">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Industry:</span>
                    <span className="font-medium truncate">{businessData.industry}</span>
                  </div>
                )}
                {businessData.productHsCode && (
                  <div className="flex gap-1">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">HS Code:</span>
                    <span className="font-medium truncate">{businessData.productHsCode}</span>
                  </div>
                )}
                {businessData.serviceOffering && (
                  <div className="flex gap-1">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Service Offering:</span>
                    <span className="font-medium truncate">{businessData.serviceOffering}</span>
                  </div>
                )}
              </div>
              {businessData.description && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">Description:</span>
                  <p className="mt-0.5 text-[10px] sm:text-xs leading-relaxed">{businessData.description}</p>
                </div>
              )}
              {businessData.companyStory && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">Company Story:</span>
                  <p className="mt-0.5 text-[10px] sm:text-xs leading-relaxed">{businessData.companyStory}</p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
              <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs">
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Email:</span>
                  <span className="font-medium truncate">{businessData.contactEmail}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Company Email:</span>
                  <span className="font-medium truncate">{businessData.companyEmail}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Phone:</span>
                  <span className="font-medium truncate">{businessData.contactPhone}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Mobile:</span>
                  <span className="font-medium truncate">{businessData.mobileNumber}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">WhatsApp:</span>
                  <span className="font-medium truncate">{businessData.whatsappNumber}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Website:</span>
                  <span className="font-medium truncate">{businessData.website}</span>
                </div>
                <div className="flex gap-1 sm:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Physical Address:</span>
                  <span className="font-medium truncate">{businessData.physicalAddress}</span>
                </div>
                <div className="flex gap-1 sm:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Coordinates:</span>
                  <span className="font-medium truncate">{businessData.coordinates}</span>
                </div>
              </div>
            </div>

            {/* Export Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
              <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Export Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs">
                <div className="flex gap-1 sm:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Current Markets:</span>
                  <span className="font-medium truncate">{businessData.currentExportMarkets}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Export Volume (3yrs):</span>
                  <span className="font-medium truncate">{businessData.exportVolumePast3Years}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Production Capacity (3yrs):</span>
                  <span className="font-medium truncate">{businessData.productionCapacityPast3}</span>
                </div>
                <div className="flex gap-1 sm:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Organization:</span>
                  <span className="font-medium truncate">{businessData.businessUserOrganisation}</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            {(businessData.instagramUrl || businessData.twitterUrl) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
                <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Social Media</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs">
                  {businessData.instagramUrl && (
                    <div className="flex gap-1">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Instagram:</span>
                      <span className="font-medium truncate">{businessData.instagramUrl}</span>
                    </div>
                  )}
                  {businessData.twitterUrl && (
                    <div className="flex gap-1">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Twitter:</span>
                      <span className="font-medium truncate">{businessData.twitterUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Logo Section */}
            {companyLogo && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
                <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Company Logo</h3>
                <div className="flex justify-center">
                  <img 
                    src={getAbsoluteUrl(companyLogo)} 
                    alt="Company Logo"
                    className="max-w-[200px] max-h-[100px] object-contain rounded border bg-white p-2"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Documents Section */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Documents ({documents.length})
              </h3>
              
              {documents.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 sm:p-3 text-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-1 sm:mb-1.5" />
                  <p className="text-yellow-800 font-medium text-[10px] sm:text-xs">No documents uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="border rounded p-1 sm:p-1.5 hover:shadow-sm transition-shadow">
                      <h4 className="font-medium text-[9px] sm:text-[10px] truncate mb-1">{doc.label}</h4>
                      <div 
                        className="relative cursor-pointer group"
                        onClick={() => {
                          const absoluteUrl = getAbsoluteUrl(doc.url!);
                          openPdfInNewWindow(absoluteUrl, `${doc.label} - ${businessData.name}`);
                        }}
                      >
                        {/* PDF preview - show icon */}
                        <div className="w-full h-16 sm:h-20 md:h-24 object-cover rounded border bg-red-50 flex flex-col items-center justify-center group-hover:bg-red-100 transition-colors">
                          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
                          <span className="text-[9px] sm:text-[10px] text-red-600 mt-1 font-medium">PDF</span>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                          <span className="text-white text-[9px] sm:text-[10px] opacity-0 group-hover:opacity-100 font-medium">
                            Open PDF
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 sm:gap-1 mt-1 sm:mt-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!doc.url) return;
                            
                            const absoluteUrl = getAbsoluteUrl(doc.url);
                            openPdfInNewWindow(absoluteUrl, `${doc.label} - ${businessData.name}`);
                          }}
                          className="h-5 sm:h-6 flex-1 text-[9px] sm:text-[10px] px-0.5 sm:px-1"
                        >
                          <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = getAbsoluteUrl(doc.url!);
                            link.download = `${businessData.name}-${doc.label}.pdf`;
                            link.click();
                          }}
                          className="h-5 sm:h-6 flex-1 text-[9px] sm:text-[10px] px-0.5 sm:px-1"
                        >
                          <Download className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications Section */}
            {businessData.certifications && businessData.certifications.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-1.5 text-sm">
                  <Award className="h-4 w-4" />
                  Business Certifications ({businessData.certifications.length})
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {businessData.certifications.map((cert: any, index: number) => {
                    const isExpired = cert.validUntil && new Date(cert.validUntil) < new Date();
                    const validUntilDate = cert.validUntil ? new Date(cert.validUntil).toLocaleDateString() : 'N/A';
                    
                    return (
                      <div key={index} className="border dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                              {cert.name}
                            </h4>
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <FileText className="h-3 w-3 mr-1" />
                              {cert.issuer}
                            </div>
                          </div>
                          
                          {cert.logoUrl && !cert.logoUrl.includes('example.com') && (
                            <img
                              src={getAbsoluteUrl(cert.logoUrl)}
                              alt={`${cert.name} logo`}
                              className="w-10 h-10 object-contain ml-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        
                        {cert.validUntil && (
                          <div className="flex items-center justify-between text-xs mb-3">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Valid until: {validUntilDate}</span>
                            </div>
                            <Badge 
                              variant={isExpired ? "destructive" : "default"}
                              className="text-[10px] px-1.5 py-0.5 h-auto"
                            >
                              {isExpired ? 'Expired' : 'Valid'}
                            </Badge>
                          </div>
                        )}
                        
                        {cert.imageUrl && (cert.imageUrl.startsWith('data:') || cert.imageUrl.startsWith('/uploads/') || cert.imageUrl.startsWith('/api/files/') || (cert.imageUrl.startsWith('http') && !cert.imageUrl.includes('example.com'))) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!cert.imageUrl) return;
                              window.open(getAbsoluteUrl(cert.imageUrl), '_blank', 'noopener,noreferrer');
                            }}
                            className="w-full text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="w-full text-xs opacity-50 cursor-not-allowed"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            No Certificate Uploaded
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owner & Notes */}
            {(businessData.owner || businessData.verificationNotes) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
                {businessData.owner && (
                  <div className="mb-2">
                    <h3 className="font-semibold mb-1 text-xs sm:text-sm">Owner</h3>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-[10px] sm:text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {businessData.owner.firstName} {businessData.owner.lastName}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                      <span className="text-gray-500 dark:text-gray-400">{businessData.owner.email}</span>
                    </div>
                  </div>
                )}
                {businessData.verificationNotes && (
                  <div className={businessData.owner ? 'pt-2 border-t border-gray-200 dark:border-gray-700' : ''}>
                    <h3 className="font-semibold mb-1 text-xs sm:text-sm text-blue-900 dark:text-blue-300">Notes</h3>
                    <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-300">{businessData.verificationNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1.5 sm:gap-2 pt-2 border-t dark:border-gray-700 flex-wrap">
              {onToggleFeatured && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs"
                  onClick={() => setFeatureConfirmOpen(true)}
                >
                  {businessData.featured ? (
                    <>
                      <StarOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Unfeature</span>
                      <span className="xs:hidden">Un</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Feature</span>
                      <span className="xs:hidden">Feat</span>
                    </>
                  )}
                </Button>
              )}
              {(businessData.verificationStatus === 'PENDING' || businessData.verificationStatus === 'REJECTED') && onApprove && (
                <Button
                  size="sm"
                  className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onApprove(businessData.id);
                    onClose();
                  }}
                >
                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Verify
                </Button>
              )}
              {(businessData.verificationStatus === 'PENDING' || businessData.verificationStatus === 'VERIFIED') && onReject && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    onReject(businessData.id);
                    onClose();
                  }}
                >
                  <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Reject
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
                      onDelete(businessData.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-7xl max-h-[95vh] p-2">
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Document preview"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Feature Confirmation Dialog */}
      {featureConfirmOpen && onToggleFeatured && (
        <Dialog open={featureConfirmOpen} onOpenChange={() => setFeatureConfirmOpen(false)}>
          <DialogContent className="max-w-sm w-[90vw]" style={{ zIndex: 9999 }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {businessData.featured
                  ? <StarOff className="h-5 w-5 text-yellow-500" />
                  : <Star className="h-5 w-5 text-yellow-500" />}
                {businessData.featured ? 'Unfeature Business' : 'Feature Business'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
              {businessData.featured
                ? `Remove "${businessData.name}" from featured businesses? It will no longer appear in the featured section on the homepage.`
                : `Feature "${businessData.name}"? It will be highlighted in the featured section on the homepage.`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setFeatureConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={businessData.featured ? 'destructive' : 'default'}
                onClick={() => {
                  setFeatureConfirmOpen(false);
                  onToggleFeatured(businessData.id, businessData.featured);
                  onClose();
                }}
              >
                {businessData.featured ? 'Yes, Unfeature' : 'Yes, Feature'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
