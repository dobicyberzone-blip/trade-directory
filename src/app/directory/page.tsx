'use client';

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
// FIX #6: Convert ExporterGridCard to static import — eliminates extra chunk-download delay
import { ExporterGridCard, ExporterGridCardSkeleton } from '@/components/exporter-grid-card';
import dynamicImport from 'next/dynamic';
import { apiClient, type Business as APIBusiness } from '@/lib/api';
import { trackSearch } from '@/lib/analytics';
import { Search, X, LayoutGrid, Map as MapIcon, SlidersHorizontal, Heart, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/pagination';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { kenyanCounties } from '@/lib/kenyan-counties';
import { ExporterProfileCard } from '@/components/exporter-profile-card';
import { EXPORT_MARKETS, BUSINESS_SECTORS } from '@/types/business';
import { INDUSTRIES, SECTORS_BY_INDUSTRY, COUNTIES, KENYAN_CITIES } from '@/lib/constants';

// FIX #7: sessionStorage cache keys
const PRODUCT_OPTIONS_CACHE_KEY = 'dir_product_options_v1';
const BUSINESSES_CACHE_KEY = 'dir_businesses_default_v1';
const BUSINESSES_CACHE_TTL = 10_000; // 10 seconds — near-instant freshness

const filterCategories = [
  { id: 'exportMarkets', name: 'Export Markets', options: EXPORT_MARKETS.map(m => m.label) },
  { id: 'numberOfEmployees', name: 'Company Size (Employees)', options: [
    '1-49', '50-100', '101-200', '201-500', '501-1000', '1000+',
  ] },
  { id: 'certification', name: 'Certification', options: [
    'ISO 9001', 'ISO 14001', 'Fair Trade', 'GlobalG.A.P.', 'Organic Certified',
    'HACCP', 'KEBS Mark of Quality', 'Rainforest Alliance', 'Made in Kenya',
  ] },
];

const MapView = dynamicImport(() => import('@/components/map-view').then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading Map...</p>
      </div>
    </div>
  ),
});

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'name_asc', label: 'Name: A-Z' },
];

// ---------------------------------------------------------------------------
// Filters component — memoized to prevent re-render when parent state changes
// ---------------------------------------------------------------------------
const Filters = ({
  selectedFilters, onFilterChange, onTextFilterChange, sortOrder, onSortChange, clearFilters, viewMode, filterCategories: dynamicCategories,
}: {
  selectedFilters: Record<string, string[]>;
  onFilterChange: (category: string, option: string) => void;
  onTextFilterChange: (category: string, value: string) => void;
  sortOrder: string;
  onSortChange: (value: string) => void;
  clearFilters: () => void;
  viewMode?: 'grid' | 'map';
  filterCategories?: typeof filterCategories;
}) => {
  const activeFilterCount = Object.values(selectedFilters).flat().length;
  const categoriesToUse = dynamicCategories || filterCategories;
  // Remove rating filter for map view (no rating data in map pins)
  const availableCategories = viewMode === 'map'
    ? categoriesToUse.filter(cat => cat.id !== 'rating')
    : categoriesToUse;

  // Derive sector options based on selected industries
  const selectedIndustries = selectedFilters['industry'] || [];
  const sectorOptions: string[] = selectedIndustries.length > 0
    ? selectedIndustries.flatMap(ind => SECTORS_BY_INDUSTRY[ind] || [])
    : Object.values(SECTORS_BY_INDUSTRY).flat();

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-grow">
        <Accordion type="multiple" defaultValue={[]} className="w-full">
          {viewMode !== 'map' && (
            <AccordionItem value="sort">
              <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">Sort by</AccordionTrigger>
              <AccordionContent className="pt-2">
                <RadioGroup value={sortOrder} onValueChange={onSortChange} className="space-y-1 px-4 pb-2">
                  {sortOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                      <Label htmlFor={`sort-${option.value}`} className="font-normal cursor-pointer flex-grow py-1">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="county">
            <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">County</AccordionTrigger>
            <AccordionContent className="pt-2">
              <ScrollArea className="h-60 px-4">
                <div className="space-y-2 pb-2">
                  {COUNTIES.map(county => (
                    <div key={county} className="flex items-center space-x-2">
                      <Checkbox
                        id={`county-${county}`}
                        checked={selectedFilters['county']?.includes(county) || false}
                        onCheckedChange={() => onFilterChange('county', county)}
                      />
                      <Label htmlFor={`county-${county}`} className="font-normal cursor-pointer flex-grow py-1">{county}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="city">
            <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">City</AccordionTrigger>
            <AccordionContent className="pt-2">
              <ScrollArea className="h-60 px-4">
                <div className="space-y-2 pb-2">
                  {[...new Set(KENYAN_CITIES)].map(city => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city}`}
                        checked={selectedFilters['town']?.includes(city) || false}
                        onCheckedChange={() => onFilterChange('town', city)}
                      />
                      <Label htmlFor={`city-${city}`} className="font-normal cursor-pointer flex-grow py-1">{city}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          {/* Industry — always full list */}
          <AccordionItem value="industry">
            <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">Industry</AccordionTrigger>
            <AccordionContent className="pt-2">
              <ScrollArea className="h-60 px-4">
                <div className="space-y-2 pb-2">
                  {INDUSTRIES.map(industry => (
                    <div key={industry} className="flex items-center space-x-2">
                      <Checkbox
                        id={`industry-${industry}`}
                        checked={selectedFilters['industry']?.includes(industry) || false}
                        onCheckedChange={() => onFilterChange('industry', industry)}
                      />
                      <Label htmlFor={`industry-${industry}`} className="font-normal cursor-pointer flex-grow py-1">{industry}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          {/* Sector — filtered by selected industries */}
          <AccordionItem value="sector">
            <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">
              Sector
              {selectedIndustries.length > 0 && (
                <span className="ml-2 text-xs font-normal text-green-600">
                  ({selectedIndustries.length} {selectedIndustries.length === 1 ? 'industry' : 'industries'} selected)
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {selectedIndustries.length === 0 && (
                <p className="text-xs text-gray-400 px-4 pb-2 italic">Select an industry above to narrow sectors</p>
              )}
              <ScrollArea className="h-60 px-4">
                <div className="space-y-2 pb-2">
                  {sectorOptions.map(sector => (
                    <div key={sector} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sector-${sector}`}
                        checked={selectedFilters['sector']?.includes(sector) || false}
                        onCheckedChange={() => onFilterChange('sector', sector)}
                      />
                      <Label htmlFor={`sector-${sector}`} className="font-normal cursor-pointer flex-grow py-1">{sector}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          {availableCategories.map(category => {
            const useScrollArea = category.options.length > 8;
            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">{category.name}</AccordionTrigger>
                <AccordionContent className="pt-2">
                  {useScrollArea ? (
                    <ScrollArea className="h-60 px-4">
                      <div className="space-y-2 pb-2">
                        {category.options.map(option => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${category.id}-${option}`}
                              checked={selectedFilters[category.id]?.includes(option) || false}
                              onCheckedChange={() => onFilterChange(category.id, option)}
                            />
                            <Label htmlFor={`${category.id}-${option}`} className="font-normal cursor-pointer flex-grow py-1">{option}</Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="space-y-2 px-4 pb-2">
                      {category.options.map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${category.id}-${option}`}
                            checked={selectedFilters[category.id]?.includes(option) || false}
                            onCheckedChange={() => onFilterChange(category.id, option)}
                          />
                          <Label htmlFor={`${category.id}-${option}`} className="font-normal cursor-pointer flex-grow py-1">{option}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
          <AccordionItem value="productHsCode">
            <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">Product HS Code</AccordionTrigger>
            <AccordionContent className="pt-2 px-4 pb-3">
              <Input
                placeholder="e.g. 09 or Coffee"
                value={selectedFilters['productHsCode']?.[0] || ''}
                onChange={(e) => onTextFilterChange('productHsCode', e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Search by HS code number or keyword</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="serviceOffering">
            <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">Service Offering</AccordionTrigger>
            <AccordionContent className="pt-2 px-4 pb-3">
              <Input
                placeholder="e.g. Logistics or Export Trading"
                value={selectedFilters['serviceOffering']?.[0] || ''}
                onChange={(e) => onTextFilterChange('serviceOffering', e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Search by service type keyword</p>
            </AccordionContent>
          </AccordionItem>
          {viewMode !== 'map' && (
            <AccordionItem value="rating">
              <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">Rating</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2 px-4 pb-2">
                  {['4 stars & up', '3 stars & up', '2 stars & up', '1 star & up'].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${option}`}
                        checked={selectedFilters['rating']?.includes(option) || false}
                        onCheckedChange={() => onFilterChange('rating', option)}
                      />
                      <Label htmlFor={`rating-${option}`} className="font-normal cursor-pointer flex-grow py-1">{option}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </ScrollArea>
      {activeFilterCount > 0 && (
        <div className="p-3 sm:p-4 mt-auto border-t">
          <Button variant="outline" onClick={clearFilters} className="w-full text-xs sm:text-sm">
            <X className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" /> Clear All Filters ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Auth gate — shows skeleton while auth resolves, redirects if unauthenticated
// ---------------------------------------------------------------------------
function DirectoryPageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/directory');
    }
  }, [isMounted, authLoading, isAuthenticated, router]);

  if (!isMounted || authLoading) {
    return (
      <>
        <Header />
        <main className="flex-grow pt-28 sm:pt-32 lg:pt-36">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-6">
            <div className="text-center mb-4 sm:mb-6 lg:mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary px-2">Kenya Export Trade Directory</h1>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
                Discover trusted, verified Kenyan exporters and their products.
              </p>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) return null;
  return <DirectoryPageContentClient />;
}

// ---------------------------------------------------------------------------
// Main directory client component
// ---------------------------------------------------------------------------
function DirectoryPageContentClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // FIX #2: Separate raw input state from debounced search term
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  // FIX #5: itemsPerPage aligned with API limit (was 51 UI / 20 API — now consistent)
  const ITEMS_PER_PAGE = 51;
  const [totalCount, setTotalCount] = useState(0);

  const [businesses, setBusinesses] = useState<APIBusiness[]>([]);
  // FIX #1: Track whether this is the very first load to show skeletons vs overlay
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [sortOrder, setSortOrder] = useState('featured');
  const [modalBusiness, setModalBusiness] = useState<APIBusiness | null>(null);
  const [focusedBusiness, setFocusedBusiness] = useState<APIBusiness | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasGoogleTranslate, setHasGoogleTranslate] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [productOptions, setProductOptions] = useState<string[]>([]);

  // Track window size for desktop detection
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Detect Google Translate bar offset
  useEffect(() => {
    const check = () => {
      const bannerFrame = document.querySelector('.goog-te-banner-frame') as HTMLElement;
      const isBannerVisible = bannerFrame && bannerFrame.style.display !== 'none' && bannerFrame.offsetHeight > 0;
      const bodyTop = document.body.style.top;
      const hasBodyOffset = bodyTop && bodyTop !== '0px' && bodyTop !== '';
      setHasGoogleTranslate(!!(isBannerVisible || hasBodyOffset));
    };
    check();
    const interval = setInterval(check, 1000);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => { clearInterval(interval); observer.disconnect(); };
  }, []);

  const modalRef = useClickOutside<HTMLDivElement>(
    () => setModalBusiness(null),
    !!modalBusiness && isDesktop,
  );

  // FIX #7: Cache product options in sessionStorage — only fetches once per session
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(PRODUCT_OPTIONS_CACHE_KEY);
      if (cached) {
        setProductOptions(JSON.parse(cached) as string[]);
        return;
      }
    } catch { /* ignore */ }

    fetch('/api/products?limit=500')
      .then(r => r.json())
      .then(data => {
        if (data.products) {
          const names = Array.from(
            new Set<string>((data.products as { name: string }[]).map(p => p.name.trim()).filter(Boolean))
          ).sort() as string[];
          setProductOptions(names);
          try { sessionStorage.setItem(PRODUCT_OPTIONS_CACHE_KEY, JSON.stringify(names)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* silently fail */ });
  }, []);

  // FIX #2: Debounce search — 200ms after last keystroke before triggering fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Dynamic filter options derived from fetched businesses
  const dynamicFilterOptions = useMemo(() => {
    const extractUniqueValues = (field: keyof APIBusiness, splitByComma = false) => {
      const values = new Set<string>();
      businesses.forEach(b => {
        const value = b[field];
        if (!value) return;
        if (splitByComma && typeof value === 'string') {
          value.split(',').forEach(item => { const t = item.trim(); if (t) values.add(t); });
        } else if (typeof value === 'string' && value.trim()) {
          values.add(value.trim());
        }
      });
      return Array.from(values).sort();
    };

    const rangeDefinitions = [
      { label: '1-49', min: 1, max: 49 },
      { label: '50-100', min: 50, max: 100 },
      { label: '101-200', min: 101, max: 200 },
      { label: '201-500', min: 201, max: 500 },
      { label: '501-1000', min: 501, max: 1000 },
      { label: '1000+', min: 1001, max: Infinity },
    ];
    const ranges = new Set<string>();
    businesses.forEach(b => {
      const count = b.numberOfEmployees ? parseInt(b.numberOfEmployees) : null;
      if (count) rangeDefinitions.forEach(r => { if (count >= r.min && count <= r.max) ranges.add(r.label); });
    });

    return {
      exportMarkets: extractUniqueValues('currentExportMarkets', true),
      businessUserOrganisation: extractUniqueValues('businessUserOrganisation'),
      sector: extractUniqueValues('sector'),
      numberOfEmployees: rangeDefinitions.map(r => r.label).filter(l => ranges.has(l)),
    };
  }, [businesses]);

  // Merge static filter categories with dynamic options + products
  const dynamicFilterCategories = useMemo(() => {
    // Only numberOfEmployees is derived from loaded businesses (range buckets)
    // sector and exportMarkets stay as static lists so all options are always visible
    const categories = filterCategories.map(cat => {
      if (cat.id === 'numberOfEmployees' && dynamicFilterOptions.numberOfEmployees.length > 0) {
        return { ...cat, options: dynamicFilterOptions.numberOfEmployees };
      }
      return cat;
    });

    // Insert Products filter (from API) after sector if we have product options
    if (productOptions.length > 0) {
      const sectorIndex = categories.findIndex(c => c.id === 'sector');
      const insertAt = sectorIndex >= 0 ? sectorIndex + 1 : categories.length;
      categories.splice(insertAt, 0, { id: 'product', name: 'Products', options: productOptions });
    }

    return categories;
  }, [dynamicFilterOptions.numberOfEmployees, productOptions]);

  // Apply URL search params (e.g. ?sector=Agriculture) on mount
  useEffect(() => {
    const sector = searchParams.get('sector');
    if (sector) setSelectedFilters({ sector: [sector] });
  }, [searchParams]);

  // FIX #3 + #8: fetchBusinesses wrapped in useCallback for stable reference
  // FIX #5: API limit now matches ITEMS_PER_PAGE; uses server pagination total
  const fetchBusinesses = useCallback(async () => {
    const isMapView = viewMode === 'map';
    const isDefaultQuery = currentPage === 1 && !searchTerm && Object.keys(selectedFilters).length === 0 && !isMapView;

    // Serve from sessionStorage cache for the default (unfiltered page 1) query
    if (isDefaultQuery) {
      try {
        const raw = sessionStorage.getItem(BUSINESSES_CACHE_KEY);
        if (raw) {
          const { data, ts } = JSON.parse(raw) as { data: typeof businesses; total: number; ts: number };
          if (Date.now() - ts < BUSINESSES_CACHE_TTL) {
            setBusinesses(data);
            setTotalCount((JSON.parse(raw) as { total: number }).total);
            setIsLoading(false);
            setIsInitialLoad(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getBusinesses({
        page: isMapView ? 0 : currentPage - 1,
        limit: isMapView ? 500 : ITEMS_PER_PAGE,
        filters: Object.keys(selectedFilters).length > 0 ? selectedFilters : undefined,
        search: searchTerm || undefined,
      });

      setBusinesses(response.businesses);

      // FIX #5: Store server-side total for accurate pagination
      if (response.pagination) {
        setTotalCount(response.pagination.total);
      }

      // Cache the default query result
      if (isDefaultQuery && response.businesses.length > 0) {
        try {
          sessionStorage.setItem(BUSINESSES_CACHE_KEY, JSON.stringify({
            data: response.businesses,
            total: response.pagination?.total ?? response.businesses.length,
            ts: Date.now(),
          }));
        } catch { /* ignore quota errors */ }
      }
    } catch {
      setBusinesses([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
      // FIX #1: After first successful fetch, switch from skeleton to overlay mode
      setIsInitialLoad(false);
    }
  }, [currentPage, selectedFilters, searchTerm, viewMode]);

  // FIX #4: Single effect drives all fetches — no duplicate on mount
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // FIX #8: visibilitychange uses stable fetchBusinesses ref — no stale closure
  // Guard: skip the immediate fire on mount (document is already visible)
  const hasMountedRef = useRef(false);
  useEffect(() => {
    hasMountedRef.current = true;
    const handler = () => {
      if (document.visibilityState === 'visible' && hasMountedRef.current) {
        fetchBusinesses();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchBusinesses]);

  const handleFilterChange = useCallback((category: string, option: string) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const next = current.includes(option)
        ? current.filter(i => i !== option)
        : [...current, option];
      if (next.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: next };
    });
  }, []);

  const handleTextFilterChange = useCallback((category: string, value: string) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      if (!value.trim()) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: [value] };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setSelectedFilters({});
    setSearchInput('');
    setSearchTerm('');
  }, []);

  // Client-side filter + sort applied on top of server-fetched page
  // (handles rating filter which is client-only, and sort which is UI-only)
  const filteredBusinesses = useMemo(() => {
    if (!businesses.length) return [];

    let result = businesses;

    // Client-side search fallback (server already filtered, this handles edge cases)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(b => [
        b.name, b.description, b.sector, b.location, b.county, b.town,
        b.typeOfBusiness, b.businessUserOrganisation, b.kraPin,
        b.companyEmail, b.physicalAddress, b.currentExportMarkets, b.companyStory,
      ].filter(Boolean).join(' ').toLowerCase().includes(lower));
    }

    // Client-side filter for rating (not handled server-side) and any residual filters
    if (Object.keys(selectedFilters).length > 0) {
      result = result.filter(business =>
        Object.entries(selectedFilters).every(([key, values]) => {
          if (!values.length) return true;
          switch (key) {
            case 'county': {
              const loc = (business.county || business.location || '').toLowerCase();
              return values.some(v => loc.includes(v.toLowerCase()));
            }
            case 'town': {
              const t = (business.town || '').toLowerCase();
              return values.some(v => t.includes(v.toLowerCase()));
            }
            case 'industry': {
              const ind = (business.industry || '').toLowerCase();
              return values.some(v => ind === v.toLowerCase());
            }
            case 'sector': {
              const s = (business.sector || '').toLowerCase();
              return values.some(v => s === v.toLowerCase());
            }
            case 'businessUserOrganisation': {
              const org = (business.businessUserOrganisation || business.sector || '').toLowerCase();
              return values.some(v => org === v.toLowerCase());
            }
            case 'exportMarkets': {
              const markets = (business.currentExportMarkets || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
              return values.some(v => markets.includes(v.toLowerCase()));
            }
            case 'numberOfEmployees': {
              const count = business.numberOfEmployees ? parseInt(business.numberOfEmployees) : null;
              if (!count) return false;
              return values.some(range => {
                switch (range) {
                  case '1-49':    return count >= 1   && count <= 49;
                  case '50-100':  return count >= 50  && count <= 100;
                  case '101-200': return count >= 101 && count <= 200;
                  case '201-500': return count >= 201 && count <= 500;
                  case '501-1000':return count >= 501 && count <= 1000;
                  case '1000+':   return count > 1000;
                  default:        return false;
                }
              });
            }
            case 'certification': {
              if (!business.certifications?.length) return false;
              return values.some(cert =>
                business.certifications!.some(c => c.name.toLowerCase().includes(cert.toLowerCase()))
              );
            }
            case 'product': {
              if (!business.products?.length) return false;
              return values.some(name =>
                business.products!.some(p => p.name.toLowerCase() === name.toLowerCase())
              );
            }
            case 'rating': {
              if (!business.rating) return false;
              return values.some(opt => (business.rating ?? 0) >= parseInt(opt.split(' ')[0]));
            }
            case 'productHsCode': {
              const hsCode = (business.productHsCode || '').toLowerCase();
              return values.some(v => hsCode.includes(v.toLowerCase()));
            }
            case 'serviceOffering': {
              const svc = (business.serviceOffering || '').toLowerCase();
              return values.some(v => svc.includes(v.toLowerCase()));
            }
            default: {
              const val = business[key as keyof APIBusiness];
              return val != null && values.includes(String(val));
            }
          }
        })
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortOrder) {
        case 'featured': {
          const diff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          return diff !== 0 ? diff : (b.rating || 0) - (a.rating || 0);
        }
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'name_asc':    return a.name.localeCompare(b.name);
        case 'newest':      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:            return (b.rating || 0) - (a.rating || 0);
      }
    });
  }, [businesses, searchTerm, selectedFilters, sortOrder]);

  // Track search analytics (debounced via searchTerm, not searchInput)
  useEffect(() => {
    if (!searchTerm && !Object.keys(selectedFilters).length) return;
    trackSearch({ query: searchTerm, filters: selectedFilters, resultsCount: filteredBusinesses.length });
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: 'search', data: { query: searchTerm, filters: selectedFilters, resultsCount: filteredBusinesses.length } }),
      }).catch(() => { /* silently fail */ });
    }
  }, [searchTerm, selectedFilters, filteredBusinesses.length]);

  // Map businesses — transform coordinates for ArcGIS map
  const mapBusinesses = useMemo(() => {
    type MapBusiness = APIBusiness & {
      latitude: number; longitude: number;
      description: string; companyLogoUrl?: string; hasValidCoords: boolean;
    };

    return filteredBusinesses.map((business): MapBusiness => {
      let latitude = 0, longitude = 0, hasValidCoords = false;

      if (business.coordinates) {
        try {
          let coords: { lat?: number; lng?: number } | null = null;
          if (typeof business.coordinates === 'string') {
            if (business.coordinates.includes(',')) {
              const [latStr, lngStr] = business.coordinates.split(',').map(s => s.trim());
              const lat = parseFloat(latStr), lng = parseFloat(lngStr);
              if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                latitude = lat; longitude = lng; hasValidCoords = true;
              }
            } else {
              coords = JSON.parse(business.coordinates) as { lat?: number; lng?: number };
              if (coords?.lat && coords?.lng && coords.lat !== 0 && coords.lng !== 0) {
                latitude = coords.lat; longitude = coords.lng; hasValidCoords = true;
              }
            }
          } else if (typeof business.coordinates === 'object') {
            coords = business.coordinates as { lat?: number; lng?: number };
            if (coords?.lat && coords?.lng && coords.lat !== 0 && coords.lng !== 0) {
              latitude = coords.lat; longitude = coords.lng; hasValidCoords = true;
            }
          }
        } catch { /* invalid coords */ }
      }

      // No valid coords — leave as 0,0; google-map will filter these out

      return {
        ...business,
        latitude, longitude,
        description: business.description || 'No description available',
        companyLogoUrl: business.logoUrl,
        hasValidCoords,
      };
    });
  }, [filteredBusinesses]);

  // FIX #5: Use server total for pagination when no client-side filters active
  // Fall back to client-side count when rating/sort filters are applied
  const hasClientOnlyFilters = !!(selectedFilters.rating?.length);
  const effectiveTotal = hasClientOnlyFilters ? filteredBusinesses.length : totalCount || filteredBusinesses.length;
  const totalPages = Math.ceil(effectiveTotal / ITEMS_PER_PAGE);

  // For grid view, businesses are already paginated server-side — show all returned
  // For client-only filter scenarios, slice client-side
  const currentBusinesses = useMemo(() => {
    if (hasClientOnlyFilters) {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredBusinesses.slice(start, start + ITEMS_PER_PAGE);
    }
    return filteredBusinesses; // server already returned the right page
  }, [filteredBusinesses, currentPage, hasClientOnlyFilters]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow overflow-x-hidden pt-28 sm:pt-32 lg:pt-36">
        <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-6 lg:py-6 max-w-full">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary px-2">Kenya Export Trade Directory</h1>
            <p className="mt-4 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
              Discover trusted, verified Kenyan exporters and their products.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 w-full">
            {/* Desktop sidebar filters */}
            <aside className="hidden xl:block">
              <Card>
                <CardHeader>
                  <CardTitle>Filters &amp; Sorting</CardTitle>
                  <CardDescription>Refine the list of exporters using the options below.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Filters
                    selectedFilters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    onTextFilterChange={handleTextFilterChange}
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                    clearFilters={handleClearFilters}
                    viewMode={viewMode}
                    filterCategories={dynamicFilterCategories}
                  />
                </CardContent>
              </Card>
            </aside>

            <div className="xl:col-span-3 min-w-0">
              {/* Search + view toggle */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 mt-4 sm:mt-0">
                <div className="flex gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {/* FIX #2: Controlled by searchInput — debounced to searchTerm */}
                    <Input
                      placeholder="Search by company or keyword..."
                      className="pl-9 h-11 text-sm w-full shadow-sm"
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                    />
                  </div>
                  <Button className="h-11 px-6 hidden sm:flex">Search</Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile filters sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="h-11 xl:hidden flex-1 sm:flex-none sm:px-4 transition-all hover:bg-gray-100">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Filters</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                      <SheetHeader className="p-4 border-b">
                        <SheetTitle>Filters &amp; Sorting</SheetTitle>
                        <SheetDescription>Refine the list of exporters using the options below.</SheetDescription>
                      </SheetHeader>
                      <Filters
                        selectedFilters={selectedFilters}
                        onFilterChange={handleFilterChange}
                        onTextFilterChange={handleTextFilterChange}
                        sortOrder={sortOrder}
                        onSortChange={setSortOrder}
                        clearFilters={handleClearFilters}
                        viewMode={viewMode}
                        filterCategories={dynamicFilterCategories}
                      />
                      <SheetClose asChild>
                        <Button className="m-4">Apply</Button>
                      </SheetClose>
                    </SheetContent>
                  </Sheet>

                  <Button
                    variant="outline"
                    onClick={() => setViewMode('grid')}
                    className={`h-11 flex-1 sm:flex-none sm:px-4 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Grid</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('map')}
                    className={`h-11 flex-1 sm:flex-none sm:px-4 transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Map</span>
                  </Button>
                </div>
              </div>

              {/* Result count */}
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">
                  {isInitialLoad ? (
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  ) : (
                    <span>{effectiveTotal} businesses found</span>
                  )}
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="flex flex-col">
                  {/*
                    FIX #1: Loading UX
                    - isInitialLoad=true  → show skeleton grid (first visit, no data yet)
                    - isLoading=true      → keep existing cards visible, show overlay spinner
                    - neither            → show cards normally
                  */}
                  <div className="relative">
                    {/* Overlay spinner for subsequent fetches — no blank flash */}
                    {!isInitialLoad && isLoading && (
                      <div className="absolute inset-0 z-10 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-6">
                      {isInitialLoad ? (
                        Array.from({ length: 6 }).map((_, i) => <ExporterGridCardSkeleton key={i} />)
                      ) : currentBusinesses.length > 0 ? (
                        currentBusinesses.map(business => (
                          <ExporterGridCard
                            key={business.id}
                            business={business}
                            onViewProfileClick={() => setModalBusiness(business)}
                          />
                        ))
                      ) : (
                        <div className="sm:col-span-2 lg:col-span-3 h-64 flex flex-col items-center justify-center text-center bg-card rounded-lg shadow-sm p-6">
                          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No Results Found</h3>
                          <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                          <Button variant="outline" className="mt-4" onClick={handleClearFilters}>Clear All Filters</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 pt-6 border-t bg-background">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={page => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Card className="h-[60vh] sm:h-[70vh] w-full overflow-hidden">
                  {isInitialLoad && isLoading ? (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading businesses...</p>
                      </div>
                    </div>
                  ) : (
                    <MapView
                      businesses={mapBusinesses}
                      onViewCardClick={business => {
                        const orig = businesses.find(b => b.id === business.id);
                        if (orig) setModalBusiness(orig);
                      }}
                      focusedBusiness={focusedBusiness ? mapBusinesses.find(b => b.id === focusedBusiness.id) || null : null}
                      onFocusedBusinessChange={business => {
                        if (business) {
                          const orig = businesses.find(b => b.id === business.id);
                          if (orig) setFocusedBusiness(orig);
                        } else {
                          setFocusedBusiness(null);
                        }
                      }}
                      showControls={true}
                      showLegend={true}
                      showSearch={true}
                      enableClustering={false}
                    />
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Exporter Profile Modal — Desktop dialog / Mobile full-screen */}
        {modalBusiness && (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setModalBusiness(null)} />
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6 lg:p-10">
                <div ref={modalRef} className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[88vh] overflow-y-auto my-auto" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setModalBusiness(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <ExporterProfileCard
                    business={modalBusiness}
                    onPinClick={() => { setFocusedBusiness(modalBusiness); setModalBusiness(null); setViewMode('map'); }}
                  />
                </div>
              </div>
            </div>

            {/* Mobile full-screen */}
            <div
              className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto overscroll-contain"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              <div className={`sticky z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${hasGoogleTranslate ? 'top-10' : 'top-0'}`}>
                <div className="px-3 py-3 sm:px-4 sm:py-3.5">
                  <div className="flex items-center justify-between gap-2 sm:gap-3" style={{ flexWrap: 'nowrap' }}>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setModalBusiness(null); }}
                      className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                      style={{ flexShrink: 0 }}
                    >
                      <X className="h-5 w-5 sm:h-5 sm:w-5" />
                      <span className="font-medium">Back</span>
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3" style={{ flexShrink: 0 }}>
                      {user?.role !== 'EXPORTER' && (
                        <button
                          onClick={async e => {
                            e.preventDefault(); e.stopPropagation();
                            if (!user) {
                              toast({ title: 'Login Required', description: 'Please login to add businesses to your favorites.', variant: 'destructive' });
                              return;
                            }
                            try {
                              const res = await apiClient.checkFavoriteStatus(modalBusiness.id);
                              if (res.isFavorited) {
                                await apiClient.removeFromFavorites(modalBusiness.id);
                                toast({ title: 'Removed from Favorites', description: `${modalBusiness.name} has been removed from your favorites.` });
                              } else {
                                await apiClient.addToFavorites(modalBusiness.id);
                                toast({ title: 'Added to Favorites', description: `${modalBusiness.name} has been added to your favorites.` });
                              }
                            } catch {
                              toast({ title: 'Error', description: 'Failed to update favorites. Please try again.', variant: 'destructive' });
                            }
                          }}
                          className="p-2 sm:p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-50 transition-colors"
                          style={{ flexShrink: 0 }}
                        >
                          <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 hover:text-red-500" />
                        </button>
                      )}

                      {modalBusiness.verificationStatus === 'VERIFIED' && (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-emerald-600 text-white border border-emerald-400 shadow-md"
                          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                            <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                          </svg>
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <ExporterProfileCard
                business={modalBusiness}
                onPinClick={() => { setFocusedBusiness(modalBusiness); setModalBusiness(null); setViewMode('map'); }}
                hideBadgeOnMobile={true}
              />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <DirectoryPageContent />
    </Suspense>
  );
}
