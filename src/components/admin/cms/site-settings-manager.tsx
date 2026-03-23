'use client';

import { useState } from 'react';
import { SiteSettings, apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Save, 
  Settings, 
  Globe, 
  Palette, 
  Mail, 
  Search
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SiteSettingsManagerProps {
  settings: SiteSettings[];
  onSettingsChange: (settings: SiteSettings[]) => void;
  onRefresh: () => void;
}

export function SiteSettingsManager({ settings, onSettingsChange, onRefresh }: SiteSettingsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    settingKey: '',
    settingValue: '',
    description: '',
    category: 'general'
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'general', label: 'General', icon: Settings },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'contact', label: 'Contact', icon: Mail },
    { value: 'seo', label: 'SEO', icon: Search }
  ];

  const handleOpenDialog = (setting?: SiteSettings) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        settingKey: setting.settingKey,
        settingValue: setting.settingValue,
        description: setting.description || '',
        category: setting.category
      });
    } else {
      setEditingSetting(null);
      setFormData({
        settingKey: '',
        settingValue: '',
        description: '',
        category: selectedCategory
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSetting(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.settingKey.trim() || !formData.settingValue.trim()) {
        toast({
          title: "Error",
          description: "Setting key and value are required",
          variant: "destructive"
        });
        return;
      }

      await apiClient.saveSiteSetting(formData);
      
      toast({
        title: "Success",
        description: `Setting ${editingSetting ? 'updated' : 'created'} successfully`
      });
      
      handleCloseDialog();
      onRefresh();
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to save setting",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const getSettingIcon = (settingKey: string) => {
    if (settingKey.includes('color')) return Palette;
    if (settingKey.includes('email') || settingKey.includes('contact')) return Mail;
    if (settingKey.includes('seo') || settingKey.includes('meta')) return Search;
    return Settings;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Site Settings</h2>
          <p className="text-gray-600">Manage global site settings and configuration</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Setting
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              {category.label}
              <Badge variant="secondary" className="ml-1">
                {getSettingsByCategory(category.value).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categorySettings = getSettingsByCategory(category.value);
          
          return (
            <TabsContent key={category.value} value={category.value} className="mt-6">
              <div className="space-y-4">
                {categorySettings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <category.icon className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {category.label.toLowerCase()} settings</h3>
                      <p className="text-gray-600 mb-4">Add your first {category.label.toLowerCase()} setting.</p>
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Setting
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {categorySettings.map((setting) => {
                      const IconComponent = getSettingIcon(setting.settingKey);
                      
                      return (
                        <Card key={setting.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <IconComponent className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{setting.settingKey}</CardTitle>
                                  {setting.description && (
                                    <CardDescription className="mt-1">{setting.description}</CardDescription>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(setting)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm font-mono text-gray-700 break-all">
                                {setting.settingValue}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? 'Edit Setting' : 'Create Setting'}
            </DialogTitle>
            <DialogDescription>
              {editingSetting ? 'Update the setting details below.' : 'Create a new site setting.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="settingKey">Setting Key *</Label>
              <Input
                id="settingKey"
                value={formData.settingKey}
                onChange={(e) => setFormData({ ...formData, settingKey: e.target.value })}
                placeholder="site_title, primary_color, contact_email..."
                disabled={!!editingSetting}
              />
            </div>

            <div>
              <Label htmlFor="settingValue">Setting Value *</Label>
              <Textarea
                id="settingValue"
                value={formData.settingValue}
                onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
                placeholder="Setting value"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this setting"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingSetting ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}