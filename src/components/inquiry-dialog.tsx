'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Business {
  id: string;
  name: string;
  productId?: string;
  ownerId?: string;
}

interface InquiryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business;
}

export function InquiryDialog({ isOpen, onOpenChange, business }: InquiryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to send an inquiry.',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Message Required',
        description: 'Please enter a message for your inquiry.',
      });
      return;
    }

    if (!business.ownerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Business owner information is missing.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the new sendInquiry API endpoint
      const response = await apiClient.sendInquiry({
        exporterId: business.ownerId,
        message: message.trim(),
        businessName: business.name,
        businessId: business.id,
      });

      if (response.success) {
        toast({
          title: 'Inquiry Sent!',
          description: `Your inquiry has been sent to ${business.name}. Check your messages for updates.`,
        });
        
        setMessage('');
        onOpenChange(false);
      } else {
        throw new Error('Failed to send inquiry');
      }
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Failed to Send Inquiry',
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] sm:w-[95vw] max-w-[500px] max-h-[90vh] p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3 pr-8">
          <DialogTitle className="text-lg sm:text-xl font-bold">
            Send Inquiry to {business.name}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Send a message directly to this business. They will receive your contact information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-3 sm:py-4">
          <div className="grid gap-2">
            <Label htmlFor="message" className="text-sm sm:text-base font-medium">
              Your Message
            </Label>
            <Textarea
              id="message"
              placeholder="I'm interested in your products and would like to know more about..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="min-h-[120px] text-sm sm:text-base resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !user}
            className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
          >
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}