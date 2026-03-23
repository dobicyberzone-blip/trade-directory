'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { TotpSetup } from '@/components/auth/totp-setup';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  totpEnabled: boolean;
  preferredOtpMethod: 'EMAIL' | 'SMS' | 'TOTP';
}

export default function SecuritySettingsPage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isUpdatingMethod, setIsUpdatingMethod] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [isDisablingTotp, setIsDisablingTotp] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser(authUser as User);
      setPhoneNumber(authUser.phoneNumber || '');
    }
  }, [authUser]);

  const handleUpdatePhone = async () => {
    if (!phoneNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number.',
      });
      return;
    }

    try {
      setIsUpdatingPhone(true);
      const response = await apiClient.updatePhoneNumber(phoneNumber);
      
      setUser(prev => prev ? {
        ...prev,
        phoneNumber: response.phoneNumber,
        phoneVerified: false
      } : null);

      toast({
        title: 'Phone Number Updated',
        description: 'Your phone number has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update phone number.',
      });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleUpdateOtpMethod = async (method: 'EMAIL' | 'SMS' | 'TOTP') => {
    if (method === 'SMS' && !user?.phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Phone Number Required',
        description: 'Please add a phone number before selecting SMS as your OTP method.',
      });
      return;
    }

    if (method === 'TOTP' && !user?.totpEnabled) {
      toast({
        variant: 'destructive',
        title: 'Authenticator App Required',
        description: 'Please set up an authenticator app before selecting TOTP as your OTP method.',
      });
      return;
    }

    try {
      setIsUpdatingMethod(true);
      await apiClient.updateOtpMethod(method);
      
      setUser(prev => prev ? {
        ...prev,
        preferredOtpMethod: method
      } : null);

      toast({
        title: 'OTP Method Updated',
        description: `Your preferred OTP method has been set to ${method.toLowerCase()}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update OTP method.',
      });
    } finally {
      setIsUpdatingMethod(false);
    }
  };

  const handleTotpSetupComplete = () => {
    setShowTotpSetup(false);
    setUser(prev => prev ? {
      ...prev,
      totpEnabled: true
    } : null);
    
    toast({
      title: 'Authenticator App Enabled',
      description: 'Your authenticator app has been successfully configured.',
    });
  };

  const handleDisableTotp = async () => {
    try {
      setIsDisablingTotp(true);
      await apiClient.disableTotp();
      
      setUser(prev => prev ? {
        ...prev,
        totpEnabled: false,
        preferredOtpMethod: 'EMAIL'
      } : null);

      toast({
        title: 'Authenticator App Disabled',
        description: 'Your authenticator app has been disabled. Your OTP method has been reset to email.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Disable Failed',
        description: error.message || 'Failed to disable authenticator app.',
      });
    } finally {
      setIsDisablingTotp(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (showTotpSetup) {
    return (
      <div className="container max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Security Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Set up your authenticator app</p>
        </div>
        
        <TotpSetup
          onComplete={handleTotpSetupComplete}
          onCancel={() => setShowTotpSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Security Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your account security and two-factor authentication</p>
      </div>

      {/* Phone Number Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Phone Number</span>
          </CardTitle>
          <CardDescription>
            Add or update your phone number for SMS-based two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex space-x-3">
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254712345678"
                className="flex-1"
              />
              <Button
                onClick={handleUpdatePhone}
                disabled={isUpdatingPhone || phoneNumber === user.phoneNumber}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUpdatingPhone ? 'Updating...' : 'Update'}
              </Button>
            </div>
            {user.phoneNumber && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Current: {user.phoneNumber} 
                {user.phoneVerified ? (
                  <span className="text-green-600 ml-2">✓ Verified</span>
                ) : (
                  <span className="text-orange-600 ml-2">⚠ Not verified</span>
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TOTP Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Authenticator App</span>
          </CardTitle>
          <CardDescription>
            Use an authenticator app like Google Authenticator or Authy for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.totpEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Authenticator App Enabled</p>
                    <p className="text-sm text-green-600">Your account is protected with TOTP</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisableTotp}
                  disabled={isDisablingTotp}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {isDisablingTotp ? 'Disabling...' : 'Disable'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Authenticator apps provide an extra layer of security by generating time-based codes.
                </p>
                <Button
                  onClick={() => setShowTotpSetup(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Set Up Authenticator App
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OTP Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Preferred Login Method</span>
          </CardTitle>
          <CardDescription>
            Choose how you want to receive verification codes when logging in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={user.preferredOtpMethod}
            onValueChange={(value) => handleUpdateOtpMethod(value as 'EMAIL' | 'SMS' | 'TOTP')}
            disabled={isUpdatingMethod}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:bg-gray-800">
              <RadioGroupItem value="EMAIL" id="email-method" />
              <Label htmlFor="email-method" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Receive codes via email</p>
                  </div>
                  <div className="text-2xl">📧</div>
                </div>
              </Label>
            </div>

            <div className={cn(
              "flex items-center space-x-3 p-3 border rounded-lg",
              user.phoneNumber ? "hover:bg-gray-50 dark:bg-gray-800" : "opacity-50 cursor-not-allowed"
            )}>
              <RadioGroupItem 
                value="SMS" 
                id="sms-method" 
                disabled={!user.phoneNumber}
              />
              <Label 
                htmlFor="sms-method" 
                className={cn("flex-1", user.phoneNumber ? "cursor-pointer" : "cursor-not-allowed")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {user.phoneNumber ? 'Receive codes via text message' : 'Phone number required'}
                    </p>
                  </div>
                  <div className="text-2xl">📱</div>
                </div>
              </Label>
            </div>

            <div className={cn(
              "flex items-center space-x-3 p-3 border rounded-lg",
              user.totpEnabled ? "hover:bg-gray-50 dark:bg-gray-800" : "opacity-50 cursor-not-allowed"
            )}>
              <RadioGroupItem 
                value="TOTP" 
                id="totp-method" 
                disabled={!user.totpEnabled}
              />
              <Label 
                htmlFor="totp-method" 
                className={cn("flex-1", user.totpEnabled ? "cursor-pointer" : "cursor-not-allowed")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {user.totpEnabled ? 'Use your authenticator app' : 'Authenticator app setup required'}
                    </p>
                  </div>
                  <div className="text-2xl">🔐</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {isUpdatingMethod && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Updating preferred method...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Security Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use an authenticator app for the highest level of security</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Keep your phone number up to date for SMS verification</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Save your backup codes in a secure location</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Never share your verification codes with anyone</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
