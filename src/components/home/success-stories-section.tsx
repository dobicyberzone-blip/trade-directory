'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Globe, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface SuccessStory {
  id: string;
  title: string;
  story: string;
  companyName: string;
  buyerName: string;
  buyerTitle?: string;
  exporterName: string;
  productCategory: string;
  exportValue?: string;
  exportDestination: string;
  imageUrl?: string;
  isFeatured: boolean;
  createdAt: string;
}

export function SuccessStoriesSection() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchSuccessStories();
  }, []);

  const fetchSuccessStories = async () => {
    try {
      const response = await fetch('/api/success-stories?featured=true');
      const data = await response.json();
      setStories(data.stories || []);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (stories.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Export Success Stories
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Success stories from our community will be featured here. Be the first to share your export success story!
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-2 rounded-full mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">Success Stories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Export Success Stories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Real stories from Kenyan exporters who have successfully expanded their businesses to international markets
          </p>
        </div>

        {/* Featured Story Card */}
        <div className="max-w-6xl mx-auto">
          <Card className="overflow-hidden shadow-2xl border-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="relative h-64 md:h-auto bg-gray-200 dark:bg-gray-700">
                {currentStory.imageUrl ? (
                  <Image
                    src={currentStory.imageUrl}
                    alt={currentStory.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600">
                    <Award className="w-24 h-24 text-white opacity-50" />
                  </div>
                )}
                {currentStory.isFeatured && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-yellow-500 text-white border-0">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <CardContent className="p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {currentStory.title}
                  </h3>

                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed line-clamp-6">
                    {currentStory.story}
                  </p>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Export Value</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {currentStory.exportValue || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Destination</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {currentStory.exportDestination}
                      </p>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exporter:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{currentStory.exporterName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Buyer:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentStory.buyerName}
                        {currentStory.buyerTitle && ` (${currentStory.buyerTitle})`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Product:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{currentStory.productCategory}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                {stories.length > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStory}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex gap-2">
                      {stories.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentIndex
                              ? 'bg-green-600 w-8'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Go to story ${index + 1}`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextStory}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Story Counter */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {currentIndex + 1} of {stories.length} success stories
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
