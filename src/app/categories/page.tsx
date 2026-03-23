
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const categories = [
  { name: 'Agriculture', description: 'Fresh produce, coffee, tea, and more.', imageUrl: 'https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=1887&auto=format&fit=crop', href: '/products?sector=Agriculture' },
  { name: 'Textiles & Apparel', description: 'High-quality garments and fabrics.', imageUrl: 'https://images.unsplash.com/photo-1542060748-10c28b62716f?q=80&w=2070&auto=format&fit=crop', href: '/products?sector=Textiles' },
  { name: 'Handicrafts', description: 'Artisanal products and traditional crafts.', imageUrl: 'https://images.unsplash.com/photo-1721713834000-1064fbf2affb?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', href: '/products?sector=Handicrafts' },
  { name: 'Technology', description: 'Innovative software and hardware solutions.', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop', href: '/products?sector=Technology' },
  { name: 'Manufacturing', description: 'Industrial goods and processed products.', imageUrl: 'https://images.unsplash.com/photo-1717386255773-1e3037c81788?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', href: '/products?sector=Manufacturing' },
  { name: 'Services', description: 'Professional, financial, and other services.', imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop', href: '/products?sector=Services' },
];

export default function CategoriesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">Product Categories</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the diverse range of high-quality products and services offered by verified Kenyan exporters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category.name} href={category.href} className="group block">
              <Card className="overflow-hidden h-full flex flex-col">
                <div className="relative h-60 w-full">
                  <Image
                    src={category.imageUrl}
                    alt={`Image for ${category.name}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                    {category.name}
                  </h3>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <p className="text-muted-foreground">{category.description}</p>
                  <div className="mt-4 flex items-center font-semibold text-primary group-hover:underline">
                    <span>Explore Category</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
