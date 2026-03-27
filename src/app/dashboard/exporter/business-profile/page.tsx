'use client';

import React, { useState, useEffect } from 'react';
import { BusinessProfileForm } from '@/components/exporter/business-profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SocialLinks } from '@/components/social-links';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Eye,
  Edit,
  Loader2,
  Award,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Users,
  Package,
  TrendingUp,
  FileText,
  Hash,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { openPdfInNewWindow } from '@/lib/pdf-viewer';
import { BusinessFormData, BusinessWithRelations } from '@/types/business';
import { formatDate, formatVerificationStatus } from '@/lib/formatters';
import { useAuth } from '@/contexts/auth-context';

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState<BusinessWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  // Load existing business profile
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        // Let auth context handle redirect
        return;
      }
      
      const response = await fetch('/api/exporter/business-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();

        setBusiness(data.business);
        setIsEditing(false);
      } else if (response.status === 404) {
        // No business profile exists yet
        setBusiness(null);
        setIsEditing(true);
      } else if (response.status === 401) {
        // Token error - let auth context handle it
        throw new Error('Authentication failed. Please log in again.');
      } else {
        throw new Error('Failed to load business profile');
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to load business profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save: called silently when user clicks Next between steps
  const handleAutoSave = async (data: Partial<BusinessFormData>) => {
    try {
      const token = localStorage.getItem('auth_token');
      const method = business ? 'PUT' : 'POST';
      const response = await fetch('/api/exporter/business-profile', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        setBusiness(result.business);
      }
    } catch {
      // Silent fail — don't interrupt the user's flow
    }
  };

  const handleSubmit = async (data: BusinessFormData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      
      // Data is already autosaved — only need to persist certifications
      const response = await fetch('/api/exporter/business-profile', {
        method: business ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save business profile');
      }

      const result = await response.json();
      setBusiness(result.business);
      setIsEditing(false);
      toast({
        title: "Success",
        description: business ? 'Business profile updated successfully!' : 'Business profile created successfully!',
      });
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to save business profile",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'NEEDS_VERIFICATION':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Your business profile has been verified and approved. You can now receive inquiries from buyers.';
      case 'REJECTED':
        return 'Your business profile verification was rejected. Please review the notes below and update your information.';
      case 'NEEDS_VERIFICATION':
        return 'Your business profile requires re-verification. Please review the feedback and update your information accordingly.';
      default:
        return 'Your business profile is pending verification. Our team will review your submission and get back to you soon.';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading business profile...</p>
        </div>
      </div>
    );
  }

  if (!business || isEditing) {
    return (
      <div className="py-4 px-2 sm:py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {business ? 'Edit Business Profile' : 'Create Business Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {business 
              ? 'Update your business information and documents'
              : 'Complete your business profile to get verified and start connecting with buyers'
            }
          </p>
        </div>

        <BusinessProfileForm
          initialData={business ? {
            kenyanNationalId: business.kenyanNationalId || '',
            name: business.name,
            logoUrl: business.logoUrl || '',
            // Business Details
            typeOfBusiness: business.typeOfBusiness || '',
            numberOfEmployees: business.numberOfEmployees || '',
            companySize: business.companySize || '',
            kraPin: business.kraPin || '',
            registrationNumber: business.registrationNumber || '',
            exportLicense: business.exportLicense || '',
            sector: business.sector,
            industry: business.industry || '',
            productHsCode: business.productHsCode || '',
            serviceOffering: business.serviceOffering || (business as any).productCatalog || '',
            goods: (business as any).goods || '',
            services: (business as any).services || '',
            subSector: (business as any).subSector || '',
            businessUserOrganisation: business.businessUserOrganisation || '',
            // Documents
            registrationCertificateUrl: business.registrationCertificateUrl || '',
            pinCertificateUrl: business.pinCertificateUrl || '',
            kenyanNationalIdUrl: business.kenyanNationalIdUrl || '',
            incorporationCertificateUrl: business.incorporationCertificateUrl || '',
            exportLicenseUrl: business.exportLicenseUrl || '',
            // Location & Contact
            licenceNumber: business.licenceNumber || '',
            town: business.town || '',
            county: business.county || '',
            physicalAddress: business.physicalAddress || '',
            website: business.website || '',
            contactPhone: business.contactPhone || '',
            mobileNumber: business.mobileNumber || '',
            companyEmail: business.companyEmail || '',
            whatsappNumber: business.whatsappNumber || '',
            // Social Media
            twitterUrl: business.twitterUrl || '',
            instagramUrl: business.instagramUrl || '',
            facebookUrl: (business as any).facebookUrl || '',
            linkedInUrl: (business as any).linkedInUrl || '',
            youtubeUrl: (business as any).youtubeUrl || '',
            tiktokUrl: (business as any).tiktokUrl || '',
            pinterestUrl: (business as any).pinterestUrl || '',
            snapchatUrl: (business as any).snapchatUrl || '',
            telegramUrl: (business as any).telegramUrl || '',
            // GPS
            coordinates: business.coordinates || '',
            // Capacity
            exportVolumePast3Years: business.exportVolumePast3Years || '',
            currentExportMarkets: business.currentExportMarkets 
              ? business.currentExportMarkets.split(',').map(m => m.trim())
              : [],
            productionCapacityPast3: business.productionCapacityPast3 || '',
            // Story
            companyStory: business.companyStory || '',
            certifications: business.certifications || [],
            // Directors
            managementTeam: (business as any).managementTeam || '',
          } : undefined}
          onSubmit={handleSubmit}
          onAutoSave={handleAutoSave}
          registrationData={{
            name: business?.name || user?.company || '',
            sector: business?.sector || (user as any)?.productCategory || '',
            industry: business?.industry || (user as any)?.industry || '',
            registrationNumber: business?.registrationNumber || '',
            legalStructure: business?.legalStructure || '',
            serviceOffering: business?.serviceOffering || (business as any)?.productCatalog || '',
            companyEmail: business?.companyEmail || user?.email || '',
            contactPhone: business?.contactPhone || user?.phoneNumber || '',
            town: business?.town || (user as any)?.businessLocation || '',
            county: business?.county || '',
            physicalAddress: business?.physicalAddress || '',
            primaryContactFirstName: business?.primaryContactFirstName || '',
            primaryContactLastName: business?.primaryContactLastName || '',
            primaryContactEmail: business?.primaryContactEmail || '',
            primaryContactPhone: business?.primaryContactPhone || '',
            dateOfIncorporation: business?.dateOfIncorporation || '',
          }}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  const statusInfo = formatVerificationStatus(business.verificationStatus);

  return (
    <div className="py-4 px-2 sm:py-6 sm:px-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Business Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your business information and verification status
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            {getStatusIcon(business.verificationStatus)}
            <span>Verification Status</span>
            <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-gray-400">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {getStatusDescription(business.verificationStatus)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Submitted</p>
              <p className="font-medium">{formatDate(business.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Last Updated</p>
              <p className="font-medium">{formatDate(business.updatedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Profile Complete</p>
              <p className="font-medium">
                {business.profileComplete ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {business.verificationNotes && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Admin Feedback
              </h4>
              <p className="text-blue-800 text-sm">{business.verificationNotes}</p>
            </div>
          )}

          {business.verificationStatus === 'NEEDS_VERIFICATION' && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Action Required
              </h4>
              <p className="text-orange-800 dark:text-orange-200 text-sm mb-3">
                Your business profile needs to be updated based on the feedback above. Please review and update your information to proceed with verification.
              </p>
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Update Profile Now
              </Button>
            </div>
          )}

          {business.verificationStatus === 'REJECTED' && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border-l-4 border-red-500">
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-2 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Verification Rejected
              </h4>
              <p className="text-red-800 dark:text-red-200 text-sm mb-3">
                Your business profile verification was rejected. Please review the admin feedback above and update your information accordingly.
              </p>
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Update & Resubmit
              </Button>
            </div>
          )}

          {business.verificationStatus === 'PENDING' && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Pending Verification
              </h4>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Your business profile is currently under review. Our verification team will review your documents and information within 2-3 business days. You will be notified once the review is complete.
              </p>
            </div>
          )}

          {business.verificationStatus === 'VERIFIED' && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border-l-4 border-green-500">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verified Business
              </h4>
              <p className="text-green-800 dark:text-green-200 text-sm">
                Congratulations! Your business profile has been verified. Buyers can now see your verified badge and send you inquiries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: main info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Business Name</p>
                  <p className="font-semibold">{business.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type of Business</p>
                  <p className="font-semibold">{business.typeOfBusiness || business.legalStructure || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Legal Structure</p>
                  <p className="font-semibold">{business.legalStructure || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Sector</p>
                  <p className="font-semibold">{business.sector || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Industry</p>
                  <p className="font-semibold">{business.industry || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date of Incorporation</p>
                  <p className="font-semibold">{business.dateOfIncorporation || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Number of Employees</p>
                  <p className="font-semibold">{business.numberOfEmployees || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Company Size</p>
                  <p className="font-semibold">{business.companySize || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">KRA PIN</p>
                  <p className="font-semibold font-mono">{business.kraPin || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Registration No.</p>
                  <p className="font-semibold font-mono">{business.registrationNumber || 'Not provided'}</p>
                </div>
                {business.exportLicense && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Export License No.</p>
                    <p className="font-semibold font-mono">{business.exportLicense}</p>
                  </div>
                )}
                {(business as any).productHsCode && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">HS Code</p>
                    <p className="font-semibold font-mono">{(business as any).productHsCode}</p>
                  </div>
                )}
                {business.businessUserOrganisation && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Business Organisation</p>
                    <p className="font-semibold">{business.businessUserOrganisation}</p>
                  </div>
                )}
              </div>

              {business.serviceOffering && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Goods</p>
                      <p className="text-sm leading-relaxed">{business.serviceOffering.split(',')[0]?.trim() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Services</p>
                      <p className="text-sm leading-relaxed">{business.serviceOffering.split(',').slice(1).join(',').trim() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Sub-sector</p>
                      <p className="text-sm leading-relaxed">—</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </p>
                <p className="font-semibold">{business.physicalAddress}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{business.town}, {business.county}</p>
                {business.coordinates && (
                  <a
                    href={`https://www.google.com/maps?q=${business.coordinates}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>

              {business.companyStory && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Company Story</p>
                    <p className="text-sm leading-relaxed">{business.companyStory}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Export Capacity */}
          {(business.exportVolumePast3Years || business.productionCapacityPast3 || business.currentExportMarkets) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Export Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.exportVolumePast3Years && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Export Volume (3 yrs)</p>
                      <p className="font-semibold">{business.exportVolumePast3Years}</p>
                    </div>
                  )}
                  {business.productionCapacityPast3 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Production Capacity (3 yrs)</p>
                      <p className="font-semibold">{business.productionCapacityPast3}</p>
                    </div>
                  )}
                </div>
                {business.currentExportMarkets && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Export Markets</p>
                    <div className="flex flex-wrap gap-2">
                      {(typeof business.currentExportMarkets === 'string'
                        ? business.currentExportMarkets.split(',')
                        : business.currentExportMarkets
                      ).map((m: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{m.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Management Team */}
          {(business as any).managementTeam && (() => {
            try {
              const team = JSON.parse((business as any).managementTeam);
              if (Array.isArray(team) && team.length > 0) {
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Management Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {team.map((member: { name: string; role: string }, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                {member.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            } catch { /* ignore */ }
            return null;
          })()}
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          {/* Company Logo */}
          {business.logoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={business.logoUrl}
                  alt={`${business.name} logo`}
                  className="w-full max-w-48 mx-auto rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(business.companyEmail || business.contactEmail) && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium break-all">{business.companyEmail || business.contactEmail}</p>
                  </div>
                </div>
              )}
              {business.contactPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-medium">{business.contactPhone}</p>
                  </div>
                </div>
              )}
              {business.mobileNumber && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                    <p className="text-sm font-medium">{business.mobileNumber}</p>
                  </div>
                </div>
              )}
              {business.whatsappNumber && (
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
                    <p className="text-sm font-medium">{business.whatsappNumber}</p>
                  </div>
                </div>
              )}
              {business.website && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                      {business.website}
                    </a>
                  </div>
                </div>
              )}
              <SocialLinks business={business} variant="list" />
            </CardContent>
          </Card>

          {/* Primary Contact */}
          {(business.primaryContactFirstName || business.primaryContactEmail) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Primary Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(business.primaryContactFirstName || business.primaryContactLastName) && (
                  <p className="font-medium">{business.primaryContactFirstName} {business.primaryContactLastName}</p>
                )}
                {business.primaryContactEmail && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{business.primaryContactEmail}</p>
                )}
                {business.primaryContactPhone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{business.primaryContactPhone}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Registration Certificate', url: business.registrationCertificateUrl },
                { label: 'PIN Certificate', url: business.pinCertificateUrl },
                { label: 'Kenyan National ID', url: business.kenyanNationalIdUrl },
                { label: 'Certificate of Incorporation', url: (business as any).incorporationCertificateUrl },
                { label: 'Export License', url: business.exportLicenseUrl },
              ].map(({ label, url }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  {url ? (
                    <Button size="sm" variant="outline" onClick={() => openPdfInNewWindow(url, label)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Not uploaded</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Certifications Section */}
      {business.certifications && business.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Business Certifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {business.certifications.map((certification, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">
                          {certification.name}
                        </h4>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
                          <Building2 className="w-3 h-3 mr-1" />
                          {certification.issuer}
                        </div>
                      </div>
                      
                      {certification.logoUrl && (
                        <img
                          src={certification.logoUrl}
                          alt={`${certification.name} logo`}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    {certification.validUntil && (
                      <div className="flex items-center text-xs mb-3 text-gray-600 dark:text-gray-300">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Valid until: {formatDate(certification.validUntil)}</span>
                      </div>
                    )}

                    {certification.imageUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (!certification.imageUrl) return;
                          window.open(resolveFileUrl(certification.imageUrl), '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Certificate
                      </Button>
                    )}
                    
                    {!certification.imageUrl && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        No certificate image uploaded
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


