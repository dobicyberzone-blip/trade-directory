'use client';

import PropTypes from 'prop-types';
import { useMemo, createContext, useContext, useState, useEffect } from 'react';

// material-ui
import { createTheme, ThemeProvider, StyledEngineProvider, ThemeOptions, PaletteOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import palette from './palette';
import typography from './typography';
import componentsOverrides from './overrides';

// ==============================|| THEME CONTEXT ||============================== //

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

// ==============================|| KEPROBA DASHBOARD THEME PROVIDER ||============================== //

export default function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const borderRadius = 12;
  const fontFamily = `'Roboto', sans-serif`;

  // Always force light mode — dark mode coming in next release
  useEffect(() => {
    localStorage.removeItem('dashboard-theme-mode');
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      // Save preference to localStorage
      localStorage.setItem('dashboard-theme-mode', newMode);
      // Sync Tailwind dark class with MUI theme
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  // Create dark palette - using proper dark theme colors (black background with white text)
  const darkPalette: PaletteOptions = useMemo(() => ({
    mode: 'dark',
    common: {
      black: '#000000',
      white: '#ffffff'
    },
    primary: {
      light: '#81c784',
      main: '#66bb6a',
      dark: '#4caf50',
      contrastText: '#ffffff'
    },
    secondary: {
      light: '#81c784',
      main: '#66bb6a',
      dark: '#4caf50',
      contrastText: '#ffffff'
    },
    error: {
      light: '#ef5350',
      main: '#f44336',
      dark: '#c62828',
      contrastText: '#ffffff'
    },
    warning: {
      light: '#ffb74d',
      main: '#ffa726',
      dark: '#f57c00',
      contrastText: '#000000'
    },
    success: {
      light: '#81c784',
      main: '#66bb6a',
      dark: '#4caf50',
      contrastText: '#ffffff'
    },
    info: {
      light: '#4fc3f7',
      main: '#29b6f6',
      dark: '#0288d1',
      contrastText: '#ffffff'
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      900: '#212121'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#757575'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    background: {
      paper: '#1a1a1a',
      default: '#121212'
    },
    action: {
      active: 'rgba(255, 255, 255, 0.54)',
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(255, 255, 255, 0.08)',
      disabled: 'rgba(255, 255, 255, 0.26)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)'
    }
  }), []);

  const themeOptions: ThemeOptions = useMemo(
    () => ({
      direction: 'ltr',
      palette: mode === 'light' ? (palette.light as PaletteOptions) : darkPalette,
      mixins: {
        toolbar: {
          minHeight: '48px',
          padding: '16px',
          '@media (min-width: 600px)': {
            minHeight: '48px'
          }
        }
      },
      typography: typography(fontFamily),
      shape: {
        borderRadius
      }
    }),
    [fontFamily, mode, darkPalette]
  );

  const themes = createTheme(themeOptions);
  themes.components = useMemo(() => componentsOverrides(themes, borderRadius), [themes, borderRadius]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={themes}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ThemeContext.Provider>
  );
}

DashboardThemeProvider.propTypes = { 
  children: PropTypes.node 
};