'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useSearchParams } from 'next/navigation';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { Pagination } from '@/components/pagination';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { kenyanCounties } from '@/lib/kenyan-counties';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const filterCategories = [
  { id: 'category', name: 'Product Category', options: [
    'Fresh Produce', 
    'Coffee', 
    'Tea', 
    'Flowers', 
    'Nuts', 
    'Herbs & Spices', 
    'Fish & Seafood', 
    'Meat & Livestock', 
    'Textiles & Apparel', 
    'Leather Goods', 
    'Wood Carvings', 
    'Beadwork', 
    'Pottery', 
    'Software', 
    'BPO Services', 
    'Gems & Minerals'
  ] },
];

const productSortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'newest', label: 'Newest' },
];

function Filters({ selectedFilters, onFilterChange, sortOrder, onSortChange, clearFilters }: { 
  selectedFilters: Record<string, string[]>, 
  onFilterChange: (category: string, option: string) => void, 
  sortOrder: string, 
  onSortChange: (value: string) => void, 
  clearFilters: () => void 
}) {
    const activeFilterCount = Object.values(selectedFilters).flat().length;

    return (
        <div className='h-full flex flex-col'>
            <ScrollArea className="flex-grow">
                <Accordion type="multiple" defaultValue={[]} className="w-full">
                    <AccordionItem value="sort">
                        <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">Sort by</AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <RadioGroup value={sortOrder} onValueChange={onSortChange} className="space-y-1 px-4 pb-2">
                                {productSortOptions.map(option => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                                        <Label htmlFor={`sort-${option.value}`} className="font-normal cursor-pointer flex-grow py-1">{option.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </AccordionContent>
                    </AccordionItem>
                    {filterCategories.map(category => (
                    <AccordionItem key={category.id} value={category.id}>
                        <AccordionTrigger className="font-semibold hover:no-underline px-4 py-3">{category.name}</AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <ScrollArea className="h-60 px-4">
                                <div className="space-y-2 pb-2">
                                    {category.options.map(option => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox 
                                        id={`${category.id}-${option}`} 
                                        checked={selectedFilters[category.id]?.includes(option) || false}
                                        onCheckedChange={() => onFilterChange(category.id, option)}
                                        />
                                        <Label
                                        htmlFor={`${category.id}-${option}`}
                                        className="font-normal cursor-pointer flex-grow py-1"
                                        >
                                        {option}
                                        </Label>
                                    </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
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
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('featured');

  useEffect(() => {
    const category = searchParams.get('category');
    const newFilters: Record<string, string[]> = {};
    if (category) {
        newFilters['category'] = [category];
    }
    if (Object.keys(newFilters).length > 0) {
        setSelectedFilters(newFilters);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProducts();
      setProducts(response.products);
    } catch (error) {

      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (category: string, option: string) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      const currentCategoryFilters = prev[category] || [];
      const newCategoryFilters = currentCategoryFilters.includes(option)
        ? currentCategoryFilters.filter(item => item !== option)
        : [...currentCategoryFilters, option];
      
      if (newCategoryFilters.length === 0) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [category]: newCategoryFilters,
      };
    });
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setSelectedFilters({});
    setSearchTerm('');
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let productsToFilter = [...products];

    if (searchTerm) {
        productsToFilter = productsToFilter.filter(product => {
            const searchTermLower = searchTerm.toLowerCase();
            return product.name.toLowerCase().includes(searchTermLower) ||
                   product.category.toLowerCase().includes(searchTermLower);
        });
    }

    if (Object.keys(selectedFilters).length > 0) {
        productsToFilter = productsToFilter.filter(product => {
            return Object.entries(selectedFilters).every(([key, values]) => {
                if (values.length === 0) return true;
                const productValue = (product as any)[key];
                if (productValue === undefined || productValue === null) return false;
                return values.includes(String(productValue));
            });
        });
    }

    const sorted = [...productsToFilter].sort((a, b) => {
        switch (sortOrder) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'featured':
            default:
                return 0; // Keep original order
        }
    });

    return sorted;
  }, [products, searchTerm, selectedFilters, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">Product Catalog</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Discover quality products from verified Kenyan exporters.
            </p>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <aside className="hidden xl:block">
              <Card>
                <CardHeader>
                  <CardTitle>Filters & Sorting</CardTitle>
                  <CardDescription>
                    Refine the list of products using the options below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Filters 
                    selectedFilters={selectedFilters} 
                    onFilterChange={handleFilterChange} 
                    sortOrder={sortOrder} 
                    onSortChange={setSortOrder} 
                    clearFilters={handleClearFilters} 
                  />
                </CardContent>
              </Card>
            </aside>

            <div className="xl:col-span-3">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="xl:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                      <SheetTitle>Filters & Sorting</SheetTitle>
                      <SheetDescription>
                        Refine the list of products using the options below.
                      </SheetDescription>
                    </SheetHeader>
                    <Filters 
                      selectedFilters={selectedFilters} 
                      onFilterChange={handleFilterChange} 
                      sortOrder={sortOrder} 
                      onSortChange={setSortOrder} 
                      clearFilters={handleClearFilters} 
                    />
                    <SheetClose asChild>
                      <Button className="m-4">Close</Button>
                    </SheetClose>
                  </SheetContent>
                </Sheet>
               
                <div className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <span>{filteredProducts?.length || 0} products found</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                ) : currentProducts && currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="sm:col-span-2 lg:col-span-3 h-64 flex flex-col items-center justify-center text-center bg-card rounded-lg shadow-sm p-6">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                    <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}