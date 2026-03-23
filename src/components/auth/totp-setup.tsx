'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface TotpSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TotpSetup({ onComplete, onCancel }: TotpSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetupTotp = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.setupTotp();
      setQrCodeUrl(response.qrCodeUrl);
      setSecret(response.secret);
      setBackupCodes(response.backupCodes);
      setStep('verify');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: error.message || 'Failed to setup authenticator app.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code.',
      });
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.enableTotp(verificationCode);
      toast({
        title: 'Authenticator Enabled',
        description: 'Your authenticator app has been successfully configured.',
      });
      onComplete();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Secret key copied to clipboard.',
      });
    } catch (error) {
      // Fallback for older browsers or if clipboard access is denied

      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy to clipboard. Please copy manually.',
      });
    }
  };

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Setup Authenticator App</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with two-factor authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Step 1: Install an Authenticator App</h3>
            <p className="text-sm text-gray-600">
              Download and install one of these authenticator apps on your mobile device:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg text-center">
                <div className="font-medium">Google Authenticator</div>
                <div className="text-xs text-gray-500">iOS & Android</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="font-medium">Authy</div>
                <div className="text-xs text-gray-500">iOS & Android</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Step 2: Generate QR Code</h3>
            <p className="text-sm text-gray-600">
              Click the button below to generate a QR code that you'll scan with your authenticator app.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetupTotp}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Scan QR Code</CardTitle>
        <CardDescription>
          Use your authenticator app to scan the QR code below
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            {qrCodeUrl && (
              <div className="p-4 bg-white border rounded-lg">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code for TOTP setup"
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Can't scan the QR code?</p>
            <p className="text-xs text-gray-600">
              Manually enter this secret key in your authenticator app:
            </p>
            <div className="flex space-x-2">
              <Input
                value={secret}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(secret)}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Enter Verification Code</h3>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app to complete setup:
          </p>
          <Input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            maxLength={6}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Backup Codes</h3>
          <p className="text-sm text-gray-600">
            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator app:
          </p>
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm text-center p-1 bg-white rounded">
                {code}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(backupCodes.join('\n'))}
            className="w-full"
          >
            Copy All Backup Codes
          </Button>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerifyTotp}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Complete Setup'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}