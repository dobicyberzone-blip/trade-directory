'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Building2, MapPin, Tag, Package, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/pagination';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface PublicBusiness {
  id: string;
  name: string;
  sector: string;
  location: string;
  town?: string;
  county?: string;
  physicalAddress?: string;
  logoUrl?: string;
  products?: { id: string; name: string; category: string }[];
  serviceOffering?: string;
  verificationStatus: string;
}

const ITEMS_PER_PAGE = 24;

// ── Single card ──────────────────────────────────────────────────────────────
function BusinessCard({ biz }: { biz: PublicBusiness }) {
  const address = [biz.physicalAddress, biz.town, biz.county]
    .filter(Boolean)
    .join(', ') || biz.location || '—';

  const productList = biz.products?.length
    ? biz.products.slice(0, 3).map(p => p.name).join(', ') +
      (biz.products.length > 3 ? ` +${biz.products.length - 3} more` : '')
    : biz.serviceOffering || null;

  const initials = biz.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      {/* Card header */}
      <div className="p-5 pb-3 flex items-start gap-4">
        {/* Logo / avatar */}
        <div className="flex-shrink-0">
          {biz.logoUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50">
              <Image
                src={biz.logoUrl}
                alt={biz.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {initials}
            </div>
          )}
        </div>

        {/* Name + verified */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">
            {biz.name}
          </h3>
          {biz.verificationStatus === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-700 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-100 dark:border-gray-700" />

      {/* Fields */}
      <div className="p-5 pt-4 flex-1 space-y-3">
        {/* Sector */}
        <div className="flex items-start gap-2.5">
          <Tag className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Sector</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
              {biz.sector || <span className="text-gray-400 italic">—</span>}
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="flex items-start gap-2.5">
          <Package className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Products / Services</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
              {productList || <span className="text-gray-400 italic">—</span>}
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Address</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug line-clamp-2">{address}</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-5">
        <Link href="/login?returnUrl=/directory">
          <button className="w-full text-xs font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 rounded-lg py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            Log in to view full profile →
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Inner page content (uses useSearchParams) ────────────────────────────────
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

  const hasFilters = !!(searchInput || sectorFilter);

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
      <div className="max-w-5xl mx-auto mb-8 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Showing {businesses.length} of {totalCount.toLocaleString()} exporters
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {businesses.map(biz => (
                <BusinessCard key={biz.id} biz={biz} />
              ))}
            </div>

            {totalCount > ITEMS_PER_PAGE && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  onPageChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Page shell ───────────────────────────────────────────────────────────────
export default function DirectoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
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
