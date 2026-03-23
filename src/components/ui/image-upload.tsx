'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  onFileUpload?: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
  description?: string;
}

export function ImageUpload({
  label = 'Image',
  value = '',
  onChange,
  onFileUpload,
  accept = 'image/*',
  maxSize = 5,
  className,
  placeholder = 'https://example.com/image.jpg',
  description
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`File size is ${sizeMB}MB. Maximum allowed is ${maxSize}MB. Please compress the image.`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (onFileUpload) {
      setIsUploading(true);
      try {

        const url = await onFileUpload(file);

        onChange(url);
        setPreviewError(false);
      } catch (error) {

        // Let the parent component handle the error toast
        // Don't show alert here since parent already shows toast
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileSelection(e.target.files[0]);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreviewError(false);
  };

  const clearImage = () => {
    onChange('');
    setPreviewError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && <Label>{label}</Label>}
      
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('url')}
          className="flex items-center gap-1"
        >
          <LinkIcon className="h-3 w-3" />
          Use URL
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('file')}
          className="flex items-center gap-1"
          disabled={!onFileUpload}
        >
          <Upload className="h-3 w-3" />
          Upload File
        </Button>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {uploadMode === 'url' ? (
        <div className="space-y-2">
          <Input
            type="url"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            'hover:border-primary/50 hover:bg-primary/5',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-foreground">
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP up to {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {value && !isUploading && (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
            {!previewError ? (
              <Image
                src={value}
                alt="Preview"
                fill
                className="object-contain"
                onError={() => setPreviewError(true)}
                unoptimized={value.includes('unsplash.com') || value.includes('pexels.com')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">Failed to load image</p>
                  <p className="text-xs text-muted-foreground px-4 break-all">{value}</p>
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearImage}
            className="absolute top-2 right-2"
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
