'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

type AllowedRole = 'buyer' | 'partner' | 'exporter' | 'admin';

/**
 * Redirects the user if they don't have the required role.
 * PARTNER is now a first-class role stored directly in the DB.
 */
export function useRoleGuard(allowedRole: AllowedRole) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    const role = user.role.toLowerCase();

    let allowed = false;
    switch (allowedRole) {
      case 'buyer':    allowed = role === 'buyer'; break;
      case 'partner':  allowed = role === 'partner'; break;
      case 'exporter': allowed = role === 'exporter'; break;
      case 'admin':    allowed = role === 'admin' || role === 'super_admin'; break;
    }

    if (!allowed) {
      if (role === 'admin' || role === 'super_admin') { router.replace('/dashboard/admin'); return; }
      if (role === 'exporter') { router.replace('/dashboard/exporter'); return; }
      if (role === 'partner')  { router.replace('/dashboard/partner'); return; }
      router.replace('/dashboard/buyer');
    }
  }, [user, isLoading, allowedRole, router]);

  return { user, isLoading };
}
