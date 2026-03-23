
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import Link from 'next/link';

const steps = [
    { 
        title: "Register Your Account", 
        description: "Create your exporter account in minutes. Provide your basic company information to get started on your export journey.",
        image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1287&auto=format&fit=crop"
    },
    { 
        title: "Complete Your Profile", 
        description: "Build a comprehensive and attractive business profile. Add products, services, certifications, and your company story to stand out to international buyers.",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1470&auto=format&fit=crop"
    },
    { 
        title: "Get Verified & Go Global", 
        description: "Submit your profile for review by KEPROBA. Once approved, you'll receive your official verification badge and be visible to a global network of buyers.",
        image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=1470&auto=format&fit=crop"
    },
];

export function RegistrationProcess() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12">Get Started in 3 Simple Steps</h2>
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "p-6 rounded-lg border-2 cursor-pointer transition-all",
                                    activeIndex === index 
                                        ? "border-primary bg-primary/5 shadow-lg" 
                                        : "border-transparent hover:bg-muted/50"
                                )}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors",
                                        activeIndex === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
                                         <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="relative h-80 md:h-[450px] rounded-lg overflow-hidden shadow-2xl">
                        {steps.map((step, index) => (
                             <Image 
                                key={index}
                                src={step.image} 
                                alt={step.title} 
                                fill 
                                className={cn(
                                    "object-cover transition-opacity duration-700",
                                    activeIndex === index ? "opacity-100" : "opacity-0"
                                )}
                            />
                        ))}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                         <div className="absolute bottom-6 left-6 right-6">
                            <Button asChild size="lg" className="w-full">
                                <Link href="/register">Start Your Application</Link>
                            </Button>
                         </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
