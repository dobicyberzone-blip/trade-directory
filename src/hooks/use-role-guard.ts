'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

type AllowedRole = 'buyer' | 'partner' | 'exporter' | 'admin';

/**
 * Redirects the user if they don't have the required role.
 * Partners are BUYER role with a partnerType set.
 */
export function useRoleGuard(allowedRole: AllowedRole) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    const role = user.role.toLowerCase();
    const isPartner = role === 'buyer' && !!(user as any).partnerType;
    const isBuyer = role === 'buyer' && !(user as any).partnerType;
    const isExporter = role === 'exporter';
    const isAdmin = role === 'admin' || role === 'super_admin';

    let allowed = false;
    switch (allowedRole) {
      case 'buyer':   allowed = isBuyer; break;
      case 'partner': allowed = isPartner; break;
      case 'exporter': allowed = isExporter; break;
      case 'admin':   allowed = isAdmin; break;
    }

    if (!allowed) {
      // Redirect to their correct dashboard
      if (isAdmin)    { router.replace('/dashboard/admin'); return; }
      if (isExporter) { router.replace('/dashboard/exporter'); return; }
      if (isPartner)  { router.replace('/dashboard/partner'); return; }
      router.replace('/dashboard/buyer');
    }
  }, [user, isLoading, allowedRole, router]);

  return { user, isLoading };
}
