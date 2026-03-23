'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface LayoutContextType {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  drawerWidth: number;
  miniDrawerWidth: number;
  isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  return (
    <LayoutContext.Provider
      value={{
        drawerOpen,
        setDrawerOpen,
        drawerWidth: 280,
        miniDrawerWidth: 80,
        isMobile,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  // Return default values if not within provider (for pages outside dashboard)
  if (context === undefined) {
    return {
      drawerOpen: true,
      setDrawerOpen: () => {},
      drawerWidth: 280,
      miniDrawerWidth: 80,
      isMobile: false,
    };
  }
  return context;
}
