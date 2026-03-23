import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import { UserRole, Permission, hasPermission, isValidRole } from './permissions';

/**
 * RBAC Middleware for protecting API routes
 * 
 * Usage in API routes:
 * import { withRBAC } from '@/lib/rbac/middleware';
 * 
 * // Protect route with specific permission
 * export const GET = withRBAC(['DIRECTORY:READ'], async (req) => { ... });
 * 
 * // Or require admin access
 * export const GET = withRBAC(['ADMIN:ACCESS'], async (req) => { ... });
 */

type PermissionCheck = Permission | Permission[];

// Extend the NextRequest type to include user
declare module 'next/server' {
  interface NextRequest {
    user?: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
}

/**
 * requirePermission - Middleware wrapper for API route handlers
 * 
 * This is the main function used by existing API routes.
 * Usage:
 * 
 * import { requirePermission } from '@/lib/rbac/middleware';
 * import { Permission } from '@/lib/rbac/permissions';
 * 
 * export const GET = requirePermission(
 *   Permission.USER_VIEW,
 *   async (req, { params }) => { ... }
 * );
 */
export function requirePermission(
  permission: Permission,
  handler: (req: NextRequest, context: { params: Promise<{ [key: string]: string }> }) => Promise<NextResponse>
) {
  return async function RBACMiddleware(
    req: NextRequest,
    context: { params: Promise<{ [key: string]: string }> }
  ): Promise<NextResponse> {
    try {
      // Verify authentication
      const tokenPayload = await verifyToken(req);
      
      if (!tokenPayload) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }

      // Attach user info to request
      req.user = {
        userId: tokenPayload.userId,
        email: tokenPayload.email,
        role: tokenPayload.role as UserRole,
      };

      // Validate role
      if (!isValidRole(tokenPayload.role)) {
        return NextResponse.json(
          { error: 'Forbidden - Invalid user role' },
          { status: 403 }
        );
      }

      const userRole = tokenPayload.role as UserRole;

      // Super admins bypass all permission checks
      if (!tokenPayload.isSuperAdmin && !hasPermission(userRole, permission)) {
        return NextResponse.json(
          { error: `Forbidden - Required permission: ${permission}` },
          { status: 403 }
        );
      }

      // Permission check passed, execute handler
      return await handler(req, context);

    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with RBAC
 * @param requiredPermissions - Permission(s) required to access the route
 * @param handler - The API route handler to wrap
 */
export function withRBAC(
  requiredPermissions: PermissionCheck,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function RBACWrapper(req: NextRequest): Promise<NextResponse> {
    try {
      // Verify authentication
      const tokenPayload = await verifyToken(req);
      
      if (!tokenPayload) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }

      // Attach user info to request
      req.user = {
        userId: tokenPayload.userId,
        email: tokenPayload.email,
        role: tokenPayload.role as UserRole,
      };

      // Validate role
      if (!isValidRole(tokenPayload.role)) {
        return NextResponse.json(
          { error: 'Forbidden - Invalid user role' },
          { status: 403 }
        );
      }

      const userRole = tokenPayload.role as UserRole;

      // Check permissions — super admins bypass all checks
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      if (!tokenPayload.isSuperAdmin) {
        for (const permission of permissions) {
          if (!hasPermission(userRole, permission)) {
            return NextResponse.json(
              { error: `Forbidden - Required permission: ${permission}` },
              { status: 403 }
            );
          }
        }
      }

      // Permission check passed, execute handler
      return await handler(req);

    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to check if user has admin access
 */
export function withAdminAccess(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRBAC(['ADMIN:ACCESS'], handler);
}

/**
 * requireSuperAdmin — blocks Normal Admin, allows only isSuperAdmin users.
 * Use for destructive or system-level operations.
 */
export function requireSuperAdmin(
  handler: (req: NextRequest, context: { params: Promise<{ [key: string]: string }> }) => Promise<NextResponse>
) {
  return async function SuperAdminMiddleware(
    req: NextRequest,
    context: { params: Promise<{ [key: string]: string }> }
  ): Promise<NextResponse> {
    try {
      const tokenPayload = await verifyToken(req);
      if (!tokenPayload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!tokenPayload.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden — Super Admin only' },
          { status: 403 }
        );
      }
      req.user = {
        userId: tokenPayload.userId,
        email: tokenPayload.email,
        role: tokenPayload.role as UserRole,
      };
      return await handler(req, context);
    } catch (error) {
      console.error('SuperAdmin Middleware Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}

/**
 * Middleware to check if user can access directory
 */
export function withDirectoryAccess(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRBAC(['DIRECTORY:READ'], handler);
}

/**
 * Middleware to check if user can create inquiries
 */
export function withInquiryAccess(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRBAC(['INQUIRY:CREATE'], handler);
}

/**
 * Utility function to get user role from request
 * Returns null if not authenticated
 */
export async function getUserRoleFromRequest(req: NextRequest): Promise<UserRole | null> {
  const tokenPayload = await verifyToken(req);
  
  if (!tokenPayload || !isValidRole(tokenPayload.role)) {
    return null;
  }
  
  return tokenPayload.role as UserRole;
}

/**
 * Utility function to check if user can view a specific profile
 * based on profile visibility settings
 */
export async function canViewProfile(
  req: NextRequest,
  targetUserId: string
): Promise<boolean> {
  const tokenPayload = await verifyToken(req);
  
  if (!tokenPayload) {
    return false;
  }

  // Admins can view all profiles
  if (tokenPayload.role === 'ADMIN' || tokenPayload.role === 'SUPER_ADMIN') {
    return true;
  }

  // Users can view their own profile
  if (tokenPayload.userId === targetUserId) {
    return true;
  }

  // Import prisma dynamically to avoid issues
  const { default: prisma } = await import('@/lib/prisma');
  
  // Get target user's profile visibility settings
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      role: true,
      profileVisible: true,
      visibleToRoles: true,
    },
  });

  if (!targetUser) {
    return false;
  }

  // Check if profile is visible
  if (!targetUser.profileVisible) {
    return false;
  }

  // Parse visibleToRoles if it exists
  const visibleToRoles = targetUser.visibleToRoles 
    ? JSON.parse(targetUser.visibleToRoles) 
    : null;

  // If no specific roles defined, check default visibility
  if (!visibleToRoles || visibleToRoles.length === 0) {
    // Default: Public profiles visible to all authenticated users
    return targetUser.role === 'EXPORTER' || targetUser.role === 'ADMIN';
  }

  // Check if current user's role is in the allowed list
  return visibleToRoles.includes(tokenPayload.role);
}

/**
 * Middleware to filter results based on profile visibility
 * Use this for directory listings
 */
export async function filterVisibleProfiles<T>(
  req: NextRequest,
  items: T[],
  getUserId: (item: T) => string
): Promise<T[]> {
  const tokenPayload = await verifyToken(req);
  
  // If not authenticated, only show public profiles
  if (!tokenPayload) {
    const { default: prisma } = await import('@/lib/prisma');
    const publicUserIds = await prisma.user.findMany({
      where: {
        role: { in: ['EXPORTER', 'ADMIN'] },
        profileVisible: true,
      },
      select: { id: true },
    });
    
    const publicIds = new Set(publicUserIds.map(u => u.id));
    return items.filter(item => publicIds.has(getUserId(item)));
  }

  // If admin, show all
  if (tokenPayload.role === 'ADMIN' || tokenPayload.role === 'SUPER_ADMIN') {
    return items;
  }

  // For other users, filter based on visibility settings
  const { default: prisma } = await import('@/lib/prisma');
  const userIds = [...new Set(items.map(getUserId))];
  
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      role: true,
      profileVisible: true,
      visibleToRoles: true,
    },
  });

  const visibleUserIds = new Set<string>();
  
  for (const user of users) {
    if (!user.profileVisible) continue;
    
    const visibleToRoles = user.visibleToRoles 
      ? JSON.parse(user.visibleToRoles) 
      : null;
    
    // If no restrictions, show exporters publicly
    if (!visibleToRoles || visibleToRoles.length === 0) {
      if (user.role === 'EXPORTER' || user.role === 'ADMIN') {
        visibleUserIds.add(user.id);
      }
      continue;
    }
    
    // Check if current user's role is allowed
    if (visibleToRoles.includes(tokenPayload.role)) {
      visibleUserIds.add(user.id);
    }
  }

  return items.filter(item => visibleUserIds.has(getUserId(item)));
}
