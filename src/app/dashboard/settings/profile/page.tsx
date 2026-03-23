'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Building, Calendar, Save, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { COUNTRIES } from '@/lib/countries';
import { SearchableSelect } from '@/components/exporter/_searchable-select';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    company: '',
    position: '',
    website: '',
    linkedIn: '',
    twitter: '',
    profileImage: '',
  });

  useEffect(() => {
    if (user) {

      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || '',
        location: user.location || '',
        bio: user.bio || '',
        company: user.company || '',
        position: user.position || '',
        website: user.website || '',
        linkedIn: user.linkedIn || '',
        twitter: user.twitter || '',
        profileImage: user.profileImage || user.avatar || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      await apiClient.updateUserProfile(user.id, profile);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });

      // Refresh user data to update header and other components
      await refreshUser();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile.';

      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select an image file (PNG, JPG, JPEG, GIF).',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
      });
      return;
    }

    try {
      // Convert to base64 for immediate preview and storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        
        // Check if the base64 string is too large (> 8MB when encoded)
        if (base64String.length > 8 * 1024 * 1024) {
          toast({
            variant: 'destructive',
            title: 'Image Too Large',
            description: 'The processed image is too large. Please try a smaller image or compress it.',
          });
          return;
        }
        
        // Update profile state immediately for instant UI feedback
        setProfile(prev => ({ ...prev, profileImage: base64String }));
        
        // Show success message
        toast({
          title: 'Image Uploaded',
          description: 'Your profile image has been updated. Click "Update Profile" to save changes.',
        });
      };
      
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Failed to process the image. Please try again.',
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
      });
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;

    const roleColors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      EXPORTER: 'bg-blue-100 text-blue-800',
      BUYER: 'bg-green-100 text-green-800'
    };

    const displayLabel = user.role === 'BUYER' && (user as any).partnerType
      ? ((user as any).partnerType.startsWith('Other: ') ? (user as any).partnerType.replace('Other: ', '') : (user as any).partnerType)
      : user.role;

    return (
      <Badge className={`${roleColors[user.role as keyof typeof roleColors]} hover:${roleColors[user.role as keyof typeof roleColors]}`}>
        {displayLabel}
      </Badge>
    );
  };

  const getVerificationStatus = () => {
    if (!user) return null;

    if (user.emailVerified) {
      return <Badge className="bg-green-100 text-green-800">Email Verified</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Email Pending</Badge>;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-full">
        {/* Profile Form */}
        <Card className="w-full shadow-sm border-0 bg-white dark:bg-gray-900">
          <CardContent className="p-3 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {(() => {
                      const imageUrl = profile.profileImage || user?.profileImage || user?.avatar;

                      return imageUrl ? (
                        <Image 
                          src={imageUrl} 
                          alt="Profile" 
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          onError={(e) => {

                            // Fallback to user icon if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              const icon = parent.querySelector('.fallback-icon');
                              if (icon) {
                                (icon as HTMLElement).style.display = 'block';
                              }
                            }
                          }}
                          onLoad={() => {

                          }}
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      );
                    })()}
                    <User className="w-12 h-12 text-gray-400 fallback-icon" style={{ display: 'none' }} />
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Click the camera icon to upload a profile picture</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supported formats: PNG, JPG, JPEG, GIF (max 5MB)</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="Your first name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name *
                    </label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Your last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    <Input
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      type="email"
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed. Contact support if needed.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Phone Number
                    </label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+254 700 123 456"
                      type="tel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Country
                  </label>
                  <SearchableSelect
                    options={COUNTRIES}
                    value={profile.location}
                    onChange={(value) => handleChange('location', value)}
                    placeholder="Select your country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Professional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Building className="inline h-4 w-4 mr-2" />
                      Company/Organization
                    </label>
                    <Input
                      value={profile.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Position/Title
                    </label>
                    <Input
                      value={profile.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      placeholder="Your job title"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Social Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website
                    </label>
                    <Input
                      value={profile.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      type="url"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      LinkedIn
                    </label>
                    <Input
                      value={profile.linkedIn}
                      onChange={(e) => handleChange('linkedIn', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      type="url"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Twitter
                    </label>
                    <Input
                      value={profile.twitter}
                      onChange={(e) => handleChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/yourusername"
                      type="url"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {getRoleBadge()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Status</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {getVerificationStatus()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Member Since
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  className="px-8" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

