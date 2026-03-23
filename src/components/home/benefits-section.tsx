'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Benefit {
    title: string;
    description: string;
    icon?: string;
}

const exporterBenefits: Benefit[] = [
    { title: "Global Visibility", description: "Reach thousands of international buyers actively sourcing from Kenya." },
    { title: "Build Credibility", description: "Gain a competitive edge with a government-issued verification badge." },
    { title: "Receive Inquiries", description: "Get qualified buyer leads and direct messages through our secure platform." },
    { title: "Grow Your Business", description: "Access new markets, trade information, and export opportunities." },
];

const buyerBenefits: Benefit[] = [
    { title: "Trusted Suppliers", description: "Source from a pool of exporters pre-verified by a government agency." },
    { title: "Easy Discovery", description: "Utilize advanced search and filters to find the exact products you need." },
    { title: "Quality Assurance", description: "Connect with certified exporters who meet international standards." },
    { title: "Direct Connection", description: "Communicate directly and securely with suppliers to build relationships." },
];

function BenefitsList({ benefits }: { benefits: Benefit[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center mt-1">
                        <Check size={16} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function BenefitsSection() {
    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12">A Platform Built for Growth</h2>
                <Tabs defaultValue="exporters" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto h-12">
                        <TabsTrigger value="exporters" className="text-base h-full">For Exporters</TabsTrigger>
                        <TabsTrigger value="buyers" className="text-base h-full">For Buyers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="exporters" className="mt-8">
                        <Card>
                            <CardContent className="p-8 md:p-12">
                                <BenefitsList benefits={exporterBenefits} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="buyers" className="mt-8">
                        <Card>
                            <CardContent className="p-8 md:p-12">
                                <BenefitsList benefits={buyerBenefits} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
