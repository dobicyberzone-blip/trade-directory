"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, PasswordInput } from "@/components/ui/input";
import { LoginSchema } from "@/lib/schemas";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { OtpVerification } from "@/components/auth/otp-verification";
import { UnifiedAuthDialog } from "@/components/auth/unified-auth-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Type definition for login response
type LoginResult = {
  requiresOtp?: boolean;
  email?: string;
  otpMethod?: string;
  message?: string;
  phoneNumber?: string;
};

// Google Privacy Policy Modal Content
function GooglePrivacyPolicyContent() {
  return (
    <ScrollArea className="h-96 w-full rounded-md border p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Google Privacy Policy</h3>
        
        <div className="space-y-3 text-sm">
          <section>
            <h4 className="font-medium">Information Google Collects</h4>
            <p className="text-gray-600">
              Google collects information to provide better services to all users. This includes information you give 
              Google, information from your use of Google services, and information from third-party sites that use Google services.
            </p>
          </section>

          <section>
            <h4 className="font-medium">How Google Uses Information</h4>
            <p className="text-gray-600">
              Google uses the information collected from all services to provide, maintain, protect and improve services, 
              develop new ones, and protect Google and users. Google also uses this information to offer tailored content.
            </p>
          </section>

          <section>
            <h4 className="font-medium">reCAPTCHA Service</h4>
            <p className="text-gray-600">
              This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply. 
              reCAPTCHA uses advanced risk analysis techniques to tell humans and bots apart.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Information Sharing</h4>
            <p className="text-gray-600">
              Google does not share personal information with companies, organizations and individuals outside of Google 
              unless one of the following circumstances applies: with user consent, for external processing, or for legal reasons.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Data Security</h4>
            <p className="text-gray-600">
              Google works hard to protect users from unauthorized access to or unauthorized alteration, disclosure or 
              destruction of information Google holds. Google encrypts services using SSL and reviews information collection practices.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Your Choices</h4>
            <p className="text-gray-600">
              You have choices regarding the information Google collects and how it&apos;s used. You can use Google&apos;s privacy 
              controls to review and adjust information associated with your Google Account.
            </p>
          </section>

          <section>
            <h4 className="font-medium">More Information</h4>
            <p className="text-gray-600">
              For more detailed information about Google&apos;s privacy practices, please visit{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                https://policies.google.com/privacy
              </a>
            </p>
          </section>
        </div>
      </div>
    </ScrollArea>
  );
}

// Google Terms of Service Modal Content
function GoogleTermsContent() {
  return (
    <ScrollArea className="h-96 w-full rounded-md border p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Google Terms of Service</h3>
        
        <div className="space-y-3 text-sm">
          <section>
            <h4 className="font-medium">Using Google Services</h4>
            <p className="text-gray-600">
              You must follow any policies made available to you within the Services. Don&apos;t misuse Google Services. 
              For example, don&apos;t interfere with Google Services or try to access them using a method other than the interface provided by Google.
            </p>
          </section>

          <section>
            <h4 className="font-medium">reCAPTCHA Terms</h4>
            <p className="text-gray-600">
              Your use of reCAPTCHA is subject to the Privacy Policy and Terms of Service. reCAPTCHA is a free service 
              that protects websites from spam and abuse by using advanced risk analysis techniques.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Your Google Account</h4>
            <p className="text-gray-600">
              You may need a Google Account in order to use some Google Services. You may use your Google Account to access 
              services offered by other companies, but those companies have their own terms and privacy policies.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Privacy and Copyright Protection</h4>
            <p className="text-gray-600">
              Google&apos;s privacy policies explain how Google treats your personal data and protects your privacy when you use Google Services. 
              Google responds to notices of alleged copyright infringement and terminates accounts of repeat infringers.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Your Content in Google Services</h4>
            <p className="text-gray-600">
              Some Google Services allow you to upload, submit, store, send or receive content. You retain ownership of any 
              intellectual property rights that you hold in that content.
            </p>
          </section>

          <section>
            <h4 className="font-medium">Software in Google Services</h4>
            <p className="text-gray-600">
              When a Service requires or includes downloadable software, this software may update automatically on your device 
              once a new version or feature is available.
            </p>
          </section>

          <section>
            <h4 className="font-medium">More Information</h4>
            <p className="text-gray-600">
              For complete Google Terms of Service, please visit{" "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                https://policies.google.com/terms
              </a>
            </p>
          </section>
        </div>
      </div>
    </ScrollArea>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMethod, setOtpMethod] = useState<'EMAIL' | 'SMS' | 'TOTP'>('EMAIL');
  const [otpPhoneNumber, setOtpPhoneNumber] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'EMAIL' | 'SMS' | 'TOTP'>('EMAIL');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    mode: 'onSubmit', // Only validate on submit, not on change
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated - with role-based destination
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role.toLowerCase();
      if (role === 'buyer' || role === 'partner') {
        router.push('/directory');
      } else if (role === 'exporter') {
        router.push('/dashboard/exporter');
      } else if (role === 'admin' || role === 'super_admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    try {
      const result = await login(values.email, values.password, undefined, selectedMethod);
      
      if ('requiresOtp' in result && result.requiresOtp) {
        setOtpEmail(result.email!);
        setOtpMethod(selectedMethod); // Use the method the user selected
        setOtpPhoneNumber((result as LoginResult).phoneNumber || '');
        
        // Automatically send OTP if not TOTP
        if (selectedMethod !== 'TOTP') {
          try {
            const response = await fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: result.email,
                phoneNumber: (result as LoginResult).phoneNumber,
                method: selectedMethod,
                type: 'LOGIN'
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to send OTP');
            }
          } catch (error) {
            // OTP sending failed - user can request resend
          }
        }
        
        setShowOtpVerification(true);
      } else {
        // Redirect is handled by the useEffect that watches isAuthenticated + user
        // No inline redirect needed — avoids race condition with stale user state
      }
    } catch (error) {
      // Error is already handled by the auth context with a toast message
      // No need to log here
    }
  }

  const handleOtpSuccess = () => {
    // Show loading state — redirect is handled by the useEffect that watches isAuthenticated + user
    // No inline redirect needed — avoids race condition with stale user state
    setIsVerifyingOtp(true);
  };

  const handleBackToLogin = () => {
    setShowOtpVerification(false);
    setOtpEmail('');
    setOtpMethod('EMAIL');
    setOtpPhoneNumber('');
  };

  // Show loading while checking auth status or verifying OTP
  if (isLoading || isVerifyingOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-900 font-semibold text-lg">
            {isVerifyingOtp ? 'Logging you in...' : 'Loading...'}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            {isVerifyingOtp ? 'Please wait while we set up your dashboard' : 'Checking authentication status'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
       <Header/>
      {/* Add padding-top to account for fixed header (h-28 = 112px) */}
      <div className="flex-1 flex items-center justify-center pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          {showOtpVerification ? (
            <div className="w-full">
              <OtpVerification
                email={otpEmail}
                method={otpMethod}
                phoneNumber={otpPhoneNumber}
                onSuccess={handleOtpSuccess}
                onBack={handleBackToLogin}
              />
            </div>
          ) : (
            <div className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
              {/* Logo */}
              <div className="text-center mb-4">
                <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                  <Logo className="h-12 w-auto mx-auto" priority={true} />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Login</h2>
                <p className="text-gray-600 text-sm">Access your Business Trade Directory Portal</p>
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium text-sm">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="you@company.com" 
                            {...field} 
                            className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                          />
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
                        <FormLabel className="text-gray-900 font-medium text-sm">
                          Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput 
                            placeholder="••••••••" 
                            {...field} 
                            className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Forgot Password Link */}
                  <div className="text-right -mt-1">
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  {/* OTP Method Selection */}
                  <div className="space-y-3 pt-2">
                    <label className="text-gray-900 font-medium text-sm block">
                      Send Login Token Via
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedMethod('SMS')}
                        className={`h-11 transition-all rounded-lg font-medium ${
                          selectedMethod === 'SMS'
                            ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700'
                        }`}
                      >
                        SMS
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedMethod('EMAIL')}
                        className={`h-11 transition-all rounded-lg font-medium ${
                          selectedMethod === 'EMAIL'
                            ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700'
                        }`}
                      >
                        Email
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedMethod('TOTP')}
                        className={`h-11 transition-all rounded-lg font-medium ${
                          selectedMethod === 'TOTP'
                            ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700'
                        }`}
                      >
                        App
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      {selectedMethod === 'SMS' && 'Receive code via text message'}
                      {selectedMethod === 'EMAIL' && 'Receive code via email'}
                      {selectedMethod === 'TOTP' && 'Use authenticator app (Google Authenticator, Authy, etc.)'}
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all mt-6"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {selectedMethod === 'TOTP' ? 'Verifying...' : 'Sending Token...'}
                      </>
                    ) : (
                      selectedMethod === 'TOTP' ? 'Continue with Authenticator' : `Send ${selectedMethod} Token`
                    )}
                  </Button>
                </form>
              </Form>

              {/* Footer */}
              <div className="text-center space-y-4 mt-8">
                <p className="text-gray-600 text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-green-600 hover:text-green-700 hover:underline font-semibold transition-colors">
                    Create account
                  </Link>
                </p>
                
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                  <p className="leading-relaxed">
                    Protected by reCAPTCHA. Google{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-green-600 hover:text-green-700 underline transition-colors">
                          Privacy Policy
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Google Privacy Policy</DialogTitle>
                        </DialogHeader>
                        <GooglePrivacyPolicyContent />
                      </DialogContent>
                    </Dialog>{" "}
                    and{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-green-600 hover:text-green-700 underline transition-colors">
                          Terms
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Google Terms of Service</DialogTitle>
                        </DialogHeader>
                        <GoogleTermsContent />
                      </DialogContent>
                    </Dialog>{" "}
                    apply.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
