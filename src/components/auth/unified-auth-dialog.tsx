'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input, PasswordInput } from '@/components/ui/input';
import { LoginSchema } from '@/lib/schemas';
import { useAuth } from '@/contexts/auth-context';
import { Logo } from '@/components/logo';
import { 
  Loader2, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Phone,
  Smartphone,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Type definition for login response
type LoginResult = {
  requiresOtp?: boolean;
  email?: string;
  otpMethod?: string;
  message?: string;
  phoneNumber?: string;
};

// OTP input component
function OtpInput({ 
  value, 
  onChange,
  autoFocus 
}: { 
  value: string; 
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value && e.currentTarget.previousElementSibling) {
      (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
    }
  };

  // Create 6 separate input boxes
  const digits = value.padEnd(6, '').split('');

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={index === 0 ? inputRef : null}
          type="text"
          inputMode="numeric"
          maxLength={index < 5 ? 1 : 1}
          value={digit}
          onChange={(e) => {
            const newVal = e.target.value.replace(/\D/g, '');
            if (newVal) {
              const nextValue = value.slice(0, index) + newVal + value.slice(index + 1);
              onChange(nextValue.slice(0, 6));
              // Focus next input
              const inputs = document.querySelectorAll<HTMLInputElement>('.otp-digit');
              if (inputs[index + 1]) {
                inputs[index + 1].focus();
              }
            }
          }}
          onKeyDown={handleKeyDown}
          className="otp-digit w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          autoFocus={index === 0 && autoFocus}
        />
      ))}
    </div>
  );
}

interface UnifiedAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: 'BUYER' | 'EXPORTER';
}

export function UnifiedAuthDialog({ 
  open, 
  onOpenChange,
  defaultRole = 'BUYER' 
}: UnifiedAuthDialogProps) {
  const router = useRouter();
  const { login, verifyOtp, requestOtp, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  
  // Auth step: 'credentials' | 'otp' | 'loading'
  const [authStep, setAuthStep] = useState<'credentials' | 'otp' | 'loading'>('credentials');
  const [otpMethod, setOtpMethod] = useState<'EMAIL' | 'SMS' | 'TOTP'>('EMAIL');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhoneNumber, setOtpPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAuthStep('credentials');
      setOtpCode('');
      setCountdown(0);
      form.reset();
    }
  }, [open, form]);

  // Handle successful auth
  useEffect(() => {
    if (user && authStep === 'loading') {
      // Redirect based on user role
      if (user.role === 'BUYER') {
        router.push('/directory');
      } else {
        router.push('/dashboard');
      }
      onOpenChange(false);
    }
  }, [user, authStep, router, onOpenChange]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleLogin = async (values: z.infer<typeof LoginSchema>) => {
    try {
      const result = await login(values.email, values.password, undefined, otpMethod) as LoginResult;
      
      if (result.requiresOtp) {
        setOtpEmail(result.email || values.email);
        setOtpPhoneNumber(result.phoneNumber || '');
        setOtpMethod(result.otpMethod as 'EMAIL' | 'SMS' | 'TOTP' || 'EMAIL');
        
        // Auto-send OTP for non-TOTP methods
        if (result.otpMethod !== 'TOTP') {
          try {
            await fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: result.email,
                phoneNumber: result.phoneNumber,
                method: result.otpMethod || 'EMAIL',
                type: 'LOGIN'
              })
            });
            setCountdown(60);
          } catch (error) {
            // OTP sending failed - user can request resend
          }
        }
        
        setAuthStep('otp');
      } else {
        // No OTP required - should redirect automatically
        setAuthStep('loading');
      }
    } catch (error) {
      // Error handled by auth context
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit code',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await verifyOtp(otpEmail, otpCode, otpMethod);
      setAuthStep('loading');
    } catch (error) {
      // Error handled by auth context
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || otpMethod === 'TOTP') return;
    
    setIsResending(true);
    try {
      await requestOtp(otpEmail, otpMethod, otpPhoneNumber || undefined);
      setCountdown(60);
      toast({
        title: 'Code Sent',
        description: 'A new verification code has been sent',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend',
        description: 'Please try again later',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToCredentials = () => {
    setAuthStep('credentials');
    setOtpCode('');
  };

  // Loading state
  if (authStep === 'loading' || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-gray-900 font-semibold text-lg">
          {isVerifying ? 'Verifying...' : 'Authenticating...'}
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Please wait while we complete the authentication
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Logo */}
      <div className="text-center mb-6">
        <div className="inline-block mb-4">
          <Logo className="h-10 w-auto mx-auto" priority={true} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {authStep === 'credentials' ? 'Welcome Back' : 'Verify Your Account'}
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          {authStep === 'credentials' 
            ? 'Sign in to your account' 
            : `Enter the verification code sent to ${otpMethod === 'EMAIL' ? otpEmail : otpPhoneNumber}`
          }
        </p>
      </div>

      {authStep === 'credentials' ? (
        // Credentials Form
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="Enter your email"
                        className="pl-10 h-12"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <PasswordInput 
                        {...field} 
                        placeholder="Enter your password"
                        className="pl-10 h-12"
                        autoComplete="current-password"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </a>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Form>
      ) : (
        // OTP Verification
        <div className="space-y-6">
          {/* OTP Method Indicator */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            {otpMethod === 'EMAIL' && (
              <>
                <Mail className="h-5 w-5" />
                <span>Email verification</span>
              </>
            )}
            {otpMethod === 'SMS' && (
              <>
                <Smartphone className="h-5 w-5" />
                <span>SMS verification</span>
              </>
            )}
            {otpMethod === 'TOTP' && (
              <>
                <Shield className="h-5 w-5" />
                <span>Authenticator app</span>
              </>
            )}
          </div>

          {/* OTP Input */}
          <div className="py-2">
            <OtpInput 
              value={otpCode} 
              onChange={setOtpCode}
              autoFocus
            />
          </div>

          {/* Verify Button */}
          <Button 
            onClick={handleVerifyOtp}
            disabled={otpCode.length !== 6 || isVerifying}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            {otpMethod === 'TOTP' ? (
              <p className="text-sm text-gray-600">
                Can't access your authenticator app?
              </p>
            ) : countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in <span className="font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend verification code'}
              </button>
            )}
          </div>

          {/* Back to Login */}
          <button
            onClick={handleBackToCredentials}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </button>
        </div>
      )}
    </div>
  );
}
