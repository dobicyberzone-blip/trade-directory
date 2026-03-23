// ==============================|| OFFICIAL KEPROBA THEME COLORS ||============================== //

const defaultColor = {
  // paper & background - Official white and light green
  paper: '#ffffff',
  backgroundLight: '#f7fdf7', // Light green background (120 60% 97%)

  // primary - Official green colors
  primaryLight: '#e8f5e8',
  primary200: '#a5d6a7',
  primaryMain: '#2e7d32', // Official green (120 61% 34%)
  primaryDark: '#1b5e20',
  primary800: '#0d4f14',

  // secondary - Complementary greens (updated to match primary)
  secondaryLight: '#e8f5e8',
  secondary200: '#a5d6a7', 
  secondaryMain: '#388e3c', // Darker green for secondary
  secondaryDark: '#2e7d32',
  secondary800: '#1b5e20',

  // accent - Official yellow
  accentLight: '#fffde7',
  accent200: '#fff59d',
  accentMain: '#ffeb3b', // Official yellow (45 100% 51%)
  accentDark: '#fbc02d',
  accent800: '#f57f17',

  // success - Green variants
  successLight: '#e8f5e8',
  success200: '#a5d6a7',
  successMain: '#4caf50',
  successDark: '#388e3c',

  // error - Red variants
  errorLight: '#ffebee',
  errorMain: '#f44336',
  errorDark: '#d32f2f',

  // warning - Yellow variants
  warningLight: '#fffde7',
  warningMain: '#ffeb3b',
  warningDark: '#fbc02d',

  // grey - Professional greys
  grey50: '#fafafa',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey500: '#9e9e9e',
  grey600: '#757575',
  grey700: '#616161',
  grey900: '#212121',

  // dark variants
  darkPaper: '#1a1a1a',
  darkBackground: '#121212',
  darkLevel1: '#1e1e1e',
  darkLevel2: '#2d2d2d',
  darkTextTitle: '#ffffff',
  darkTextPrimary: '#e0e0e0',
  darkTextSecondary: '#b0b0b0'
};

const palette = {
  light: {
    mode: 'light' as const,
    common: {
      black: defaultColor.grey900,
      white: '#ffffff'
    },
    primary: {
      light: defaultColor.primaryLight,
      main: defaultColor.primaryMain,
      dark: defaultColor.primaryDark,
      200: defaultColor.primary200,
      800: defaultColor.primary800,
      contrastText: '#ffffff'
    },
    secondary: {
      light: defaultColor.secondaryLight,
      main: defaultColor.secondaryMain,
      dark: defaultColor.secondaryDark,
      200: defaultColor.secondary200,
      800: defaultColor.secondary800,
      contrastText: '#ffffff'
    },
    error: {
      light: defaultColor.errorLight,
      main: defaultColor.errorMain,
      dark: defaultColor.errorDark,
      contrastText: '#ffffff'
    },
    warning: {
      light: defaultColor.accentLight,
      main: defaultColor.accentMain,
      dark: defaultColor.accentDark,
      contrastText: '#ffffff'
    },
    info: {
      light: defaultColor.primaryLight,
      main: defaultColor.primaryMain,
      dark: defaultColor.primaryDark,
      contrastText: '#ffffff'
    },
    success: {
      light: defaultColor.successLight,
      200: defaultColor.success200,
      main: defaultColor.successMain,
      dark: defaultColor.successDark,
      contrastText: '#ffffff'
    },
    grey: {
      50: defaultColor.grey50,
      100: defaultColor.grey100,
      200: defaultColor.grey200,
      300: defaultColor.grey300,
      500: defaultColor.grey500,
      600: defaultColor.grey600,
      700: defaultColor.grey700,
      900: defaultColor.grey900
    },
    text: {
      primary: defaultColor.grey900,
      secondary: defaultColor.grey600,
      dark: defaultColor.grey900,
      hint: defaultColor.grey300,
      heading: defaultColor.grey900
    },
    divider: defaultColor.grey200,
    background: {
      paper: defaultColor.paper,
      default: defaultColor.backgroundLight
    }
  }
};

export default palette;