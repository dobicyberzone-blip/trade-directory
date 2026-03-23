'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import type { SuccessStory } from '@/lib/api';
import { Plus, Send, Loader2 } from 'lucide-react';

const productCategories = [
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
  'Gems & Minerals',
  'Other'
];

const exportDestinations = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Belgium',
  'Italy',
  'Spain',
  'Canada',
  'Australia',
  'Japan',
  'China',
  'India',
  'South Africa',
  'UAE',
  'Other'
];

interface SuccessStoryFormProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  editingStory?: SuccessStory;
  onCancel?: () => void;
}

export function SuccessStoryForm({ onSuccess, trigger, editingStory, onCancel }: SuccessStoryFormProps) {
  const [isOpen, setIsOpen] = useState(!!editingStory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: editingStory?.title || '',
    story: editingStory?.story || '',
    companyName: editingStory?.companyName || '',
    buyerName: editingStory?.buyerName || '',
    buyerTitle: editingStory?.buyerTitle || '',
    exporterName: editingStory?.exporterName || '',
    productCategory: editingStory?.productCategory || '',
    exportValue: editingStory?.exportValue || '',
    exportDestination: editingStory?.exportDestination || '',
    imageUrl: editingStory?.imageUrl || '',
  });

  // Update form data when editingStory changes
  useEffect(() => {
    if (editingStory) {
      setFormData({
        title: editingStory.title || '',
        story: editingStory.story || '',
        companyName: editingStory.companyName || '',
        buyerName: editingStory.buyerName || '',
        buyerTitle: editingStory.buyerTitle || '',
        exporterName: editingStory.exporterName || '',
        productCategory: editingStory.productCategory || '',
        exportValue: editingStory.exportValue || '',
        exportDestination: editingStory.exportDestination || '',
        imageUrl: editingStory.imageUrl || '',
      });
      setIsOpen(true);
    }
  }, [editingStory]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['title', 'story', 'companyName', 'buyerName', 'exporterName', 'productCategory', 'exportDestination'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      let response;
      if (editingStory) {
        // Update existing story
        response = await apiClient.updateSuccessStory(editingStory.id, formData);
        toast({
          title: 'Success Story Updated!',
          description: response.message,
        });
      } else {
        // Create new story
        response = await apiClient.createSuccessStory(formData);
        toast({
          title: 'Success Story Submitted!',
          description: response.message,
        });
      }

      // Reset form only if creating new story
      if (!editingStory) {
        setFormData({
          title: '',
          story: '',
          companyName: '',
          buyerName: '',
          buyerTitle: '',
          exporterName: '',
          productCategory: '',
          exportValue: '',
          exportDestination: '',
          imageUrl: '',
        });
      }

      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: editingStory ? 'Update Failed' : 'Submission Failed',
        description: error.message || `Failed to ${editingStory ? 'update' : 'submit'} success story. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        onCancel?.();
      }
    }}>
      {!editingStory && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Share Your Success Story
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100vw-16px)] sm:max-w-[600px] md:max-w-[650px] lg:max-w-[700px] h-[calc(100vh-16px)] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 md:px-5 py-3 md:py-4 border-b flex-shrink-0">
          <DialogTitle className="text-base md:text-lg">
            {editingStory ? 'Edit Success Story' : 'Share Your Export Success Story'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 overscroll-contain">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="title" className="text-sm">Story Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., How KEPROBA helped us export premium coffee to Europe"
                  required
                  className="text-sm h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="companyName" className="text-sm">Your Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Your company name"
                    required
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <Label htmlFor="buyerName" className="text-sm">Your Name *</Label>
                  <Input
                    id="buyerName"
                    value={formData.buyerName}
                    onChange={(e) => handleInputChange('buyerName', e.target.value)}
                    placeholder="Your full name"
                    required
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="buyerTitle" className="text-sm">Your Job Title</Label>
                  <Input
                    id="buyerTitle"
                    value={formData.buyerTitle}
                    onChange={(e) => handleInputChange('buyerTitle', e.target.value)}
                    placeholder="e.g., Procurement Manager"
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <Label htmlFor="exporterName" className="text-sm">Exporter/Supplier Name *</Label>
                  <Input
                    id="exporterName"
                    value={formData.exporterName}
                    onChange={(e) => handleInputChange('exporterName', e.target.value)}
                    placeholder="Kenyan exporter name"
                    required
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="productCategory" className="text-sm">Product Category *</Label>
                  <Select value={formData.productCategory} onValueChange={(value) => handleInputChange('productCategory', value)}>
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category} className="text-sm">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="exportDestination" className="text-sm">Export Destination *</Label>
                  <Select value={formData.exportDestination} onValueChange={(value) => handleInputChange('exportDestination', value)}>
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {exportDestinations.map((destination) => (
                        <SelectItem key={destination} value={destination} className="text-sm">
                          {destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="exportValue" className="text-sm">Export Value (Optional)</Label>
                  <Input
                    id="exportValue"
                    value={formData.exportValue}
                    onChange={(e) => handleInputChange('exportValue', e.target.value)}
                    placeholder="e.g., $50,000 USD"
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl" className="text-sm">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    placeholder="Image URL"
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="story" className="text-sm">Your Success Story *</Label>
                <Textarea
                  id="story"
                  value={formData.story}
                  onChange={(e) => handleInputChange('story', e.target.value)}
                  placeholder="Tell us about your experience working with Kenyan exporters through KEPROBA. What challenges did you face? How did the platform help? What was the outcome?"
                  rows={4}
                  required
                  className="text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Share details about your experience, challenges overcome, and the positive impact.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Your success story will be reviewed by our team before being published.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  onCancel?.();
                }} 
                className="text-sm h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="text-sm h-9">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingStory ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {editingStory ? 'Update Story' : 'Submit Story'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}