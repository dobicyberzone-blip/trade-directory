'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ResponsiveButton } from '@/components/ui/responsive-button';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

// Carousel interval - 6 seconds per slide
const INTERVAL = 6000;

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    buttonText: string;
    buttonLink: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    isActive: boolean;
    order: number;
}

// Static hero slides - ordered to start with image1
const STATIC_SLIDES: HeroSlide[] = [
    {
        id: 'hero-1',
        title: 'The Official Trade Directory for Kenyan Exporters',
        subtitle: 'Connecting Kenya to the world. Discover quality products and trusted suppliers, all verified by KEPROBA.',
        imageUrl: '/carosel/image1.jpg',
        buttonText: 'Explore Directory',
        buttonLink: '/directory',
        secondaryButtonText: 'View on Map',
        secondaryButtonLink: '/directory',
        isActive: true,
        order: 0
    },
    {
        id: 'hero-2',
        title: 'Verified Kenyan Exporters at Your Fingertips',
        subtitle: 'Access a curated database of vetted suppliers across agriculture, manufacturing, and services.',
        imageUrl: '/carosel/image2.jpg',
        buttonText: 'Find Exporters',
        buttonLink: '/directory',
        secondaryButtonText: 'Explore Map',
        secondaryButtonLink: '/directory',
        isActive: true,
        order: 1
    },
    {
        id: 'hero-3',
        title: 'Expand Your Global Reach',
        subtitle: 'Connect with verified international buyers and grow your export business with KEPROBA verification.',
        imageUrl: '/carosel/image3.jpg',
        buttonText: 'Explore Directory',
        buttonLink: '/directory',
        secondaryButtonText: 'Learn More',
        secondaryButtonLink: '/about',
        isActive: true,
        order: 2
    },
    {
        id: 'hero-4',
        title: 'Quality Assured Exports',
        subtitle: 'Every exporter is verified by Kenya Export Promotion and Brand Agency for authenticity.',
        imageUrl: '/carosel/image4.jpg',
        buttonText: 'View Directory',
        buttonLink: '/directory',
        secondaryButtonText: 'About KEPROBA',
        secondaryButtonLink: '/about',
        isActive: true,
        order: 3
    },
    {
        id: 'hero-5',
        title: 'Your Gateway to International Markets',
        subtitle: 'Join Kenya\'s premier trade directory and connect with buyers worldwide.',
        imageUrl: '/carosel/image5.jpg',
        buttonText: 'Browse Directory',
        buttonLink: '/directory',
        secondaryButtonText: 'Register Now',
        secondaryButtonLink: '/register',
        isActive: true,
        order: 4
    }
];

export function HeroSection() {
    const [slides] = useState<HeroSlide[]>(STATIC_SLIDES);
    const [index, setIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0])); // First image is considered loaded
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Preload image function
    const preloadImage = useCallback((src: string, slideIndex: number) => {
        if (loadedImages.has(slideIndex)) return;
        
        const img = new window.Image();
        img.src = src;
        img.onload = () => {
            setLoadedImages(prev => new Set(prev).add(slideIndex));
        };
        img.onerror = () => {

        };
    }, [loadedImages]);

    // Preload next 2 images when component mounts
    useEffect(() => {
        if (slides.length > 1) {
            // Preload second image immediately
            preloadImage(slides[1].imageUrl, 1);
        }
        if (slides.length > 2) {
            // Preload third image after a short delay
            setTimeout(() => {
                preloadImage(slides[2].imageUrl, 2);
            }, 500);
        }
    }, [slides, preloadImage]);

    // Set up the interval for slide rotation
    useEffect(() => {
        if (slides.length < 2) return;

        intervalRef.current = setInterval(() => {
            setIndex(i => (i + 1) % slides.length);
        }, INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [slides.length]);

    // Preload next slide image when index changes
    useEffect(() => {
        if (slides.length === 0) return;
        
        const nextIndex = (index + 1) % slides.length;
        const nextNextIndex = (index + 2) % slides.length;
        
        // Preload next image
        if (!loadedImages.has(nextIndex)) {
            preloadImage(slides[nextIndex].imageUrl, nextIndex);
        }
        
        // Preload the one after that
        if (!loadedImages.has(nextNextIndex)) {
            setTimeout(() => {
                preloadImage(slides[nextNextIndex].imageUrl, nextNextIndex);
            }, 1000);
        }
    }, [index, slides, loadedImages, preloadImage]);

    // If no slides are available, show a placeholder
    if (slides.length === 0) {
        return (
            <section className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[500px] overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                <div className="text-center px-4">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-800">
                        Loading...
                    </h1>
                </div>
            </section>
        );
    }

    const currentSlide = slides[index];

    return (
        <section className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[500px] overflow-hidden">
            {/* Slides */}
            <div className="absolute inset-0">
                {slides.map((slide, i) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out
                            ${i === index
                                ? 'opacity-100 scale-100 z-10'
                                : 'opacity-0 scale-105 z-0'
                            }`}
                    >
                        <Image
                            src={slide.imageUrl}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            priority={i === 0}
                            quality={85}
                            sizes="100vw"
                            loading={i === 0 ? 'eager' : 'lazy'}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="
                        />
                    </div>
                ))}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70 z-10" />

            {/* Content - Responsive Container */}
            <div className="relative z-20 flex h-full items-center justify-center text-center text-white">
                <ResponsiveContainer className="mt-16 sm:mt-20">
                    <h1 
                        key={`title-${currentSlide.id}`}
                        className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg animate-fade-in px-2"
                    >
                        {currentSlide.title}
                    </h1>

                    <p 
                        key={`subtitle-${currentSlide.id}`}
                        className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto drop-shadow-md animate-fade-in-delay px-4"
                    >
                        {currentSlide.subtitle}
                    </p>

                    <div 
                        key={`buttons-${currentSlide.id}`}
                        className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in-delay-2 px-4 max-w-md sm:max-w-none mx-auto"
                    >
                        <ResponsiveButton 
                            asChild 
                            size="lg" 
                            fullWidth
                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all sm:w-auto"
                        >
                            <Link href={currentSlide.buttonLink}>{currentSlide.buttonText}</Link>
                        </ResponsiveButton>
                        {currentSlide.secondaryButtonText && currentSlide.secondaryButtonLink && (
                            <ResponsiveButton 
                                asChild 
                                size="lg" 
                                variant="secondary" 
                                fullWidth
                                className="bg-white text-green-800 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all sm:w-auto"
                            >
                                <Link href={currentSlide.secondaryButtonLink}>{currentSlide.secondaryButtonText}</Link>
                            </ResponsiveButton>
                        )}
                    </div>
                </ResponsiveContainer>
            </div>

            {/* Indicators - Responsive positioning */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex justify-center gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => setIndex(i)}
                            className={`h-2 sm:h-3 rounded-full transition-all duration-300 hover:bg-white touch-manipulation
                                ${i === index ? 'bg-white w-6 sm:w-8' : 'bg-white/50 w-2 sm:w-3'}
                            `}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}