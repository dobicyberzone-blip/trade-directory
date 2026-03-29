'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

export function ProductInquiryDetails({ productId, businessId, variant = 'default' }: { productId: string, businessId: string, variant?: 'default' | 'sidebar' }) {
  const firestore = useFirestore();
  
  const productDocRef = useMemoFirebase(() => {
    if (!firestore || !productId || !businessId) return null;
    return doc(firestore, 'businesses', businessId, 'products', productId);
  }, [firestore, productId, businessId]);

  const { data: product, isLoading } = useDoc(productDocRef);

  if (isLoading) {
    return <Skeleton className="h-5 w-32" />;
  }

  if (!product) {
    return <span className="text-muted-foreground text-sm">Product not found</span>;
  }

  if (variant === 'sidebar') {
     return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
            <Package className="h-4 w-4 flex-shrink-0" />
            {/* @ts-ignore */}
            <span className="truncate">Inquiry about {product.name}</span>
        </div>
     )
  }

  return (
    <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 rounded-sm overflow-hidden flex-shrink-0">
            {product.imageUrl?.startsWith('data:') || product.imageUrl?.startsWith('blob:') ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              /* @ts-ignore */
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
            )}
        </div>
        {/* @ts-ignore */}
        <span>{product.name}</span>
    </div>
  );
}
