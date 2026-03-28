'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// project imports
import Header from './Header';
import Sidebar from './Sidebar';
import { User } from '@/lib/api';

// Constants for consistent spacing (matching Sidebar.tsx)
const DRAWER_WIDTH_CLOSED = 80;

interface MainLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout({ children, user, onLogout }: MainLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  
  // Start with sidebar collapsed by default
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Keep sidebar collapsed on mobile, allow toggle on desktop
    if (downMD) {
      setDrawerOpen(false);
    }
  }, [downMD]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigate = (url: string) => {
    router.push(url);
    if (downMD) {
      setDrawerOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Skip Navigation Link for Accessibility */}
      <Button
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '999px',
          width: '1px',
          height: '1px',
          top: 'auto',
          overflow: 'hidden',
          zIndex: -999,
          '&:focus': {
            position: 'fixed',
            top: theme.spacing(1),
            left: theme.spacing(1),
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            zIndex: theme.zIndex.tooltip,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: theme.spacing(1),
            py: theme.spacing(1),
          },
        }}
        aria-label="Skip to main content"
      >
        Skip to main content
      </Button>

      {/* header */}
      <AppBar 
        enableColorOnDark 
        position="fixed" 
        color="inherit" 
        elevation={0} 
        sx={{ 
          bgcolor: 'background.default',
          zIndex: theme.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: { xs: 64, sm: 70 },
            px: { xs: 2, sm: 3 }
          }}
        >
          <Header 
            drawerOpen={drawerOpen}
            onDrawerToggle={handleDrawerToggle}
            user={user}
            onLogout={onLogout}
          />
        </Toolbar>
      </AppBar>

      {/* sidebar */}
      <Sidebar 
        drawerOpen={drawerOpen}
        onDrawerToggle={handleDrawerToggle}
        onNavigate={handleNavigate}
        currentPath={pathname}
        userRole={(user?.role || 'BUYER') as 'ADMIN' | 'EXPORTER' | 'BUYER' | 'SUPER_ADMIN'}
        isSuperAdmin={user?.isSuperAdmin || user?.role === 'SUPER_ADMIN'}
        isPartner={!!user?.partnerType}
        onLogout={onLogout}
      />

      {/* main content */}
      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          // Content extends behind sidebar on desktop for glass effect
          p: { xs: 1, sm: 2, md: 3 },
          pt: { xs: '72px', sm: '80px', md: '97px' },
          mt: { xs: 1, sm: 2, md: 3 },
          ml: 0,
          transition: theme.transitions.create(['padding-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: 'background.default',
          minHeight: '100vh',
          width: 'calc(80vw - 16px)', // Reduce width to account for scrollbar
          overflow: 'hidden', // Prevent horizontal scroll
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box', // Include padding in width calculation
        }}
      >
        <Box sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'auto', // Allow vertical scroll only
          boxSizing: 'border-box',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}