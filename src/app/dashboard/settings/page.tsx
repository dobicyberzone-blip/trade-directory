'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const settingsOptions = [
    {
      title: 'Profile Settings',
      description: 'Update your personal information, contact details, and profile picture',
      icon: <User className="h-6 w-6" />,
      href: '/dashboard/settings/profile',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Security Settings',
      description: 'Manage your password, two-factor authentication, and security preferences',
      icon: <Shield className="h-6 w-6" />,
      href: '/dashboard/settings/security',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Notifications',
      description: 'View and manage your notifications and alerts',
      icon: <Bell className="h-6 w-6" />,
      href: '/dashboard/notifications',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4 px-2 sm:px-0 max-w-full">
      {/* Quick Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {settingsOptions.map((option) => (
          <Card key={option.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${option.color}`}>
                  {option.icon}
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{option.description}</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(option.href)}
              >
                Open Settings
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}