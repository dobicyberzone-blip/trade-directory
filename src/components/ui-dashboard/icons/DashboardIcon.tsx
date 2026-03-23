'use client';

import { useTheme } from '@mui/material/styles';
import { Icon } from '@tabler/icons-react';
import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

interface DashboardIconProps {
  /** Icon component from @tabler/icons-react */
  icon: Icon;
  /** Icon size - defaults to 20px */
  size?: number | string;
  /** Whether to apply white color in dark mode */
  whiteInDarkMode?: boolean;
  /** Custom color override */
  color?: string;
  /** Stroke width - defaults to 1.5 */
  stroke?: number;
  /** Additional className */
  className?: string;
  /** Icon node for complex icons */
  children?: ReactNode;
}

/**
 * DashboardIcon - A consistent icon component for dashboard UI
 * 
 * Features:
 * - White (#FFFFFF) color in dark mode for optimal visibility
 * - Consistent icon sizing across the dashboard
 * - Hover state support with opacity changes
 * - Support for all Tabler icons
 * 
 * Usage:
 * <DashboardIcon icon={IconBell} />
 * <DashboardIcon icon={IconSettings} size={24} />
 * <DashboardIcon icon={IconUser} whiteInDarkMode={true} />
 */
export function DashboardIcon({
  icon: IconComponent,
  size = 20,
  whiteInDarkMode = true,
  color,
  stroke = 1.5,
  className = '',
  children
}: DashboardIconProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Determine icon color
  const iconColor = color 
    ? color 
    : (whiteInDarkMode && isDarkMode ? '#FFFFFF' : undefined);

  return (
    <IconComponent 
      size={size} 
      stroke={stroke}
      color={iconColor}
      className={className}
    />
  );
}

// ==============================|| ICON WRAPPER FOR DARK MODE ||============================== //

interface IconWrapperProps {
  children: ReactNode;
  /** Whether icon should be white in dark mode */
  whiteInDarkMode?: boolean;
  /** Additional sx styles */
  sx?: object;
}

/**
 * IconWrapper - Wraps any icon content to ensure white color in dark mode
 * Use this for wrapping custom icons or non-Tabler icons
 */
export function IconWrapper({ 
  children, 
  whiteInDarkMode = true,
  sx 
}: IconWrapperProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Box 
      component="span"
      sx={{ 
        color: whiteInDarkMode && isDarkMode ? '#FFFFFF' : 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx
      }}
    >
      {children}
    </Box>
  );
}

// ==============================|| HOVER ICON BUTTON ||============================== //

interface HoverIconButtonProps {
  /** Icon component from @tabler/icons-react */
  icon: Icon;
  /** Tooltip title */
  title?: string;
  /** Icon size */
  size?: number | string;
  /** Button size (width/height) */
  buttonSize?: number;
  /** Stroke width */
  stroke?: number;
  /** Click handler */
  onClick?: () => void;
  /** Additional button sx */
  sx?: object;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * HoverIconButton - Icon button with consistent hover states
 * 
 * Features:
 * - White icons in dark mode
 * - Subtle opacity change on hover (0.7 to 1.0)
 * - Consistent sizing and spacing
 */
export function HoverIconButton({
  icon: IconComponent,
  title,
  size = 20,
  buttonSize = 40,
  stroke = 1.5,
  onClick,
  sx = {},
  disabled = false
}: HoverIconButtonProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const iconColor = isDarkMode ? '#FFFFFF' : theme.palette.text.primary;

  const button = (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: '10px',
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.secondary,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.main,
          // Opacity change for icon on hover - subtle white transition
          '& svg': {
            opacity: 1,
            color: iconColor,
          },
        },
        // Default icon state - slightly transparent in dark mode
        '& svg': {
          opacity: isDarkMode ? 0.85 : 1,
          transition: 'opacity 0.2s ease-in-out, color 0.2s ease-in-out',
        },
        '&.Mui-disabled': {
          opacity: 0.5,
        },
        ...sx,
      }}
    >
      <IconComponent size={size} stroke={stroke} />
    </IconButton>
  );

  if (title) {
    return (
      <Tooltip title={title} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}

// ==============================|| SIDEBAR NAV ICON ||============================== //

interface SidebarNavIconProps {
  /** Icon component from @tabler/icons-react */
  icon?: Icon;
  /** Default icon if none provided */
  defaultIcon?: Icon;
  /** Icon size */
  size?: number;
  /** Stroke width */
  stroke?: number;
}

/**
 * SidebarNavIcon - Consistent icon for sidebar navigation items
 * 
 * Features:
 * - White color in dark mode
 * - 20px default size
 * - Proper spacing and alignment
 */
export function SidebarNavIcon({
  icon,
  defaultIcon: DefaultIcon,
  size = 20,
  stroke = 1.5
}: SidebarNavIconProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Determine which icon to render
  const IconComponent = icon || DefaultIcon;
  
  if (!IconComponent) return null;

  return (
    <IconComponent 
      size={size} 
      stroke={stroke}
      // Always use white in dark mode for navigation icons
      color={isDarkMode ? '#FFFFFF' : undefined}
    />
  );
}

// ==============================|| ACTION ICON BUTTON ||============================== //

interface ActionIconButtonProps {
  /** Icon component from @tabler/icons-react */
  icon: Icon;
  /** Button label for accessibility */
  label: string;
  /** Icon size */
  size?: number;
  /** Button size (width/height) */
  buttonSize?: number;
  /** Stroke width */
  stroke?: number;
  /** Click handler */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Additional sx styles */
  sx?: object;
  /** Badge content (e.g., notification count) */
  badge?: ReactNode;
}

/**
 * ActionIconButton - Action button for header/toolbar with badge support
 * 
 * Features:
 * - White icons in dark mode
 * - Notification badge support
 * - Consistent hover states with opacity
 */
export function ActionIconButton({
  icon: IconComponent,
  label,
  size = 20,
  buttonSize = 40,
  stroke = 1.5,
  onClick,
  disabled = false,
  sx = {},
  badge
}: ActionIconButtonProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const iconColor = isDarkMode ? '#FFFFFF' : theme.palette.text.primary;

  return (
    <Tooltip title={label} arrow>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: '10px',
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.secondary,
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '& svg': {
              opacity: 1,
            },
          },
          '& svg': {
            // Subtle opacity in default state, full on hover
            opacity: isDarkMode ? 0.85 : 1,
            transition: 'opacity 0.2s ease-in-out',
          },
          '&.Mui-disabled': {
            opacity: 0.5,
          },
          ...sx,
        }}
        aria-label={label}
      >
        <IconComponent size={size} stroke={stroke} />
        {badge}
      </IconButton>
    </Tooltip>
  );
}

// Export all components
export default DashboardIcon;
