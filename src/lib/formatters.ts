import { format, formatDistanceToNow, isValid } from 'date-fns';

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return format(dateObj, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Kenyan phone numbers
  if (cleaned.startsWith('254')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4)}`;
  }
  
  return phone;
}

export function formatKraPin(pin: string | null | undefined): string {
  if (!pin) return 'N/A';
  
  // Format KRA PIN as A000000000A
  const cleaned = pin.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 1)}${cleaned.slice(1, 10)}${cleaned.slice(10)}`;
  }
  
  return pin;
}

export function formatBusinessName(name: string | null | undefined): string {
  if (!name) return 'Unnamed Business';
  
  return name.length > 50 ? `${name.slice(0, 50)}...` : name;
}

export function formatAddress(address: string | null | undefined): string {
  if (!address) return 'No address provided';
  
  return address.length > 100 ? `${address.slice(0, 100)}...` : address;
}

export function formatCoordinates(coordinates: string | null | undefined): string {
  if (!coordinates) return 'No location set';
  
  try {
    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return coordinates;
  }
}

export function formatUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
}

export function truncateText(text: string | null | undefined, maxLength: number = 100): string {
  if (!text) return '';
  
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '??';
}

export function formatVerificationStatus(status: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Verified',
        color: 'text-green-800',
        bgColor: 'bg-green-100'
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        color: 'text-red-800',
        bgColor: 'bg-red-100'
      };
    case 'NEEDS_VERIFICATION':
      return {
        label: 'Needs Re-verification',
        color: 'text-orange-800',
        bgColor: 'bg-orange-100'
      };
    default:
      return {
        label: 'Pending',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-100'
      };
  }
}

// Utility function to download an image from a URL
export async function downloadImageFromUrl(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Generate a unique filename with timestamp
export function generateFilename(baseName: string, extension: string = 'png'): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${baseName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.${extension}`;
}