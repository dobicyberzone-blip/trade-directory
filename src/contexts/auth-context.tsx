'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { hasValidToken, clearAuthData, setUserData, getUserData } from '@/lib/auth-utils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, otpCode?: string, otpMethod?: 'EMAIL' | 'SMS' | 'TOTP') => Promise<{ requiresOtp?: boolean; email?: string; otpMethod?: string; message?: string; phoneNumber?: string }>;
  verifyOtp: (email: string, otpCode: string, method?: 'EMAIL' | 'SMS' | 'TOTP') => Promise<void>;
  requestOtp: (email: string, method?: 'EMAIL' | 'SMS', phoneNumber?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: 'ADMIN' | 'EXPORTER' | 'BUYER';
  businessName?: string;
  businessLocation?: string;
  productCategory?: string;
  industry?: string;
  partnerType?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    if (isMounted) {
      checkAuthStatus();
    }
  }, [isMounted]);

  const checkAuthStatus = async () => {
      try {
        // First check if we have a valid token format
        if (!hasValidToken()) {
          setIsLoading(false);
          return;
        }

        // Try to restore user from localStorage first for faster initial load
        const cachedUser = getUserData() as User | null;
        if (cachedUser) {
          setUser(cachedUser);
          setIsLoading(false); // Set loading false immediately when we have cached user
        }

        // Then validate with API in background (don't block UI)
        // Skip API validation if we have a cached user - trust the token until it actually fails
        if (cachedUser) {
          // Optionally refresh user data in background without blocking
          apiClient.getCurrentUser()
            .then(response => {
              if (response) {
                setUser(response.user);
                setUserData(response.user);
              }
            })
            .catch(error => {
              // Silently fail - keep cached user unless it's a clear token error
              const errorMsg = error instanceof Error ? error.message : '';
              const isTokenError = errorMsg.includes('session has expired') || 
                                  errorMsg.includes('Invalid token') ||
                                  errorMsg.includes('Token expired') ||
                                  errorMsg.includes('invalid signature') ||
                                  errorMsg.includes('jwt expired');

              if (isTokenError) {
                clearAuthData();
                setUser(null);
              }
            });
          return;
        }

        // No cached user - try to fetch from API
        try {
          const response = await apiClient.getCurrentUser();

          // Handle null response (e.g., 404 when endpoint not configured)
          if (!response) {
            clearAuthData();
            setUser(null);
            return;
          }

          // Update user data in state and localStorage
          setUser(response.user);
          setUserData(response.user);
        } catch (apiError) {
          const errorMsg = apiError instanceof Error ? apiError.message : '';

          // Only clear session if it's explicitly a token/session error
          const isTokenError = errorMsg.includes('session has expired') || 
                              errorMsg.includes('Invalid token') ||
                              errorMsg.includes('Token expired') ||
                              errorMsg.includes('invalid signature') ||
                              errorMsg.includes('jwt expired');

          if (isTokenError) {
            clearAuthData();
            setUser(null);
          }
        }
      } catch (error) {
        // If we have a cached user, keep them logged in despite errors
        const cachedUser = getUserData() as User | null;
        if (cachedUser) {
          setUser(cachedUser);
        } else {
          // Clear invalid token and user state only if no cached user
          clearAuthData();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

  const login = async (email: string, password: string, otpCode?: string, otpMethod?: 'EMAIL' | 'SMS' | 'TOTP') => {
    try {
      const response = await apiClient.login(email, password, otpCode, otpMethod);
      
      if ('requiresOtp' in response) {
        toast({
          title: 'OTP Required',
          description: `Please check your ${response.otpMethod?.toLowerCase() || 'email'} for the verification code.`,
        });
        return { requiresOtp: true, email: response.email, otpMethod: response.otpMethod, message: response.message, phoneNumber: response.phoneNumber };
      } else {
        // Set user immediately for faster UI response and persist to localStorage
        setUser(response.user);
        setUserData(response.user);
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${response.user.firstName}!`,
        });
        return {};
      }
    } catch (error: unknown) {
      // Provide user-friendly error messages
      // NOTE: Do NOT clear existing auth data here - this is a login attempt failure,
      // not an indication that existing session is invalid
      let errorMessage = 'Incorrect credentials. Please try again.';
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('Cannot connect to API server') || errorMsg.includes('Cannot connect to the server')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (errorMsg.includes('Invalid credentials') || errorMsg.includes('Incorrect email or password')) {
        errorMessage = 'Incorrect email or password. Please check your credentials.';
      } else if (errorMsg.includes('HTTP 401') || errorMsg.includes('session has expired')) {
        errorMessage = 'Incorrect email or password. Please check your credentials.';
      } else if (errorMsg.includes('HTTP 429') || errorMsg.includes('Too many')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
      throw error;
    }
  };

  const verifyOtp = async (email: string, otpCode: string, method?: 'EMAIL' | 'SMS' | 'TOTP'): Promise<void> => {
    try {
      const response = await apiClient.verifyOtp(email, otpCode, method);

      // Set user immediately for faster UI response and persist to localStorage
      setUser(response.user);
      setUserData(response.user);
      
      // Refresh user data to ensure we have the latest emailVerified status
      await refreshUser();
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${response.user.firstName}!`,
      });
    } catch (error: unknown) {

      const errorMsg = error instanceof Error ? error.message : 'Invalid OTP code. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: errorMsg,
      });
      throw error;
    }
  };

  const requestOtp = async (email: string, method: 'EMAIL' | 'SMS' = 'EMAIL', phoneNumber?: string) => {
    try {
      await apiClient.requestOtp(email, method, phoneNumber);
      toast({
        title: 'OTP Sent',
        description: `Please check your ${method.toLowerCase()} for the verification code.`,
      });
    } catch (error: unknown) {

      const errorMsg = error instanceof Error ? error.message : 'Could not send OTP. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Failed to Send OTP',
        description: errorMsg,
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.register(data);
      // Do NOT set user or log them in automatically
      // User must verify email via OTP on login page
      
      toast({
        title: 'Registration Successful',
        description: `Account created successfully! Please login with your email to verify and access your dashboard.`,
      });
    } catch (error: unknown) {

      const errorMsg = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: errorMsg,
      });
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const refreshUser = async () => {
    try {

      const response = await apiClient.getCurrentUser();
      
      // Handle null response (e.g., 404 when endpoint not configured)
      if (!response) {

        return;
      }

      setUser(response.user);
      setUserData(response.user);
    } catch (error) {

      // Check if it's specifically a token error
      const errorMsg = error instanceof Error ? error.message : '';
      const isTokenError = errorMsg.includes('session has expired') || 
                          errorMsg.includes('Invalid token') ||
                          errorMsg.includes('Token expired') ||
                          errorMsg.includes('invalid signature');
      
      // Only logout on actual token errors, not on permission or network errors
      if (isTokenError) {

        logout();
      } else {
        // For network errors, permission issues, or other problems, keep user logged in

        const cachedUser = getUserData();
        if (cachedUser && !user) {
          setUser(cachedUser as User);
        }
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await apiClient.forgotPassword(email);
      toast({
        title: 'Reset Link Sent',
        description: 'Please check your email for password reset instructions.',
      });
    } catch (error: unknown) {

      const errorMsg = error instanceof Error ? error.message : 'Could not send password reset email. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Failed to Send Reset Link',
        description: errorMsg,
      });
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await apiClient.resetPassword(token, newPassword);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been updated. Please log in with your new password.',
      });
    } catch (error: unknown) {

      const errorMsg = error instanceof Error ? error.message : 'Could not reset password. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Password Reset Failed',
        description: errorMsg,
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    verifyOtp,
    requestOtp,
    register,
    forgotPassword,
    resetPassword,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}