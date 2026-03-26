'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Building2, MapPin, Tag, Package, CheckCircle, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/pagination';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { ExporterGridCard, ExporterGridCardSkeleton } from '@/components/exporter-grid-card';
import { apiClient, type Business as APIBusiness } from '@/lib/api';
import { COUNTIES, KENYAN_CITIES, INDUSTRIES, SECTORS_BY_INDUSTRY } from '@/lib/constants';
import { EXPORT_MARKETS } from '@/types/business';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const dynamic = 'force-dynamic';

interface PublicBusiness {
  id: string; name: string; sector: string; location: string;
  town?: string; county?: string; physicalAddress?: string; logoUrl?: string;
  products?: { id: string; name: string; category: string }[];
  serviceOffering?: string; verificationStatus: string;
}

const PUBLIC_PER_PAGE = 24;
const AUTH_PER_PAGE = 51;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'name_asc', label: 'Name: A–Z' },
];

// ── Public card (unauthenticated) ────────────────────────────────────────────
function PublicBusinessCard({ biz }: { biz: PublicBusiness }) {
  const address = [biz.physicalAddress, biz.town, biz.county].filter(Boolean).join(', ') || biz.location || '—';
  const productList = biz.products?.length
    ? biz.products.slice(0, 3).map(p => p.name).join(', ') + (biz.products.length > 3 ? ` +${biz.products.length - 3}` : '')
    : biz.serviceOffering || null;
  const initials = biz.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      <div className="p-5 pb-3 flex items-start gap-4">
        <div className="flex-shrink-0">
          {biz.logoUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50">
              <Image src={biz.logoUrl} alt={biz.name} width={56} height={56} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">{initials}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">{biz.name}</h3>
          {biz.verificationStatus === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-700 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
      </div>
      <div className="mx-5 border-t border-gray-100 dark:border-gray-700" />
      <div className="p-5 pt-4 flex-1 space-y-3">
        <div className="flex items-start gap-2.5">
          <Tag className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Sector</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{biz.sector || <span className="text-gray-400 italic">—</span>}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Package className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Products / Services</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{productList || <span className="text-gray-400 italic">—</span>}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Address</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{address}</p>
          </div>
        </div>
      </div>
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

// ── Authenticated filters sidebar ────────────────────────────────────────────
function FiltersSidebar({
  selectedFilters, onFilterChange, onTextFilterChange, sortOrder, onSortChange, clearFilters,
}: {
  selectedFilters: Record<string, string[]>;
  onFilterChange: (cat: string, opt: string) => void;
  onTextFilterChange: (cat: string, val: string) => void;
  sortOrder: string;
  onSortChange: (v: string) => void;
  clearFilters: () => void;
}) {
  const activeCount = Object.values(selectedFilters).flat().length;
  const selectedIndustries = selectedFilters['industry'] || [];
  const sectorOptions = selectedIndustries.length > 0
    ? selectedIndustries.flatMap(ind => SECTORS_BY_INDUSTRY[ind] || [])
    : Object.values(SECTORS_BY_INDUSTRY).flat();

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="sort">
            <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">Sort by</AccordionTrigger>
            <AccordionContent>
              <RadioGroup value={sortOrder} onValueChange={onSortChange} className="space-y-1 px-4 pb-3">
                {SORT_OPTIONS.map(o => (
                  <div key={o.value} className="flex items-center gap-2">
                    <RadioGroupItem value={o.value} id={`sort-${o.value}`} />
                    <Label htmlFor={`sort-${o.value}`} className="font-normal cursor-pointer">{o.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {[
            { id: 'county', label: 'County', options: [...COUNTIES] },
            { id: 'city', label: 'City', options: [...KENYAN_CITIES] },
          ].map(({ id, label, options }) => (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">{label}</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-52 px-4">
                  <div className="space-y-2 pb-2">
                    {options.map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox id={`${id}-${opt}`}
                          checked={selectedFilters[id === 'city' ? 'town' : id]?.includes(opt) || false}
                          onCheckedChange={() => onFilterChange(id === 'city' ? 'town' : id, opt)} />
                        <Label htmlFor={`${id}-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          ))}

          <AccordionItem value="industry">
            <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">Industry</AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-52 px-4">
                <div className="space-y-2 pb-2">
                  {[...INDUSTRIES].map(ind => (
                    <div key={ind} className="flex items-center gap-2">
                      <Checkbox id={`industry-${ind}`}
                        checked={selectedFilters['industry']?.includes(ind) || false}
                        onCheckedChange={() => onFilterChange('industry', ind)} />
                      <Label htmlFor={`industry-${ind}`} className="font-normal cursor-pointer">{ind}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sector">
            <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">Sector</AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-52 px-4">
                <div className="space-y-2 pb-2">
                  {sectorOptions.map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <Checkbox id={`sector-${s}`}
                        checked={selectedFilters['sector']?.includes(s) || false}
                        onCheckedChange={() => onFilterChange('sector', s)} />
                      <Label htmlFor={`sector-${s}`} className="font-normal cursor-pointer">{s}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="exportMarkets">
            <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">Export Markets</AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-52 px-4">
                <div className="space-y-2 pb-2">
                  {EXPORT_MARKETS.map(m => (
                    <div key={m.value} className="flex items-center gap-2">
                      <Checkbox id={`em-${m.value}`}
                        checked={selectedFilters['exportMarkets']?.includes(m.label) || false}
                        onCheckedChange={() => onFilterChange('exportMarkets', m.label)} />
                      <Label htmlFor={`em-${m.value}`} className="font-normal cursor-pointer">{m.label}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          {[
            { id: 'serviceOffering', label: 'Service Offering', placeholder: 'e.g. Logistics' },
            { id: 'productHsCode', label: 'Product HS Code', placeholder: 'e.g. 09 or Coffee' },
          ].map(({ id, label, placeholder }) => (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">{label}</AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <Input placeholder={placeholder} value={selectedFilters[id]?.[0] || ''}
                  onChange={e => onTextFilterChange(id, e.target.value)} className="text-sm" />
              </AccordionContent>
            </AccordionItem>
          ))}

          <AccordionItem value="rating">
            <AccordionTrigger className="font-semibold px-4 py-3 hover:no-underline">Rating</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 px-4 pb-3">
                {['4 stars & up', '3 stars & up', '2 stars & up'].map(opt => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox id={`rating-${opt}`}
                      checked={selectedFilters['rating']?.includes(opt) || false}
                      onCheckedChange={() => onFilterChange('rating', opt)} />
                    <Label htmlFor={`rating-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>

      {activeCount > 0 && (
        <div className="p-4 border-t">
          <Button variant="outline" onClick={clearFilters} className="w-full text-sm">
            <X className="h-4 w-4 mr-2" /> Clear All ({activeCount})
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Authenticated full directory ─────────────────────────────────────────────
function AuthenticatedDirectory({ initialSector }: { initialSector: string }) {
  const [businesses, setBusinesses] = useState<APIBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(
    initialSector ? { sector: [initialSector] } : {}
  );
  const [sortOrder, setSortOrder] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearchTerm(searchInput); setCurrentPage(1); }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getBusinesses({
        page: currentPage - 1,
        limit: AUTH_PER_PAGE,
        search: searchTerm || undefined,
        filters: Object.keys(selectedFilters).length > 0 ? selectedFilters : undefined,
      });
      setBusinesses(response.businesses);
      setTotalCount(response.pagination?.total ?? response.businesses.length);
    } catch {
      setBusinesses([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [currentPage, searchTerm, selectedFilters]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const handleFilterChange = useCallback((cat: string, opt: string) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      const cur = prev[cat] || [];
      const next = cur.includes(opt) ? cur.filter(i => i !== opt) : [...cur, opt];
      if (!next.length) { const { [cat]: _, ...rest } = prev; return rest; }
      return { ...prev, [cat]: next };
    });
  }, []);

  const handleTextFilterChange = useCallback((cat: string, val: string) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      if (!val.trim()) { const { [cat]: _, ...rest } = prev; return rest; }
      return { ...prev, [cat]: [val] };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setCurrentPage(1); setSelectedFilters({}); setSearchInput(''); setSearchTerm('');
  }, []);

  const activeFilterCount = Object.values(selectedFilters).flat().length;

  const filtersPanel = (
    <FiltersSidebar
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
      onTextFilterChange={handleTextFilterChange}
      sortOrder={sortOrder}
      onSortChange={v => { setSortOrder(v); setCurrentPage(1); }}
      clearFilters={clearFilters}
    />
  );

  return (
    <div className="flex gap-6">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-36 max-h-[calc(100vh-10rem)]">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Refine the list of exporters using the options below.
            </p>
          </div>
          {filtersPanel}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Search + mobile filter trigger */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search exporters…" className="pl-9 h-11" />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Mobile filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden h-11 px-3 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters {activeFilterCount > 0 && <span className="bg-green-600 text-white text-xs rounded-full px-1.5">{activeFilterCount}</span>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="px-4 py-3 border-b">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              {filtersPanel}
            </SheetContent>
          </Sheet>
        </div>

        {/* Results count */}
        {!isInitialLoad && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {totalCount.toLocaleString()} {totalCount === 1 ? 'business' : 'businesses'} found
          </p>
        )}

        {/* Grid */}
        {isInitialLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <ExporterGridCardSkeleton key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No exporters found</p>
            {(searchTerm || activeFilterCount > 0) && (
              <button onClick={clearFilters} className="mt-2 text-sm text-green-600 underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {businesses.map(biz => (
                <ExporterGridCard key={biz.id} business={biz} />
              ))}
            </div>
            {totalCount > AUTH_PER_PAGE && (
              <div className="mt-10 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={Math.ceil(totalCount / AUTH_PER_PAGE)}
                  onPageChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Public directory (unauthenticated) ───────────────────────────────────────
function PublicDirectory({ initialSector }: { initialSector: string }) {
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter] = useState(initialSector);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearchTerm(searchInput); setCurrentPage(1); }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ verified: 'true', page: String(currentPage - 1), limit: String(PUBLIC_PER_PAGE) });
      if (searchTerm) params.set('search', searchTerm);
      if (sectorFilter) params.set('sector', sectorFilter);
      const res = await fetch(`/api/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotalCount(data.pagination?.total ?? (data.businesses?.length || 0));
    } catch {
      setBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, sectorFilter]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  return (
    <>
      {/* Login banner */}
      <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-green-800 dark:text-green-300">
          <span className="font-semibold">Want full access?</span> Log in to view complete profiles, send inquiries, and connect directly with exporters.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/login?returnUrl=/directory"><Button size="sm" variant="outline" className="border-green-600 text-green-700">Log In</Button></Link>
          <Link href="/register"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Register</Button></Link>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by company name, sector, product…" className="pl-9 h-11" />
        {searchInput && (
          <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {totalCount > 0 && !isLoading && (
        <p className="text-sm text-gray-500 mb-4 text-center">{totalCount.toLocaleString()} verified {totalCount === 1 ? 'exporter' : 'exporters'} listed</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No exporters found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {businesses.map(biz => <PublicBusinessCard key={biz.id} biz={biz} />)}
          </div>
          {totalCount > PUBLIC_PER_PAGE && (
            <div className="mt-10 flex justify-center">
              <Pagination currentPage={currentPage} totalPages={Math.ceil(totalCount / PUBLIC_PER_PAGE)}
                onPageChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Inner content (uses useSearchParams) ─────────────────────────────────────
function DirectoryContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialSector = searchParams.get('sector') || '';

  if (authLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">Kenya Export Trade Directory</h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover verified Kenyan exporters and their products.
        </p>
      </div>
      {isAuthenticated
        ? <AuthenticatedDirectory initialSector={initialSector} />
        : <PublicDirectory initialSector={initialSector} />
      }
    </>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
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
