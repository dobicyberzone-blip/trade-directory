'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input, PasswordInput } from '@/components/ui/input';
import { RegisterSchema, type RegisterFormValues } from '@/lib/schemas';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { 
  PARTNER_TYPE_OPTIONS, 
  COUNTY_OPTIONS, 
  CITY_OPTIONS, 
  LEGAL_STRUCTURE_OPTIONS,
  SERVICE_OFFERING_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS
} from '@/lib/constants';
import { useMasterData } from '@/hooks/use-master-data';

type FormValues = RegisterFormValues;

// Steps for the wizard
type WizardStep = 'role' | 'business' | 'contact' | 'credentials';

// Success component
function RegistrationSuccess({ email, onContinueToLogin }: { email: string; onContinueToLogin: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <div className="w-8 h-8 bg-green-500 rounded-full"></div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
        <p className="text-gray-600">Welcome to KEPROBA, {email}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Notice Sent</p>
            <p className="text-sm text-blue-700">A confirmation notice has been sent to your email address. Please check your inbox to verify your account.</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={onContinueToLogin}
        className="w-full bg-green-600 hover:bg-yellow-400 hover:text-green-800 text-white py-3 rounded-lg font-medium transition-all"
      >
        Continue to Login
      </Button>
    </div>
  );
}

// Progress Indicator Component
function ProgressIndicator({ currentStep, steps }: { currentStep: WizardStep; steps: { key: WizardStep; label: string }[] }) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);
  
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between relative">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-start flex-1">
            <div className="flex flex-col items-center w-full">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                index < currentIndex ? "bg-green-500 text-white" :
                index === currentIndex ? "bg-green-600 text-white ring-4 ring-green-100" :
                "bg-gray-200 text-gray-500"
              )}>
                {index < currentIndex ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index + 1}
              </div>
              <span className={cn(
                "text-xs mt-2 text-center hidden sm:block whitespace-nowrap",
                index === currentIndex ? "text-green-600 font-medium" : "text-gray-500"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mt-5 mx-1 shrink-0",
                index < currentIndex ? "bg-green-500" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  useEffect(() => {
    setIsMounted(true);
    // Clear localStorage on first load to ensure fresh start
    localStorage.removeItem('registration_draft');
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <RegisterPageContent 
    showSuccess={showSuccess} 
    setShowSuccess={setShowSuccess}
    registeredEmail={registeredEmail}
    setRegisteredEmail={setRegisteredEmail}
  />;
}

function RegisterPageContent({ 
  showSuccess, 
  setShowSuccess, 
  registeredEmail, 
  setRegisteredEmail 
}: {
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  registeredEmail: string;
  setRegisteredEmail: (email: string) => void;
}) {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  // Master data from DB — active industries/sectors only
  const { industries: dbIndustries, sectorsByIndustry: dbSectorsByIndustry } = useMasterData();
  
  // Wizard state - always start at role step (ignore any saved state)
  const [currentStep, setCurrentStep] = useState<WizardStep>('role');
  const [selectedRole, setSelectedRole] = useState<'exporter' | 'buyer' | 'partner'>('exporter');
  
  // Dropdown states
  const [sectorOpen, setSectorOpen] = useState(false);
  const [sectorSearch, setSectorSearch] = useState('');
  const sectorRef = useRef<HTMLDivElement>(null);
  
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const partnerRef = useRef<HTMLDivElement>(null);
  
  const [countyOpen, setCountyOpen] = useState(false);
  const [countySearch, setCountySearch] = useState('');
  const countyRef = useRef<HTMLDivElement>(null);
  
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityRef = useRef<HTMLDivElement>(null);
  
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const industryRef = useRef<HTMLDivElement>(null);
  
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalSearch, setLegalSearch] = useState('');
  const legalRef = useRef<HTMLDivElement>(null);

  // "Other" free-text state for industry and sector
  const [industryOtherText, setIndustryOtherText] = useState('');
  const [sectorOtherText, setSectorOtherText] = useState('');
  const [partnerOtherText, setPartnerOtherText] = useState('');
  const [legalOtherText, setLegalOtherText] = useState('');

  // Email duplicate check state
  const [emailCheckState, setEmailCheckState] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmailCheckState('checking');
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailCheckState(data.available ? 'available' : 'taken');
    } catch {
      setEmailCheckState('idle');
    }
  };

  // Business name duplicate check state
  const [bizNameCheckState, setBizNameCheckState] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  // Terms agreement state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState<'terms' | 'privacy' | null>(null);

  const checkBusinessNameAvailability = async (name: string) => {
    if (!name || name.trim().length < 2) return;
    setBizNameCheckState('checking');
    try {
      const res = await fetch(`/api/auth/check-business-name?name=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      setBizNameCheckState(data.available ? 'available' : 'taken');
    } catch {
      setBizNameCheckState('idle');
    }
  };

  // Product/Services multi-select state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const productRef = useRef<HTMLDivElement>(null);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Auto-save to localStorage
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sectorRef.current && !sectorRef.current.contains(e.target as Node)) setSectorOpen(false);
      if (partnerRef.current && !partnerRef.current.contains(e.target as Node)) setPartnerOpen(false);
      if (countyRef.current && !countyRef.current.contains(e.target as Node)) setCountyOpen(false);
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) setIndustryOpen(false);
      if (legalRef.current && !legalRef.current.contains(e.target as Node)) setLegalOpen(false);
      if (productRef.current && !productRef.current.contains(e.target as Node)) setProductDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      role: "exporter" as "exporter" | "buyer" | "partner",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      partnerType: "",
      // Business info
      businessName: "",
      dateOfIncorporation: "",
      businessRegistrationNumber: "",
      sector: "",
      industry: "",
      productServices: [],
      legalStructure: "",
      fullAddress: "",
      county: "",
      city: "",
      country: "Kenya",
      // Contact info
      primaryContactFirstName: "",
      primaryContactLastName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      companyEmail: "",
      companyPhone: "",
    },
    mode: "onChange",
  });

  // Watch role changes
  const watchRole = form.watch('role');

  // Load auto-saved data
  useEffect(() => {
    if (autoSaveEnabled && !showSuccess) {
      const savedData = localStorage.getItem('registration_draft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          Object.keys(parsed).forEach(key => {
            if (key in form.getValues()) {
              form.setValue(key as keyof FormValues, parsed[key]);
            }
          });
        } catch (e) {
          console.error('Failed to load saved data');
        }
      }
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && !showSuccess) {
      const subscription = form.watch((values) => {
        const toSave = { ...values };
        delete toSave.password;
        delete toSave.confirmPassword;
        localStorage.setItem('registration_draft', JSON.stringify(toSave));
      });
      return () => subscription.unsubscribe();
    }
  }, [form, autoSaveEnabled, showSuccess]);

  // Step definitions
  const steps = [
    { key: 'role' as WizardStep, label: 'Account Type' },
    { key: 'business' as WizardStep, label: 'Business Info' },
    { key: 'contact' as WizardStep, label: 'Contact' },
    { key: 'credentials' as WizardStep, label: 'Account' },
  ];

  // Navigation functions
  const canProceedToStep = (step: WizardStep): boolean => {
    if (step === 'business') return true; // Always can go to business after role
    if (step === 'contact') return true;
    if (step === 'credentials') return true;
    return false;
  };

  const handleNext = async () => {
    let isValid = false;
    
    if (currentStep === 'role') {
      // Validate role selection
      const role = form.getValues('role');
      if (role) {
        // If buyer, go straight to credentials
        if (role === 'buyer') {
          setCurrentStep('credentials');
        } else if (role === 'partner') {
          // Partner must select a partner type first
          const partnerType = form.getValues('partnerType');
          if (!partnerType || partnerType === '') {
            toast({ variant: "destructive", title: "Error", description: "Please select your partner type" });
            return;
          }
          if (partnerType === 'Other' && (!partnerOtherText || partnerOtherText.trim() === '')) {
            toast({ variant: "destructive", title: "Error", description: "Please specify your partner type" });
            return;
          }
          setCurrentStep('credentials');
        } else {
          setCurrentStep('business');
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: "Please select an account type" });
      }
    } else if (currentStep === 'business') {
      // Validate business info
      const fieldsToCheck = ['businessName', 'businessRegistrationNumber', 'sector', 'fullAddress', 'county', 'city'];
      isValid = await form.trigger(fieldsToCheck as any);
      if (isValid) {
        setCurrentStep('contact');
      }
    } else if (currentStep === 'contact') {
      // Validate contact info
      const fieldsToCheck = ['primaryContactFirstName', 'primaryContactLastName', 'primaryContactEmail', 'primaryContactPhone'];
      isValid = await form.trigger(fieldsToCheck as any);
      if (isValid) {
        setCurrentStep('credentials');
      }
    }
  };

  const handleBack = () => {
    const role = form.getValues('role');
    if (currentStep === 'business') {
      setCurrentStep('role');
    } else if (currentStep === 'contact') {
      setCurrentStep('business');
    } else if (currentStep === 'credentials') {
      // Buyer and partner go back to role selection (no business steps)
      if (role === 'buyer' || role === 'partner') {
        setCurrentStep('role');
      } else {
        setCurrentStep('contact');
      }
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      // Block submission if email is already taken
      if (emailCheckState === 'taken') {
        toast({
          variant: 'destructive',
          title: 'Email Already Registered',
          description: 'An account with this email already exists. Please use a different email address or sign in to your existing account.',
        });
        return;
      }

      // Block submission if business name is already taken
      if (bizNameCheckState === 'taken') {
        toast({
          variant: 'destructive',
          title: 'Business Name Already Registered',
          description: 'A business with this name already exists. Please use a unique business name.',
        });
        return;
      }

      // Block submission if terms not accepted
      if (!agreedToTerms) {
        toast({
          variant: 'destructive',
          title: 'Terms & Conditions Required',
          description: 'Please read and accept the Terms and Conditions and Privacy Policy to continue.',
        });
        return;
      }

      // Clear auto-save
      localStorage.removeItem('registration_draft');
      setAutoSaveEnabled(false);

      const baseData = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber?.trim() || undefined,
        role: (values.role === 'partner' ? 'BUYER' : values.role.toUpperCase()) as 'ADMIN' | 'EXPORTER' | 'BUYER',
      };

      let registrationData: any;

      if (values.role === 'exporter') {
        registrationData = {
          ...baseData,
          // Business info
          businessName: values.businessName,
          businessLocation: values.city || values.fullAddress,
          dateOfIncorporation: values.dateOfIncorporation,
          businessRegistrationNumber: values.businessRegistrationNumber,
          sector: values.sector,
          industry: values.industry,
          productServices: values.productServices,
          legalStructure: values.legalStructure,
          fullAddress: values.fullAddress,
          county: values.county,
          city: values.city,
          country: values.country,
          // Contact info
          primaryContactFirstName: values.primaryContactFirstName,
          primaryContactLastName: values.primaryContactLastName,
          primaryContactEmail: values.primaryContactEmail,
          primaryContactPhone: values.primaryContactPhone,
          companyEmail: values.companyEmail,
          companyPhone: values.companyPhone,
          productCategory: values.sector, // Legacy field
        };
      } else {
        registrationData = {
          ...baseData,
          partnerType: values.partnerType,
        };
      }

      await register(registrationData);
      setRegisteredEmail(values.email);
      setShowSuccess(true);
      
    } catch (error: any) {
      const errorMessage = error.message || "";
      let displayMessage = "An error occurred during registration. Please try again.";
      
      if (errorMessage.toLowerCase().includes("email") && 
          (errorMessage.toLowerCase().includes("already") || 
           errorMessage.toLowerCase().includes("exists") ||
           errorMessage.toLowerCase().includes("duplicate") ||
           errorMessage.toLowerCase().includes("taken"))) {
        displayMessage = "This email is already registered. Please use a different email or sign in.";
      } else if (errorMessage) {
        displayMessage = errorMessage;
      }
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: displayMessage,
      });
    }
  }

  const handleContinueToLogin = () => {
    router.push('/login');
  };

  // Custom dropdown component
  const CustomDropdown = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    search, 
    setSearch, 
    isOpen, 
    setIsOpen, 
    ref,
    label
  }: any) => (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center justify-between w-full h-12 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-xl border z-[100] max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b bg-white sticky top-0">
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1 px-1">
              {options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase())).length} of {options.length}
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {options
              .filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()))
              .map((option: any) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 transition-colors flex items-center justify-between ${value === option.value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-900'}`}
                >
                  <span>{option.label}</span>
                  {value === option.value && <span className="text-green-600">✓</span>}
                </button>
              ))
            }
            {options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No {label.toLowerCase()} found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Multi-select for products/services
  const toggleProduct = (product: string) => {
    const current = form.getValues('productServices') || [];
    if (current.includes(product)) {
      form.setValue('productServices', current.filter(p => p !== product));
    } else {
      form.setValue('productServices', [...current, product]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-8">
          {showSuccess ? (
            <RegistrationSuccess 
              email={registeredEmail}
              onContinueToLogin={handleContinueToLogin}
            />
          ) : (
            <div className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
              {/* Logo */}
              <div className="text-center mb-8">
                <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                  <Logo className="h-14 w-auto mx-auto" />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-600 text-sm">
                  {selectedRole === 'exporter'
                    ? 'Register your business to start exporting'
                    : selectedRole === 'partner'
                    ? 'Register as a partner organisation'
                    : 'Join as a buyer to connect with exporters'}
                </p>
              </div>

              {/* Progress Indicator */}
              <ProgressIndicator currentStep={currentStep} steps={steps} />

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* STEP 1: Role Selection */}
                  {currentStep === 'role' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-900 font-medium">Select Account Type <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedRole(value as 'exporter' | 'buyer' | 'partner');
                                  // Clear partnerType when switching away from partner
                                  if (value !== 'partner') form.setValue('partnerType', '');
                                }}
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-4 items-stretch"
                              >
                                {/* Exporter */}
                                <FormItem className="h-full">
                                  <RadioGroupItem value="exporter" id="exporter" className="sr-only" />
                                  <Label
                                    htmlFor="exporter"
                                    className={cn(
                                      "flex flex-col items-center justify-center rounded-lg border-2 bg-white p-4 cursor-pointer transition-all h-full min-h-[100px]",
                                      field.value === 'exporter'
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    )}
                                  >
                                    <div className={cn("mb-2 w-5 h-5 rounded-full flex-shrink-0", field.value === 'exporter' ? "bg-green-500" : "bg-gray-300")}></div>
                                    <span className={cn("font-medium text-base", field.value === 'exporter' ? "text-green-700" : "text-gray-700")}>Exporter</span>
                                    <span className="text-xs text-gray-500 mt-1 text-center">Kenyan Businesses</span>
                                  </Label>
                                </FormItem>

                                {/* Buyer */}
                                <FormItem className="h-full">
                                  <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
                                  <Label
                                    htmlFor="buyer"
                                    className={cn(
                                      "flex flex-col items-center justify-center rounded-lg border-2 bg-white p-4 cursor-pointer transition-all h-full min-h-[100px]",
                                      field.value === 'buyer'
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    )}
                                  >
                                    <div className={cn("mb-2 w-5 h-5 rounded-full flex-shrink-0", field.value === 'buyer' ? "bg-green-500" : "bg-gray-300")}></div>
                                    <span className={cn("font-medium text-base", field.value === 'buyer' ? "text-green-700" : "text-gray-700")}>Buyer</span>
                                    <span className="text-xs text-gray-500 mt-1 text-center">International Buyers</span>
                                  </Label>
                                </FormItem>

                                {/* Partner */}
                                <FormItem className="h-full">
                                  <RadioGroupItem value="partner" id="partner" className="sr-only" />
                                  <Label
                                    htmlFor="partner"
                                    className={cn(
                                      "flex flex-col items-center justify-center rounded-lg border-2 bg-white p-4 cursor-pointer transition-all h-full min-h-[100px]",
                                      field.value === 'partner'
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    )}
                                  >
                                    <div className={cn("mb-2 w-5 h-5 rounded-full flex-shrink-0", field.value === 'partner' ? "bg-green-500" : "bg-gray-300")}></div>
                                    <span className={cn("font-medium text-base", field.value === 'partner' ? "text-green-700" : "text-gray-700")}>Partner</span>
                                    <span className="text-xs text-gray-500 mt-1 text-center">Government, TSIs, etc.</span>
                                  </Label>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>

                            {/* Partner type dropdown — only for Partner selection */}
                            {field.value === 'partner' && (
                              <div className="mt-4 space-y-3">
                                <FormField
                                  control={form.control}
                                  name="partnerType"
                                  render={({ field: partnerField }) => {
                                    const partnerVal = form.watch('partnerType') || '';
                                    const isOther = partnerVal === 'Other' || partnerVal.startsWith('Other:');
                                    return (
                                    <FormItem>
                                      <FormLabel className="text-gray-900 font-medium">Partner Type <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <CustomDropdown
                                          value={isOther ? 'Other' : partnerVal}
                                          onChange={(val: string) => {
                                            if (val === 'Other') {
                                              partnerField.onChange('Other');
                                              setPartnerOtherText('');
                                            } else {
                                              partnerField.onChange(val);
                                              setPartnerOtherText('');
                                            }
                                          }}
                                          options={PARTNER_TYPE_OPTIONS}
                                          placeholder="Select partner type"
                                          search={partnerSearch}
                                          setSearch={setPartnerSearch}
                                          isOpen={partnerOpen}
                                          setIsOpen={setPartnerOpen}
                                          ref={partnerRef}
                                          label="Partner Types"
                                        />
                                      </FormControl>
                                      {isOther && (
                                        <Input
                                          placeholder="Please specify your partner type"
                                          value={partnerOtherText}
                                          onChange={(e) => {
                                            setPartnerOtherText(e.target.value);
                                            partnerField.onChange(e.target.value ? `Other: ${e.target.value}` : 'Other');
                                          }}
                                          className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                          autoFocus
                                        />
                                      )}
                                      <FormMessage />
                                    </FormItem>
                                    );
                                  }}
                                />
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* STEP 2: Business Information (Exporter only) */}
                  {currentStep === 'business' && selectedRole === 'exporter' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField 
                          control={form.control} 
                          name="businessName" 
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-gray-900 font-medium">Business Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Your Company Ltd."
                                    {...field}
                                    className={`h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10 ${
                                      bizNameCheckState === 'taken' ? 'border-red-400 focus:border-red-400 focus:ring-red-400' :
                                      bizNameCheckState === 'available' ? 'border-green-400' : ''
                                    }`}
                                    onBlur={(e) => {
                                      field.onBlur();
                                      checkBusinessNameAvailability(e.target.value);
                                    }}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      if (bizNameCheckState !== 'idle') setBizNameCheckState('idle');
                                    }}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {bizNameCheckState === 'checking' && (
                                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                      </svg>
                                    )}
                                    {bizNameCheckState === 'available' && (
                                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {bizNameCheckState === 'taken' && (
                                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </FormControl>
                              {bizNameCheckState === 'checking' && (
                                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                  <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                  Checking availability…
                                </p>
                              )}
                              {bizNameCheckState === 'taken' && (
                                <div className="mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 flex items-start gap-2">
                                  <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <div className="text-sm text-red-700 leading-snug">
                                    <span className="font-semibold">Business name already registered.</span>{' '}
                                    A business with this name already exists in the Trade Directory. Please use a unique name.
                                  </div>
                                </div>
                              )}
                              {bizNameCheckState === 'available' && (
                                <p className="text-sm text-green-700 flex items-center gap-1.5 mt-1">
                                  <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Business name is available
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="businessRegistrationNumber" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Business Reg. No. <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="e.g., CPR/2020/123456" 
                                    {...field} 
                                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                  />
                                  {/* TODO: BRS integration — uncomment when Business Registration Services API is ready
                                  <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800"
                                    onClick={() => toast({ title: "Verification", description: "Business registration verification would be integrated with the Business Registration Services API" })}
                                  >
                                    Verify
                                  </button>
                                  */}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="dateOfIncorporation" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Date of Incorporation</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <input
                                    type="date"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full h-12 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
                                    style={{ colorScheme: 'light' }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="legalStructure" 
                          render={({ field }) => {
                            const legalVal = form.watch('legalStructure') || '';
                            const isOther = legalVal === 'Other' || legalVal.startsWith('Other:');
                            return (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Legal Structure</FormLabel>
                              <FormControl>
                                <CustomDropdown
                                  value={isOther ? 'Other' : legalVal}
                                  onChange={(val: string) => {
                                    if (val === 'Other') {
                                      field.onChange('Other');
                                      setLegalOtherText('');
                                    } else {
                                      field.onChange(val);
                                      setLegalOtherText('');
                                    }
                                  }}
                                  options={LEGAL_STRUCTURE_OPTIONS}
                                  placeholder="Select legal structure"
                                  search={legalSearch}
                                  setSearch={setLegalSearch}
                                  isOpen={legalOpen}
                                  setIsOpen={setLegalOpen}
                                  ref={legalRef}
                                  label="Legal Structures"
                                />
                              </FormControl>
                              {isOther && (
                                <Input
                                  placeholder="Please specify your legal structure"
                                  value={legalOtherText}
                                  onChange={(e) => {
                                    setLegalOtherText(e.target.value);
                                    field.onChange(e.target.value ? `Other: ${e.target.value}` : 'Other');
                                  }}
                                  className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                  autoFocus
                                />
                              )}
                              <FormMessage />
                            </FormItem>
                            );
                          }} 
                        />

                        <FormField 
                          control={form.control} 
                          name="industry" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Industry</FormLabel>
                              <FormControl>
                                <CustomDropdown
                                  value={field.value === 'Other' ? 'Other' : field.value}
                                  onChange={(val: string) => {
                                    if (val === 'Other') {
                                      field.onChange('Other');
                                      setIndustryOtherText('');
                                    } else {
                                      field.onChange(val);
                                      setIndustryOtherText('');
                                    }
                                    // clear sector when industry changes
                                    form.setValue('sector', '');
                                    setSectorSearch('');
                                    setSectorOtherText('');
                                  }}
                                  options={[...dbIndustries.map(i => ({ value: i.name, label: i.name })), { value: 'Other', label: 'Other' }]}
                                  placeholder="Select industry"
                                  search={industrySearch}
                                  setSearch={setIndustrySearch}
                                  isOpen={industryOpen}
                                  setIsOpen={setIndustryOpen}
                                  ref={industryRef}
                                  label="Industries"
                                />
                              </FormControl>
                              {field.value === 'Other' && (
                                <Input
                                  placeholder="Please specify your industry"
                                  value={industryOtherText}
                                  onChange={(e) => {
                                    setIndustryOtherText(e.target.value);
                                    field.onChange(e.target.value ? `Other: ${e.target.value}` : 'Other');
                                  }}
                                  className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              )}
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="sector" 
                          render={({ field }) => {
                            const selectedIndustry = form.watch('industry');
                            const baseIndustry = selectedIndustry?.startsWith('Other:') ? 'Other' : selectedIndustry;
                            const sectorOptions = baseIndustry && dbSectorsByIndustry[baseIndustry]
                              ? dbSectorsByIndustry[baseIndustry].map(s => ({ value: s, label: s }))
                              : [];
                            const allSectorOptions = [...sectorOptions, { value: 'Other', label: 'Other' }];
                            return (
                              <FormItem>
                                <FormLabel className="text-gray-900 font-medium">Sector <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <CustomDropdown
                                    value={field.value === 'Other' || field.value?.startsWith('Other:') ? 'Other' : field.value}
                                    onChange={(val: string) => {
                                      if (val === 'Other') {
                                        field.onChange('Other');
                                        setSectorOtherText('');
                                      } else {
                                        field.onChange(val);
                                        setSectorOtherText('');
                                      }
                                    }}
                                    options={allSectorOptions}
                                    placeholder={selectedIndustry && baseIndustry !== 'Other' ? 'Select sector' : 'Select an industry first'}
                                    search={sectorSearch}
                                    setSearch={setSectorSearch}
                                    isOpen={sectorOpen}
                                    setIsOpen={setSectorOpen}
                                    ref={sectorRef}
                                    label="Sectors"
                                  />
                                </FormControl>
                                {(field.value === 'Other' || field.value?.startsWith('Other:')) && (
                                  <Input
                                    placeholder="Please specify your sector"
                                    value={sectorOtherText}
                                    onChange={(e) => {
                                      setSectorOtherText(e.target.value);
                                      field.onChange(e.target.value ? `Other: ${e.target.value}` : 'Other');
                                    }}
                                    className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                  />
                                )}
                                <FormMessage />
                              </FormItem>
                            );
                          }} 
                        />

                        <FormField
                          control={form.control}
                          name="productServices"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Products/Services</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Fresh Produce, Coffee, Logistics"
                                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? [e.target.value] : [])}
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField 
                          control={form.control} 
                          name="fullAddress" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Full Address <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="P.O. Box 12345, Street Address" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="county" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">County <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <CustomDropdown
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={COUNTY_OPTIONS}
                                  placeholder="Select county"
                                  search={countySearch}
                                  setSearch={setCountySearch}
                                  isOpen={countyOpen}
                                  setIsOpen={setCountyOpen}
                                  ref={countyRef}
                                  label="Counties"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="city" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">City <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <CustomDropdown
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={CITY_OPTIONS}
                                  placeholder="Select city"
                                  search={citySearch}
                                  setSearch={setCitySearch}
                                  isOpen={cityOpen}
                                  setIsOpen={setCityOpen}
                                  ref={cityRef}
                                  label="Cities"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="country" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Country</FormLabel>
                              <FormControl>
                                <Input 
                                  value="Kenya"
                                  disabled
                                  className="h-12 border-gray-200 bg-gray-50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Contact Information */}
                  {currentStep === 'contact' && selectedRole === 'exporter' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Primary Contact Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField 
                          control={form.control} 
                          name="primaryContactFirstName" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">First Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="John" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="primaryContactLastName" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Last Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Doe" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="primaryContactEmail" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Email Address <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="john@company.com" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="primaryContactPhone" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Mobile Phone <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+254712345678 or 0712345678" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Enter a valid Kenya phone number</p>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="companyEmail" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Company Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="info@company.com" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />

                        <FormField 
                          control={form.control} 
                          name="companyPhone" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Company Phone</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+254200123456" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Account Credentials */}
                  {(currentStep === 'credentials' || selectedRole === 'buyer' || selectedRole === 'partner') && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                        {selectedRole === 'exporter' ? 'Account Credentials' : 'Personal & Account Information'}
                      </h3>

                      {/* Buyer / Partner: collect name manually */}
                      {(selectedRole === 'buyer' || selectedRole === 'partner') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">First Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="John" {...field} className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Last Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="Doe" {...field} className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}

                      {/* Exporter: pre-fill name/email/phone from primary contact */}
                      {selectedRole === 'exporter' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => {
                              // Sync from primary contact if still empty
                              const pc = form.watch('primaryContactFirstName');
                              if (pc && !field.value) { setTimeout(() => field.onChange(pc), 0); }
                              return (
                                <FormItem>
                                  <FormLabel className="text-gray-900 font-medium">First Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl><Input placeholder="John" {...field} className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }} />
                            <FormField control={form.control} name="lastName" render={({ field }) => {
                              const pc = form.watch('primaryContactLastName');
                              if (pc && !field.value) { setTimeout(() => field.onChange(pc), 0); }
                              return (
                                <FormItem>
                                  <FormLabel className="text-gray-900 font-medium">Last Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl><Input placeholder="Doe" {...field} className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }} />
                          </div>
                        </div>
                      )}

                      <FormField control={form.control} name="email" render={({ field }) => {
                        if (selectedRole === 'exporter') {
                          const pc = form.watch('primaryContactEmail');
                          if (pc && !field.value) { setTimeout(() => field.onChange(pc), 0); }
                        }
                        return (
                          <FormItem>
                            <FormLabel className="text-gray-900 font-medium">
                              {selectedRole === 'partner' ? 'Official / Organisation Email' : 'Email Address'} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="email"
                                  placeholder={selectedRole === 'partner' ? 'official@organisation.go.ke' : 'you@company.com'}
                                  {...field}
                                  className={`h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10 ${
                                    emailCheckState === 'taken' ? 'border-red-400 focus:border-red-400 focus:ring-red-400' :
                                    emailCheckState === 'available' ? 'border-green-400' : ''
                                  }`}
                                  onBlur={(e) => {
                                    field.onBlur();
                                    checkEmailAvailability(e.target.value);
                                  }}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Reset check state when user edits the field
                                    if (emailCheckState !== 'idle') setEmailCheckState('idle');
                                  }}
                                />
                                {/* Status icon */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                  {emailCheckState === 'checking' && (
                                    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                  )}
                                  {emailCheckState === 'available' && (
                                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {emailCheckState === 'taken' && (
                                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            {/* Inline duplicate feedback */}
                            {emailCheckState === 'checking' && (
                              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Checking availability…
                              </p>
                            )}
                            {emailCheckState === 'taken' && (
                              <div className="mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 flex items-start gap-2">
                                <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-red-700 leading-snug">
                                  <span className="font-semibold">Email already registered.</span>{' '}
                                  An account with this email address already exists.{' '}
                                  <a href="/login" className="underline font-medium hover:text-red-900 whitespace-nowrap">Sign in to your account →</a>
                                  <span className="block text-xs text-red-500 mt-0.5">If you forgot your password, use the <a href="/forgot-password" className="underline hover:text-red-700">forgot password</a> link on the login page.</span>
                                </div>
                              </div>
                            )}
                            {emailCheckState === 'available' && (
                              <p className="text-sm text-green-700 flex items-center gap-1.5 mt-1">
                                <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Great — this email is available
                              </p>
                            )}
                            {selectedRole === 'partner' && emailCheckState === 'idle' && (
                              <p className="text-xs text-gray-500">Use your official organisation email address</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }} />

                      <FormField control={form.control} name="phoneNumber" render={({ field }) => {
                        if (selectedRole === 'exporter') {
                          const pc = form.watch('primaryContactPhone');
                          if (pc && !field.value) { setTimeout(() => field.onChange(pc), 0); }
                        }
                        return (
                          <FormItem>
                            <FormLabel className="text-gray-900 font-medium">
                              Phone Number <span className="text-gray-500 text-sm">(Optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="+254712345678 or 0712345678" {...field} className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500" />
                            </FormControl>
                            <p className="text-xs text-gray-500">Add phone for SMS verification during login</p>
                            <FormMessage />
                          </FormItem>
                        );
                      }} />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Password <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <PasswordInput 
                                  placeholder="••••••••" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 font-medium">Confirm Password <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <PasswordInput 
                                  placeholder="••••••••" 
                                  {...field} 
                                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                        <ul className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                          <li className="flex items-center gap-1"><span className="text-green-500">✓</span> At least 8 characters</li>
                          <li className="flex items-center gap-1"><span className="text-green-500">✓</span> One uppercase letter (A-Z)</li>
                          <li className="flex items-center gap-1"><span className="text-green-500">✓</span> One lowercase letter (a-z)</li>
                          <li className="flex items-center gap-1"><span className="text-green-500">✓</span> One number (0-9)</li>
                          <li className="flex items-center gap-1"><span className="text-green-500">✓</span> One special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Terms & Conditions checkbox — only shown on credentials step */}
                  {(currentStep === 'credentials' || selectedRole === 'buyer' || selectedRole === 'partner') && (
                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={e => setAgreedToTerms(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            agreedToTerms
                              ? 'bg-green-600 border-green-600'
                              : 'bg-white border-gray-300 group-hover:border-green-400'
                          }`}>
                            {agreedToTerms && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 leading-snug">
                          By signing up you agree to our{' '}
                          <button
                            type="button"
                            onClick={() => setTermsModalOpen('terms')}
                            className="text-green-600 font-semibold underline underline-offset-2 hover:text-green-700"
                          >
                            Terms and Conditions
                          </button>
                          {' '}and{' '}
                          <button
                            type="button"
                            onClick={() => setTermsModalOpen('privacy')}
                            className="text-green-600 font-semibold underline underline-offset-2 hover:text-green-700"
                          >
                            Privacy Policy
                          </button>
                          .
                        </span>
                      </label>
                      {!agreedToTerms && form.formState.isSubmitted && (
                        <p className="text-xs text-red-600 mt-1.5 ml-8">You must accept the terms to create an account.</p>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 pt-4">
                    {currentStep !== 'role' && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1 h-12"
                      >
                        Back
                      </Button>
                    )}
                    
                    {currentStep === 'credentials' ? (
                      <Button 
                        type="submit" 
                        className="flex-1 h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium text-lg"
                        disabled={form.formState.isSubmitting || isLoading}
                      >
                        {form.formState.isSubmitting || isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    ) : (
                      <Button 
                        type="button"
                        onClick={handleNext}
                        className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-green-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms / Privacy Policy Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setTermsModalOpen(null)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {termsModalOpen === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
              </h2>
              <button
                onClick={() => setTermsModalOpen(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 text-sm text-gray-700 leading-relaxed space-y-4">
              {termsModalOpen === 'terms' ? (
                <>
                  <p className="text-xs text-gray-400">Last updated: January 2026</p>
                  <p>Welcome to the Kenya Export Promotion and Branding Agency (KEPROBA) Trade Directory. These Terms and Conditions govern your use of our platform and services. By creating an account, you agree to be bound by these terms.</p>
                  {[
                    ['1. Acceptance of Terms', 'By creating an account, accessing, or using the KEPROBA Trade Directory platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.'],
                    ['2. Platform Purpose', 'The KEPROBA Trade Directory connects verified Kenyan exporters with international buyers, promotes Kenyan products and services in global markets, and supports Kenya\'s export development objectives.'],
                    ['3. User Accounts', 'You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. One person or entity may maintain only one account.'],
                    ['4. Verification Process', 'Exporters must undergo KEPROBA\'s verification process, which requires submission of valid business documentation. KEPROBA reserves the right to approve or reject verification applications.'],
                    ['5. User Responsibilities', 'All information provided must be accurate, current, and complete. Users must maintain professional standards in all communications and must not post false, misleading, or fraudulent information.'],
                    ['6. Prohibited Activities', 'Users must not engage in spam, harassment, or abusive behavior; attempt to circumvent platform security measures; use the platform for illegal activities; or infringe on intellectual property rights.'],
                    ['7. Business Transactions', 'KEPROBA facilitates connections but is not party to business transactions. All commercial agreements are between buyers and exporters directly. KEPROBA does not guarantee the completion or success of any transaction.'],
                    ['8. Data Protection', 'Personal data is processed according to our Privacy Policy. Business information may be displayed publicly for trade promotion. Users consent to data sharing with relevant government agencies.'],
                    ['9. Limitation of Liability', 'KEPROBA provides the platform "as is" without warranties. We are not liable for business losses or failed transactions. Users assume responsibility for their business decisions.'],
                    ['10. Governing Law', 'These Terms and Conditions are governed by the laws of Kenya. Any disputes shall be subject to the jurisdiction of Kenyan courts.'],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                      <p>{body}</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 pt-2 border-t">For questions: legal@keproba.go.ke | +254 20 222 85 34 8</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">Last updated: January 2026</p>
                  <p>KEPROBA is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
                  {[
                    ['Information We Collect', 'We collect your name, email address, contact information, business details, account credentials, and technical information such as IP addresses and usage patterns.'],
                    ['How We Use Your Information', 'We use your information to provide our trade directory services, verify business credentials, facilitate connections between exporters and buyers, send important account updates, and comply with legal obligations.'],
                    ['Public Directory', 'Verified business information is displayed publicly to promote Kenyan exports, including company name, description, contact details, product offerings, certifications, and business location.'],
                    ['Government Agencies', 'As a state corporation, we may share information with relevant government bodies for trade promotion, regulatory compliance, and national economic planning.'],
                    ['Data Security', 'We implement encryption of data in transit and at rest, regular security audits, access controls, and employee training on data protection practices.'],
                    ['Your Rights', 'You have the right to access and review your personal information, request corrections, delete your account, opt-out of marketing communications, and lodge complaints with data protection authorities.'],
                    ['Data Retention', 'We retain your information for as long as necessary to provide our services and comply with legal obligations. Business directory information may be retained longer to maintain historical trade records.'],
                    ['Changes to This Policy', 'We may update this Privacy Policy periodically. We will notify you of significant changes through email or platform notifications.'],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                      <p>{body}</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 pt-2 border-t">For questions: privacy@keproba.go.ke | +254 20 222 85 34 8</p>
                </>
              )}
            </div>
            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500">
                Read the full version at{' '}
                <a
                  href={termsModalOpen === 'terms' ? '/terms-and-conditions' : '/privacy-policy'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 underline"
                >
                  {termsModalOpen === 'terms' ? '/terms-and-conditions' : '/privacy-policy'}
                </a>
              </p>
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setTermsModalOpen(null);
                }}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer/>
    </div>
  );
}
