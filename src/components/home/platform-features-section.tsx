'use client';

import { Search, Map, MessagesSquare, BarChart, FileText, Languages } from 'lucide-react';

interface Feature {
    name: string;
    description: string;
    icon: string;
    order: number;
}

const iconMap: Record<string, React.ReactNode> = {
    'search': <Search />,
    'map': <Map />,
    'message-square': <MessagesSquare />,
    'bar-chart': <BarChart />,
    'file-text': <FileText />,
    'languages': <Languages />,
};

const features: Feature[] = [
    { name: "Advanced Search", description: "Filter by product, location, certification", icon: "search", order: 1 },
    { name: "Interactive Map", description: "Visual exporter discovery", icon: "map", order: 2 },
    { name: "Secure Messaging", description: "Protected communication", icon: "message-square", order: 3 },
    { name: "Export Analytics", description: "Performance insights", icon: "bar-chart", order: 4 },
    { name: "Document Management", description: "Upload certificates", icon: "file-text", order: 5 },
    { name: "Multi-language", description: "All 100+ languages supported", icon: "languages", order: 6 },
];

export function PlatformFeaturesSection() {
    return (
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">Powerful Trade Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {features.map(feature => (
                        <div key={feature.name} className="flex items-start gap-4">
                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {iconMap[feature.icon] || <Search />}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{feature.name}</h4>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
