'use client';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ExporterProfileCard } from '@/components/exporter-profile-card';
import { ExporterGridCard } from '@/components/exporter-grid-card';
import { apiClient, Business } from '@/lib/api';
import Link from 'next/link';
import { X, Heart } from 'lucide-react';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface FeaturedExporter extends Business {
  featuredOrder?: number;
}

export function UserProfilesCarousel() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [api, setApi] = useState<CarouselApi>();
    const [selectedProfile, setSelectedProfile] = useState<FeaturedExporter | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [featuredExporters, setFeaturedExporters] = useState<FeaturedExporter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Use ref instead of state to avoid re-renders on scroll
    const hasGoogleTranslateRef = useRef(false);
    const [googleTranslateOffset, setGoogleTranslateOffset] = useState(false);

    const modalRef = useClickOutside<HTMLDivElement>(
        () => setIsDialogOpen(false),
        isDialogOpen
    );

    // Lock body scroll when modal open, restore on close
    useEffect(() => {
        if (isDialogOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isDialogOpen]);

    useEffect(() => {
        loadFeaturedExporters();
    }, []);

    // Stop carousel auto-scroll when modal is open
    useEffect(() => {
        if (!api || isDialogOpen) return;
        const timer = setInterval(() => {
            api.scrollNext();
        }, 5000);
        return () => clearInterval(timer);
    }, [api, isDialogOpen]);

    // Google Translate detection - only update state when value actually changes
    useEffect(() => {
        const checkGoogleTranslate = () => {
            const bannerFrame = document.querySelector('.goog-te-banner-frame') as HTMLElement;
            const isBannerVisible = bannerFrame && bannerFrame.style.display !== 'none' && bannerFrame.offsetHeight > 0;
            const bodyTop = document.body.style.top;
            const hasOffset = !!(isBannerVisible || (bodyTop && bodyTop !== '0px' && bodyTop !== ''));
            // Only trigger re-render if value actually changed
            if (hasOffset !== hasGoogleTranslateRef.current) {
                hasGoogleTranslateRef.current = hasOffset;
                setGoogleTranslateOffset(hasOffset);
            }
        };
        checkGoogleTranslate();
        const interval = setInterval(checkGoogleTranslate, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadFeaturedExporters = async () => {
        try {
            setIsLoading(true);
            try {
                const businessesResponse = await apiClient.getBusinesses({ featured: true, verified: true });
                if (businessesResponse.businesses.length > 0) {
                    setFeaturedExporters(businessesResponse.businesses.slice(0, 6));
                    return;
                }
            } catch { /* fall through */ }
            try {
                const settingsResponse = await apiClient.getSiteSettingOptional('featured_exporters');
                if (settingsResponse.setting?.settingValue) {
                    const featuredIds = JSON.parse(settingsResponse.setting.settingValue);
                    const businessesResponse = await apiClient.getBusinesses({ verified: true });
                    const featured = featuredIds
                        .map((item: { businessId: string; order: number }) => {
                            const business = businessesResponse.businesses.find(b => b.id === item.businessId);
                            return business ? { ...business, featuredOrder: item.order } : null;
                        })
                        .filter((b: FeaturedExporter | null): b is FeaturedExporter => b !== null)
                        .sort((a: FeaturedExporter, b: FeaturedExporter) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
                    if (featured.length > 0) { setFeaturedExporters(featured); return; }
                }
            } catch { /* fall through */ }
            const businessesResponse = await apiClient.getBusinesses({ verified: true });
            setFeaturedExporters(businessesResponse.businesses.slice(0, 6));
        } catch {
            setFeaturedExporters([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewProfile = useCallback((profile: FeaturedExporter) => {
        setSelectedProfile(profile);
        setIsDialogOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsDialogOpen(false);
        setSelectedProfile(null);
    }, []);

    const handleFavoriteClick = useCallback(async () => {
        if (!user || !selectedProfile) return;
        if (!user) {
            toast({ title: 'Login Required', description: 'Please login to add businesses to your favorites.', variant: 'destructive' });
            return;
        }
        try {
            const response = await apiClient.checkFavoriteStatus(selectedProfile.id);
            if (response.isFavorited) {
                await apiClient.removeFromFavorites(selectedProfile.id);
                toast({ title: 'Removed from Favorites', description: `${selectedProfile.name} removed from favorites.` });
            } else {
                await apiClient.addToFavorites(selectedProfile.id);
                toast({ title: 'Added to Favorites', description: `${selectedProfile.name} added to favorites.` });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to update favorites.', variant: 'destructive' });
        }
    }, [user, selectedProfile, toast]);

    if (isLoading) {
        return (
            <section className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">Meet Our Verified Exporters</h2>
                    <div className="mt-12 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (featuredExporters.length === 0) {
        return (
            <section className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">Meet Our Verified Exporters</h2>
                    <div className="mt-12 text-center">
                        <p className="text-muted-foreground">No featured exporters available at the moment.</p>
                        <p className="text-sm text-muted-foreground mt-2">Check back soon for verified exporters!</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary">Meet Our Verified Exporters</h2>
                        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                            Discover trusted, verified Kenyan exporters ready to connect with global buyers
                        </p>
                    </div>
                    
                    <div className="relative overflow-hidden">
                        <Carousel
                            setApi={setApi}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {featuredExporters.slice(0, 10).map((profile) => (
                                    <CarouselItem key={profile.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                                        <div className="h-full pr-1">
                                            <ExporterGridCard 
                                                business={profile} 
                                                onViewProfileClick={() => handleViewProfile(profile)}
                                                hideActions={true}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex -left-10" />
                            <CarouselNext className="hidden md:flex -right-10" />
                        </Carousel>
                    </div>

                    {/* View All Button */}
                    <div className="mt-12 text-center">
                        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                            <Link href="/directory">
                                View All Exporters
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Exporter Profile Modal - Modal on Desktop, Full Screen on Mobile */}
            {isDialogOpen && selectedProfile ? (
                <>
                    {/* Desktop: Dialog with backdrop */}
                    <div className="hidden md:block">
                        <div
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div
                                ref={modalRef}
                                className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close button - top right */}
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                {/* Landscape layout container - prevents horizontal scroll */}
                                <div className="overflow-y-auto overflow-x-hidden max-h-[90vh]">
                                    <ExporterProfileCard
                                        business={selectedProfile}
                                        onPinClick={handleCloseModal}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile: Full Screen with Back Button */}
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col"
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {/* Sticky Header */}
                        <div className={`sticky z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0 ${googleTranslateOffset ? 'top-10' : 'top-0'}`}>
                            <div className="px-3 py-3 sm:px-4 sm:py-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                                    >
                                        <X className="h-5 w-5" />
                                        <span className="font-medium">Back</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {user?.role !== 'EXPORTER' && (
                                            <button
                                                onClick={handleFavoriteClick}
                                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-50 transition-colors"
                                            >
                                                <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
                                            </button>
                                        )}
                                        {selectedProfile.verificationStatus === 'VERIFIED' ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 text-white border border-emerald-400 shadow-md whitespace-nowrap">
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                                                    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
                                                </svg>
                                                <span>Verified</span>
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap">
                                                Pending
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="px-3 pt-6 pb-8 sm:px-4">
                                <ExporterProfileCard
                                    business={selectedProfile}
                                    onPinClick={handleCloseModal}
                                    hideBadgeOnMobile={true}
                                />
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </>
    );
}