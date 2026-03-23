"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { ForgotPasswordSchema } from "@/lib/schemas";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ForgotPasswordPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { forgotPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ForgotPasswordSchema>) {
    try {
      // Ensure email is not undefined
      if (!values.email || values.email.trim() === '') {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address.",
        });
        return;
      }

      await forgotPassword(values.email.trim());
      setSentEmail(values.email.trim());
      setEmailSent(true);
    } catch (error) {
      // Error is handled by the auth context

    }
  }

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      {/* Add padding-top to account for fixed header (h-28 = 112px) */}
      <div className="flex-1 flex items-center justify-center pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
           {emailSent ? (
            <EmailSentSuccess 
              email={sentEmail}
              onBackToForm={() => {
                setEmailSent(false);
                setSentEmail('');
                form.reset();
              }}
            />
          ) : (
            <div className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
              {/* Logo */}
              <div className="text-center mb-6">
                <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                  <Logo className="h-14 w-auto mx-auto" />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
                <p className="text-gray-600">Enter your email and we'll send you a reset link</p>
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="you@company.com" 
                            {...field} 
                            className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium text-lg"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending Reset Link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Remembered your password?{" "}
                  <Link href="/login" className="text-green-600 hover:underline font-medium">
                    Back to Login
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Success component for when email is sent
function EmailSentSuccess({ email, onBackToForm }: { email: string; onBackToForm: () => void }) {
  return (
    <div className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100 space-y-6">
      {/* Logo */}
      <div className="text-center">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <Logo className="h-14 w-auto mx-auto" />
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Check Your Email</h2>
        <p className="text-gray-600">
          We've sent password reset instructions to
        </p>
        <p className="text-green-600 font-medium">{email}</p>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Check your email inbox (and spam folder)</li>
          <li>Click the reset link in the email</li>
          <li>Follow the instructions to create a new password</li>
          <li>Log in with your new password</li>
        </ol>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={onBackToForm}
          variant="outline"
          className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Send to Different Email
        </Button>
        
        <div className="text-center">
          <Link href="/login" className="text-green-600 hover:underline font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
