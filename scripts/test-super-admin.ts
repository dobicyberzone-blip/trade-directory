/**
 * Super Admin Role Refactor — Comprehensive Test Suite
 * 
 * Tests that the SUPER_ADMIN standalone role works correctly:
 * - RBAC permissions (SUPER_ADMIN has all permissions)
 * - Role validation and utility functions
 * - Middleware authorization logic
 * - Token payload structure (no isSuperAdmin field)
 * - Prisma schema Role enum
 * - API route authorization patterns
 * 
 * Run with: npx tsx scripts/test-super-admin.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf-8');
}

// ─── Import the modules under test ───────────────────────────────────────────

import {
  UserRole,
  Permission,
  ALL_ROLES,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY_NAMES,
  DEFAULT_VISIBILITY,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  isAdminRole,
  isExporterRole,
  isReadOnlyRole,
  isValidRole,
  getVisibleRolesForRole,
} from '../src/lib/rbac/permissions.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. PRISMA SCHEMA — Role enum
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Prisma Schema — Role enum', () => {
  const schema = readSource('prisma/schema.prisma');

  it('should define a Role enum (not a plain String)', () => {
    assert.ok(schema.includes('enum Role {'), 'Schema must contain "enum Role {"');
  });

  it('should contain all 9 role values in the enum', () => {
    const expectedRoles = ['ADMIN', 'SUPER_ADMIN', 'EXPORTER', 'BUYER', 'PARTNER',
      'DEVELOPMENT_PARTNER', 'TSI', 'MDA', 'MISSION'];
    for (const role of expectedRoles) {
      assert.ok(schema.includes(role), `Role enum must contain "${role}"`);
    }
    // Verify they're inside the enum block specifically
    const enumBlock = schema.match(/enum Role \{([\s\S]*?)\}/)?.[1] || '';
    for (const role of expectedRoles) {
      assert.ok(enumBlock.includes(role), `Role enum block must contain "${role}"`);
    }
  });

  it('should use Role enum type on the User model (not String)', () => {
    assert.ok(
      schema.includes('role                     Role              @default(BUYER)'),
      'User.role must be of type Role with @default(BUYER)'
    );
    assert.ok(
      !schema.includes('role                     String            @default("BUYER")'),
      'User.role must NOT be plain String'
    );
  });

  it('should NOT have isSuperAdmin field on User model', () => {
    const userModelSection = schema.split('model User {')[1]?.split('}')[0] || '';
    assert.ok(
      !userModelSection.includes('isSuperAdmin'),
      'User model must NOT contain isSuperAdmin field'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. RBAC PERMISSIONS — SUPER_ADMIN vs ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RBAC Permissions — SUPER_ADMIN has all permissions', () => {
  it('SUPER_ADMIN should be a valid role', () => {
    assert.ok(isValidRole('SUPER_ADMIN'));
  });

  it('SUPER_ADMIN should be in ALL_ROLES', () => {
    assert.ok(ALL_ROLES.includes('SUPER_ADMIN'));
  });

  it('SUPER_ADMIN should have a display name', () => {
    assert.equal(ROLE_DISPLAY_NAMES.SUPER_ADMIN, 'Super Administrator');
  });

  it('SUPER_ADMIN should have every permission defined in Permission type', () => {
    const allDefinedPermissions: Permission[] = [
      'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE', 'USER_MANAGE_ROLES', 'USER_SUSPEND',
      'BUSINESS_VIEW', 'BUSINESS_CREATE', 'BUSINESS_EDIT', 'BUSINESS_DELETE', 'BUSINESS_VERIFY', 'BUSINESS_FEATURE',
      'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE', 'PRODUCT_VERIFY',
      'ANALYTICS_VIEW', 'ANALYTICS_EXPORT',
      'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE',
      'CERTIFICATION_VIEW', 'CERTIFICATION_CREATE', 'CERTIFICATION_EDIT', 'CERTIFICATION_DELETE',
      'DIRECTORY:READ', 'DIRECTORY:SEARCH', 'ENTRY:VIEW',
      'INQUIRY:CREATE', 'INQUIRY:READ_OWN', 'INQUIRY:UPDATE_OWN', 'INQUIRY:DELETE_OWN',
      'ADMIN:ACCESS', 'ADMIN:USERS_MANAGE', 'ADMIN:ROLES_MANAGE', 'ADMIN:PERMISSIONS_MANAGE',
      'ADMIN:SETTINGS_MANAGE', 'ADMIN:REPORTS_VIEW', 'ADMIN:EXPORT_DATA', 'ADMIN:AUDIT_VIEW', 'ADMIN:ANALYTICS_VIEW',
    ];

    for (const perm of allDefinedPermissions) {
      assert.ok(
        hasPermission('SUPER_ADMIN', perm),
        `SUPER_ADMIN must have permission: ${perm}`
      );
    }
  });

  it('SUPER_ADMIN should have more permissions than ADMIN', () => {
    const superPerms = ROLE_PERMISSIONS.SUPER_ADMIN;
    const adminPerms = ROLE_PERMISSIONS.ADMIN;
    assert.ok(
      superPerms.length > adminPerms.length,
      `SUPER_ADMIN (${superPerms.length}) must have more permissions than ADMIN (${adminPerms.length})`
    );
  });

  it('ADMIN should NOT have destructive/system permissions', () => {
    const adminOnlyMissing: Permission[] = [
      'USER_DELETE', 'USER_MANAGE_ROLES',
      'BUSINESS_DELETE', 'BUSINESS_FEATURE',
      'PRODUCT_DELETE',
      'ANALYTICS_EXPORT',
      'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE',
      'CERTIFICATION_CREATE', 'CERTIFICATION_EDIT', 'CERTIFICATION_DELETE',
      'ADMIN:ROLES_MANAGE', 'ADMIN:PERMISSIONS_MANAGE', 'ADMIN:SETTINGS_MANAGE',
      'ADMIN:EXPORT_DATA', 'ADMIN:AUDIT_VIEW',
    ];

    for (const perm of adminOnlyMissing) {
      assert.ok(
        !hasPermission('ADMIN', perm),
        `ADMIN must NOT have permission: ${perm}`
      );
    }
  });

  it('SUPER_ADMIN should have ALL admin-only permissions', () => {
    const superOnlyPerms: Permission[] = [
      'USER_DELETE', 'USER_MANAGE_ROLES',
      'BUSINESS_DELETE', 'BUSINESS_FEATURE',
      'PRODUCT_DELETE',
      'ANALYTICS_EXPORT',
      'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE',
      'CERTIFICATION_CREATE', 'CERTIFICATION_EDIT', 'CERTIFICATION_DELETE',
      'ADMIN:ROLES_MANAGE', 'ADMIN:PERMISSIONS_MANAGE', 'ADMIN:SETTINGS_MANAGE',
      'ADMIN:EXPORT_DATA', 'ADMIN:AUDIT_VIEW',
    ];

    for (const perm of superOnlyPerms) {
      assert.ok(
        hasPermission('SUPER_ADMIN', perm),
        `SUPER_ADMIN must have permission: ${perm}`
      );
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. ROLE UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Role utility functions', () => {
  it('isAdminRole should return true for SUPER_ADMIN', () => {
    assert.ok(isAdminRole('SUPER_ADMIN'));
  });

  it('isAdminRole should return true for ADMIN', () => {
    assert.ok(isAdminRole('ADMIN'));
  });

  it('isAdminRole should return false for non-admin roles', () => {
    assert.ok(!isAdminRole('EXPORTER'));
    assert.ok(!isAdminRole('BUYER'));
    assert.ok(!isAdminRole('PARTNER'));
  });

  it('isReadOnlyRole should return false for SUPER_ADMIN', () => {
    assert.ok(!isReadOnlyRole('SUPER_ADMIN'));
  });

  it('isReadOnlyRole should return false for ADMIN', () => {
    assert.ok(!isReadOnlyRole('ADMIN'));
  });

  it('isReadOnlyRole should return true for read-only roles', () => {
    assert.ok(isReadOnlyRole('BUYER'));
    assert.ok(isReadOnlyRole('PARTNER'));
    assert.ok(isReadOnlyRole('DEVELOPMENT_PARTNER'));
    assert.ok(isReadOnlyRole('TSI'));
    assert.ok(isReadOnlyRole('MDA'));
    assert.ok(isReadOnlyRole('MISSION'));
  });

  it('isValidRole should return true for all 9 roles', () => {
    for (const role of ALL_ROLES) {
      assert.ok(isValidRole(role), `${role} must be valid`);
    }
  });

  it('isValidRole should return false for invalid roles', () => {
    assert.ok(!isValidRole('GUEST'));
    assert.ok(!isValidRole(''));
    assert.ok(!isValidRole('super_admin')); // lowercase
  });

  it('hasAnyPermission should work for SUPER_ADMIN', () => {
    assert.ok(hasAnyPermission('SUPER_ADMIN', ['USER_DELETE', 'BUSINESS_DELETE']));
  });

  it('hasAnyPermission should work for ADMIN (partial match)', () => {
    // ADMIN has USER_VIEW but not USER_DELETE
    assert.ok(hasAnyPermission('ADMIN', ['USER_DELETE', 'USER_VIEW']));
  });

  it('hasAnyPermission should return false when ADMIN has none', () => {
    assert.ok(!hasAnyPermission('ADMIN', ['USER_DELETE', 'BUSINESS_DELETE']));
  });

  it('hasAllPermissions should return true for SUPER_ADMIN', () => {
    assert.ok(hasAllPermissions('SUPER_ADMIN', ['USER_VIEW', 'USER_DELETE', 'BUSINESS_DELETE']));
  });

  it('hasAllPermissions should return false for ADMIN on super-only perms', () => {
    assert.ok(!hasAllPermissions('ADMIN', ['USER_VIEW', 'USER_DELETE']));
  });

  it('getPermissions should return correct permissions for each role', () => {
    const superPerms = getPermissions('SUPER_ADMIN');
    const adminPerms = getPermissions('ADMIN');
    const buyerPerms = getPermissions('BUYER');

    assert.ok(superPerms.length > 0);
    assert.ok(adminPerms.length > 0);
    assert.ok(buyerPerms.length > 0);
    assert.ok(superPerms.length > adminPerms.length);
    assert.ok(adminPerms.length > buyerPerms.length);
  });

  it('getVisibleRolesForRole should return all roles for SUPER_ADMIN', () => {
    const visible = getVisibleRolesForRole('SUPER_ADMIN');
    assert.deepEqual(visible, ALL_ROLES);
  });

  it('getVisibleRolesForRole should return all roles for ADMIN', () => {
    const visible = getVisibleRolesForRole('ADMIN');
    assert.deepEqual(visible, ALL_ROLES);
  });

  it('DEFAULT_VISIBILITY should include all roles', () => {
    for (const role of ALL_ROLES) {
      assert.ok(
        role in DEFAULT_VISIBILITY,
        `DEFAULT_VISIBILITY must contain ${role}`
      );
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. TOKEN PAYLOAD — No isSuperAdmin field
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('TokenPayload — no isSuperAdmin field', () => {
  const authUtils = readSource('src/lib/auth-utils.ts');

  it('TokenPayload interface should NOT have isSuperAdmin field', () => {
    const interfaceSection = authUtils.split('export interface TokenPayload {')[1]?.split('}')[0] || '';
    assert.ok(
      !interfaceSection.includes('isSuperAdmin'),
      'TokenPayload must NOT contain isSuperAdmin'
    );
  });

  it('TokenPayload should have role field with SUPER_ADMIN in union', () => {
    assert.ok(
      authUtils.includes("role: 'ADMIN' | 'EXPORTER' | 'BUYER' | 'PARTNER' | 'SUPER_ADMIN'"),
      'TokenPayload.role must include SUPER_ADMIN'
    );
  });

  it('verifyToken should NOT normalize SUPER_ADMIN to ADMIN', () => {
    assert.ok(
      !authUtils.includes("role: 'ADMIN',\n        isSuperAdmin: true"),
      'verifyToken must NOT normalize SUPER_ADMIN to ADMIN + isSuperAdmin'
    );
    assert.ok(
      !authUtils.includes("decoded.role === 'SUPER_ADMIN'"),
      'verifyToken must NOT check for SUPER_ADMIN to normalize it'
    );
  });

  it('JWT payloads in login route should NOT include isSuperAdmin', () => {
    const loginRoute = readSource('src/app/api/auth/login/route.ts');
    assert.ok(
      !loginRoute.includes('isSuperAdmin: user.isSuperAdmin'),
      'Login route must NOT include isSuperAdmin in JWT payload'
    );
  });

  it('JWT payloads in verify-otp route should NOT include isSuperAdmin', () => {
    const verifyOtpRoute = readSource('src/app/api/auth/verify-otp/route.ts');
    assert.ok(
      !verifyOtpRoute.includes('isSuperAdmin: user.isSuperAdmin'),
      'Verify OTP route must NOT include isSuperAdmin in JWT payload'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. RBAC MIDDLEWARE — SUPER_ADMIN bypass logic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RBAC Middleware — SUPER_ADMIN bypass', () => {
  const middleware = readSource('src/lib/rbac/middleware.ts');

  it('requirePermission should check userRole !== "SUPER_ADMIN"', () => {
    assert.ok(
      middleware.includes("userRole !== 'SUPER_ADMIN' && !hasPermission(userRole, permission)"),
      'requirePermission must check role === SUPER_ADMIN for bypass'
    );
  });

  it('withRBAC should check userRole !== "SUPER_ADMIN"', () => {
    assert.ok(
      middleware.includes("if (userRole !== 'SUPER_ADMIN')"),
      'withRBAC must check role === SUPER_ADMIN for bypass'
    );
  });

  it('requireSuperAdmin should check tokenPayload.role !== "SUPER_ADMIN"', () => {
    assert.ok(
      middleware.includes("tokenPayload.role !== 'SUPER_ADMIN'"),
      'requireSuperAdmin must check role === SUPER_ADMIN'
    );
  });

  it('middleware should NOT reference isSuperAdmin anywhere', () => {
    assert.ok(
      !middleware.includes('isSuperAdmin'),
      'Middleware must NOT reference isSuperAdmin'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. API ROUTES — Authorization checks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('API Routes — authorization checks use role, not isSuperAdmin', () => {
  it('admin/users route should check token?.role === "SUPER_ADMIN"', () => {
    const route = readSource('src/app/api/admin/users/route.ts');
    assert.ok(
      route.includes("token?.role === 'SUPER_ADMIN'"),
      'admin/users route must check role'
    );
    assert.ok(
      !route.includes('token?.isSuperAdmin'),
      'admin/users route must NOT check token.isSuperAdmin'
    );
  });

  it('admin/users route should NOT select isSuperAdmin from DB', () => {
    const route = readSource('src/app/api/admin/users/route.ts');
    assert.ok(
      !route.includes('isSuperAdmin: true,'),
      'admin/users route select must NOT include isSuperAdmin'
    );
  });

  it('admin/audit-logs route should check token.role === "SUPER_ADMIN"', () => {
    const route = readSource('src/app/api/admin/audit-logs/route.ts');
    assert.ok(
      route.includes("token.role === 'SUPER_ADMIN'"),
      'audit-logs route must check role'
    );
    assert.ok(
      !route.includes('token.isSuperAdmin'),
      'audit-logs route must NOT check token.isSuperAdmin'
    );
  });

  it('admin/master-data route should check token.role === "SUPER_ADMIN"', () => {
    const route = readSource('src/app/api/admin/master-data/route.ts');
    assert.ok(
      route.includes("token.role !== 'SUPER_ADMIN'"),
      'master-data route must check role'
    );
    assert.ok(
      !route.includes('token.isSuperAdmin'),
      'master-data route must NOT check token.isSuperAdmin'
    );
  });

  it('admin/businesses/[id]/delete route should check token.role', () => {
    const route = readSource('src/app/api/admin/businesses/[id]/delete/route.ts');
    assert.ok(
      route.includes("token.role !== 'SUPER_ADMIN'"),
      'businesses delete route must check role'
    );
    assert.ok(
      !route.includes('isSuperAdmin'),
      'businesses delete route must NOT reference isSuperAdmin'
    );
  });

  it('auth/me route should NOT select isSuperAdmin from DB', () => {
    const route = readSource('src/app/api/auth/me/route.ts');
    assert.ok(
      !route.includes('isSuperAdmin: true'),
      'auth/me route must NOT select isSuperAdmin'
    );
  });

  it('users route should NOT select isSuperAdmin from DB', () => {
    const route = readSource('src/app/api/users/route.ts');
    assert.ok(
      !route.includes('isSuperAdmin: true'),
      'users route must NOT select isSuperAdmin'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. FRONTEND — No isSuperAdmin field, uses role check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Frontend — uses role check instead of isSuperAdmin', () => {
  it('User type in api.ts should NOT have isSuperAdmin field', () => {
    const apiTs = readSource('src/lib/api.ts');
    const userTypeSection = apiTs.split('export interface User {')[1]?.split('}')[0] || '';
    assert.ok(
      !userTypeSection.includes('isSuperAdmin'),
      'User type must NOT contain isSuperAdmin'
    );
  });

  it('auth-context should NOT have normalizeUser function', () => {
    const authContext = readSource('src/contexts/auth-context.tsx');
    assert.ok(
      !authContext.includes('function normalizeUser'),
      'auth-context must NOT have normalizeUser function'
    );
    assert.ok(
      !authContext.includes('normalizeUser('),
      'auth-context must NOT call normalizeUser'
    );
  });

  it('dashboard layout should pass SUPER_ADMIN role as-is', () => {
    const layout = readSource('src/app/dashboard/layout.tsx');
    assert.ok(
      !layout.includes("user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role"),
      'Dashboard layout must NOT normalize SUPER_ADMIN to ADMIN'
    );
    assert.ok(
      !layout.includes('isSuperAdmin:'),
      'Dashboard layout must NOT pass isSuperAdmin'
    );
  });

  it('admin users page should derive isSuperAdmin from role', () => {
    const page = readSource('src/app/dashboard/admin/users/page.tsx');
    assert.ok(
      page.includes("user?.role === 'SUPER_ADMIN'"),
      'Users page must derive isSuperAdmin from role'
    );
    assert.ok(
      !page.includes('(user as any)?.isSuperAdmin'),
      'Users page must NOT use isSuperAdmin field'
    );
  });

  it('admin analytics page should derive isSuperAdmin from role', () => {
    const page = readSource('src/app/dashboard/admin/analytics/page.tsx');
    assert.ok(
      page.includes("user?.role === 'SUPER_ADMIN'"),
      'Analytics page must derive isSuperAdmin from role'
    );
  });

  it('admin logs page should derive isSuperAdmin from role', () => {
    const page = readSource('src/app/dashboard/admin/logs/page.tsx');
    assert.ok(
      page.includes("user?.role === 'SUPER_ADMIN'"),
      'Logs page must derive isSuperAdmin from role'
    );
  });

  it('admin business-verification page should derive isSuperAdmin from role', () => {
    const page = readSource('src/app/dashboard/admin/business-verification/page.tsx');
    assert.ok(
      page.includes("user?.role === 'SUPER_ADMIN'"),
      'Business verification page must derive isSuperAdmin from role'
    );
  });

  it('admin master-data page should derive isSuperAdmin from role', () => {
    const page = readSource('src/app/dashboard/admin/master-data/page.tsx');
    assert.ok(
      page.includes("user?.role === 'SUPER_ADMIN'"),
      'Master data page must derive isSuperAdmin from role'
    );
    assert.ok(
      !page.includes('user?.isSuperAdmin'),
      'Master data page must NOT use isSuperAdmin field'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. CREATE SUPER ADMIN SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Create Super Admin script', () => {
  it('should create users with role: "SUPER_ADMIN"', () => {
    const script = readSource('scripts/create-super-admin.ts');
    assert.ok(
      script.includes("role: 'SUPER_ADMIN'"),
      'Script must create users with role: SUPER_ADMIN'
    );
  });

  it('should update existing users to role: "SUPER_ADMIN"', () => {
    const script = readSource('scripts/create-super-admin.ts');
    assert.ok(
      script.includes("role: 'SUPER_ADMIN'"),
      'Script must update existing users to SUPER_ADMIN'
    );
  });

  it('should NOT reference isSuperAdmin or role: "ADMIN"', () => {
    const script = readSource('scripts/create-super-admin.ts');
    assert.ok(
      !script.includes('isSuperAdmin'),
      'Script must NOT reference isSuperAdmin'
    );
    // The script should use SUPER_ADMIN, not ADMIN
    const createSection = script.split('prisma.user.create')[1]?.split('})')[0] || '';
    assert.ok(
      !createSection.includes("role: 'ADMIN'"),
      'Script create section must NOT use role: ADMIN'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. ROLE CHANGE API — Valid roles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Role change API — valid roles', () => {
  it('should accept all valid roles including SUPER_ADMIN', () => {
    const route = readSource('src/app/api/admin/users/[id]/role/route.ts');
    assert.ok(
      route.includes("'SUPER_ADMIN'"),
      'Role change API must accept SUPER_ADMIN'
    );
    assert.ok(
      route.includes("'DEVELOPMENT_PARTNER'"),
      'Role change API must accept DEVELOPMENT_PARTNER'
    );
    assert.ok(
      route.includes("'TSI'"),
      'Role change API must accept TSI'
    );
    assert.ok(
      route.includes("'MDA'"),
      'Role change API must accept MDA'
    );
    assert.ok(
      route.includes("'MISSION'"),
      'Role change API must accept MISSION'
    );
  });

  it('should NOT have stale role values (CONTENT_MANAGER, MODERATOR, VIEWER)', () => {
    const route = readSource('src/app/api/admin/users/[id]/role/route.ts');
    assert.ok(
      !route.includes("'CONTENT_MANAGER'"),
      'Role change API must NOT contain CONTENT_MANAGER'
    );
    assert.ok(
      !route.includes("'MODERATOR'"),
      'Role change API must NOT contain MODERATOR'
    );
    assert.ok(
      !route.includes("'VIEWER'"),
      'Role change API must NOT contain VIEWER'
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. GLOBAL CHECK — No residual isSuperAdmin references in source
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Global check — no residual isSuperAdmin database references', () => {
  it('API routes should NOT query isSuperAdmin from Prisma', () => {
    const apiFiles = [
      'src/app/api/admin/users/route.ts',
      'src/app/api/auth/me/route.ts',
      'src/app/api/users/route.ts',
      'src/app/api/admin/businesses/[id]/delete/route.ts',
    ];

    for (const file of apiFiles) {
      const content = readSource(file);
      // Check there's no select: { isSuperAdmin: true } or similar Prisma queries
      assert.ok(
        !content.includes('select: {') || !content.includes('isSuperAdmin: true'),
        `${file} must NOT select isSuperAdmin from database`
      );
    }
  });

  it('no API route should set isSuperAdmin in JWT payload', () => {
    const authFiles = [
      'src/app/api/auth/login/route.ts',
      'src/app/api/auth/verify-otp/route.ts',
    ];

    for (const file of authFiles) {
      const content = readSource(file);
      assert.ok(
        !content.includes('isSuperAdmin: user.isSuperAdmin'),
        `${file} must NOT include isSuperAdmin in JWT payload`
      );
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// node:test handles pass/fail reporting and exit code automatically.
// A non-zero exit code means at least one test failed.
