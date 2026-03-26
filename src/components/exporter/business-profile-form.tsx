'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { FileUploader } from '@/components/ui/file-uploader';
import { SearchableSelect } from './_searchable-select';
import { LocationPicker } from '@/components/exporter/location-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  FileText, 
  MapPin, 
  Globe, 
  Award,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Building,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  BusinessFormData,
  CertificationFormData,
  BUSINESS_TYPES, 
  KENYAN_COUNTIES,
  EXPORT_MARKETS 
} from '@/types/business';
import { INDUSTRIES, INDUSTRY_CATEGORIES, SECTORS_BY_INDUSTRY } from '@/lib/constants';
import { SearchableMultiSelect } from '@/components/exporter/_searchable-multi-select';
import { 
  DEFAULT_IMAGE_OPTIONS, 
  DEFAULT_DOCUMENT_OPTIONS 
} from '@/lib/file-validation';
import { resolveFileUrl } from '@/lib/pdf-viewer';

const businessFormSchema = z.object({
  // Basic Details
  kenyanNationalId: z.string().min(1, 'Kenyan National ID is required'),
  name: z.string().optional(),                  // read-only (from registration)
  logoUrl: z.string().min(1, 'Company logo is required'),
  
  // Business Details
  typeOfBusiness: z.string().optional(),        // not rendered as editable input
  legalStructure: z.string().optional(),
  numberOfEmployees: z.string().min(1, 'Number of employees is required'),
  companySize: z.string().optional(),
  kraPin: z.string().min(1, 'KRA PIN is required'),
  registrationNumber: z.string().optional(),    // read-only (from registration)
  exportLicense: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  productHsCode: z.string().optional(),
  serviceOffering: z.string().optional(),
  businessUserOrganisation: z.string().optional(),
  
  // Documents
  registrationCertificateUrl: z.string().min(1, 'Registration certificate is required'),
  pinCertificateUrl: z.string().min(1, 'PIN certificate is required'),
  kenyanNationalIdUrl: z.string().optional(),
  incorporationCertificateUrl: z.string().optional(),
  exportLicenseUrl: z.string().optional(),
  
  // Location & Contact
  licenceNumber: z.string().optional(),
  town: z.string().optional(),
  county: z.string().optional(),
  physicalAddress: z.string().optional(),
  website: z.string().optional(),
  contactPhone: z.string().optional(),
  mobileNumber: z.string().optional(),
  companyEmail: z.string().optional(),
  whatsappNumber: z.string().optional(),
  
  // Social Media
  twitterUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  
  // Primary Contact (read-only from registration)
  primaryContactFirstName: z.string().optional(),
  primaryContactLastName: z.string().optional(),
  primaryContactEmail: z.string().optional(),
  primaryContactPhone: z.string().optional(),
  
  // Location GPS
  coordinates: z.string().optional(),
  
  // Company Capacity
  exportVolumePast3Years: z.string().optional(),
  currentExportMarkets: z.array(z.string()).optional(),
  productionCapacityPast3: z.string().optional(),
  
  // Company Story
  companyStory: z.string().optional(),
});

interface BusinessProfileFormProps {
  initialData?: Partial<BusinessFormData>;
  onSubmit: (data: BusinessFormData) => Promise<void>;
  onAutoSave?: (data: Partial<BusinessFormData>) => Promise<void>;
  registrationData?: {
    name?: string;
    sector?: string;
    industry?: string;
    registrationNumber?: string;
    legalStructure?: string;
    serviceOffering?: string;
    companyEmail?: string;
    contactPhone?: string;
    town?: string;
    county?: string;
    physicalAddress?: string;
    primaryContactFirstName?: string;
    primaryContactLastName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    dateOfIncorporation?: string;
  };
  isLoading?: boolean;
}

export function BusinessProfileForm({ 
  initialData, 
  onSubmit,
  onAutoSave,
  registrationData,
  isLoading = false 
}: BusinessProfileFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [certifications, setCertifications] = useState<CertificationFormData[]>([]);
  const [isCertDialogOpen, setIsCertDialogOpen] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [otherBusinessTypeSelected, setOtherBusinessTypeSelected] = useState(false);
  const [industryOtherText, setIndustryOtherText] = useState('');
  const [sectorOtherText, setSectorOtherText] = useState('');
  const [certFormData, setCertFormData] = useState<CertificationFormData>({
    name: '',
    issuer: '',
    validUntil: undefined,
    imageUrl: '',
    logoUrl: '',
  });

  // Directors state
  const [directors, setDirectors] = useState<{ name: string; role: string }[]>([]);

  // Load initial certifications if editing existing business
  useEffect(() => {
    if (initialData && (initialData as any).certifications) {
      const certs = (initialData as any).certifications.map((bc: any) => ({
        name: bc.name,
        issuer: bc.issuer,
        imageUrl: bc.imageUrl || '',
        logoUrl: bc.logoUrl || '',
        validUntil: bc.validUntil ? new Date(bc.validUntil) : undefined,
      }));
      setCertifications(certs);
    }
    // If editing and typeOfBusiness is a custom value, show the text input
    if (initialData?.typeOfBusiness && !BUSINESS_TYPES.includes(initialData.typeOfBusiness)) {
      setOtherBusinessTypeSelected(true);
    }
    // Initialize "Other" text fields from existing data
    if (initialData?.industry?.startsWith('Other:')) {
      setIndustryOtherText(initialData.industry.replace('Other: ', ''));
    }
    if (initialData?.sector?.startsWith('Other:')) {
      setSectorOtherText(initialData.sector.replace('Other: ', ''));
    }
    // Parse directors from managementTeam JSON
    if ((initialData as any)?.managementTeam) {
      try {
        const parsed = JSON.parse((initialData as any).managementTeam);
        if (Array.isArray(parsed)) setDirectors(parsed);
      } catch { /* ignore malformed */ }
    }
  }, []);

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      kenyanNationalId: '',
      name: registrationData?.name || '',
      logoUrl: '',
      typeOfBusiness: registrationData?.legalStructure || '',
      legalStructure: registrationData?.legalStructure || '',
      numberOfEmployees: '',
      companySize: '',
      kraPin: '',
      registrationNumber: registrationData?.registrationNumber || '',
      exportLicense: '',
      sector: registrationData?.sector || '',
      industry: registrationData?.industry || '',
      serviceOffering: registrationData?.serviceOffering || '',
      businessUserOrganisation: '',
      registrationCertificateUrl: '',
      pinCertificateUrl: '',
      kenyanNationalIdUrl: '',
      incorporationCertificateUrl: '',
      exportLicenseUrl: '',
      licenceNumber: '',
      town: registrationData?.town || '',
      county: registrationData?.county || '',
      physicalAddress: registrationData?.physicalAddress || '',
      website: '',
      contactPhone: registrationData?.contactPhone || '',
      mobileNumber: '',
      companyEmail: registrationData?.companyEmail || '',
      primaryContactFirstName: registrationData?.primaryContactFirstName || '',
      primaryContactLastName: registrationData?.primaryContactLastName || '',
      primaryContactEmail: registrationData?.primaryContactEmail || '',
      primaryContactPhone: registrationData?.primaryContactPhone || '',
      whatsappNumber: '',
      twitterUrl: '',
      instagramUrl: '',
      coordinates: '',
      exportVolumePast3Years: '',
      currentExportMarkets: [],
      productionCapacityPast3: '',
      companyStory: '',
      ...initialData
    }
  });

  const watchedValues = form.watch();
  const typeOfBusinessVal = watchedValues.typeOfBusiness || '';
  // "Other" means user selected it and needs to type a custom value
  const STANDARD_BUSINESS_TYPES = BUSINESS_TYPES.filter(t => t !== 'Other');
  const typeOfBusinessIsCustom = typeOfBusinessVal !== '' && !STANDARD_BUSINESS_TYPES.includes(typeOfBusinessVal);

  // Debounced autosave — fires 500ms after the user stops typing/changing fields
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  // Track previous serialized form values to avoid firing autosave on every render
  const prevFormValuesRef = useRef<string>('');
  const prevDirectorsRef = useRef<string>('');

  const runSave = useCallback(async (data: any) => {
    if (!onAutoSave) return;
    setSaveIndicator('saving');
    try {
      await onAutoSave(data);
      setSaveIndicator('saved');
      if (saveIndicatorTimerRef.current) clearTimeout(saveIndicatorTimerRef.current);
      saveIndicatorTimerRef.current = setTimeout(() => setSaveIndicator('idle'), 1500);
    } catch {
      setSaveIndicator('idle');
    }
  }, [onAutoSave]);

  const triggerDebouncedSave = useCallback(() => {
    if (!onAutoSave) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      // Autosave: never include certifications — they are only saved on explicit submit
      // This prevents the delete+recreate loop that causes duplication
      // Include directors (managementTeam) so they are persisted on autosave too
      runSave({
        ...form.getValues(),
        managementTeam: directors.length > 0 ? JSON.stringify(directors) : null,
      });
    }, 500);
  }, [onAutoSave, form, runSave, directors]);

  useEffect(() => {
    // Skip the very first render (initial population from initialData)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Only trigger autosave when form values or directors actually changed
    // (avoids infinite loop caused by setBusiness in parent re-rendering this component)
    const currentFormValues = JSON.stringify(form.getValues());
    const currentDirectors = JSON.stringify(directors);
    if (
      currentFormValues === prevFormValuesRef.current &&
      currentDirectors === prevDirectorsRef.current
    ) {
      return;
    }
    prevFormValuesRef.current = currentFormValues;
    prevDirectorsRef.current = currentDirectors;
    triggerDebouncedSave();
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [watchedValues, directors]);

  // Calculate completion percentage
  useEffect(() => {
    // Canonical required fields — must match dashboard and backend
    const requiredFields = [
      'kenyanNationalId', 'name', 'logoUrl',
      'numberOfEmployees', 'kraPin', 'sector',
      'registrationCertificateUrl', 'pinCertificateUrl',
      'town', 'county', 'physicalAddress', 'contactPhone', 'companyEmail'
    ];
    
    const optionalFields = [
      'exportLicense',
      'website', 'whatsappNumber', 'twitterUrl', 'instagramUrl',
      'exportVolumePast3Years', 'currentExportMarkets', 'productionCapacityPast3',
      'companyStory', 'mobileNumber', 'companySize', 'businessUserOrganisation',
    ];

    const isFieldFilled = (field: string) => {
      const val = watchedValues[field as keyof BusinessFormData];
      if (Array.isArray(val)) return val.length > 0;
      return Boolean(val);
    };

    const completedRequired = requiredFields.filter(isFieldFilled).length;
    const completedOptional = optionalFields.filter(isFieldFilled).length;

    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields = completedRequired + completedOptional;
    
    setCompletionPercentage(Math.round((completedFields / totalFields) * 100));
  }, [watchedValues]);

  const sections = [
    {
      title: 'Basic Details',
      icon: Building2,
      fields: ['kenyanNationalId', 'name', 'logoUrl']
    },
    {
      title: 'Business Details',
      icon: FileText,
      fields: ['typeOfBusiness', 'numberOfEmployees', 'kraPin', 'sector']
    },
    {
      title: 'Documents',
      icon: FileText,
      fields: ['registrationCertificateUrl', 'pinCertificateUrl', 'kenyanNationalIdUrl', 'exportLicenseUrl']
    },
    {
      title: 'Location & Contact',
      icon: MapPin,
      fields: ['town', 'county', 'physicalAddress', 'website', 'contactPhone', 'companyEmail', 'whatsappNumber']
    },
    {
      title: 'Social Media & Location',
      icon: Globe,
      fields: ['twitterUrl', 'instagramUrl', 'coordinates']
    },
    {
      title: 'Company Export Trading Capacity',
      icon: Award,
      fields: ['exportVolumePast3Years', 'currentExportMarkets', 'productionCapacityPast3', 'companyStory']
    }
  ];

  const handleSubmit = async (data: BusinessFormData) => {
    try {
      const dataWithCertifications = {
        ...data,
        // Mirror exportLicense into licenceNumber so the DB field stays populated
        licenceNumber: data.exportLicense || data.licenceNumber || '',
        certifications,
        _certificationsUpdated: true,
        _isFinalSave: true,
        managementTeam: directors.length > 0 ? JSON.stringify(directors) : null,
      };
      await onSubmit(dataWithCertifications as any);
      toast({
        title: "Success",
        description: "Business profile saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save business profile",
        variant: "destructive",
      });
    }
  };

  const sectionRequiredFields: Record<number, string[]> = {
    0: ['kenyanNationalId', 'logoUrl'],          // name is read-only
    1: ['numberOfEmployees', 'kraPin'],           // sector/typeOfBusiness are read-only
    2: ['registrationCertificateUrl', 'pinCertificateUrl'],
    3: [],                                        // editable — no hard required validation on nav
    4: [],
    5: [],
  };

  // Validate current section before moving to next
  const validateCurrentSection = async () => {
    const requiredFields = sectionRequiredFields[currentSection] || [];
    
    // Trigger validation for required fields in current section
    const results = await Promise.all(
      requiredFields.map(field => form.trigger(field as keyof BusinessFormData))
    );
    
    // Check if all validations passed
    const allValid = results.every(result => result === true);
    
    if (!allValid) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Silently auto-save without validation (used on Previous + tab navigation)
  // Fire-and-forget — never blocks navigation, never touches certifications
  const silentAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    runSave({
      ...form.getValues(),
      managementTeam: directors.length > 0 ? JSON.stringify(directors) : null,
    });
  };

  // Handle next button click with validation + auto-save
  const handleNext = async () => {
    const isValid = await validateCurrentSection();
    if (!isValid) return;
    silentAutoSave();
    setCurrentSection(Math.min(sections.length - 1, currentSection + 1));
  };

  // Handle previous button click with auto-save (no validation needed going back)
  const handlePrevious = () => {
    silentAutoSave();
    setCurrentSection(Math.max(0, currentSection - 1));
  };

  // Handle section tab click with auto-save
  const handleSectionClick = (index: number) => {
    if (index === currentSection) return;
    silentAutoSave();
    setCurrentSection(index);
  };

  // Certification management functions
  const handleAddCertification = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!certFormData.name || !certFormData.issuer) {
      toast({
        title: "Error",
        description: "Please fill in certification name and issuer",
        variant: "destructive",
      });
      return;
    }

    const newCertifications = editingCertIndex !== null
      ? certifications.map((cert, index) => index === editingCertIndex ? certFormData : cert)
      : [...certifications, certFormData];

    setCertifications(newCertifications);
    setIsCertDialogOpen(false);
    setEditingCertIndex(null);
    setCertFormData({
      name: '',
      issuer: '',
      validUntil: undefined,
      imageUrl: '',
      logoUrl: '',
    });

    toast({
      title: editingCertIndex !== null ? 'Certification Updated' : 'Certification Added',
      description: 'Certification saved. Click "Save Profile" to finalize.',
    });
  };

  const handleEditCertification = (index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCertFormData(certifications[index]);
    setEditingCertIndex(index);
    setIsCertDialogOpen(true);
  };

  const handleDeleteCertification = (index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCertifications(certifications.filter((_, i) => i !== index));
    toast({
      title: "Certification Removed",
      description: "Click \"Save Profile\" to save your changes.",
    });
  };

  const handleCertificationTypeChange = (value: string) => {
    if (value === 'Custom Certification') {
      setCertFormData({ ...certFormData, name: '' });
    } else {
      setCertFormData({ ...certFormData, name: value });
    }
  };

  const isExpired = (date?: Date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date?: Date) => {
    if (!date) return false;
    const now = new Date();
    const threeMonthsFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
    return new Date(date) <= threeMonthsFromNow && !isExpired(date);
  };

  // Helper: read-only field pre-filled from registration — styled as a plain disabled input
  const FromRegField = ({ value }: { value: string; label?: string }) => (
    <div className="mt-1 h-10 px-3 flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed select-none">
      <span className="flex-1 truncate">{value || <span className="text-gray-400">—</span>}</span>
    </div>
  );

  const COMMON_CERTIFICATIONS = [
    'Made in Kenya Certification',
    'ISO 9001 - Quality Management',
    'ISO 14001 - Environmental Management',
    'ISO 22000 - Food Safety Management',
    'HACCP - Hazard Analysis Critical Control Points',
    'GlobalGAP - Good Agricultural Practices',
    'Fair Trade Certification',
    'Organic Certification',
    'Rainforest Alliance Certification',
    'BRC - British Retail Consortium',
    'SQF - Safe Quality Food',
    'Custom Certification'
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Basic Details
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kenyanNationalId">Kenyan National ID Number *</Label>
                <Input
                  id="kenyanNationalId"
                  {...form.register('kenyanNationalId')}
                  placeholder="Enter your Kenyan National ID number"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your Kenyan National ID number</p>
                {form.formState.errors.kenyanNationalId && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.kenyanNationalId.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Business Name *</Label>
                <FromRegField value={form.watch('name') || ''} />
              </div>
            </div>

            <FileUploader
              label="Company Logo"
              description="Upload your company logo or provide a URL. Recommended size: 400x400px"
              value={form.watch('logoUrl')}
              onChange={(url) => form.setValue('logoUrl', url)}
              validationOptions={DEFAULT_IMAGE_OPTIONS}
              accept="image/jpeg"
              required
            />
            {form.formState.errors.logoUrl && (
              <p className="text-sm text-red-600">
                {form.formState.errors.logoUrl.message}
              </p>
            )}
          </div>
        );

      case 1: // Business Details
        return (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legalStructure">Legal Structure</Label>
                <SearchableSelect
                  options={['Sole Proprietorship', 'Partnership', 'Limited Company', 'Public Limited Company', 'NGO', 'Cooperative', 'Other']}
                  value={form.watch('legalStructure') || ''}
                  onChange={(value) => form.setValue('legalStructure', value, { shouldDirty: true })}
                  placeholder="Select legal structure"
                />
              </div>

              <div>
                <Label htmlFor="companySize">Company Size</Label>
                <SearchableSelect
                  options={['Micro (1-9)', 'Small (10-49)', 'Medium (50-249)', 'Large (250+)']}
                  value={form.watch('companySize') || ''}
                  onChange={(value) => form.setValue('companySize', value)}
                  placeholder="Select company size"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date of Incorporation</Label>
                <FromRegField value={registrationData?.dateOfIncorporation || ''} />
              </div>

              <div>
                <Label htmlFor="numberOfEmployees">Number of Employees *</Label>
                <Input
                  id="numberOfEmployees"
                  {...form.register('numberOfEmployees')}
                  placeholder="e.g., 10"
                  type="number"
                  min="1"
                  className="mt-1"
                />
                {form.formState.errors.numberOfEmployees && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.numberOfEmployees.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kraPin">KRA PIN *</Label>
                <Input
                  id="kraPin"
                  {...form.register('kraPin')}
                  placeholder="e.g., A012345678Z"
                  className="mt-1"
                />
                {form.formState.errors.kraPin && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.kraPin.message}</p>
                )}
              </div>

              <div>
                <Label>Business Reg. No.</Label>
                <FromRegField value={form.watch('registrationNumber') || ''} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <SearchableSelect
                  options={[...INDUSTRIES]}
                  value={form.watch('industry') || ''}
                  onChange={(value) => form.setValue('industry', value, { shouldDirty: true })}
                  placeholder="Select industry"
                />
              </div>

              <div>
                <Label htmlFor="sector">Business Sector</Label>
                <Input
                  id="sector"
                  {...form.register('sector')}
                  placeholder="e.g., Agriculture, Manufacturing"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceOffering">Products/Services</Label>
                <Input
                  id="serviceOffering"
                  {...form.register('serviceOffering')}
                  placeholder="e.g., Fresh Produce, Coffee, Logistics"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="businessUserOrganisation">Business User Organisation</Label>
                <Input
                  id="businessUserOrganisation"
                  {...form.register('businessUserOrganisation')}
                  placeholder="e.g., KAM, KNCCI"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exportLicense">Export License No.</Label>
                <Input
                  id="exportLicense"
                  {...form.register('exportLicense')}
                  placeholder="Enter export license number"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="productHsCode">Product HS Code</Label>
                <Input
                  id="productHsCode"
                  {...form.register('productHsCode')}
                  placeholder="e.g., 0901.11"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Directors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Names of Directors</Label>
                <button
                  type="button"
                  onClick={() => setDirectors(prev => [...prev, { name: '', role: '' }])}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Director
                </button>
              </div>

              {directors.length === 0 && (
                <p className="text-sm text-gray-400 italic py-2">No directors added yet. Click "Add Director" to begin.</p>
              )}

              <div className="space-y-2">
                {directors.map((director, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Full name"
                      value={director.name}
                      onChange={(e) => {
                        const updated = [...directors];
                        updated[index] = { ...updated[index], name: e.target.value };
                        setDirectors(updated);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Role (e.g. CEO, Chairperson)"
                      value={director.role}
                      onChange={(e) => {
                        const updated = [...directors];
                        updated[index] = { ...updated[index], role: e.target.value };
                        setDirectors(updated);
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setDirectors(prev => prev.filter((_, i) => i !== index))}
                      className="mt-1 text-red-400 hover:text-red-600 flex-shrink-0"
                      aria-label="Remove director"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Documents
        return (
          <div className="space-y-6">
            <FileUploader
              label="Registration Certificate"
              description="Upload your business registration certificate (PDF only, max 1MB)"
              value={form.watch('registrationCertificateUrl')}
              onChange={(url) => form.setValue('registrationCertificateUrl', url)}
              validationOptions={DEFAULT_DOCUMENT_OPTIONS}
              accept="application/pdf"
              required
            />
            {form.formState.errors.registrationCertificateUrl && (
              <p className="text-sm text-red-600">
                {form.formState.errors.registrationCertificateUrl.message}
              </p>
            )}

            <FileUploader
              label="PIN Certificate"
              description="Upload your KRA PIN certificate (PDF only, max 1MB)"
              value={form.watch('pinCertificateUrl')}
              onChange={(url) => form.setValue('pinCertificateUrl', url)}
              validationOptions={DEFAULT_DOCUMENT_OPTIONS}
              accept="application/pdf"
              required
            />
            {form.formState.errors.pinCertificateUrl && (
              <p className="text-sm text-red-600">
                {form.formState.errors.pinCertificateUrl.message}
              </p>
            )}

            <FileUploader
              label="Kenyan National ID (Optional)"
              description="Upload your Kenyan National ID document (PDF only, max 1MB)"
              value={form.watch('kenyanNationalIdUrl')}
              onChange={(url) => form.setValue('kenyanNationalIdUrl', url)}
              validationOptions={DEFAULT_DOCUMENT_OPTIONS}
              accept="application/pdf"
            />

            <FileUploader
              label="Kenya Certificate of Incorporation (Optional)"
              description="Upload your Kenya Certificate of Incorporation (PDF only, max 1MB)"
              value={form.watch('incorporationCertificateUrl')}
              onChange={(url) => form.setValue('incorporationCertificateUrl', url)}
              validationOptions={DEFAULT_DOCUMENT_OPTIONS}
              accept="application/pdf"
            />

            <FileUploader
              label="Export License/Permit (Optional)"
              description="Upload your Export License/Permit document (PDF only, max 1MB)"
              value={form.watch('exportLicenseUrl')}
              onChange={(url) => form.setValue('exportLicenseUrl', url)}
              validationOptions={DEFAULT_DOCUMENT_OPTIONS}
              accept="application/pdf"
            />
            {form.formState.errors.exportLicenseUrl && (
              <p className="text-sm text-red-600">
                {form.formState.errors.exportLicenseUrl.message}
              </p>
            )}
          </div>
        );

      case 3: // Location & Contact
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website Link</Label>
                <Input
                  id="website"
                  {...form.register('website')}
                  placeholder="https://example.com"
                  type="url"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  {...form.register('mobileNumber')}
                  placeholder="+254 700 000 000"
                  type="tel"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="town">City/Town *</Label>
                <Input
                  id="town"
                  {...form.register('town')}
                  placeholder="e.g., Nairobi"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="county">County *</Label>
                <SearchableSelect
                  options={KENYAN_COUNTIES}
                  value={form.watch('county') || ''}
                  onChange={(value) => form.setValue('county', value, { shouldDirty: true })}
                  placeholder="Select county"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="physicalAddress">Physical Address *</Label>
              <Input
                id="physicalAddress"
                {...form.register('physicalAddress')}
                placeholder="P.O. Box 12345, Street Address"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPhone">Company Phone *</Label>
                <Input
                  id="contactPhone"
                  {...form.register('contactPhone')}
                  placeholder="+254 700 000 000"
                  type="tel"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  {...form.register('whatsappNumber')}
                  placeholder="+254 700 000 000"
                  type="tel"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="companyEmail">Company Email *</Label>
              <Input
                id="companyEmail"
                {...form.register('companyEmail')}
                placeholder="company@example.com"
                type="email"
                className="mt-1"
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Primary Contact</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryContactFirstName">First Name</Label>
                  <Input
                    id="primaryContactFirstName"
                    {...form.register('primaryContactFirstName')}
                    placeholder="First name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryContactLastName">Last Name</Label>
                  <Input
                    id="primaryContactLastName"
                    {...form.register('primaryContactLastName')}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryContactEmail">Email</Label>
                  <Input
                    id="primaryContactEmail"
                    {...form.register('primaryContactEmail')}
                    placeholder="contact@example.com"
                    type="email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryContactPhone">Phone</Label>
                  <Input
                    id="primaryContactPhone"
                    {...form.register('primaryContactPhone')}
                    placeholder="+254 700 000 000"
                    type="tel"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Social Media & Location
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="twitterUrl">Twitter</Label>
                <Input
                  id="twitterUrl"
                  {...form.register('twitterUrl')}
                  placeholder="https://twitter.com/yourcompany"
                  type="url"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input
                  id="instagramUrl"
                  {...form.register('instagramUrl')}
                  placeholder="https://instagram.com/yourcompany"
                  type="url"
                  className="mt-1"
                />
              </div>
            </div>

            <LocationPicker
              label="Precise Location (GPS)"
              description="Click 'Update Location' to set your business location on the map"
              value={form.watch('coordinates')}
              onChange={(coordinates) => {
                form.setValue('coordinates', coordinates, { shouldDirty: true, shouldValidate: true });
                silentAutoSave();
              }}
            />
            {form.formState.errors.coordinates && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.coordinates.message}
              </p>
            )}
          </div>
        );

      case 5: // Company Capacity & Story
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exportVolumePast3Years">Export Volume for the Past 3 Years</Label>
                <Input
                  id="exportVolumePast3Years"
                  {...form.register('exportVolumePast3Years')}
                  placeholder="e.g., 7 containers, 10000 kg"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="productionCapacityPast3">Production Volume/Capacity For The Past 3 Years</Label>
                <Input
                  id="productionCapacityPast3"
                  {...form.register('productionCapacityPast3')}
                  placeholder="Enter production capacity"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currentExportMarkets">Export Destination/Markets</Label>
              <SearchableMultiSelect
                options={EXPORT_MARKETS}
                selected={form.watch('currentExportMarkets') || []}
                onChange={(selected) => {
                  form.setValue('currentExportMarkets', selected, { shouldValidate: true, shouldDirty: true });
                }}
                placeholder="Select export markets..."
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select all countries/regions you currently export to
              </p>
            </div>

            <div>
              <Label htmlFor="companyStory">Company Story</Label>
              <Textarea
                id="companyStory"
                {...form.register('companyStory')}
                placeholder="Tell your company's story..."
                className="mt-1"
                rows={6}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Business Profile</CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Complete your business profile to get verified
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {completionPercentage}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Complete</p>
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Section Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = index === currentSection;
          const isCompleted = section.fields.every(field => 
            watchedValues[field as keyof BusinessFormData]
          );

          return (
            <Button
              key={index}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSectionClick(index)}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-xs text-center leading-tight">
                {section.title}
              </span>
              {isCompleted && (
                <CheckCircle className="w-3 h-3 text-green-500 mt-1" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={form.handleSubmit(handleSubmit as any)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(sections[currentSection].icon, { className: "w-5 h-5" })}
              <span>{sections[currentSection].title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderSection()}
          </CardContent>
        </Card>

        {/* Certifications Section - Only show on last section */}
        {currentSection === sections.length - 1 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>Business Certifications</span>
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Add your business certifications. Changes will be saved when you click "Save Profile" below.
                    </p>
                  </div>
                  <Dialog 
                    open={isCertDialogOpen} 
                    onOpenChange={(open: boolean) => {
                      setIsCertDialogOpen(open);
                      if (open) {
                        // Reset form when opening for new certification
                        setEditingCertIndex(null);
                        setCertFormData({
                          name: '',
                          issuer: '',
                          validUntil: undefined,
                          imageUrl: '',
                          logoUrl: '',
                        });
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Certification
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCertIndex !== null ? 'Edit Certification' : 'Add New Certification'}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Select Certification Type</Label>
                            <SearchableSelect
                              options={COMMON_CERTIFICATIONS}
                              value={certFormData.name}
                              onChange={handleCertificationTypeChange}
                              placeholder="Choose a certification type"
                            />
                          </div>

                          <div>
                            <Label htmlFor="cert-name">Certification Name *</Label>
                            <Input
                              id="cert-name"
                              value={certFormData.name}
                              onChange={(e) => setCertFormData({ ...certFormData, name: e.target.value })}
                              placeholder="Enter certification name"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cert-issuer">Issuing Authority *</Label>
                            <Input
                              id="cert-issuer"
                              value={certFormData.issuer}
                              onChange={(e) => setCertFormData({ ...certFormData, issuer: e.target.value })}
                              placeholder="e.g., ISO, GlobalGAP, Fair Trade USA"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="cert-valid">Valid Until</Label>
                            <div className="relative mt-1">
                              <input
                                id="cert-valid"
                                type="date"
                                value={certFormData.validUntil ? new Date(certFormData.validUntil).toISOString().split('T')[0] : ''}
                                onChange={(e) => setCertFormData({
                                  ...certFormData,
                                  validUntil: e.target.value ? new Date(e.target.value) : undefined
                                })}
                                className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
                                style={{ colorScheme: 'light' }}
                              />
                            </div>
                          </div>
                        </div>

                        <FileUploader
                          label="Certificate Image (Optional)"
                          description="Upload the certificate image. You can add this later if you don't have it now. Accepted formats: JPG, JPEG, WEBP (PNG not accepted — quality images only)."
                          value={certFormData.imageUrl || ''}
                          onChange={(url) => setCertFormData({ ...certFormData, imageUrl: url })}
                          validationOptions={DEFAULT_IMAGE_OPTIONS}
                          accept="image/jpeg,image/webp"
                        />

                        <FileUploader
                          label="Certificate Logo/Badge (Optional)"
                          description="Upload the certification logo or badge. You can add this later if you don't have it now. Accepted formats: JPG, JPEG, WEBP (PNG not accepted — quality images only)."
                          value={certFormData.logoUrl || ''}
                          onChange={(url) => setCertFormData({ ...certFormData, logoUrl: url })}
                          validationOptions={DEFAULT_IMAGE_OPTIONS}
                          accept="image/jpeg,image/webp"
                        />

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCertDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={(e) => handleAddCertification(e)}
                          >
                            {editingCertIndex !== null ? 'Update' : 'Add'} Certification
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {certifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No certifications added yet</p>
                    <p className="text-sm">Add certifications to showcase your business credentials</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certifications.map((certification, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">
                                {certification.name}
                              </h4>
                              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                                <Building className="w-3 h-3 mr-1" />
                                {certification.issuer}
                              </div>
                            </div>

                            {certification.logoUrl && (
                              <img
                                src={certification.logoUrl}
                                alt={`${certification.name} logo`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>

                          {certification.validUntil && (
                            <div className="flex items-center text-xs mb-3">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span className="mr-2">
                                Valid until: {new Date(certification.validUntil).toLocaleDateString()}
                              </span>
                              {isExpired(certification.validUntil) && (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              )}
                              {isExpiringSoon(certification.validUntil) && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              {certification.imageUrl ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!certification.imageUrl) return;
                                    window.open(resolveFileUrl(certification.imageUrl), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <p className="text-xs text-gray-500">No image</p>
                              )}
                            </div>

                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleEditCertification(index, e)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleDeleteCertification(index, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation & Save */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
                disabled={currentSection === sections.length - 1}
              >
                Next
              </Button>
            </div>
            {/* Subtle save indicator — barely noticeable */}
            <span
              className="transition-opacity duration-500"
              style={{ opacity: saveIndicator === 'idle' ? 0 : 1 }}
              aria-hidden="true"
            >
              {saveIndicator === 'saving' && (
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block animate-pulse" />
              )}
              {saveIndicator === 'saved' && (
                <CheckCircle className="w-3 h-3 text-green-500 inline-block" />
              )}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {certifications.length > 0 && currentSection === sections.length - 1 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {certifications.length} certification{certifications.length !== 1 ? 's' : ''} ready to save
              </p>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : certifications.length > 0 ? 'Save & Finish' : 'Save Profile'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
