"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Package, Users, ExternalLink, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Business {
  id: string;
  name: string;
  description?: string;
  location: string;
  sector: string;
  rating?: number;
  verificationStatus: string;
  logoUrl?: string;
  featured?: boolean;
  _count?: { products: number };
  products?: Array<{ id: string; name: string; category: string }>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  unit?: string;
  imageUrl?: string;
  business?: {
    id: string;
    name: string;
    location: string;
    logoUrl?: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
  bio?: string;
  profileImage?: string;
  avatar?: string;
  business?: {
    id: string;
    name: string;
    sector: string;
  };
  _count?: { products: number };
}

interface SearchResultsProps {
  results: {
    businesses: Business[];
    products: Product[];
    users: User[];
    totalCount: number;
    hasMore: boolean;
  };
  query: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function SearchResults({ results, query, isLoading, onLoadMore }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState('all');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.totalCount === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We couldn&apos;t find anything matching &quot;{query}&quot;. Try adjusting your search terms or filters.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Suggestions:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your spelling</li>
            <li>• Try more general terms</li>
            <li>• Remove some filters</li>
          </ul>
        </div>
      </div>
    );
  }

  const BusinessCard = ({ business }: { business: Business }) => {
    // Add cache-busting for logo images
    const logoUrl = business.logoUrl 
      ? `${business.logoUrl}${business.logoUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`
      : undefined;
    
    return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
              <AvatarImage src={logoUrl} alt={business.name} />
              <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-xs sm:text-sm md:text-base">
                {business.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                  {business.name}
                  {business.featured && business.verificationStatus === 'VERIFIED' && (
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{business.location}</span>
                  </div>
                  {business.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs sm:text-sm font-medium">{business.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Badge 
                variant={business.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'}
                className={cn(
                  "text-xs flex-shrink-0",
                  business.verificationStatus === 'VERIFIED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                )}
              >
                {business.verificationStatus}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {business.description || `${business.sector} business based in ${business.location}`}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Package className="w-3 h-3" />
                  <span>{business._count?.products || 0} products</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{business.sector}</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto text-xs">
                <Link href={`/directory/${business.id}`}>
                  View Profile
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>

            {business.products && business.products.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Featured Products:</p>
                <div className="flex flex-wrap gap-1">
                  {business.products.slice(0, 3).map((product: { id: string; name: string }) => (
                    <Badge key={product.id} variant="outline" className="text-xs">
                      {product.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {product.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  {product.price && (
                    <span className="text-sm font-medium text-green-600">
                      ${product.price}{product.unit && `/${product.unit}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {product.description}
            </p>

            {product.business && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage 
                        src={product.business.logoUrl 
                          ? `${product.business.logoUrl}${product.business.logoUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`
                          : undefined
                        } 
                        alt={product.business.name} 
                      />
                      <AvatarFallback className="text-xs">
                        {product.business.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.business.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.business.location}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${product.id}`}>
                      View Product
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const UserCard = ({ user }: { user: User }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.profileImage || user.avatar} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                  {user.location && (
                    <>
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {user.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}

            {user.business && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.business.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.business.sector}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {user._count && user._count.products > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Package className="w-3 h-3" />
                        <span>{user._count.products}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/directory/${user.business.id}`}>
                        View Business
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Search Results for &quot;{query}&quot;
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {results.totalCount} result{results.totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="all" className="flex flex-col sm:flex-row items-center sm:space-x-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <span>All</span>
            <Badge variant="secondary" className="mt-1 sm:mt-0 sm:ml-1 text-xs">
              {results.totalCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="businesses" className="flex flex-col sm:flex-row items-center sm:space-x-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mb-1 sm:mb-0" />
            <span className="hidden sm:inline">Businesses</span>
            <span className="sm:hidden">Biz</span>
            <Badge variant="secondary" className="mt-1 sm:mt-0 sm:ml-1 text-xs">
              {results.businesses.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center sm:space-x-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <Package className="w-3 h-3 sm:w-4 sm:h-4 mb-1 sm:mb-0" />
            <span className="hidden sm:inline">Products</span>
            <span className="sm:hidden">Prod</span>
            <Badge variant="secondary" className="mt-1 sm:mt-0 sm:ml-1 text-xs">
              {results.products.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center sm:space-x-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mb-1 sm:mb-0" />
            <span>People</span>
            <Badge variant="secondary" className="mt-1 sm:mt-0 sm:ml-1 text-xs">
              {results.users.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {/* Mixed Results */}
          {results.businesses.slice(0, 2).map((business) => (
            <BusinessCard key={`business-${business.id}`} business={business} />
          ))}
          {results.products.slice(0, 2).map((product) => (
            <ProductCard key={`product-${product.id}`} product={product} />
          ))}
          {results.users.slice(0, 2).map((user) => (
            <UserCard key={`user-${user.id}`} user={user} />
          ))}
        </TabsContent>

        <TabsContent value="businesses" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {results.businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </TabsContent>

        <TabsContent value="products" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {results.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {results.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      {results.hasMore && onLoadMore && (
        <div className="text-center pt-4 sm:pt-6">
          <Button onClick={onLoadMore} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Loading...' : 'Load More Results'}
          </Button>
        </div>
      )}
    </div>
  );
}