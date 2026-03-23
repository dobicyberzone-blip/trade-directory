/**
 * RBAC - Role-Based Access Control System
 * Kenya Export Trade Directory & Kenya Export Traders Business Directory
 * 
 * This module defines all roles, permissions, and access control functions
 * for the platform. All role types have READ-ONLY access to:
 * - Search directories
 * - View entry details
 * - Make inquiries
 */

// User Role Types
export type UserRole = 
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'EXPORTER'
  | 'BUYER'
  | 'DEVELOPMENT_PARTNER'
  | 'TSI'
  | 'MDA'
  | 'MISSION';

// Sub-role types for additional categorization
export type SubRole = 
  | 'DEVELOPMENT_PARTNER'
  | 'TSI'
  | 'MDA'
  | 'MISSION'
  | null;

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super Administrator',
  EXPORTER: 'Exporter',
  BUYER: 'Buyer',
  DEVELOPMENT_PARTNER: 'Development Partner',
  TSI: 'Trade Support Institution',
  MDA: 'Kenya Government (MDA)',
  MISSION: 'Kenya Mission Abroad',
};

// All defined roles
export const ALL_ROLES: UserRole[] = [
  'ADMIN',
  'SUPER_ADMIN',
  'EXPORTER',
  'BUYER',
  'DEVELOPMENT_PARTNER',
  'TSI',
  'MDA',
  'MISSION',
];

// Sub-roles
export const ALL_SUB_ROLES: Exclude<SubRole, null>[] = [
  'DEVELOPMENT_PARTNER',
  'TSI',
  'MDA',
  'MISSION',
];

// Roles that can have sub-roles
export const ROLES_WITH_SUB_ROLES: UserRole[] = [
  'BUYER',
  'DEVELOPMENT_PARTNER',
  'TSI',
  'MDA',
  'MISSION',
];

// Permission Types
export type Permission = 
  // Directory/Public permissions
  | 'DIRECTORY:READ'
  | 'DIRECTORY:SEARCH'
  | 'ENTRY:VIEW'
  | 'INQUIRY:CREATE'
  | 'INQUIRY:READ_OWN'
  | 'INQUIRY:UPDATE_OWN'
  | 'INQUIRY:DELETE_OWN'
  
  // Admin/User management permissions
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_EDIT'
  | 'USER_DELETE'
  | 'USER_MANAGE_ROLES'
  | 'USER_SUSPEND'
  
  // Business permissions
  | 'BUSINESS_VIEW'
  | 'BUSINESS_CREATE'
  | 'BUSINESS_EDIT'
  | 'BUSINESS_DELETE'
  | 'BUSINESS_VERIFY'
  | 'BUSINESS_FEATURE'
  
  // Product permissions
  | 'PRODUCT_VIEW'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_EDIT'
  | 'PRODUCT_DELETE'
  | 'PRODUCT_VERIFY'
  
  // Analytics permissions
  | 'ANALYTICS_VIEW'
  | 'ANALYTICS_EXPORT'
  
  // Category permissions
  | 'CATEGORY_VIEW'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_EDIT'
  | 'CATEGORY_DELETE'
  
  // Certification permissions
  | 'CERTIFICATION_VIEW'
  | 'CERTIFICATION_CREATE'
  | 'CERTIFICATION_EDIT'
  | 'CERTIFICATION_DELETE'
  
  // Exporter-specific permissions
  | 'EXPORTER:CREATE'
  | 'EXPORTER:READ'
  | 'EXPORTER:UPDATE'
  | 'EXPORTER:DELETE'
  | 'EXPORTER:MANAGE_PRODUCTS'
  | 'EXPORTER:MANAGE_CERTIFICATIONS'
  
  // Product permissions
  | 'PRODUCT:READ'
  | 'PRODUCT:CREATE'
  | 'PRODUCT:UPDATE'
  | 'PRODUCT:DELETE'
  | 'PRODUCT:VERIFY'
  
  // Business permissions
  | 'BUSINESS:READ'
  | 'BUSINESS:CREATE'
  | 'BUSINESS:UPDATE'
  | 'BUSINESS:DELETE'
  | 'BUSINESS:VERIFY'
  | 'BUSINESS:FEATURE'
  
  // Admin permissions
  | 'ADMIN:ACCESS'
  | 'ADMIN:USERS_MANAGE'
  | 'ADMIN:ROLES_MANAGE'
  | 'ADMIN:PERMISSIONS_MANAGE'
  | 'ADMIN:SETTINGS_MANAGE'
  | 'ADMIN:REPORTS_VIEW'
  | 'ADMIN:EXPORT_DATA'
  | 'ADMIN:AUDIT_VIEW'
  | 'ADMIN:ANALYTICS_VIEW';

// Permission Groups
export const PERMISSION_GROUPS = {
  DIRECTORY: [
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
  ],
  ENTRY: [
    'ENTRY:VIEW',
  ],
  INQUIRY: [
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
  ],
  EXPORTER: [
    'EXPORTER:CREATE',
    'EXPORTER:READ',
    'EXPORTER:UPDATE',
    'EXPORTER:DELETE',
    'EXPORTER:MANAGE_PRODUCTS',
    'EXPORTER:MANAGE_CERTIFICATIONS',
  ],
  PRODUCT: [
    'PRODUCT:READ',
    'PRODUCT:CREATE',
    'PRODUCT:UPDATE',
    'PRODUCT:DELETE',
    'PRODUCT:VERIFY',
  ],
  BUSINESS: [
    'BUSINESS:READ',
    'BUSINESS:CREATE',
    'BUSINESS:UPDATE',
    'BUSINESS:DELETE',
    'BUSINESS:VERIFY',
    'BUSINESS:FEATURE',
  ],
  ADMIN: [
    'ADMIN:ACCESS',
    'ADMIN:USERS_MANAGE',
    'ADMIN:ROLES_MANAGE',
    'ADMIN:PERMISSIONS_MANAGE',
    'ADMIN:SETTINGS_MANAGE',
    'ADMIN:REPORTS_VIEW',
    'ADMIN:EXPORT_DATA',
    'ADMIN:AUDIT_VIEW',
    'ADMIN:ANALYTICS_VIEW',
  ],
};

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Normal Administrator — operational access only, no destructive or system-level actions
  ADMIN: [
    // User management (no delete, no role changes)
    'USER_VIEW',
    'USER_CREATE',
    'USER_EDIT',
    'USER_SUSPEND',
    // Business (no delete, no feature)
    'BUSINESS_VIEW',
    'BUSINESS_EDIT',
    'BUSINESS_VERIFY',
    // Products (no delete)
    'PRODUCT_VIEW',
    'PRODUCT_EDIT',
    'PRODUCT_VERIFY',
    // Analytics (view only, no export)
    'ANALYTICS_VIEW',
    // Categories (view only)
    'CATEGORY_VIEW',
    // Certifications (view only)
    'CERTIFICATION_VIEW',
    // Directory
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
    // Admin (no settings, no permissions, no full audit)
    'ADMIN:ACCESS',
    'ADMIN:USERS_MANAGE',
    'ADMIN:REPORTS_VIEW',
    'ADMIN:ANALYTICS_VIEW',
  ],

  // Super Administrator - Same full access as ADMIN
  SUPER_ADMIN: [
    'USER_VIEW',
    'USER_CREATE',
    'USER_EDIT',
    'USER_DELETE',
    'USER_MANAGE_ROLES',
    'USER_SUSPEND',
    'BUSINESS_VIEW',
    'BUSINESS_CREATE',
    'BUSINESS_EDIT',
    'BUSINESS_DELETE',
    'BUSINESS_VERIFY',
    'BUSINESS_FEATURE',
    'PRODUCT_VIEW',
    'PRODUCT_CREATE',
    'PRODUCT_EDIT',
    'PRODUCT_DELETE',
    'PRODUCT_VERIFY',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
    'CATEGORY_VIEW',
    'CATEGORY_CREATE',
    'CATEGORY_EDIT',
    'CATEGORY_DELETE',
    'CERTIFICATION_VIEW',
    'CERTIFICATION_CREATE',
    'CERTIFICATION_EDIT',
    'CERTIFICATION_DELETE',
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
    'ADMIN:ACCESS',
    'ADMIN:USERS_MANAGE',
    'ADMIN:ROLES_MANAGE',
    'ADMIN:PERMISSIONS_MANAGE',
    'ADMIN:SETTINGS_MANAGE',
    'ADMIN:REPORTS_VIEW',
    'ADMIN:EXPORT_DATA',
    'ADMIN:AUDIT_VIEW',
    'ADMIN:ANALYTICS_VIEW',
  ],
  
  // Exporter - Can manage their own business and products
  EXPORTER: [
    // Directory access
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    // Inquiry permissions
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
    // Own exporter profile
    'EXPORTER:READ',
    'EXPORTER:UPDATE',
    'EXPORTER:MANAGE_PRODUCTS',
    'EXPORTER:MANAGE_CERTIFICATIONS',
    // Product management
    'PRODUCT:READ',
    'PRODUCT:CREATE',
    'PRODUCT:UPDATE',
    'PRODUCT:DELETE',
    // Business
    'BUSINESS:READ',
    'BUSINESS:UPDATE',
  ],
  
  // BUYER - Read-only access to directories, view entries, make inquiries
  BUYER: [
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
  ],
  
  // DEVELOPMENT_PARTNER - Same as BUYER (Read-only)
  DEVELOPMENT_PARTNER: [
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
  ],
  
  // TSI (Trade Support Institutions) - Same as BUYER (Read-only)
  TSI: [
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
  ],
  
  // MDA (Kenya Government Ministries & State Department) - Same as BUYER (Read-only)
  MDA: [
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
  ],
  
  // MISSION (Kenya Missions Abroad) - Same as BUYER (Read-only)
  MISSION: [
    'DIRECTORY:READ',
    'DIRECTORY:SEARCH',
    'ENTRY:VIEW',
    'INQUIRY:CREATE',
    'INQUIRY:READ_OWN',
    'INQUIRY:UPDATE_OWN',
    'INQUIRY:DELETE_OWN',
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Get all permissions for a role
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if role is an admin role
export function isAdminRole(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

// Check if role is an exporter
export function isExporterRole(role: UserRole): boolean {
  return role === 'EXPORTER';
}

// Check if role is a read-only role (Buyer, Development Partner, TSI, MDA, Mission)
export function isReadOnlyRole(role: UserRole): boolean {
  return ['BUYER', 'DEVELOPMENT_PARTNER', 'TSI', 'MDA', 'MISSION'].includes(role);
}

// Check if role can have sub-roles
export function canHaveSubRole(role: UserRole): boolean {
  return ROLES_WITH_SUB_ROLES.includes(role);
}

// Validate if a role is valid
export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}

// Validate if a sub-role is valid
export function isValidSubRole(subRole: string): subRole is Exclude<SubRole, null> {
  return ALL_SUB_ROLES.includes(subRole as Exclude<SubRole, null>);
}

// Profile visibility types
export type VisibilityScope = 'PUBLIC' | 'REGISTERED' | 'SPECIFIC_ROLES';

export const VISIBILITY_SCOPES: VisibilityScope[] = ['PUBLIC', 'REGISTERED', 'SPECIFIC_ROLES'];

// Default visibility settings per role
export const DEFAULT_VISIBILITY: Record<UserRole, VisibilityScope> = {
  ADMIN: 'PUBLIC',
  SUPER_ADMIN: 'PUBLIC',
  EXPORTER: 'PUBLIC',
  BUYER: 'REGISTERED',
  DEVELOPMENT_PARTNER: 'REGISTERED',
  TSI: 'REGISTERED',
  MDA: 'REGISTERED',
  MISSION: 'REGISTERED',
};

// Get roles that can see specific role profiles
export function getVisibleRolesForRole(viewerRole: UserRole): UserRole[] {
  // Admins can see everyone
  if (viewerRole === 'ADMIN' || viewerRole === 'SUPER_ADMIN') {
    return ALL_ROLES;
  }
  
  // Exporters can see all buyers and other exporters
  if (viewerRole === 'EXPORTER') {
    return ['ADMIN', 'EXPORTER', 'BUYER', 'DEVELOPMENT_PARTNER', 'TSI', 'MDA', 'MISSION'];
  }
  
  // All read-only roles can see exporters and their own type
  return ['ADMIN', 'EXPORTER'];
}

// Permission constants for easy reference
export const Permission = {
  // User management
  USER_VIEW: 'USER_VIEW' as Permission,
  USER_CREATE: 'USER_CREATE' as Permission,
  USER_EDIT: 'USER_EDIT' as Permission,
  USER_DELETE: 'USER_DELETE' as Permission,
  USER_MANAGE_ROLES: 'USER_MANAGE_ROLES' as Permission,
  USER_SUSPEND: 'USER_SUSPEND' as Permission,
  
  // Business
  BUSINESS_VIEW: 'BUSINESS_VIEW' as Permission,
  BUSINESS_CREATE: 'BUSINESS_CREATE' as Permission,
  BUSINESS_EDIT: 'BUSINESS_EDIT' as Permission,
  BUSINESS_DELETE: 'BUSINESS_DELETE' as Permission,
  BUSINESS_VERIFY: 'BUSINESS_VERIFY' as Permission,
  BUSINESS_FEATURE: 'BUSINESS_FEATURE' as Permission,
  
  // Products
  PRODUCT_VIEW: 'PRODUCT_VIEW' as Permission,
  PRODUCT_CREATE: 'PRODUCT_CREATE' as Permission,
  PRODUCT_EDIT: 'PRODUCT_EDIT' as Permission,
  PRODUCT_DELETE: 'PRODUCT_DELETE' as Permission,
  PRODUCT_VERIFY: 'PRODUCT_VERIFY' as Permission,
  
  // Analytics
  ANALYTICS_VIEW: 'ANALYTICS_VIEW' as Permission,
  ANALYTICS_EXPORT: 'ANALYTICS_EXPORT' as Permission,
  
  // Categories
  CATEGORY_VIEW: 'CATEGORY_VIEW' as Permission,
  CATEGORY_CREATE: 'CATEGORY_CREATE' as Permission,
  CATEGORY_EDIT: 'CATEGORY_EDIT' as Permission,
  CATEGORY_DELETE: 'CATEGORY_DELETE' as Permission,
  
  // Certifications
  CERTIFICATION_VIEW: 'CERTIFICATION_VIEW' as Permission,
  CERTIFICATION_CREATE: 'CERTIFICATION_CREATE' as Permission,
  CERTIFICATION_EDIT: 'CERTIFICATION_EDIT' as Permission,
  CERTIFICATION_DELETE: 'CERTIFICATION_DELETE' as Permission,
  
  // Directory
  DIRECTORY_READ: 'DIRECTORY:READ' as Permission,
  DIRECTORY_SEARCH: 'DIRECTORY:SEARCH' as Permission,
  ENTRY_VIEW: 'ENTRY:VIEW' as Permission,
  INQUIRY_CREATE: 'INQUIRY:CREATE' as Permission,
  INQUIRY_READ_OWN: 'INQUIRY:READ_OWN' as Permission,
  INQUIRY_UPDATE_OWN: 'INQUIRY:UPDATE_OWN' as Permission,
  INQUIRY_DELETE_OWN: 'INQUIRY:DELETE_OWN' as Permission,
  
  // Admin
  ADMIN_ACCESS: 'ADMIN:ACCESS' as Permission,
  ADMIN_USERS_MANAGE: 'ADMIN:USERS_MANAGE' as Permission,
  ADMIN_ROLES_MANAGE: 'ADMIN:ROLES_MANAGE' as Permission,
  ADMIN_PERMISSIONS_MANAGE: 'ADMIN:PERMISSIONS_MANAGE' as Permission,
  ADMIN_SETTINGS_MANAGE: 'ADMIN:SETTINGS_MANAGE' as Permission,
  ADMIN_REPORTS_VIEW: 'ADMIN:REPORTS_VIEW' as Permission,
  ADMIN_EXPORT_DATA: 'ADMIN:EXPORT_DATA' as Permission,
  ADMIN_AUDIT_VIEW: 'ADMIN:AUDIT_VIEW' as Permission,
  ADMIN_ANALYTICS_VIEW: 'ADMIN:ANALYTICS_VIEW' as Permission,
};

// Export utility functions
export const rbacUtils = {
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
  getVisibleRolesForRole,
};
