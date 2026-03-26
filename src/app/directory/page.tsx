'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Building2, MapPin, Tag, Package } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/pagination';

export const dynamic = 'force-dynamic';

interface PublicBusiness {
  id: string;
  name: string;
  sector: string;
  location: string;
  town?: string;
  county?: string;
  physicalAddress?: string;
  products?: { id: string; name: string; category: string }[];
  serviceOffering?: string;
  verificationStatus: string;
}

const ITEMS_PER_PAGE = 50;

// Inner component — uses useSearchParams, must be inside <Suspense>
function DirectoryContent() {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState(searchParams.get('sector') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        verified: 'true',
        page: String(currentPage - 1),
        limit: String(ITEMS_PER_PAGE),
      });
      if (searchTerm) params.set('search', searchTerm);
      if (sectorFilter) params.set('sector', sectorFilter);
      const res = await fetch(`/api/businesses?${params.toString()}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotalCount(data.pagination?.total ?? (data.businesses?.length || 0));
    } catch {
      setBusinesses([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, sectorFilter]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setSectorFilter('');
    setCurrentPage(1);
  };

  const hasFilters = searchInput || sectorFilter;

  return (
    <>
      {/* Page header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
          Kenya Export Trade Directory
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover verified Kenyan exporters and their products.
        </p>
        {totalCount > 0 && !isLoading && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            {totalCount.toLocaleString()} verified {totalCount === 1 ? 'exporter' : 'exporters'} listed
          </p>
        )}
      </div>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by company name, sector, product…"
            className="pl-9 h-11"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasFilters && (
          <Button variant="outline" onClick={clearSearch} className="h-11 px-4 text-sm">Clear</Button>
        )}
      </div>

      {/* Login prompt banner */}
      <div className="max-w-4xl mx-auto mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-green-800 dark:text-green-300">
          <span className="font-semibold">Want full access?</span> Log in to view complete exporter profiles, send inquiries, and connect directly with businesses.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/login?returnUrl=/directory">
            <Button size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-600">Log In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Register</Button>
          </Link>
        </div>
      </div>

      {/* Table / cards */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-lg animate-pulse border border-gray-100 dark:border-gray-700" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No exporters found</p>
            {hasFilters && (
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search or{' '}
                <button onClick={clearSearch} className="text-green-600 underline">clear filters</button>
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="text-left px-5 py-3.5 font-semibold w-[28%]">
                      <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Company Name</span>
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold w-[18%]">
                      <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Sector</span>
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold w-[28%]">
                      <span className="flex items-center gap-2"><Package className="h-4 w-4" /> Products / Services</span>
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold w-[26%]">
                      <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {businesses.map((biz, idx) => (
                    <tr
                      key={biz.id}
                      className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/60'} hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white leading-snug">{biz.name}</div>
                        {biz.verificationStatus === 'VERIFIED' && (
                          <Badge className="mt-1 text-[10px] bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0">✓ Verified</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        {biz.sector || <span className="text-gray-400 italic text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        {biz.products && biz.products.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {biz.products.slice(0, 3).map(p => (
                              <span key={p.id} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">{p.name}</span>
                            ))}
                            {biz.products.length > 3 && <span className="text-xs text-gray-400">+{biz.products.length - 3} more</span>}
                          </div>
                        ) : biz.serviceOffering ? (
                          <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{biz.serviceOffering}</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                        {[biz.physicalAddress, biz.town, biz.county].filter(Boolean).join(', ') || biz.location || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {businesses.map(biz => (
                <div key={biz.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{biz.name}</h3>
                    {biz.verificationStatus === 'VERIFIED' && (
                      <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 flex-shrink-0 px-1.5 py-0">✓</Badge>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    {biz.sector && (
                      <div className="flex items-center gap-1.5"><Tag className="h-3 w-3 flex-shrink-0 text-gray-400" /><span>{biz.sector}</span></div>
                    )}
                    {(biz.products?.length || biz.serviceOffering) && (
                      <div className="flex items-start gap-1.5">
                        <Package className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
                        <span className="line-clamp-2">
                          {biz.products?.length
                            ? biz.products.slice(0, 3).map(p => p.name).join(', ') + (biz.products.length > 3 ? ` +${biz.products.length - 3}` : '')
                            : biz.serviceOffering}
                        </span>
                      </div>
                    )}
                    {([biz.physicalAddress, biz.town, biz.county].filter(Boolean).join(', ') || biz.location) && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
                        <span>{[biz.physicalAddress, biz.town, biz.county].filter(Boolean).join(', ') || biz.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalCount > ITEMS_PER_PAGE && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function DirectoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={
            <div className="space-y-3 pt-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse max-w-2xl mx-auto mb-8" />
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-lg animate-pulse border border-gray-100 dark:border-gray-700" />
              ))}
            </div>
          }>
            <DirectoryContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
