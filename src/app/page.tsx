'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/home/hero-section';
import { VerificationBadgeSection } from '@/components/home/verification-badge-section';
import { BenefitsSection } from '@/components/home/benefits-section';
import { PlatformFeaturesSection } from '@/components/home/platform-features-section';
import { StatisticsTicker } from '@/components/home/statistics-ticker';
import { RegistrationProcess } from '@/components/home/registration-process';
import { SuccessStoriesCarousel } from '@/components/home/success-stories-carousel';
import { useAuth } from '@/contexts/auth-context';

// Dynamic imports for carousel components - code splitting for better performance
const UserProfilesCarousel = dynamic(() => import('@/components/home/user-profiles-carousel').then(mod => ({ default: mod.UserProfilesCarousel })), {
  loading: () => <div className="h-96 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>,
  ssr: false
});

const PartnerLogosCarousel = dynamic(() => import('@/components/home/partner-logos-carousel').then(mod => ({ default: mod.PartnerLogosCarousel })), {
  loading: () => <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
});

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-20 md:pt-24">
        <HeroSection />
        <VerificationBadgeSection />
        {/* Only show verified exporters section when user is logged in */}
        {!isLoading && isAuthenticated && <UserProfilesCarousel />}
        <BenefitsSection />
        <SuccessStoriesCarousel />
        <PlatformFeaturesSection />
        <StatisticsTicker />
        <RegistrationProcess />
        <PartnerLogosCarousel />
      </main>
      <Footer />
    </div>
  );
}
