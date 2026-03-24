'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, XCircle, Clock, Trash2, Package } from 'lucide-react';
import { useCenteredDialog } from '@/hooks/useCenteredDialog';
import { resolveFileUrl } from '@/lib/pdf-viewer';

interface ProductPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  product: any;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProductPreviewDialog({ 
  open, 
  onClose, 
  product,
  onApprove,
  onReject,
  onDelete
}: ProductPreviewDialogProps) {
  const dialogStyle = useCenteredDialog();

  if (!product) {
    return null;
  }

  const getStatusColor = (verified: boolean) => {
    return verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  // Safe data access with fallbacks
  const productData = {
    name: product?.name || 'N/A',
    description: product?.description || 'No description provided',
    category: product?.category || 'N/A',
    price: product?.price || null,
    unit: product?.unit || 'N/A',
    minOrder: product?.minOrder || 'N/A',
    availability: product?.availability ?? true,
    verified: product?.verified ?? false,
    verificationNotes: product?.verificationNotes || null,
    imageUrl: product?.imageUrl || null,
    views: product?.views || 0,
    business: product?.business || null,
    user: product?.user || null,
    id: product?.id || '',
    createdAt: product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6"
        style={dialogStyle}
      >
        <DialogHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm sm:text-base md:text-lg leading-tight flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                {productData.name}
              </DialogTitle>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">{productData.category}</p>
            </div>
            <Badge className={`${getStatusColor(productData.verified)} shrink-0 text-[10px] sm:text-xs`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(productData.verified)}
                <span className="hidden xs:inline">{productData.verified ? 'Verified' : 'Pending'}</span>
              </span>
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Product Image */}
          {productData.imageUrl && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
              <img 
                src={productData.imageUrl} 
                alt={productData.name}
                className="w-full h-48 sm:h-64 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.png';
                  e.currentTarget.className = 'w-full h-48 sm:h-64 object-contain rounded bg-gray-100';
                }}
              />
            </div>
          )}

          {/* Product Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
            <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Product Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs">
              <div className="flex gap-1">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Category:</span>
                <span className="font-medium truncate">{productData.category}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Price:</span>
                <span className="font-medium truncate">
                  {productData.price ? `${productData.price}` : 'Contact for price'}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Unit:</span>
                <span className="font-medium truncate">{productData.unit}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Min Order:</span>
                <span className="font-medium truncate">{productData.minOrder}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Availability:</span>
                <span className="font-medium truncate">
                  {productData.availability ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Views:</span>
                <span className="font-medium truncate">{productData.views}</span>
              </div>
              <div className="flex gap-1 sm:col-span-2">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Created:</span>
                <span className="font-medium truncate">{productData.createdAt}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">Description:</span>
              <p className="mt-0.5 text-[10px] sm:text-xs leading-relaxed">{productData.description}</p>
            </div>
          </div>

          {/* Business Information */}
          {productData.business && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
              <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 text-[10px] sm:text-xs">
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Business Name:</span>
                  <span className="font-medium truncate">{productData.business.name}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Status:</span>
                  <span className="font-medium truncate">{productData.business.verificationStatus || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Owner Information */}
          {productData.user && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-2.5">
              <h3 className="font-semibold mb-1.5 text-xs sm:text-sm">Product Owner</h3>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-[10px] sm:text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {productData.user.firstName} {productData.user.lastName}
                </span>
                <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                <span className="text-gray-500 dark:text-gray-400">{productData.user.email}</span>
              </div>
            </div>
          )}

          {/* Verification Notes */}
          {productData.verificationNotes && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded p-2 sm:p-2.5">
              <h3 className="font-semibold mb-1 text-xs sm:text-sm text-blue-900 dark:text-blue-300">Verification Notes</h3>
              <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-300">{productData.verificationNotes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1.5 sm:gap-2 pt-2 border-t dark:border-gray-700 flex-wrap">
            {!productData.verified && onApprove && (
              <Button
                size="sm"
                className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onApprove(productData.id);
                  onClose();
                }}
              >
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                Verify
              </Button>
            )}
            {!productData.verified && onReject && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => {
                  onReject(productData.id);
                  onClose();
                }}
              >
                <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                Reject
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs border-red-500 text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                    onDelete(productData.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                Delete
              </Button>
            )}
            {productData.imageUrl && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[80px] sm:min-w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs"
                onClick={() => {
                  if (!productData.imageUrl) return;
                  window.open(resolveFileUrl(productData.imageUrl), '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                View Image
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
