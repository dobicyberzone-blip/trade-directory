'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { User, apiClient } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityList } from '@/components/activity/activity-list';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Building, 
  Edit,
  Save,
  X,
  Shield,
  MapPin
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserDetailsDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function UserDetailsDialog({ user, isOpen, onClose, onUserUpdated }: UserDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'BUYER'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'BUYER'
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await apiClient.updateUser(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role as 'ADMIN' | 'EXPORTER' | 'BUYER',
      });

      toast({
        title: 'Success',
        description: 'User updated successfully. Role changes will take effect on next login.'
      });

      setIsEditing(false);
      onUserUpdated();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'BUYER'
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'EXPORTER':
        return 'bg-blue-100 text-blue-800';
      case 'BUYER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* User Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              {user.profileImage || user.avatar ? (
                <img src={user.profileImage || user.avatar} alt="" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover" loading="lazy" />
              ) : (
                <span className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none text-sm">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none text-sm">
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} className="flex-1 sm:flex-none text-sm">
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <p className="text-sm text-gray-900 mt-1">{user.firstName}</p>
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <p className="text-sm text-gray-900 mt-1">{user.lastName}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Email Address</Label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Role</Label>
                    {isEditing ? (
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUYER">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              <span>Buyer</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="EXPORTER">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>Exporter</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="ADMIN">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <span>Admin</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {user.role}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {user.business ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Business Name</Label>
                        <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {user.business.name}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Location</Label>
                        <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {user.business.location}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Verification Status</Label>
                        <div className="mt-1">
                          <Badge variant={user.business.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                            {user.business.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                      
                      {user.business.description && (
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-gray-900 mt-1">{user.business.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Profile</h3>
                      <p className="text-gray-600">This user hasn&apos;t created a business profile yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <ActivityList userId={user.id} limit={50} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Account Status</Label>
                        <p className="text-sm text-gray-600">Current account status</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}