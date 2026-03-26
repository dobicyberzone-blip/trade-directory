import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Building, Globe, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow pt-20 md:pt-24">
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center text-center text-white">
          <Image
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
            alt="Kenya Trade Directory- Connecting Kenyan Exporters to Global Markets"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-w-4xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              About The Kenya Trade Directory
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto drop-shadow-md">
              Facilitating global trade by connecting the world to verified Kenyan exporters.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold text-primary mb-4">Our Organization</h2>
                <p className="text-muted-foreground mb-4">
                  The Kenya Export Promotion and Branding Agency (KEPROBA) is a state corporation established under the State Corporations Act Cap 446 through Legal Notice No. 110 of August 9th, 2019, after the merger of the Export Promotion Council and Brand Kenya Board.
                </p>
                <p className="text-muted-foreground">
                  Our mandate is to implement export promotion and nation branding initiatives and to coordinate the Government of Kenya's efforts to promote the country's goods and services in export markets. The Kenya Trade Directory is our flagship digital platform designed to bridge the gap between Kenyan exporters and international buyers.
                </p>
              </div>
              <div className="order-1 md:order-2">
                  <Image
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop"
                    alt="KEPROBA Team Meeting"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-primary mb-12">Our Mission & Vision</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-4">
                        <Target className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-muted-foreground">To brand and promote Kenyan exports in the global market, and to enhance the competitiveness of Kenyan products and services.</p>
              </div>
              <div className="text-center">
                 <div className="flex justify-center mb-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-4">
                        <Globe className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
                <p className="text-muted-foreground">To be a global leader in promoting Kenya's exports and national brand, fostering sustainable economic growth for the country.</p>
              </div>
              <div className="text-center">
                 <div className="flex justify-center mb-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-4">
                        <Building className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Values</h3>
                <p className="text-muted-foreground">Integrity, Professionalism, Innovation, and a commitment to serving the needs of Kenyan exporters and international buyers.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
