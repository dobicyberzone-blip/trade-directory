'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';

interface CenteredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function CenteredDialog({ open, onOpenChange, children, className }: CenteredDialogProps) {
  const { drawerOpen, drawerWidth, miniDrawerWidth, isMobile } = useLayout();
  
  // Calculate offset for centering
  const sidebarWidth = isMobile ? 0 : (drawerOpen ? drawerWidth : miniDrawerWidth);
  const offset = sidebarWidth / 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(className)}
        style={{
          left: isMobile ? '50%' : `calc(50% + ${offset}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
