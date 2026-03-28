'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';
import { DashboardThemeProvider, MainLayout, Loader } from '@/components/ui-dashboard';

// ==============================|| DASHBOARD LAYOUT ||============================== //

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before checking auth
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, isMounted]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading only during initial mount or when explicitly loading
  if (!isMounted) {
    return (
      <DashboardThemeProvider>
        <Loader />
      </DashboardThemeProvider>
    );
  }

  // Show loading if not authenticated and still checking (will redirect)
  if (!isAuthenticated && isLoading) {
    return (
      <DashboardThemeProvider>
        <Loader />
      </DashboardThemeProvider>
    );
  }

  // If not authenticated and not loading, redirect is happening
  if (!isAuthenticated || !user) {
    return null; // Let the redirect happen without showing loader
  }

  return (
    <DashboardThemeProvider>
      <MainLayout
        user={{
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: (user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role) as 'ADMIN' | 'EXPORTER' | 'BUYER',
          isSuperAdmin: (user as any).isSuperAdmin || user.role === 'SUPER_ADMIN',
          partnerType: (user as any).partnerType,
          avatar: user.profileImage || user.avatar,
          createdAt: user.createdAt,
        }}
        onLogout={handleLogout}
      >
        {children}
      </MainLayout>
    </DashboardThemeProvider>
  );
}
