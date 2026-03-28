'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Heart, Mail, Phone, MessageCircle, Send, Download, Globe, MapPin, Calendar, Users, Building2, Award, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { Business, BusinessCertification } from '@/lib/api';
import { trackBusinessView, trackFavorite } from '@/lib/analytics';
import { getInitials } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Helper function to download an image
async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {

  }
}

// Helper to generate a unique filename
function generateFilename(baseName: string, extension: string = 'png'): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${baseName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.${extension}`;
}

export function ExporterGridCard({ business, onViewProfileClick, hideActions }: { business: Business, onViewProfileClick?: (business: Business) => void, hideActions?: boolean }) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isVerified = business.verificationStatus === 'VERIFIED';
  const initials = getInitials(business.name);

  // Get dynamic certifications from business
  const certifications: BusinessCertification[] = business.certifications || [];
  
  // Get products
  const products = business.products || [];
  const keyProducts = products.slice(0, 3).map((p) => p.name);

  // Collect all available images from the business profile
  const profileImages = [
    { url: business.logoUrl, label: 'Logo', type: 'logo', isPdf: false },
    { url: business.registrationCertificateUrl, label: 'Registration Certificate', type: 'certificate', isPdf: true },
    { url: business.pinCertificateUrl, label: 'PIN Certificate', type: 'certificate', isPdf: true },
    ...products.filter(p => p.imageUrl).slice(0, 4).map((p, i) => ({ 
      url: p.imageUrl, 
      label: p.name || `Product ${i + 1}`, 
      type: 'product',
      isPdf: false
    })),
    ...certifications.filter(c => c.imageUrl || c.logoUrl).map((c) => [
      { url: c.imageUrl, label: c.name, type: 'certification', isPdf: false },
      { url: c.logoUrl, label: `${c.name} Logo`, type: 'certification', isPdf: false },
    ]).flat(),
  ].filter(img => img.url);

  // Check if business is favorited on mount
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
    if (user && business.id) {
      checkFavoriteStatus();
    }
  }, [user, business.id, checkFavoriteStatus]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

    setIsLoading(true);
    try {
      if (isFavorited) {
        await apiClient.removeFromFavorites(business.id);
        setIsFavorited(false);
        
        // Track favorite removal
        trackFavorite({
          businessId: business.id,
          businessName: business.name,
          action: 'remove',
        });
        
        // Track in database
        const token = localStorage.getItem('auth_token');
        if (token) {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: 'favorite',
              data: {
                businessId: business.id,
                businessName: business.name,
                action: 'remove',
              },
            }),
          }).catch(err => console.error('Failed to track favorite:', err));
        }
        
        toast({
          title: 'Removed from Favorites',
          description: `${business.name} has been removed from your favorites.`,
        });
      } else {
        await apiClient.addToFavorites(business.id);
        setIsFavorited(true);
        
        // Track favorite addition
        trackFavorite({
          businessId: business.id,
          businessName: business.name,
          action: 'add',
        });
        
        // Track in database
        const token = localStorage.getItem('auth_token');
        if (token) {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: 'favorite',
              data: {
                businessId: business.id,
                businessName: business.name,
                action: 'add',
              },
            }),
          }).catch(err => console.error('Failed to track favorite:', err));
        }
        
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
      setIsLoading(false);
    }
  };

  const handleSendInquiry = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to send an inquiry.',
        variant: 'destructive',
      });
      return;
    }

    if (!inquiryMessage.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message before sending.',
        variant: 'destructive',
      });
      return;
    }

    if (!business.ownerId) {
      toast({
        title: 'Error',
        description: 'Unable to send inquiry. Business owner not found.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingInquiry(true);
    try {
      const response = await apiClient.sendInquiry({
        exporterId: business.ownerId,
        message: inquiryMessage.trim(),
        businessName: business.name,
        businessId: business.id,
      });

      if (response.success) {
        toast({
          title: 'Inquiry Sent',
          description: `Your inquiry has been sent to ${business.name}. Check your messages for updates.`,
        });
        setShowInquiryDialog(false);
        setInquiryMessage('');
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to send inquiry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingInquiry(false);
    }
  };

  // Download entire card as image

  // Download a specific image or PDF
  const handleDownloadImage = (url: string | null | undefined, label: string, isPdf: boolean = false) => {
    if (!url) return;
    
    // Determine file extension based on type
    const extension = isPdf ? 'pdf' : 'png';
    const filename = generateFilename(`${business.name}-${label}`, extension);
    
    // For PDFs, create a download link directly
    if (isPdf) {
      const link = document.createElement('a');
      link.href = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For images, use the existing download function
      downloadImage(url, filename);
    }
  };

  const handleOpenInquiryDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to send an inquiry.',
        variant: 'destructive',
      });
      return;
    }
    setShowInquiryDialog(true);
  };

  return (
    <>
      <Card ref={cardRef} className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 relative group">

        {/* Featured Star Badge - Left Top Corner */}
        {business.featured && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-amber-500 text-white p-1.5 rounded-br-lg">
              <Star className="h-4 w-4 fill-current" />
            </div>
          </div>
        )}

        <CardContent className="p-5 flex-grow flex flex-col">
          {/* Header with Logo and Actions */}
          <div className="flex justify-between items-start mb-3">
            <div className="h-16 w-16 rounded-full border-2 border-primary/20 shadow-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 flex-shrink-0">
              {business.logoUrl && !logoError ? (
                <img
                  src={business.logoUrl}
                  alt={`${business.name} logo`}
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-white font-bold text-lg">{initials}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Favorite Button - Hidden for exporters */}
              {user?.role !== 'EXPORTER' && (
                <button
                  onClick={handleFavoriteToggle}
                  disabled={isLoading}
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-200 hover:scale-110",
                    isFavorited 
                      ? "text-red-500 hover:text-red-600" 
                      : "text-gray-400 hover:text-red-500",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isFavorited && "fill-current"
                    )} 
                  />
                </button>
              )}
              {/* Verification Badge */}
              <div className="flex items-center gap-1 text-green-600">
                {isVerified && (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-bold">Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Company Name and Location */}
          <div className="mb-3">
            <h3 className="text-base font-bold text-foreground truncate mb-0.5" title={business.name}>{business.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{business.location}, Kenya</span>
              {business.county && <span></span>}
            </div>
            <p className="text-xs font-semibold text-primary mt-1">{business.industry || business.sector}</p>
          </div>

          {/* Business Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            {business.dateOfIncorporation && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Est. {business.dateOfIncorporation}</span>
              </div>
            )}
            {business.companySize && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{business.companySize}</span>
              </div>
            )}
            {business.typeOfBusiness && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{business.typeOfBusiness}</span>
              </div>
            )}
            {/* Rating - shown after company type for visual hierarchy */}
            {business.rating && (
              <div className="flex items-center gap-1 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3 w-3',
                        i < Math.floor(business.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {(business.rating || 0).toFixed(1)}
                </span>
                {business.totalRatings && business.totalRatings > 0 && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    ({business.totalRatings})
                  </span>
                )}
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <a 
                  href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  Website
                </a>
              </div>
            )}
          </div>

          {/* Company Story */}
          {business.companyStory && (
            <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{business.companyStory}</p>
          )}

          {/* Two Column Layout for Contact and Products */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column: Contact Info */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Contact:</p>
              {business.contactEmail && (
                <div className="flex items-start gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <a 
                    href={`mailto:${business.contactEmail}`}
                    className="text-xs text-muted-foreground hover:text-primary truncate transition-colors leading-tight"
                    title={business.contactEmail}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {business.contactEmail}
                  </a>
                </div>
              )}
              {business.contactPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`tel:${business.contactPhone}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {business.contactPhone}
                  </a>
                </div>
              )}
              {business.whatsappNumber && (
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Key Products */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Products:</p>
              <div className="flex flex-wrap gap-1">
                {keyProducts.length > 0 ? (
                  keyProducts.map((p: string, index: number) => (
                    <Badge key={`${p}-${index}`} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {p}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Certifications */}
          {certifications.length > 0 && (
            <div className="mt-auto pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">Certifications:</p>
                </div>
                {profileImages.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageGallery(true);
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    aria-label={`View all ${profileImages.length} images`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    View All ({profileImages.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {certifications.slice(0, 4).map((cert) => (
                  <div 
                    key={cert.id} 
                    className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                    title={`${cert.name}${cert.validUntil ? ` - Valid until ${new Date(cert.validUntil).toLocaleDateString()}` : ''}`}
                  >
                    {cert.logoUrl || cert.imageUrl ? (
                      <Avatar className="w-5 h-5 border border-green-300">
                        <AvatarImage 
                          src={cert.logoUrl || cert.imageUrl || undefined} 
                          alt={`${cert.name} logo`}
                          className="object-contain p-0.5"
                        />
                        <AvatarFallback className="text-[8px] bg-green-200 text-green-700">
                          <Award className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-medium text-green-800 truncate max-w-[100px]">
                      {cert.name}
                    </span>
                    {cert.validUntil && (
                      <span className="text-[9px] text-green-600 flex-shrink-0">
                        {new Date(cert.validUntil).getFullYear()}
                      </span>
                    )}
                  </div>
                ))}
                {certifications.length > 4 && (
                  <div className="flex items-center px-2 py-1 bg-gray-100 border border-gray-300 rounded-md text-[10px] text-gray-600 font-medium">
                    +{certifications.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Markets */}
          {business.currentExportMarkets && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Export Markets:</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{business.currentExportMarkets}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-3 border-t bg-card">
          <div className="flex gap-2 w-full">
            {!hideActions && (onViewProfileClick ? (
              <Button 
                onClick={() => {
                  // Track profile view
                  trackBusinessView({
                    businessId: business.id,
                    businessName: business.name,
                    sector: business.sector,
                  });
                  
                  // Track in database
                  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                  if (token) {
                    fetch('/api/analytics/track', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        type: 'profile_view',
                        data: {
                          businessId: business.id,
                          businessName: business.name,
                          sector: business.sector,
                          source: 'directory',
                        },
                      }),
                    }).catch(err => console.error('Failed to track view:', err));
                  }
                  
                  onViewProfileClick(business);
                }} 
                className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-sm"
              >
                View Profile
              </Button>
            ) : (
              <Button asChild className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-sm">
                <Link 
                  href={`/directory/${business.id}`}
                  onClick={() => {
                    // Track profile view
                    trackBusinessView({
                      businessId: business.id,
                      businessName: business.name,
                      sector: business.sector,
                    });
                    
                    // Track in database
                    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                    if (token) {
                      fetch('/api/analytics/track', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          type: 'profile_view',
                          data: {
                            businessId: business.id,
                            businessName: business.name,
                            sector: business.sector,
                            source: 'directory',
                          },
                        }),
                      }).catch(err => console.error('Failed to track view:', err));
                    }
                  }}
                >
                  View Profile
                </Link>
              </Button>
            ))}
            {/* Hide Send Inquiry button for exporters */}
            {!hideActions && user?.role !== 'EXPORTER' && (
              <Button 
                variant="outline"
                onClick={handleOpenInquiryDialog}
                className="flex-1 h-9 text-sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Send Inquiry
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Image Gallery Dialog */}
      <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{business.name} - Profile Images</DialogTitle>
            <DialogDescription>
              View profile images, certificates, and product images.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {profileImages.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {img.isPdf ? (
                    // PDF Document - Show icon instead of trying to display
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600">
                      <svg className="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold">PDF</span>
                    </div>
                  ) : (
                    // Image - Show avatar with image
                    <Avatar className="w-full h-full rounded-lg">
                      <AvatarImage 
                        src={img.url || undefined} 
                        alt={img.label}
                        className="object-contain"
                      />
                      <AvatarFallback className="bg-green-100 text-green-700 font-bold text-lg rounded-lg">
                        {getInitials(img.label)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {img.url && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.isPdf && (
                        <button
                          onClick={() => {
                            const { openPdfInNewWindow } = require('@/lib/pdf-viewer');
                            openPdfInNewWindow(img.url, img.label);
                          }}
                          className="p-2 bg-blue-500/90 hover:bg-blue-600 rounded-full text-white"
                          title="View PDF"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadImage(img.url, img.label, img.isPdf)}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                        title={img.isPdf ? "Download PDF" : "Download image"}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-1 text-muted-foreground truncate">{img.label}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageGallery(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inquiry Dialog */}
      <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Inquiry to {business.name}</DialogTitle>
            <DialogDescription>
              Send a message to this exporter. They will receive your inquiry in their messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Write your inquiry message here... (e.g., I'm interested in your products, pricing, minimum order quantity, etc.)"
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInquiryDialog(false)}
              disabled={isSendingInquiry}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInquiry}
              disabled={isSendingInquiry || !inquiryMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSendingInquiry ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Inquiry
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ExporterGridCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 flex-grow flex flex-col">
        {/* Header: avatar + badge */}
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>

        {/* Company name + location + sector */}
        <div className="mb-3 space-y-1.5">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>

        {/* Company story */}
        <div className="space-y-1.5 mb-4">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>

        {/* Contact + Products two-col */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2 rounded" />
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-auto pt-2 border-t space-y-2">
          <Skeleton className="h-3 w-1/3 rounded" />
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="p-3 border-t flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    </div>
  );
}
