
'use client';

import { ShieldCheck } from 'lucide-react';

export function VerificationBadgeSection() {
    return (
        <section className="py-16 md:py-24 text-center bg-background">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary">Government-Verified Trust</h2>
                <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Every exporter on this platform is rigorously vetted by KEPROBA for credibility, compliance, and quality.
                </p>
                <div className="mt-12 flex justify-center">
                    <div className="relative w-48 h-48 animate-pulse">
                        <ShieldCheck className="absolute inset-0 m-auto h-full w-full text-green-100" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-40 h-40 rounded-full bg-green-500 shadow-2xl flex flex-col items-center justify-center text-white">
                                <ShieldCheck className="h-12 w-12" />
                                <span className="text-lg font-bold mt-2">VERIFIED</span>
                                <span className="text-xs">BY KEPROBA</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
