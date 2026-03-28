'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface OtpVerificationProps {
  email: string;
  method: 'EMAIL' | 'SMS' | 'TOTP';
  phoneNumber?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function OtpVerification({ email, method, phoneNumber, onSuccess, onBack }: OtpVerificationProps) {
  const { verifyOtp, requestOtp, isLoading } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fallbackMsg, setFallbackMsg] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      return;
    }

    setIsVerifying(true);
    
    try {
      await verifyOtp(email, otpCode, method);
      // Keep showing loading state while redirecting
      onSuccess();
    } catch {
      // Error is handled by the auth context
      setOtpCode('');
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (method === 'TOTP') return;
    try {
      await requestOtp(email, method, phoneNumber);
      setCountdown(60);
      setCanResend(false);
      setFallbackMsg('');
    } catch {
      // Error is handled by the auth context
    }
  };

  const handleFallback = async () => {
    try {
      const res = await fetch('/api/auth/otp-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'LOGIN' }),
      });
      const data = await res.json();
      if (data.code) {
        setOtpCode(data.code);
        setFallbackMsg('Code retrieved — click Verify Code to continue.');
      } else {
        setFallbackMsg(data.error || 'No valid code found. Please resend.');
      }
    } catch {
      setFallbackMsg('Could not retrieve code. Please resend.');
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
  };

  const getMethodTitle = () => {
    switch (method) {
      case 'SMS':
        return 'Verify Your Phone';
      case 'TOTP':
        return 'Enter Authenticator Code';
      default:
        return 'Verify Your Email';
    }
  };

  const getMethodDescription = () => {
    switch (method) {
      case 'SMS':
        return `We've sent a 6-digit verification code to your phone number`;
      case 'TOTP':
        return `Enter the 6-digit code from your authenticator app`;
      default:
        return `We've sent a 6-digit verification code to your email`;
    }
  };

  const getContactInfo = () => {
    switch (method) {
      case 'SMS':
        return phoneNumber ? `ending in ${phoneNumber.slice(-4)}` : '';
      case 'TOTP':
        return '';
      default:
        return email;
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center pb-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <Logo className="h-14 w-auto mx-auto" />
          </Link>
        </div>
        
        <CardTitle className="text-3xl font-bold text-gray-900">
          {getMethodTitle()}
        </CardTitle>
        <CardDescription className="text-lg text-gray-600 mt-2">
          {getMethodDescription()}
          {getContactInfo() && (
            <>
              <br />
              <strong className="text-gray-900">{getContactInfo()}</strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              Enter verification code
            </label>
            <Input
              type="text"
              value={otpCode}
              onChange={handleOtpChange}
              placeholder="000000"
              className="h-12 text-center text-2xl tracking-widest font-mono border-gray-300 focus:border-primary focus:ring-primary"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              {method === 'TOTP' 
                ? 'Enter the code from your authenticator app'
                : 'Enter the 6-digit code sent to you'
              }
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-medium text-lg"
            disabled={isLoading || isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying & Logging In...
              </>
            ) : isLoading ? (
              'Verifying...'
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            {method === 'TOTP' ? "Can't access your authenticator app?" : "Didn't receive the code?"}
          </p>
          
          {method !== 'TOTP' && (
            canResend ? (
              <Button
                variant="outline"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend Code
              </Button>
            ) : (
              <p className="text-sm text-gray-500">
                Resend available in {countdown}s
              </p>
            )
          )}

          {method === 'EMAIL' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleFallback}
                className="text-xs text-gray-400 underline hover:text-gray-600"
              >
                Email not arriving? Click here
              </button>
              {fallbackMsg && (
                <p className="text-xs mt-1 text-green-600">{fallbackMsg}</p>
              )}
            </div>
          )}
          
          {method === 'TOTP' && (
            <p className="text-sm text-gray-500">
              Use one of your backup codes if you can&apos;t access your authenticator app
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full h-12 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          disabled={isLoading || isVerifying}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}