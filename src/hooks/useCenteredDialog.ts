'use client';

import { useLayout } from '@/contexts/LayoutContext';
import { CSSProperties } from 'react';

export function useCenteredDialog(): CSSProperties {
  const { drawerOpen, drawerWidth, miniDrawerWidth, isMobile } = useLayout();
  
  // Calculate offset for centering
  const sidebarWidth = isMobile ? 0 : (drawerOpen ? drawerWidth : miniDrawerWidth);
  const offset = sidebarWidth / 2;

  return {
    left: isMobile ? '50%' : `calc(50% + ${offset}px)`,
    top: '50%',
    transform: 'translate(-50%, -50%)',
    right: 'auto',
  };
}
