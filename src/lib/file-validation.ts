export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export const DEFAULT_IMAGE_OPTIONS: FileValidationOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB - Industry standard for high-quality images
  allowedTypes: ['image/jpeg', 'image/jpg'], // JPEG only for best quality
  allowedExtensions: ['.jpg', '.jpeg'] // JPEG only
};

export const DEFAULT_DOCUMENT_OPTIONS: FileValidationOptions = {
  maxSize: 1 * 1024 * 1024, // 1MB
  allowedTypes: ['application/pdf'], // PDF only
  allowedExtensions: ['.pdf'] // PDF only
};

export function validateFile(file: File, options: FileValidationOptions): FileValidationResult {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${options.allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  if (options.allowedExtensions) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!options.allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension not supported. Allowed extensions: ${options.allowedExtensions.join(', ')}`
      };
    }
  }

  return { isValid: true };
}

export function validateUrl(url: string): FileValidationResult {
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'jpg':
    case 'jpeg':
      return '🖼️';
    default:
      return '📎';
  }
}