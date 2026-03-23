'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  UserRole, 
  SubRole, 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getPermissions,
  isAdminRole,
  isExporterRole,
  isReadOnlyRole,
  canHaveSubRole,
  isValidRole,
  isValidSubRole,
  rbacUtils,
} from './permissions';

interface RBACUser {
  id: string;
  email: string;
  role: UserRole;
  subRole?: SubRole;
  profileVisible: boolean;
  visibleToRoles?: string[];
}

interface RBACContextType {
  user: RBACUser | null;
  isLoading: boolean;
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  // Role checks
  isAdmin: boolean;
  isExporter: boolean;
  isReadOnly: boolean;
  canHaveSubRole: boolean;
  // Profile visibility
  isProfileVisible: boolean;
  canViewProfile: (targetRole: UserRole) => boolean;
  updateProfileVisibility: (visible: boolean) => Promise<void>;
  updateVisibleToRoles: (roles: UserRole[]) => Promise<void>;
  // Utility
  getAllPermissions: () => Permission[];
  getRoleDisplayName: (role?: UserRole) => string;
  refreshUser: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
  initialUser?: RBACUser | null;
}

export function RBACProvider({ children, initialUser }: RBACProviderProps) {
  const [user, setUser] = useState<RBACUser | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    if (!initialUser && typeof window !== 'undefined') {
      // Fetch user from API if not provided
      fetchUser();
    }
  }, [initialUser]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            role: data.user.role as UserRole,
            subRole: data.user.subRole as SubRole || null,
            profileVisible: data.user.profileVisible ?? true,
            visibleToRoles: data.user.visibleToRoles ? JSON.parse(data.user.visibleToRoles) : undefined,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAllPermissions(user.role, permissions);
  };

  const updateProfileVisibility = async (visible: boolean) => {
    try {
      const response = await fetch('/api/user/profile-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisible: visible }),
      });
      
      if (response.ok) {
        setUser(prev => prev ? { ...prev, profileVisible: visible } : null);
      }
    } catch (error) {
      console.error('Failed to update profile visibility:', error);
      throw error;
    }
  };

  const updateVisibleToRoles = async (roles: UserRole[]) => {
    try {
      const response = await fetch('/api/user/profile-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibleToRoles: roles }),
      });
      
      if (response.ok) {
        setUser(prev => prev ? { ...prev, visibleToRoles: roles } : null);
      }
    } catch (error) {
      console.error('Failed to update visible to roles:', error);
      throw error;
    }
  };

  const canViewProfile = (targetRole: UserRole): boolean => {
    if (!user) return false;
    
    // Admins can view all profiles
    if (user.role === 'ADMIN') return true;
    
    // Get visible roles for current user
    const visibleRoles = rbacUtils.getVisibleRolesForRole(user.role);
    return visibleRoles.includes(targetRole);
  };

  const getAllPermissions = (): Permission[] => {
    if (!user) return [];
    return getPermissions(user.role);
  };

  const getRoleDisplayName = (role?: UserRole): string => {
    const { ROLE_DISPLAY_NAMES } = require('./permissions');
    return role ? ROLE_DISPLAY_NAMES[role] || role : (user ? ROLE_DISPLAY_NAMES[user.role] : '');
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value: RBACContextType = {
    user,
    isLoading,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    isAdmin: user ? isAdminRole(user.role) : false,
    isExporter: user ? isExporterRole(user.role) : false,
    isReadOnly: user ? isReadOnlyRole(user.role) : false,
    canHaveSubRole: user ? canHaveSubRole(user.role) : false,
    isProfileVisible: user?.profileVisible ?? true,
    canViewProfile,
    updateProfileVisibility,
    updateVisibleToRoles,
    getAllPermissions,
    getRoleDisplayName,
    refreshUser,
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

// Higher-order component for permission-gated content
interface WithPermissionProps {
  permission: Permission;
  fallback?: ReactNode;
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  { permission, fallback = null }: WithPermissionProps
) {
  return function WithPermissionComponent(props: P) {
    const { hasPermission } = useRBAC();
    
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
    
    return <Component {...props} />;
  };
}

// Hook for checking multiple permissions
export function usePermissions(requiredPermissions: Permission[], requireAll: boolean = false) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC();
  
  if (requireAll) {
    return hasAllPermissions(requiredPermissions);
  }
  
  return hasAnyPermission(requiredPermissions);
}

// Hook for conditional rendering based on role
export function useRoleCheck(allowedRoles: UserRole[]) {
  const { user } = useRBAC();
  
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// Export types for external use
export type { UserRole, SubRole, Permission };
