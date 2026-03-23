// ==============================|| KEPROBA DASHBOARD UI COMPONENTS ||============================== //

// Configuration
export { default as config } from './config';

// Theme
export { default as DashboardThemeProvider, useThemeMode } from './theme/theme-provider';

// Icon Components
export { DashboardIcon, IconWrapper, HoverIconButton, SidebarNavIcon, ActionIconButton, default as DashboardIconDefault } from './icons';

// Layout Components
export { default as MainLayout } from './layout/MainLayout';
export { default as Header } from './layout/Header';
export { default as Sidebar } from './layout/Sidebar';
export { default as LogoSection } from './layout/LogoSection';
export { getMenuItemsForRole } from './layout/menuConfig';

// Card Components
export { default as StatsCard } from './cards/StatsCard';
export { MainCard } from './cards/main-card';
export { 
  StatCard, 
  ProgressCard, 
  ActivityCard, 
  QuickActionCard 
} from './cards/dashboard-cards';

// Table Components
export { default as DataTable } from './tables/DataTable';

// Other Components
export { default as Loader } from './Loader';

// Theme utilities
export { default as palette } from './theme/palette';
export { default as typography } from './theme/typography';
export { default as componentsOverrides } from './theme/overrides';