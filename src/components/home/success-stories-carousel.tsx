'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SuccessStory {
  id: string;
  title: string;
  story: string;
  companyName: string;
  buyerName: string;
  buyerTitle?: string;
  exporterName: string;
  productCategory: string;
  exportValue?: string;
  exportDestination: string;
  imageUrl?: string;
  isFeatured: boolean;
  createdAt: string;
}

// Fallback seed data if no featured stories exist
const fallbackStories: SuccessStory[] = [
  {
    id: '1',
    title: 'Fresh Avocados to Europe',
    story: 'Working with this platform helped us connect with reliable buyers in Europe. Our avocado exports have grown by 300% in just one year!',
    companyName: 'European Fresh Foods Ltd',
    buyerName: 'Sarah Johnson',
    buyerTitle: 'Procurement Manager',
    exporterName: 'Green Valley Farms',
    productCategory: 'Fresh Avocados',
    exportValue: '$500,000',
    exportDestination: 'Netherlands',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Coffee Beans to USA',
    story: 'The verification badge gave us credibility with international buyers. We secured our first major contract within 2 months of joining!',
    companyName: 'Premium Coffee Roasters',
    buyerName: 'Michael Chen',
    buyerTitle: 'Head of Sourcing',
    exporterName: 'Highland Coffee Co-op',
    productCategory: 'Arabica Coffee',
    exportValue: '$750,000',
    exportDestination: 'United States',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Tea Export Success',
    story: 'The platform made it easy to showcase our quality certifications. We now export to 5 countries and our business has doubled!',
    companyName: 'Asian Tea Importers',
    buyerName: 'Priya Patel',
    buyerTitle: 'Director',
    exporterName: 'Kericho Tea Estates',
    productCategory: 'Premium Black Tea',
    exportValue: '$1,200,000',
    exportDestination: 'United Kingdom',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
];

export function SuccessStoriesCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [activeIndex, setActiveIndex] = useState(0);
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    useEffect(() => {
        loadSuccessStories();
    }, []);

    const loadSuccessStories = async () => {
        try {
            const response = await fetch('/api/success-stories?featured=true&approved=true');
            if (response.ok) {
                const data = await response.json();
                const featuredStories = data.stories || [];
                
                // Use featured stories from database, or fallback to seed data
                setStories(featuredStories.length > 0 ? featuredStories : fallbackStories);
            } else {
                // Use fallback on error
                setStories(fallbackStories);
            }
        } catch (error) {
            // Use fallback on error
            setStories(fallbackStories);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        
        const timer = setInterval(scrollNext, 8000);
        return () => {
            clearInterval(timer);
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, scrollNext]);

    if (isLoading) {
        return (
            <section className="py-16 md:py-24 bg-background overflow-hidden">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">Export Success Stories</h2>
                    <div className="flex items-center justify-center h-64 mt-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
         <section className="py-16 md:py-24 bg-background overflow-hidden">
             <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">Export Success Stories</h2>
                <div className="relative mt-12">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {stories.map((story) => (
                                <div key={story.id} className="flex-[0_0_100%] min-w-0 px-4">
                                     <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-3xl mx-auto">
                                        <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-primary/50">
                                            <AvatarImage src={story.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.buyerName)}&background=059669&color=fff`} />
                                            <AvatarFallback>{story.buyerName.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-lg md:text-xl italic text-muted-foreground">&quot;{story.story.length > 200 ? story.story.substring(0, 200) + '...' : story.story}&quot;</p>
                                        <p className="mt-4 font-bold text-lg text-foreground">{story.buyerName}, <span className="font-normal text-primary">{story.companyName}</span></p>
                                        <div className="mt-4 inline-block bg-accent/20 text-yellow-900 px-4 py-2 rounded-full font-semibold text-sm">
                                            {story.exportValue ? `Export Value: ${story.exportValue}` : `${story.productCategory} to ${story.exportDestination}`}
                                        </div>
                                         <div className="mt-4 flex justify-center">
                                             <div className="flex items-center gap-1 text-green-600">
                                                <ShieldCheck className="h-5 w-5" />
                                                <span className="text-xs font-bold">Verified Member</span>
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <Button variant="outline" size="icon" onClick={scrollPrev} className="absolute top-1/2 left-0 md:-left-4 -translate-y-1/2 rounded-full h-12 w-12 z-10"><ArrowLeft /></Button>
                     <Button variant="outline" size="icon" onClick={scrollNext} className="absolute top-1/2 right-0 md:-right-4 -translate-y-1/2 rounded-full h-12 w-12 z-10"><ArrowRight /></Button>
                </div>
                 <div className="flex justify-center gap-2 mt-8">
                    {stories.map((_, index) => (
                        <button key={index} onClick={() => emblaApi?.scrollTo(index)} className={cn("h-2 w-2 rounded-full transition-all duration-300", activeIndex === index ? "w-6 bg-primary" : "bg-muted-foreground/50")}></button>
                    ))}
                </div>
            </div>
        </section>
    );
}
