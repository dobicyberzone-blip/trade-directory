'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Eye, 
  Download, 
  Link, 
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, validateUrl, formatFileSize, FileValidationOptions } from '@/lib/file-validation';

interface FileUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  validationOptions?: FileValidationOptions;
  accept?: string;
  placeholder?: string;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}

export function FileUploader({
  value = '',
  onChange,
  onError,
  label,
  description,
  required = false,
  disabled = false,
  validationOptions,
  accept,
  placeholder = 'Enter file URL or upload a file',
  className
}: FileUploaderProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0
  });
  const [preview, setPreview] = useState<string | null>(null);

  const isImage = (url: string) => {
    if (url.startsWith('data:')) return url.startsWith('data:image/');
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('image');
  };

  const isPdf = (url: string) => {
    if (url.startsWith('data:')) return url.startsWith('data:application/pdf');
    return /\.pdf$/i.test(url) || url.includes('.pdf');
  };

  const uploadFile = async (file: File): Promise<string> => {

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Upload failed');
      }

      return result.url;
    } catch (fetchError) {

      throw fetchError;
    }
  };

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file
    if (validationOptions) {
      const validation = validateFile(file, validationOptions);
      if (!validation.isValid) {
        setUploadState({ isUploading: false, progress: 0, error: validation.error });
        onError?.(validation.error || 'File validation failed');
        return;
      }
    }

    setUploadState({ isUploading: true, progress: 0, error: undefined });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 100);

      const url = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadState({ isUploading: false, progress: 100 });
      
      onChange(url);
      setPreview(url);
      
      setTimeout(() => {
        setUploadState({ isUploading: false, progress: 0 });
      }, 1000);
    } catch (error) {
      setUploadState({ 
        isUploading: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [validationOptions, onChange, onError]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileUpload,
    accept: accept
      ? Object.fromEntries(accept.split(',').map(a => [a.trim(), []]))
      : undefined,
    multiple: false,
    disabled: disabled || uploadState.isUploading,
    noClick: false,
    noKeyboard: false,
  });

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setUploadState({ isUploading: false, progress: 0, error: 'Please enter a URL' });
      return;
    }

    const validation = validateUrl(urlInput);
    if (!validation.isValid) {
      setUploadState({ isUploading: false, progress: 0, error: validation.error });
      onError?.(validation.error || 'Invalid URL');
      return;
    }

    onChange(urlInput);
    setPreview(urlInput);
    setUploadState({ isUploading: false, progress: 0, error: undefined });
  };

  const handleRemove = () => {
    onChange('');
    setPreview(null);
    setUrlInput('');
    setUploadState({ isUploading: false, progress: 0, error: undefined });
  };

  const handlePreview = () => {
    if (!value) return;

    // Regular URL — open directly (most common case after upload)
    if (!value.startsWith('data:')) {
      window.open(value, '_blank', 'noopener,noreferrer');
      return;
    }

    // data: URL — open in a new window using document.write to avoid blob revocation issues
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }

    if (value.startsWith('data:application/pdf')) {
      // Embed PDF via <embed> tag inside the new window
      newWindow.document.write(`<!DOCTYPE html><html><head><title>PDF Preview</title><style>*{margin:0;padding:0;}body,html{width:100%;height:100%;overflow:hidden;}embed{width:100%;height:100%;}</style></head><body><embed src="${value}" type="application/pdf" width="100%" height="100%"/></body></html>`);
      newWindow.document.close();
    } else if (value.startsWith('data:image/')) {
      newWindow.document.write(`<!DOCTYPE html><html><head><title>Image Preview</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;}img{max-width:100%;max-height:100vh;object-fit:contain;}</style></head><body><img src="${value}" alt="Preview"/></body></html>`);
      newWindow.document.close();
    } else {
      newWindow.document.write(`<!DOCTYPE html><html><head><title>Preview</title></head><body><p>Cannot preview this file type.</p></body></html>`);
      newWindow.document.close();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}

      {/* Mode Toggle */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { open(); }}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('url')}
          disabled={disabled}
        >
          <Link className="w-4 h-4 mr-2" />
          Use URL
        </Button>
      </div>

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="flex space-x-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={disabled || !urlInput.trim()}
          >
            Set URL
          </Button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div>
          <Card
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
              isDragActive && 'border-blue-500 bg-blue-50',
              disabled && 'cursor-not-allowed opacity-50',
              uploadState.error && 'border-red-500 bg-red-50'
            )}
          >
            <input {...getInputProps()} />
            
            {uploadState.isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                <Progress value={uploadState.progress} className="w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    or click to browse files
                  </p>
                  {accept && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Accepted: {accept.split(',').map(a => a.trim().split('/')[1]?.toUpperCase().replace('JPEG', 'JPG/JPEG')).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadState.error}</span>
        </div>
      )}

      {/* File Preview */}
      {value && !uploadState.isUploading && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {isImage(value) ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border"
                    onError={() => setPreview(null)}
                  />
                  <ImageIcon className="w-4 h-4 absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
                </div>
              ) : isPdf(value) ? (
                <div className="w-12 h-12 bg-red-100 rounded border flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {value.split('/').pop() || 'Uploaded file'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">File ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex-1 sm:flex-none"
              >
                <Eye className="w-4 h-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">View</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="flex-1 sm:flex-none"
              >
                <X className="w-4 h-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Delete</span>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}