'use client';
import Image from 'next/image';

export function PartnerLogosCarousel() {
     const logos = [
        { name: "JAPAN", src: "/Japan.jpg", height: "h-20" },
        { name: "UNDP", src: "/UNDP.png", height: "h-28" },
        { name: "Gov Kenya", src: "/GOK.png", height: "h-20" },
        {  name: "KAM", src: "/KAM.png", height: "h-20" },
        { name: "KNCCI", src: "/KNCCI.png", height: "h-20" },
    ];
    return (
        <section className="py-12 md:py-16 bg-background">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-center text-muted-foreground mb-8">Supported By</h2>
                <div className="relative w-full overflow-hidden">
                    <div className="flex animate-infinite-scroll group-hover:paused">
                        {[...logos, ...logos].map((logo, index) => (
                            <div key={index} className="flex-shrink-0 w-48 mx-8 flex items-center justify-center" >
                                <Image
                                    src={logo.src}
                                    alt={logo.name}
                                    width={200}
                                    height={100}
                                    className={`${logo.height} w-auto object-contain`}
                                    loading="lazy"
                                    sizes="(max-width: 768px) 100px, 200px"
                                />
                            </div>
                          ))}
                    </div>
                </div>
            </div>
             <style jsx>{`
                @keyframes infinite-scroll {
                  from { transform: translateX(0); }
                  to { transform: translateX(-50%); }
                }
                .animate-infinite-scroll {
                  animation: infinite-scroll 40s linear infinite;
                }
            `}</style>
        </section>
    );
}
