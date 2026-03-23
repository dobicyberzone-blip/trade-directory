'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface Statistics {
  totalExporters: number;
  verifiedExporters: number;
  productCategories: number;
  countriesReached: number;
}

export function StatisticsTicker() {
  const [stats, setStats] = useState<Statistics>({
    totalExporters: 0,
    verifiedExporters: 0,
    productCategories: 0,
    countriesReached: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/statistics/home');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // Keep default values on error
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <section className="py-16 md:py-24 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kenya's Growing Export Community
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto">
            Join thousands of verified exporters connecting with global buyers
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 mr-2" />
              <p className="text-4xl md:text-5xl font-bold">
                {isLoading ? '...' : `${formatNumber(stats.totalExporters)}+`}
              </p>
            </div>
            <p className="text-white/80 text-sm md:text-base">Total Exporters</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 mr-2" />
              <p className="text-4xl md:text-5xl font-bold">
                {isLoading ? '...' : `${formatNumber(stats.verifiedExporters)}+`}
              </p>
            </div>
            <p className="text-white/80 text-sm md:text-base">Verified Exporters</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 mr-2" />
              <p className="text-4xl md:text-5xl font-bold">
                {isLoading ? '...' : `${formatNumber(stats.productCategories)}+`}
              </p>
            </div>
            <p className="text-white/80 text-sm md:text-base">Product Categories</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 mr-2" />
              <p className="text-4xl md:text-5xl font-bold">
                {isLoading ? '...' : `${formatNumber(stats.countriesReached)}+`}
              </p>
            </div>
            <p className="text-white/80 text-sm md:text-base">Countries Reached</p>
          </div>
        </div>
      </div>
    </section>
  );
}
