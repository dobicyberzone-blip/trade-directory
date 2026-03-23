
import { z } from 'zod';

// Kenya phone validation
const kenyaPhoneRegex = /^(\+254|254|0)?[1-9]\d{8}$/;

// Business registration number validation (simplified)
const businessRegNoRegex = /^[A-Z0-9]{5,15}$/i;

const passwordValidation = z.string()
  .min(8, { message: "Password must be at least 8 characters." })
  .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
  .regex(/[a-z]/, { message: "Must contain at least one lowercase letter." })
  .regex(/[0-9]/, { message: "Must contain at least one number." })
  .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character." });

export const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// Unified registration schema with all fields
export const RegisterSchema = z.object({
  // Account type selection
  role: z.enum(["exporter", "buyer"], { 
    required_error: "Please select an account type." 
  }),
  
  // Partner type (for buyers only)
  partnerType: z.string().optional(),
  
  // Personal info (common)
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  phoneNumber: z.string().optional(),
  
  // Account credentials
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: passwordValidation,
  confirmPassword: z.string(),
  
  // Business information (for exporters)
  businessName: z.string().optional(),
  dateOfIncorporation: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  productServices: z.array(z.string()).optional(),
  legalStructure: z.string().optional(),
  fullAddress: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  
  // Primary contact (for exporters)
  primaryContactFirstName: z.string().optional(),
  primaryContactLastName: z.string().optional(),
  primaryContactEmail: z.string().email({ message: "Valid email is required." }).optional().or(z.literal("")),
  primaryContactPhone: z.string().optional(),
  companyEmail: z.string().email({ message: "Valid company email is required." }).optional().or(z.literal("")),
  companyPhone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
}).refine(data => {
  // If role is buyer/partner, partnerType is required
  if (data.role === 'buyer') {
    if (!data.partnerType || data.partnerType.length === 0) {
      return false;
    }
    // If "Other" is selected without custom text, it's invalid
    if (data.partnerType === 'Other') {
      return false;
    }
    return true;
  }
  return true;
}, {
  message: "Please select or specify your partner type.",
  path: ["partnerType"],
}).refine(data => {
  // If role is exporter, business fields are required
  if (data.role === 'exporter') {
    return !!data.businessName && !!data.businessRegistrationNumber && 
           !!data.sector && !!data.fullAddress && !!data.county && !!data.city;
  }
  return true;
}, {
  message: "Please fill in all required business information.",
  path: ["businessName"],
}).refine(data => {
  // If role is exporter, primary contact fields are required
  if (data.role === 'exporter') {
    return !!data.primaryContactFirstName && !!data.primaryContactLastName && 
           !!data.primaryContactEmail && !!data.primaryContactPhone;
  }
  return true;
}, {
  message: "Please fill in all required contact information.",
  path: ["primaryContactFirstName"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export const VerifyOTPSchema = z.object({
  otp: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export const ResetPasswordSchema = z.object({
  password: passwordValidation,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

// Export type
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
