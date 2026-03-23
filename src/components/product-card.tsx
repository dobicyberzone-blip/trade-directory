'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Edit, Languages } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useState } from 'react';
import { ProductTranslateDialog } from './product-translate-dialog';

interface ProductType {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  category?: string;
}

export function ProductCard({ product, businessId }: { product: ProductType, businessId: string }) {
  const { user } = useAuth();
  const [isTranslateOpen, setTranslateOpen] = useState(false);

  const isOwner = user?.id === businessId;

  return (
    <>
      <div className="group h-full flex flex-col">
        <div className="relative h-48 w-full">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-semibold text-lg truncate flex-grow" title={product.name}>{product.name}</h3>
          
          <div className="flex items-center justify-between mt-4">
            <p className="font-bold text-primary text-xl">
              {product.price?.toLocaleString()} {product.currency || 'KES'}
            </p>
            <div className="flex gap-2">
              {isOwner ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setTranslateOpen(true)}>
                    <Languages className="mr-2 h-4 w-4" />
                    Translate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/products/${product.id}/inquire?businessId=${businessId}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Inquire
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {isOwner && (
        <ProductTranslateDialog
          isOpen={isTranslateOpen}
          onOpenChange={setTranslateOpen}
          product={product}
        />
      )}
    </>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-1/3 mb-2" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-2/3 mt-1" />
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
