'use client';

import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Send, Download, Globe, Phone, Star, Heart } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { InquiryDialog } from './inquiry-dialog';
import { RatingDialog } from './rating-dialog';
import { MiniMap } from './mini-map';
import { apiClient, Business, Product } from '@/lib/api';
import { ExportOptions, ExportQuality } from './export-options-dialog';

// Extended Business interface for the profile card component
interface BusinessProfile extends Business {
  registrationDate?: string;
  yearOfEstablishment?: string; // legacy fallback
  companyLogoUrl?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
  email?: string;
  websiteUrl?: string;
  subCategory?: string;
}

// Extended Product interface for the profile card component
interface ProductProfile extends Product {
  hsCode?: string;
}
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const VerifiedScallop = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

function ExporterProfileCard({ business, onPinClick, hideBadgeOnMobile = false }: { business: BusinessProfile, onPinClick: () => void, hideBadgeOnMobile?: boolean }) {
  const { user } = useAuth();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [businessRating, setBusinessRating] = useState(business.rating);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  const checkFavoriteStatus = useCallback(async () => {
    // Don't check if user is not authenticated
    if (!user || !business.id) {
      setIsFavorited(false);
      return;
    }
    
    // Check if token exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setIsFavorited(false);
      return;
    }
    
    try {
      const response = await apiClient.checkFavoriteStatus(business.id);
      setIsFavorited(response.isFavorited);
    } catch (error) {
      // Silently fail for 401 errors (user not authenticated)
      if (error instanceof Error && (error.message.includes('session has expired') || error.message.includes('Unauthorized'))) {
        setIsFavorited(false);
      } else {

      }
    }
  }, [user, business.id]);

  useEffect(() => {
    setIsMounted(true);
    if (user && business.id) {
      checkFavoriteStatus();
    }
  }, [user, business.id, checkFavoriteStatus]);

  const handleRatingSubmitted = async () => {
    try {
      const response = await apiClient.getBusinessRatingStats(business.id);
      setBusinessRating(response.averageRating);
    } catch (error) {

    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add businesses to your favorites.',
        variant: 'destructive',
      });
      return;
    }

    // Disable favorites for exporters
    if (user.role === 'EXPORTER') {
      toast({
        title: 'Feature Not Available',
        description: 'Exporters cannot save favorites.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        await apiClient.removeFromFavorites(business.id);
        setIsFavorited(false);
        toast({
          title: 'Removed from Favorites',
          description: `${business.name} has been removed from your favorites.`,
        });
      } else {
        await apiClient.addToFavorites(business.id);
        setIsFavorited(true);
        toast({
          title: 'Added to Favorites',
          description: `${business.name} has been added to your favorites.`,
        });
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const products = business.products || [];
  const lastUpdate = isMounted && business?.updatedAt
    ? formatDistanceToNow(new Date(business.updatedAt), { addSuffix: true })
    : 'recently';
  
  // Get date of incorporation
  const dateOfIncorporation = business.dateOfIncorporation;

  // Parse coordinates from the coordinates string field
  const getCoordinates = () => {
    // First check if we have direct latitude/longitude fields
    if (business.latitude && business.longitude) {
      return {
        latitude: business.latitude,
        longitude: business.longitude
      };
    }
    
    // Try to parse from coordinates string field
    if (business.coordinates) {
      try {
        // Handle different coordinate formats
        // Format 1: "lat,lng" or "lat, lng"
        if (typeof business.coordinates === 'string' && business.coordinates.includes(',')) {
          const [lat, lng] = business.coordinates.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
          }
        }
        // Format 2: JSON string like '{"lat": -1.2921, "lng": 36.8219}'
        if (typeof business.coordinates === 'string' && business.coordinates.startsWith('{')) {
          const parsed = JSON.parse(business.coordinates);
          if (parsed.lat && parsed.lng) {
            return { latitude: parsed.lat, longitude: parsed.lng };
          }
          if (parsed.latitude && parsed.longitude) {
            return { latitude: parsed.latitude, longitude: parsed.longitude };
          }
        }
      } catch (error) {
        console.error('Failed to parse coordinates:', error);
      }
    }
    
    // No valid coordinates — return 0,0 so MiniMap shows "Location not available"
    return {
      latitude: 0,
      longitude: 0
    };
  };

  const { latitude, longitude } = getCoordinates();

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const StarFull = () => (
      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );

    const StarEmpty = () => (
      <svg className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );

    return (
      <div className="flex items-center gap-0.5">
        {Array(fullStars).fill(0).map((_, i) => <StarFull key={`full-${i}`} />)}
        {hasHalfStar && <StarFull />}
        {Array(emptyStars).fill(0).map((_, i) => <StarEmpty key={`empty-${i}`} />)}
        <span className="ml-2 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Legacy handlers for backward compatibility - Auto-detect orientation based on screen size
  const handleExportPDF = async () => {
    const isMobile = window.innerWidth < 768;
    await handleExportWithOptionsNew({
      quality: 'print',
      format: 'pdf',
      includeMap: true,
      includeCertifications: true,
      includeProducts: true,
      includeContactInfo: true,
      fileName: business.name.replace(/[^a-zA-Z0-9]/g, '_'),
      orientation: isMobile ? 'portrait' : 'landscape',
      pageSize: 'a4',
    });
  };

  // Legacy handler for PNG export - Auto-detect orientation based on screen size
  const handleExportPNG = async () => {
    const isMobile = window.innerWidth < 768;
    await handleExportWithOptionsNew({
      quality: 'print',
      format: 'png',
      includeMap: true,
      includeCertifications: true,
      includeProducts: true,
      includeContactInfo: true,
      fileName: business.name.replace(/[^a-zA-Z0-9]/g, '_'),
      orientation: isMobile ? 'portrait' : 'landscape',
      pageSize: 'a4',
    });
  };

  // New export handler using dedicated export layout with proper A4 dimensions
  const handleExportWithOptionsNew = async (options: ExportOptions): Promise<void> => {
    setIsExportingPDF(true);
    
    try {
      const { exportToPNG, exportToPDF, waitForImages } = await import('@/lib/a4-export-utils');
      const { ExporterProfileExportLayoutSimple } = await import('./exporter-profile-export-layout-simple');
      const { createRoot } = await import('react-dom/client');
      
      const isPdf = options.format === 'pdf';
      
      // Import types from a4-export-utils
      type Quality = 'screen' | 'high' | 'print';
      type Orientation = 'portrait' | 'landscape';
      
      // Convert quality types: 'standard' -> 'screen', 'high' -> 'high', 'print' -> 'print'
      const qualityMap: Record<ExportQuality, Quality> = {
        'standard': 'screen',
        'high': 'high',
        'print': 'print'
      };
      const exportQuality: Quality = qualityMap[options.quality];
      
      // Convert orientation: 'auto' -> 'portrait' (default), handle undefined
      const exportOrientation: Orientation = 
        !options.orientation || options.orientation === 'auto' 
          ? 'portrait' 
          : options.orientation as Orientation;
      
      toast({
        title: isPdf ? "Generating PDF" : "Generating Image",
        description: `Creating ${options.quality} quality export in ${exportOrientation} format...`,
      });

      // Create a temporary container for the export layout
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.zIndex = '-1';
      exportContainer.style.visibility = 'visible';
      document.body.appendChild(exportContainer);

      // Render the export layout with proper A4 dimensions
      const root = createRoot(exportContainer);
      await new Promise<void>((resolve) => {
        root.render(
          <ExporterProfileExportLayoutSimple
            business={business}
            businessRating={businessRating}
            orientation={exportOrientation}
            quality={exportQuality}
          />
        );
        // Wait for render and images to load
        setTimeout(resolve, 1500);
      });

      // Wait for all images to load
      const exportElement = exportContainer.firstChild as HTMLElement;
      if (exportElement) {
        await waitForImages(exportElement);
      }

      const sanitizedName = options.fileName || business.name.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Export using the appropriate utility
      if (isPdf) {
        await exportToPDF(exportElement, {
          orientation: exportOrientation,
          format: 'pdf',
          quality: exportQuality,
          fileName: `${sanitizedName}_Profile`,
        });
        
        toast({
          title: "PDF Downloaded",
          description: `Business profile has been exported successfully in ${exportOrientation} format at ${options.quality} quality.`,
        });
      } else {
        await exportToPNG(exportElement, {
          orientation: exportOrientation,
          format: options.format,
          quality: exportQuality,
          fileName: `${sanitizedName}_Profile`,
        });
        
        toast({
          title: "Image Downloaded",
          description: `Business profile has been exported as ${options.format.toUpperCase()} in ${exportOrientation} format at ${options.quality} quality.`,
        });
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(exportContainer);
    } catch (err) {

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      toast({
        title: 'Export Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      <div 
        ref={cardRef} 
        className="relative bg-white w-full max-w-6xl mx-auto rounded-lg shadow-lg"
      >
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            {/* Left: Logo and Company Info */}
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full">
              <div className="relative flex-shrink-0 mt-1 sm:mt-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl border-2 border-gray-200 shadow-md bg-gray-100 overflow-hidden flex items-center justify-center">
                  {business.logoUrl ? (
                    <img 
                      src={business.logoUrl} 
                      alt={`${business.name} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to letter if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('span');
                          fallback.className = 'text-xl sm:text-2xl md:text-3xl font-black text-gray-600';
                          fallback.textContent = business.name.charAt(0).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-600">
                      {business.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 mt-1 sm:mt-0 pt-0 sm:pt-2">
                {/* Company name and metadata */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <h1 className="text-base sm:text-xl md:text-2xl font-black text-gray-900 leading-tight flex items-center gap-2 whitespace-nowrap sm:whitespace-normal">
                    {business.name}
                    <img 
                      src="/Kenya_flag animated.gif" 
                      alt="Kenya Flag" 
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0 hover:scale-110 transition-transform duration-300"
                      title="Made in Kenya"
                      style={{ 
                        mixBlendMode: 'multiply',
                        filter: 'brightness(1.1) contrast(1.2)',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </h1>
                </div>
                 
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700 font-medium">
                      {business.location || 'Nairobi'}{business.county && business.county !== business.location ? `` : ''}, Kenya
                    </span>
                  </div>
                  {businessRating && (
                    <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current flex-shrink-0" />
                    <span className="font-bold text-gray-700 text-base sm:text-lg">{businessRating.toFixed(1)}</span>
                  </div>
                  )}
                  {/* Category and Subcategory */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200">
                      {business.sector || 'Agriculture'}
                    </span>
                    {/* Product categories from exporter's products */}
                    {Array.isArray(products) && products.length > 0 && (
                      <>
                        {[...new Set(products.map((p) => p.category).filter((c) => Boolean(c)))].slice(0, 4).map((cat, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {cat}
                          </span>
                        ))}
                      </>
                    )}
                    {business.subCategory && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        {business.subCategory}
                      </span>
                    )}
                  </div>
                  <div className="text-base text-gray-500 font-medium">
                    {dateOfIncorporation ? `Inc. ${dateOfIncorporation}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions - Desktop: inline, Mobile: below */}
            <div 
              className={`flex items-center gap-3 sm:gap-4 flex-shrink-0 justify-end w-full sm:w-auto ${hideBadgeOnMobile ? 'hidden md:flex' : 'flex'}`}
              data-export-ignore
            >
              {/* Favorite Button - Hidden for exporters */}
              {user?.role !== 'EXPORTER' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFavoriteToggle();
                  }}
                  disabled={isLoadingFavorite}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-full transition-all hover:scale-105 active:scale-95 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center",
                    isFavorited 
                      ? "bg-red-50 text-red-500" 
                      : "bg-gray-50 text-gray-400 hover:text-red-500 active:text-red-500",
                    isLoadingFavorite && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={cn("h-5 w-5 sm:h-6 sm:w-6", isFavorited && "fill-current")} />
                </button>
              )}
              
              {business.verificationStatus === 'VERIFIED' ? (
                <div className="flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
                  </svg>
                  <span>Verified</span>
                </div>
              ) : (
                <div className={cn(
                  "px-5 py-3 rounded-full text-base font-semibold flex-shrink-0",
                  'bg-yellow-50 text-yellow-700 border border-yellow-200'
                )}>
                  Pending
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
            
            {/* LEFT COLUMN: ARCGIS MINI MAP & BUSINESS INFO */}
            <div className="lg:col-span-4 space-y-3">
              <div className="aspect-[16/9] rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-50 relative">
                <MiniMap
                  latitude={latitude}
                  longitude={longitude}
                  businessName={business.name}
                  onMapClick={() => {
                    if (onPinClick) {
                      onPinClick();
                    }
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-[10px] font-semibold text-slate-700">Location</span>
                  </div>
                  <p className="text-[9px] text-slate-500 truncate max-w-[120px]">{business.location || 'Nairobi, Kenya'}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      Legal Status
                    </p>
                    <p className="text-slate-800 font-bold text-xs sm:text-sm">{business.typeOfBusiness || 'Limited Company'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      Date of Incorporation
                    </p>
                    <p className="text-slate-800 font-bold text-xs sm:text-sm">
                      {dateOfIncorporation || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {businessRating && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      Customer Rating
                    </p>
                    {renderStars(businessRating)}
                  </div>
                )}
                
                <div className="pt-2 border-t border-slate-200/50">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    KRA PIN:
                  </p>
                  <p className="text-slate-800 font-mono text-xs sm:text-sm font-bold tracking-tight">{business.kraPin || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PRODUCTS & CONTACT */}
            <div className="lg:col-span-8 flex flex-col justify-between">
               
              {/* Products Showcase */}
              <div className="mb-3">
                <h3 className="font-bold text-base text-gray-900 border-b-2 border-gray-200 pb-1.5 mb-2">
                  Products & Services
                </h3>
                
                {Array.isArray(products) && products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {[...products].reverse().map((product: ProductProfile, index: number) => (
                      <div key={index} className="text-sm">
                        <span className="font-bold text-gray-800">{product.name}</span>
                        {product.description && (
                          <span className="text-slate-600"> - {product.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 font-medium">{business.companyStory || 'Premium quality products for export markets'}</p>
                )}
              </div>

              {/* Contact Information and Business Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="space-y-3">
                  <h3 className="font-bold text-base text-gray-900 border-b-2 border-gray-200 pb-1.5">Contact Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">Email Address:</label>
                      <p className="text-[#007a46] font-bold text-sm break-all underline decoration-emerald-100 underline-offset-4">
                        {business.contactEmail || (business as any).email || ''}
                      </p>
                    </div>
                    {business.companyEmail && business.companyEmail !== business.contactEmail && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">Company Email:</label>
                        <p className="text-[#007a46] font-bold text-sm break-all underline decoration-emerald-100 underline-offset-4">
                          {business.companyEmail}
                        </p>
                      </div>
                    )}
                    {business.contactPhone && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone Number:
                        </label>
                        <p className="text-slate-800 font-bold text-sm">{business.contactPhone}</p>
                      </div>
                    )}
                    {(business.website || (business as any).websiteUrl) && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Website:
                        </label>
                        <p className="text-[#007a46] font-bold text-sm break-all underline decoration-emerald-100 underline-offset-4">
                          {business.website || (business as any).websiteUrl}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-base text-gray-900 border-b-2 border-gray-200 pb-1.5">Business Details</h3>
                  <div className="space-y-2">
                    {business.sector && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">Sector:</label>
                        <p className="text-slate-800 font-bold text-sm">{business.sector}</p>
                      </div>
                    )}
                    {business.industry && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">Industry:</label>
                        <p className="text-slate-800 font-bold text-sm">{business.industry}</p>
                      </div>
                    )}
                    {business.serviceOffering && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">Products / Services:</label>
                        <p className="text-slate-800 font-medium text-sm">{business.serviceOffering}</p>
                      </div>
                    )}
                    {business.productHsCode && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">HS Code:</label>
                        <p className="text-slate-800 font-mono font-bold text-sm">{business.productHsCode}</p>
                      </div>
                    )}
                    {business.currentExportMarkets && (
                      <div>
                        <label className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase block mb-1">Export Markets:</label>
                        <p className="text-slate-800 font-medium text-sm">
                          {business.currentExportMarkets.split(',').map((m: string) => m.trim()).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TRUST SIGNALS */}
              <div className="relative">
                <p className="absolute -top-3 left-6 px-3 bg-white text-xs font-black text-emerald-800/50 uppercase tracking-widest z-10">Trust Signals</p>
                <div className={`p-4 rounded-2xl border-2 shadow-md space-y-2 ${business.verificationStatus === 'VERIFIED' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <VerifiedScallop className={`h-8 sm:h-10 w-10 sm:w-12 ${business.verificationStatus === 'VERIFIED' ? 'text-[#059669]' : 'text-gray-400'}`} />
                      <div>
                        <span className={`text-lg sm:text-2xl font-black tracking-tight leading-none ${business.verificationStatus === 'VERIFIED' ? 'text-[#064e3b]' : 'text-gray-600'}`}>
                          {business.verificationStatus === 'VERIFIED' ? 'Verified Badge' : business.verificationStatus === 'PENDING' ? 'Verification Pending' : 'Unverified Business'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
                      {[
                        { name: 'GlobalGAP', logo: '/GlobalGAP.png' },
                        { name: 'FairTrade', logo: '/FairTrade.png' },
                        { name: 'ISO', logo: '/ISO.png' }
                      ].map((cert, i) => (
                        <div key={i} className="h-10 sm:h-12 w-16 sm:w-20 rounded-xl bg-white border border-green-100 flex items-center justify-center p-1.5 sm:p-2 opacity-70 hover:opacity-100 transition-opacity">
                          <img 
                            src={cert.logo} 
                            alt={cert.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-emerald-200/50 text-right">
                    <p className="text-[9px] sm:text-[10px] font-bold text-emerald-800/60" suppressHydrationWarning>Last Profile Update: {lastUpdate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BUTTONS AREA (HIDDEN IN JPEG) */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4 px-2 sm:px-0" data-export-ignore>
            {/* Hide Send Inquiry button for exporters */}
            {user?.role !== 'EXPORTER' && (
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInquiryOpen(true);
                }} 
                className="w-full sm:flex-1 bg-transparent border-2 border-[#007a46] text-[#007a46] hover:bg-[#005c35] hover:text-white active:bg-[#005c35] active:text-white h-10 sm:h-11 rounded-xl text-sm font-black shadow-xl touch-manipulation"
              >
                <Send className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> 
                <span className="hidden xs:inline">Send Official Inquiry</span>
                <span className="xs:hidden">Send Inquiry</span>
              </Button>
            )}
            {/* Hide Rate Business button for exporters */}
            {user?.role !== 'EXPORTER' && (
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRatingOpen(true);
                }} 
                variant="outline"
                className="w-full sm:flex-1 bg-transparent border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 hover:text-black active:bg-yellow-50 active:text-black h-10 sm:h-11 rounded-xl text-sm font-black shadow-lg touch-manipulation"
              >
                <Star className="mr-2 h-4 sm:h-5 w-4 sm:w-5 group-hover:text-black" /> 
                <span>Rate Business</span>
              </Button>
            )}
            <Button 
              ref={downloadButtonRef}
              disabled={isExportingPDF}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExportPDF();
              }}
              className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 active:bg-red-700 text-white border-2 border-red-600 h-10 sm:h-11 rounded-xl text-sm font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              <Download className="mr-2 h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" /> 
              <span className="truncate">{isExportingPDF ? 'Generating...' : 'Download Profile'}</span>
            </Button>
          </div>
        </div>
      </div>

      <InquiryDialog isOpen={inquiryOpen} onOpenChange={setInquiryOpen} business={business} />
      <RatingDialog 
        isOpen={ratingOpen} 
        onOpenChange={setRatingOpen}
        business={business}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </>
  );
}
export { ExporterProfileCard };
