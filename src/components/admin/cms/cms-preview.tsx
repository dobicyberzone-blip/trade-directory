'use client';

import React, { useState } from 'react';
import { ContentSection, ContentItem, SiteSettings } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  ExternalLink, 
  Settings, 
  Layout, 
  FileText, 
  Image,
  Users,
  Factory,
  TrendingUp,
  Globe
} from 'lucide-react';

interface CMSPreviewProps {
  sections: ContentSection[];
  items: Record<string, ContentItem[]>;
  settings: SiteSettings[];
}

export function CMSPreview({ sections, items, settings }: CMSPreviewProps) {
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const activeSections = sections.filter(section => section.isActive);
  const totalItems = Object.values(items).reduce((total, sectionItems) => total + sectionItems.length, 0);

  const getSectionItems = (sectionId: string) => {
    return items[sectionId] || [];
  };

  const getSiteSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || 'Not set';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Preview</h2>
          <p className="text-gray-600">Preview your content structure and settings</p>
        </div>
        <Button 
          onClick={() => window.open('/', '_blank')}
          className="flex items-center gap-2"
        >
          <ExternalLink size={16} />
          View Live Site
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layout size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sections</p>
                <p className="text-2xl font-bold">{activeSections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Content Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Site Settings</p>
                <p className="text-2xl font-bold">{settings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Globe size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Site Status</p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Live
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Site Configuration
          </CardTitle>
          <CardDescription>
            Current site settings and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Site Title</label>
                <p className="text-sm text-gray-900">{getSiteSettingValue('site_title')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Site Description</label>
                <p className="text-sm text-gray-900">{getSiteSettingValue('site_description')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Contact Email</label>
                <p className="text-sm text-gray-900">{getSiteSettingValue('contact_email')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <p className="text-sm text-gray-900">{getSiteSettingValue('phone_number')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-sm text-gray-900">{getSiteSettingValue('address')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Social Media</label>
                <div className="flex gap-2">
                  {getSiteSettingValue('facebook_url') !== 'Not set' && (
                    <Badge variant="outline">Facebook</Badge>
                  )}
                  {getSiteSettingValue('twitter_url') !== 'Not set' && (
                    <Badge variant="outline">Twitter</Badge>
                  )}
                  {getSiteSettingValue('linkedin_url') !== 'Not set' && (
                    <Badge variant="outline">LinkedIn</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Sections Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout size={20} />
            Content Sections
          </CardTitle>
          <CardDescription>
            Overview of all content sections and their items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layout size={48} className="mx-auto mb-4 opacity-50" />
                <p>No active content sections found</p>
              </div>
            ) : (
              activeSections.map((section) => {
                const sectionItems = getSectionItems(section.id);
                return (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {section.type === 'hero' && <Image size={16} className="text-blue-600" />}
                          {section.type === 'features' && <Layout size={16} className="text-blue-600" />}
                          {section.type === 'exporters' && <Users size={16} className="text-blue-600" />}
                          {section.type === 'sectors' && <Factory size={16} className="text-blue-600" />}
                          {section.type === 'success_stories' && <TrendingUp size={16} className="text-blue-600" />}
                          {!['hero', 'features', 'exporters', 'sectors', 'success_stories'].includes(section.type) && (
                            <FileText size={16} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{section.title}</h4>
                          <p className="text-sm text-gray-600">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {section.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {sectionItems.length} items
                        </Badge>
                      </div>
                    </div>
                    
                    {sectionItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sectionItems.slice(0, 6).map((item) => (
                            <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                              <h5 className="font-medium text-sm">{item.title}</h5>
                              {item.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant={item.isActive ? "default" : "secondary"} 
                                  className="text-xs"
                                >
                                  {item.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {item.order !== undefined && (
                                  <span className="text-xs text-gray-500">Order: {item.order}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {sectionItems.length > 6 && (
                            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-center">
                              <span className="text-sm text-gray-600">
                                +{sectionItems.length - 6} more items
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye size={20} />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.open('/', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink size={16} />
              View Homepage
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/directory', '_blank')}
              className="flex items-center gap-2"
            >
              <Users size={16} />
              View Directory
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/products', '_blank')}
              className="flex items-center gap-2"
            >
              <Factory size={16} />
              View Products
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/about', '_blank')}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              View About
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}