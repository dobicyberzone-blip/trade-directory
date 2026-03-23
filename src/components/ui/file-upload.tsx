'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Loader2, 
  FileText,
  File,
  Download,
  Eye,
  Trash2,
  FileAudio,
  FileVideo,
  Archive,
  Presentation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Supported file types
const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  presentations: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

const DEFAULT_MAX_SIZE = 10; // MB
const DEFAULT_MAX_FILES = 10;

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface FileUploadProps {
  label?: string;
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onFileUpload?: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  className?: string;
  description?: string;
  showGallery?: boolean;
  allowUrlInput?: boolean;
}

function getFileIcon(fileType: string) {
  if (FILE_TYPES.images.includes(fileType)) return ImageIcon;
  if (FILE_TYPES.documents.includes(fileType)) return FileText;
  if (FILE_TYPES.spreadsheets.includes(fileType)) return FileText;
  if (FILE_TYPES.presentations.includes(fileType)) return Presentation;
  if (FILE_TYPES.audio.includes(fileType)) return FileAudio;
  if (FILE_TYPES.video.includes(fileType)) return FileVideo;
  if (FILE_TYPES.archives.includes(fileType)) return Archive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function FileUpload({
  label = 'Files',
  value = [],
  onChange,
  onFileUpload,
  accept = '*',
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  className,
  description,
  showGallery = true,
  allowUrlInput = true
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFileType = (file: File): boolean => {
    if (accept === '*') return true;
    const acceptedTypes = accept.split(',').map(t => t.trim());
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });
  };

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

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (!onFileUpload) return;

    const remainingSlots = maxFiles - value.length;
    const filesToUpload = files.slice(0, remainingSlots);

    for (const file of filesToUpload) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name}: File size must be less than ${maxSize}MB`);
        continue;
      }

      // Validate file type
      if (!isValidFileType(file)) {
        alert(`${file.name}: File type not supported`);
        continue;
      }

      // Upload file
      setIsUploading(true);
      const fileId = generateId();
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
          }));
        }, 100);

        const url = await onFileUpload(file);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        const uploadedFile: UploadedFile = {
          id: fileId,
          name: file.name,
          url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        };

        onChange([...value, uploadedFile]);

        // Clear progress after short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 500);

      } catch (error) {

        alert(`Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    setIsUploading(false);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    const fileName = urlInput.split('/').pop() || 'file';
    const uploadedFile: UploadedFile = {
      id: generateId(),
      name: fileName,
      url: urlInput.trim(),
      size: 0,
      type: 'external/url',
      uploadedAt: new Date()
    };

    onChange([...value, uploadedFile]);
    setUrlInput('');
  };

  const handleRemoveFile = (fileId: string) => {
    onChange(value.filter(f => f.id !== fileId));
  };

  const handleDownload = (file: UploadedFile) => {
    window.open(file.url, '_blank');
  };

  const handleView = (file: UploadedFile) => {
    window.open(file.url, '_blank');
  };

  const isImage = (fileType: string) => FILE_TYPES.images.includes(fileType);

  return (
    <div className={cn('space-y-4', className)}>
      {label && <Label className="text-base font-semibold">{label}</Label>}
      
      {/* Mode Toggle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={uploadMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('file')}
          className="flex items-center gap-1"
        >
          <Upload className="h-3 w-3" />
          Upload Files
        </Button>
        {allowUrlInput && (
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
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Upload Area */}
      {uploadMode === 'file' ? (
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
            disabled={isUploading || value.length >= maxFiles}
            multiple
          />

          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading files...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-foreground">
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, up to {maxSize}MB each
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="flex-1"
            />
            <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* File Gallery/List */}
      {showGallery && value.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Uploaded Files ({value.length}/{maxFiles})
            </Label>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {value.map((file) => {
                const FileIcon = getFileIcon(file.type);
                const isImageFile = isImage(file.type);
                
                return (
                  <Card key={file.id} className="overflow-hidden group">
                    <div className="relative aspect-square">
                      {isImageFile ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          fill
                          className="object-cover"
                          unoptimized={file.url.includes('unsplash.com') || file.url.includes('pexels.com')}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                          <FileIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleView(file)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveFile(file.id)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.size > 0 ? formatFileSize(file.size) : 'External'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {value.map((file) => {
                const FileIcon = getFileIcon(file.type);
                const isImageFile = isImage(file.type);
                
                return (
                  <div 
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Icon/Thumbnail */}
                    <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {isImageFile ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          fill
                          className="object-cover"
                          unoptimized={file.url.includes('unsplash.com') || file.url.includes('pexels.com')}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{file.size > 0 ? formatFileSize(file.size) : 'External URL'}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(file)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(file.id)}
                        title="Remove"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility component for displaying files in read-only mode (for public gallery)
interface FileGalleryProps {
  files: UploadedFile[];
  className?: string;
  viewMode?: 'grid' | 'list';
}

export function FileGallery({ files, className, viewMode = 'grid' }: FileGalleryProps) {
  const handleView = (file: UploadedFile) => {
    window.open(file.url, '_blank');
  };

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  if (files.length === 0) {
    return null;
  }

  if (viewMode === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {files.map((file) => {
          const FileIcon = getFileIcon(file.type);
          const isImageFile = isImage(file.type);
          
          return (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                {isImageFile ? (
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{file.size > 0 ? formatFileSize(file.size) : 'External URL'}</span>
                  <span>•</span>
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleView(file)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(file)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}>
      {files.map((file) => {
        const FileIcon = getFileIcon(file.type);
        const isImageFile = isImage(file.type);
        
        return (
          <Card key={file.id} className="overflow-hidden">
            <div className="relative aspect-square">
              {isImageFile ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <FileIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.size > 0 ? formatFileSize(file.size) : 'External'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Helper function for checking if a file type is an image
function isImage(fileType: string): boolean {
  return FILE_TYPES.images.includes(fileType);
}
