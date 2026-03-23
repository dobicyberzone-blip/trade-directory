"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SearchBar } from '@/components/search/search-bar';
import { SearchResults } from '@/components/search/search-results';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Star } from 'lucide-react';

interface SearchFilters {
  category?: string;
  location?: string;
  sector?: string;
  verificationStatus?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface Business {
  id: string;
  name: string;
  description?: string;
  location: string;
  sector: string;
  rating?: number;
  verificationStatus: string;
  logoUrl?: string;
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

interface TrendingData {
  topBusinesses: Array<{ name: string; rating?: number }>;
  topProducts: Array<{ name: string; category: string }>;
  topCategories: Array<{ name: string; count: number }>;
  topSectors: Array<{ name: string; count: number }>;
}

interface SearchResults {
  businesses: Business[];
  products: Product[];
  users: User[];
  totalCount: number;
  hasMore: boolean;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(1);

  // Get initial query from URL params
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const sector = searchParams.get('sector') || undefined;
    
    setCurrentQuery(query);
    setCurrentFilters({
      category,
      location,
      sector,
    });

    if (query) {
      performSearch(query, { category, location, sector });
    } else {
      loadTrendingData();
    }
  }, [searchParams]);

  const loadTrendingData = async () => {
    try {
      // Use environment variable for API URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      
      if (!API_BASE_URL) {
        console.error('NEXT_PUBLIC_API_URL environment variable is not set');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/search/trending`);
      if (response.ok) {
        const data = await response.json();
        setTrending(data.data);
      }
    } catch (error) {

    }
  };

  const performSearch = async (query: string, filters: SearchFilters = {}, pageNum: number = 1) => {
    setIsLoading(true);
    
    try {
      // Use environment variable for API URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      
      if (!API_BASE_URL) {
        console.error('NEXT_PUBLIC_API_URL environment variable is not set');
        return;
      }
      
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (filters.category) params.set('category', filters.category);
      if (filters.location) params.set('location', filters.location);
      if (filters.sector) params.set('sector', filters.sector);
      if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus);
      if (filters.minRating) params.set('minRating', filters.minRating.toString());
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      params.set('page', pageNum.toString());
      params.set('limit', '20');

      const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 1) {
          setResults(data.data);
        } else {
          // Append results for pagination
          setResults((prev) => {
            if (!prev) return data.data;
            return {
              ...data.data,
              businesses: [...prev.businesses, ...data.data.businesses],
              products: [...prev.products, ...data.data.products],
              users: [...prev.users, ...data.data.users],
            };
          });
        }
        
        setPage(pageNum);
        
        // Update URL without triggering a reload
        const newParams = new URLSearchParams();
        if (query) newParams.set('q', query);
        if (filters.category) newParams.set('category', filters.category);
        if (filters.location) newParams.set('location', filters.location);
        if (filters.sector) newParams.set('sector', filters.sector);
        
        const newUrl = `/search${newParams.toString() ? `?${newParams.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
        
      } else {

      }
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string, filters: SearchFilters = {}) => {
    setCurrentQuery(query);
    setCurrentFilters(filters);
    setPage(1);
    performSearch(query, filters, 1);
  };

  const handleLoadMore = () => {
    performSearch(currentQuery, currentFilters, page + 1);
  };

  const handleTrendingClick = (term: string, type: string) => {
    const filters: SearchFilters = {};
    
    if (type === 'category') {
      filters.category = term;
    } else if (type === 'sector') {
      filters.sector = term;
    }
    
    handleSearch(term, filters);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <Header />
      
      <main className="flex-grow container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pt-20 md:pt-24">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <SearchBar
            onSearch={handleSearch}
            defaultQuery={currentQuery}
            defaultFilters={currentFilters}
            className="mx-auto"
          />
        </div>

        {/* Results or Trending */}
        {results ? (
          <SearchResults
            results={results}
            query={currentQuery}
            isLoading={isLoading}
            onLoadMore={results.hasMore ? handleLoadMore : undefined}
          />
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Welcome Message */}
            <div className="text-center py-6 sm:py-8 px-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Discover Kenya&apos;s Export Excellence
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
                Search through verified exporters, premium products, and trusted businesses 
                connecting Kenya to global markets.
              </p>
            </div>

            {/* Trending Searches */}
            {trending && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Top Businesses */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Top Rated Businesses</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {trending.topBusinesses?.slice(0, 5).map((business: { name: string; rating?: number }, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleTrendingClick(business.name, 'business')}
                          className="w-full text-left p-2 sm:p-2.5 rounded-lg hover:bg-yellow-50 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate pr-2">
                              {business.name}
                            </span>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 font-medium">
                                {business.rating?.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Categories */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Popular Categories</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trending.topCategories?.slice(0, 8).map((category: { name: string; count: number }, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleTrendingClick(category.name, 'category')}
                          className="inline-flex"
                        >
                          <Badge 
                            variant="outline" 
                            className="hover:bg-green-50 hover:border-green-300 hover:shadow-sm cursor-pointer transition-all duration-200 text-xs sm:text-sm"
                          >
                            <span className="truncate">{category.name}</span>
                            <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                              {category.count}
                            </span>
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Products */}
                <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Recently Added</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {trending.topProducts?.slice(0, 5).map((product: { name: string; category: string }, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleTrendingClick(product.name, 'product')}
                          className="w-full text-left p-2 sm:p-2.5 rounded-lg hover:bg-blue-50 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {product.category}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Search Suggestions */}
            <div className="text-center px-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Popular Searches
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Coffee', 'Tea', 'Avocados', 'Flowers', 'Textiles', 
                  'Handicrafts', 'Macadamia', 'Sisal', 'Leather', 'Spices'
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
