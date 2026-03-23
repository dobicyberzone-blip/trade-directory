"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { z as zod } from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Schema for password reset form
const ResetPasswordSchema = zod.object({
  password: zod.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character." }),
  confirmPassword: zod.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired.",
      });
      return;
    }

    try {
      await resetPassword(token, values.password);
      setResetSuccess(true);
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <Button className="bg-gray-800 hover:bg-gray-900">
              Request New Reset Link
            </Button>
          </Link>
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

          {resetSuccess ? (
            <div className="bg-white py-8 px-6 shadow-lg rounded-lg border space-y-6">
              {/* Logo */}
              <div className="text-center">
                <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                  <Logo className="h-12 w-auto mx-auto" />
                </Link>
              </div>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Password Reset Complete!</h2>
                  <p className="text-gray-600">Your password has been successfully updated.</p>
                </div>

                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium text-lg"
                >
                  Continue to Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white py-8 px-6 shadow-lg rounded-lg border">
              {/* Logo */}
              <div className="text-center mb-6">
                <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                  <Logo className="h-12 w-auto mx-auto" />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                <p className="text-gray-600">Enter your new password below</p>
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">New Password</FormLabel>
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
                        <FormLabel className="text-gray-900 font-medium">Confirm New Password</FormLabel>
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

                  {/* Password Requirements */}
                  <div className="bg-gray-50 border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• At least 8 characters</li>
                      <li>• One uppercase letter</li>
                      <li>• One lowercase letter</li>
                      <li>• One number</li>
                      <li>• One special character</li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium text-lg"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Footer */}
              <div className="text-center mt-6">
                <Link href="/login" className="text-green-600 hover:underline font-medium">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
