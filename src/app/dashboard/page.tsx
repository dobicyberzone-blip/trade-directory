'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect based on user role with type safety
    const role = user.role.toLowerCase();

    if (role === 'admin' || role === 'super_admin') {
      router.push('/dashboard/admin');
    } else if (role === 'exporter') {
      router.push('/dashboard/exporter');
    } else if (role === 'buyer') {
      router.push('/dashboard/buyer');
    } else if (role === 'partner') {
      router.push('/dashboard/partner');
    } else {
      router.push('/dashboard/buyer');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-gray-100"></div>
      <p className="text-gray-600 dark:text-gray-300">
        Redirecting to your dashboard...
      </p>
    </div>
  );
}