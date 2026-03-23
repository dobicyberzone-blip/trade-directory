'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Loader2 } from 'lucide-react';
import { apiClient, type Business, type Rating } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RatingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business;
  onRatingSubmitted?: () => void;
}

export function RatingDialog({ isOpen, onOpenChange, business, onRatingSubmitted }: RatingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user && business?.id) {
      loadExistingRating();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, business?.id]);

  const loadExistingRating = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUserRating(business.id);
      if (response.rating) {
        setExistingRating(response.rating);
        setRating(response.rating.rating);
        setReview(response.rating.review || '');
      } else {
        setExistingRating(null);
        setRating(0);
        setReview('');
      }
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to rate this business.',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingRating) {
        // Update existing rating
        await apiClient.updateRating(business.id, {
          rating,
          review: review.trim() || undefined,
        });
        toast({
          title: 'Rating Updated',
          description: 'Your rating has been successfully updated.',
        });
      } else {
        // Create new rating
        await apiClient.addRating({
          businessId: business.id,
          rating,
          review: review.trim() || undefined,
        });
        toast({
          title: 'Rating Submitted',
          description: 'Thank you for your feedback! Your rating has been submitted.',
        });
      }

      onOpenChange(false);
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      // Reset form when closing
      setTimeout(() => {
        setRating(0);
        setHoverRating(0);
        setReview('');
        setExistingRating(null);
      }, 200);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={cn(
            "transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded p-1 touch-manipulation",
            isActive ? "text-yellow-400" : "text-gray-300"
          )}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={isSubmitting}
        >
          <Star 
            className={cn(
              "h-10 w-10 sm:h-8 sm:w-8 transition-all duration-200",
              isActive && "fill-current"
            )} 
          />
        </button>
      );
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-32px)] sm:w-[95vw] max-w-[500px] max-h-[90vh] p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3 pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
            {existingRating ? 'Update Your Rating' : 'Rate This Business'}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {existingRating 
              ? `Update your rating and review for ${business?.name}`
              : `Share your experience with ${business?.name} to help other buyers`
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* Star Rating */}
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-0.5 sm:gap-1">
                {renderStars()}
              </div>
              <p className="text-sm sm:text-base font-medium text-muted-foreground">
                {getRatingText(hoverRating || rating)}
              </p>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <label htmlFor="review" className="text-sm sm:text-base font-medium">
                Review (Optional)
              </label>
              <Textarea
                id="review"
                placeholder="Share your experience with this business..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                maxLength={500}
                className="min-h-[100px] text-sm sm:text-base resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {review.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full h-11 sm:h-10 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full h-11 sm:h-10 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {existingRating ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {existingRating ? 'Update Rating' : 'Submit Rating'}
                  </>
                )}
              </Button>
            </div>

            {existingRating && (
              <div className="text-xs text-muted-foreground text-center">
                You previously rated this business {existingRating.rating} star{existingRating.rating !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}