'use client';

import { useState } from 'react';
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  FileType
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCenteredDialog } from '@/hooks/useCenteredDialog';

// Export quality options
export type ExportQuality = 'standard' | 'high' | 'print';

// Export format options
export type ExportFormat = 'pdf' | 'png' | 'jpg';

// Export options interface
export interface ExportOptions {
  quality: ExportQuality;
  format: ExportFormat;
  includeMap: boolean;
  includeCertifications: boolean;
  includeProducts: boolean;
  includeContactInfo: boolean;
  fileName: string;
  pageSize?: 'a4' | 'letter' | 'auto';
  orientation?: 'portrait' | 'landscape' | 'auto';
}

// Default export options
export const defaultExportOptions: ExportOptions = {
  quality: 'high',
  format: 'pdf',
  includeMap: true,
  includeCertifications: true,
  includeProducts: true,
  includeContactInfo: true,
  fileName: '',
  pageSize: 'auto',
  orientation: 'auto',
};

// Quality settings mapping
export const qualitySettings: Record<ExportQuality, { scale: number; jpgQuality: number; description: string }> = {
  standard: {
    scale: 1.5,
    jpgQuality: 0.8,
    description: 'Good quality, smaller file size - suitable for email',
  },
  high: {
    scale: 2.5,
    jpgQuality: 0.92,
    description: 'High quality, balanced file size - suitable for sharing',
  },
  print: {
    scale: 4,
    jpgQuality: 1.0,
    description: 'Maximum quality, larger file size - suitable for printing',
  },
};

interface ExportOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

export function ExportOptionsDialog({
  isOpen,
  onOpenChange,
  businessName,
  onExport,
  isExporting,
}: ExportOptionsDialogProps): React.ReactElement {
  const dialogStyle = useCenteredDialog();
  const [options, setOptions] = useState<ExportOptions>({
    ...defaultExportOptions,
    fileName: businessName.replace(/[^a-zA-Z0-9]/g, '_'),
  });

  // Update options when business name changes
  useState(() => {
    setOptions(prev => ({
      ...prev,
      fileName: businessName.replace(/[^a-zA-Z0-9]/g, '_'),
    }));
  });

  const handleQualityChange = (quality: ExportQuality) => {
    setOptions(prev => ({ ...prev, quality }));
  };

  const handleFormatChange = (format: ExportFormat) => {
    setOptions(prev => ({ 
      ...prev, 
      format,
      // Adjust default page size for images
      pageSize: format === 'pdf' ? prev.pageSize : undefined,
      orientation: format === 'pdf' ? prev.orientation : undefined,
    }));
  };

  const handleIncludeChange = (field: keyof Omit<ExportOptions, 'quality' | 'format' | 'fileName' | 'pageSize' | 'orientation'>, checked: boolean) => {
    setOptions(prev => ({ ...prev, [field]: checked }));
  };

  const handleFileNameChange = (value: string) => {
    // Sanitize filename - only allow alphanumeric, underscore, hyphen
    const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '_');
    setOptions(prev => ({ ...prev, fileName: sanitized }));
  };

  const handleExport = () => {
    onExport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" style={dialogStyle}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Export Business Profile
          </DialogTitle>
          <DialogDescription>
            Configure export settings for your business profile. Choose quality, format, and content options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName" className="text-sm font-semibold">
              File Name
            </Label>
            <Input
              id="fileName"
              value={options.fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              placeholder="Enter file name"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              The file will be saved as: {options.fileName || 'business_profile'}.{options.format}
            </p>
          </div>

          <Separator />

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleFormatChange('pdf')}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                  options.format === 'pdf'
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <FileText className="h-8 w-8 mb-2" />
                <span className="text-sm font-semibold">PDF</span>
                <span className="text-xs text-muted-foreground mt-1">Document</span>
              </button>
              <button
                onClick={() => handleFormatChange('png')}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                  options.format === 'png'
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <ImageIcon className="h-8 w-8 mb-2" />
                <span className="text-sm font-semibold">PNG</span>
                <span className="text-xs text-muted-foreground mt-1">Image</span>
              </button>
              <button
                onClick={() => handleFormatChange('jpg')}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                  options.format === 'jpg'
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <FileType className="h-8 w-8 mb-2" />
                <span className="text-sm font-semibold">JPG</span>
                <span className="text-xs text-muted-foreground mt-1">Image</span>
              </button>
            </div>
          </div>

          <Separator />

          {/* Quality Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Quality</Label>
            <RadioGroup
              value={options.quality}
              onValueChange={(value) => handleQualityChange(value as ExportQuality)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="quality-standard" />
                <Label htmlFor="quality-standard" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Standard</span>
                    <span className="text-xs text-muted-foreground">1.5x • ~500KB</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Good for email and web</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="quality-high" />
                <Label htmlFor="quality-high" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">High</span>
                    <span className="text-xs text-muted-foreground">2.5x • ~1MB</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best for sharing</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="quality-print" />
                <Label htmlFor="quality-print" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Print</span>
                    <span className="text-xs text-muted-foreground">4x • ~3MB</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best for printing</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {options.format === 'pdf' && (
            <>
              <Separator />
              
              {/* PDF Options */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">PDF Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pageSize" className="text-xs text-muted-foreground">Page Size</Label>
                    <select
                      id="pageSize"
                      value={options.pageSize}
                      onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as 'a4' | 'letter' | 'auto' }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="auto">Auto</option>
                      <option value="a4">A4</option>
                      <option value="letter">Letter</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orientation" className="text-xs text-muted-foreground">Orientation</Label>
                    <select
                      id="orientation"
                      value={options.orientation}
                      onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'landscape' | 'auto' }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="auto">Auto</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Include Content</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMap"
                  checked={options.includeMap}
                  onCheckedChange={(checked) => handleIncludeChange('includeMap', checked as boolean)}
                />
                <Label htmlFor="includeMap" className="text-sm cursor-pointer">
                  Location Map
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCertifications"
                  checked={options.includeCertifications}
                  onCheckedChange={(checked) => handleIncludeChange('includeCertifications', checked as boolean)}
                />
                <Label htmlFor="includeCertifications" className="text-sm cursor-pointer">
                  Certifications & Trust Signals
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeProducts"
                  checked={options.includeProducts}
                  onCheckedChange={(checked) => handleIncludeChange('includeProducts', checked as boolean)}
                />
                <Label htmlFor="includeProducts" className="text-sm cursor-pointer">
                  Products & Services
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeContactInfo"
                  checked={options.includeContactInfo}
                  onCheckedChange={(checked) => handleIncludeChange('includeContactInfo', checked as boolean)}
                />
                <Label htmlFor="includeContactInfo" className="text-sm cursor-pointer">
                  Contact Information
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !options.fileName.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <>
                <span className="animate-pulse mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {options.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
