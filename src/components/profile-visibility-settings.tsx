'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Users, Globe, Lock, Check, X } from 'lucide-react';
import { UserRole, ROLE_DISPLAY_NAMES, ALL_ROLES, isValidRole } from '@/lib/rbac/permissions';

interface ProfileVisibilitySettingsProps {
  initialProfileVisible?: boolean;
  initialVisibleToRoles?: string[];
  onUpdate?: (profileVisible: boolean, visibleToRoles: string[]) => Promise<void>;
}

export default function ProfileVisibilitySettings({
  initialProfileVisible = true,
  initialVisibleToRoles = [],
  onUpdate,
}: ProfileVisibilitySettingsProps) {
  const [profileVisible, setProfileVisible] = useState(initialProfileVisible);
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(initialVisibleToRoles);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/profile-visibility');
      if (response.ok) {
        const data = await response.json();
        setProfileVisible(data.user.profileVisible ?? true);
        setVisibleToRoles(data.user.visibleToRoles ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch profile visibility settings:', error);
    }
  };

  const handleToggleVisibility = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      if (onUpdate) {
        await onUpdate(!profileVisible, visibleToRoles);
      } else {
        const response = await fetch('/api/user/profile-visibility', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileVisible: !profileVisible }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update visibility');
        }
      }
      
      setProfileVisible(!profileVisible);
      setMessage({ type: 'success', text: 'Profile visibility updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update visibility' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = async (role: string) => {
    if (!isValidRole(role)) return;
    
    setIsLoading(true);
    setMessage(null);
    
    const newRoles = visibleToRoles.includes(role)
      ? visibleToRoles.filter(r => r !== role)
      : [...visibleToRoles, role];
    
    try {
      if (onUpdate) {
        await onUpdate(profileVisible, newRoles);
      } else {
        const response = await fetch('/api/user/profile-visibility', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleToRoles: newRoles }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update visible roles');
        }
      }
      
      setVisibleToRoles(newRoles);
      setMessage({ type: 'success', text: 'Visibility settings updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update visibility settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles = ALL_ROLES.filter(role => 
    role !== 'ADMIN' && role !== 'EXPORTER'
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {profileVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            Profile Visibility
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {profileVisible 
              ? 'Your profile is visible to other users' 
              : 'Your profile is hidden from other users'}
          </p>
        </div>
        
        <button
          onClick={handleToggleVisibility}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${profileVisible ? 'bg-green-600' : 'bg-gray-600'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${profileVisible ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {message && (
        <div className={`
          p-3 rounded-md flex items-center gap-2
          ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}
        `}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {profileVisible && (
        <div className="space-y-4">
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Visible to Specific Roles
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Select which user roles can view your profile. Leave empty for default visibility.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {availableRoles.map(role => {
                const isSelected = visibleToRoles.length === 0 || visibleToRoles.includes(role);
                const isExplicitlySelected = visibleToRoles.includes(role);
                
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    disabled={isLoading || visibleToRoles.length === 0}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${isExplicitlySelected 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : visibleToRoles.length === 0
                          ? 'border-gray-600 bg-gray-700/30 opacity-50'
                          : 'border-gray-600 hover:border-gray-500'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{ROLE_DISPLAY_NAMES[role as UserRole]}</span>
                      {isExplicitlySelected && (
                        <Check className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {visibleToRoles.length === 0 && (
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Currently using default visibility (public for exporters)
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
          <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-1">Privacy Information</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Administrators can always view all profiles</li>
              <li>When hidden, your profile won't appear in search results</li>
              <li>You can still make inquiries and use all features</li>
              <li>Your business information remains visible if you're an exporter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
