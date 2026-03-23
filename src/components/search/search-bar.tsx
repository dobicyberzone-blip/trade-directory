"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  text: string;
  type: 'business' | 'product' | 'category' | 'sector' | 'location';
}

interface SearchFilters {
  category?: string;
  location?: string;
  sector?: string;
  verificationStatus?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
  defaultQuery?: string;
  defaultFilters?: SearchFilters;
}

export function SearchBar({
  onSearch,
  placeholder = "Search businesses, products, or services...",
  showFilters = true,
  className,
  defaultQuery = '',
  defaultFilters = {},
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [availableFilters, setAvailableFilters] = useState<{
    categories?: string[];
    sectors?: string[];
    locations?: string[];
    sortOptions?: Array<{ value: string; label: string }>;
  }>({});
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load available filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Use environment variable for API URL
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        
        if (!API_BASE_URL) {
          console.error('NEXT_PUBLIC_API_URL environment variable is not set');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/search/filters`);
        if (response.ok) {
          const data = await response.json();
          setAvailableFilters(data.data);
        } else {

        }
      } catch (error) {

      }
    };

    loadFilters();
  }, []);

  // Handle search suggestions
  useEffect(() => {
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    if (query.length >= 2) {
      suggestionsTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          // Use environment variable for API URL
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        
        if (!API_BASE_URL) {
          console.error('NEXT_PUBLIC_API_URL environment variable is not set');
          return;
        }
          
          const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}&limit=8`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.data || []);
            setShowSuggestions(true);
          }
        } catch (error) {

        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, [query]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    onSearch(finalQuery, filters);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string | number | undefined) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      if (key === 'minRating' && typeof value === 'number') {
        newFilters[key] = value;
      } else if (typeof value === 'string') {
        (newFilters as Record<string, string | number>)[key] = value;
      }
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'business': return '🏢';
      case 'product': return '📦';
      case 'category': return '🏷️';
      case 'sector': return '🏭';
      case 'location': return '📍';
      default: return '🔍';
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-3xl", className)}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          className="pl-10 sm:pl-12 pr-20 sm:pr-24 h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-green-500 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          
          <Button
            onClick={() => handleSearch()}
            size="sm"
            className="h-7 sm:h-8 bg-green-600 hover:bg-green-700 text-white px-2.5 sm:px-3 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 sm:space-x-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <span className="text-base sm:text-lg">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{suggestion.text}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{suggestion.type}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center space-x-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex-shrink-0 shadow-sm hover:shadow-md transition-shadow">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="text-xs sm:text-sm">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 sm:ml-1.5 h-4 w-4 sm:h-5 sm:w-5 p-0 text-xs flex items-center justify-center bg-green-100 text-green-700">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 sm:w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm sm:text-base">Search Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs sm:text-sm">
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 block">Category</label>
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {availableFilters.categories?.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 block">Location</label>
                  <Select
                    value={filters.location || 'all'}
                    onValueChange={(value) => updateFilter('location', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {availableFilters.locations?.map((location: string) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sector Filter */}
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 block">Sector</label>
                  <Select
                    value={filters.sector || 'all'}
                    onValueChange={(value) => updateFilter('sector', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="All sectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sectors</SelectItem>
                      {availableFilters.sectors?.map((sector: string) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 block">Sort By</label>
                  <Select
                    value={filters.sortBy || 'relevance'}
                    onValueChange={(value) => updateFilter('sortBy', value)}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilters.sortOptions?.map((option: { value: string; label: string }) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => handleSearch()} 
                  className="w-full h-8 sm:h-9 bg-green-600 hover:bg-green-700 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all"
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filters Display */}
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            return (
              <Badge key={key} variant="secondary" className="h-8 px-2 sm:px-2.5 flex-shrink-0 bg-green-50 text-green-700 border-green-200">
                <span className="text-xs truncate max-w-[100px] sm:max-w-none">
                  {key}: {String(value)}
                </span>
                <button
                  onClick={() => updateFilter(key as keyof SearchFilters, undefined)}
                  className="ml-1 sm:ml-1.5 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
