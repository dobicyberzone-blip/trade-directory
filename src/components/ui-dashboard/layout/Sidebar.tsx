'use client';

import { memo, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

// icons
import { 
  IconChevronDown, 
  IconChevronUp,
  IconDashboard,
  IconUsers,
  IconShoppingCart,
  IconPackage,
  IconMessageCircle,
  IconBell,
  IconShield,
  IconChartBar,
  IconSettings,
  IconBuilding,
  IconTruck,
  IconTrendingUp,
  IconHelp,
  IconUser,
  IconPlus,
  IconList,
  IconSearch,
  IconHeart,
  IconHome,
  IconLogout,
  IconBuildingStore,
  IconPackageImport,
  IconTrophy,
  IconHelpCircle,
  IconStar,
  IconFileText,
  IconLayout,
  IconMail
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { DashboardIcon } from '../icons';

// project imports
import { getMenuItemsForRole, type MenuItem } from './menuConfig';

interface SidebarProps {
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  onNavigate: (url: string) => void;
  currentPath: string;
  userRole: 'ADMIN' | 'EXPORTER' | 'BUYER' | 'SUPER_ADMIN';
  isSuperAdmin?: boolean;
  isPartner?: boolean;
  onLogout?: () => void;
}

const drawerWidth = 250;
const miniDrawerWidth = 80;

// Icon mapping
const iconMap: Record<string, Icon> = {
  dashboard: IconDashboard,
  users: IconUsers,
  'shopping-cart': IconShoppingCart,
  package: IconPackage,
  'message-circle': IconMessageCircle,
  bell: IconBell,
  shield: IconShield,
  'chart-bar': IconChartBar,
  settings: IconSettings,
  building: IconBuilding,
  truck: IconTruck,
  'trending-up': IconTrendingUp,
  help: IconHelp,
  user: IconUser,
  plus: IconPlus,
  list: IconList,
  search: IconSearch,
  heart: IconHeart,
  'building-check': IconBuildingStore,
  'package-check': IconPackageImport,
  trophy: IconTrophy,
  'help-circle': IconHelpCircle,
  star: IconStar,
  'file-text': IconFileText,
  'bar-chart': IconChartBar,
  layout: IconLayout,
  mail: IconMail,
};

// ==============================|| SIDEBAR DRAWER ||============================== //

function Sidebar({ drawerOpen, onDrawerToggle, onNavigate, currentPath, userRole, isSuperAdmin, isPartner, onLogout }: SidebarProps) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const menuItems = getMenuItemsForRole(userRole, isSuperAdmin, isPartner);

  const handleItemClick = (item: MenuItem) => {
    if (item.type === 'collapse') {
      setOpenItems(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else if (item.url) {
      onNavigate(item.url);
    }
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <DashboardIcon icon={IconDashboard} size={20} whiteInDarkMode={true} />;
    const IconComponent = iconMap[iconName] || IconDashboard;
    return <DashboardIcon icon={IconComponent} size={20} whiteInDarkMode={true} />;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isSelected = currentPath === item.url;
    const isOpen = openItems[item.id];

    if (item.type === 'group') {
      return (
        <Box key={item.id}>
          <Typography
            variant="caption"
            sx={{
              px: 3,
              pt: level === 0 ? 2 : 1.5,
              pb: 0.5,
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.7rem',
              display: drawerOpen ? 'block' : 'none',
              lineHeight: 1.5
            }}
          >
            {item.title}
          </Typography>
          <List sx={{ py: 0, mt: 0.5 }}>
            {item.children?.map((child: MenuItem) => renderMenuItem(child, level + 1))}
          </List>
        </Box>
      );
    }

    if (item.type === 'collapse') {
      const tooltipTitle = !drawerOpen ? item.title : '';
      return (
        <Box key={item.id}>
          <Tooltip title={tooltipTitle} placement="right" arrow>
            <Box>
              <ListItemButton
                onClick={() => handleItemClick(item)}
                sx={{
                  pl: 2.5,
                  pr: 2,
                  py: 1.25,
                  mx: 1,
                  borderRadius: 1,
                  minHeight: 44,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: theme.palette.text.primary,
                  },
                  '&.Mui-focusVisible': {
                    bgcolor: 'primary.light',
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : 'auto', justifyContent: 'center' }}>
                  {renderIcon(item.icon)}
                </ListItemIcon>
                {drawerOpen && (
                  <>
                    <ListItemText 
                      primary={item.title}
                      slotProps={{
                        primary: {
                          variant: 'body2',
                          fontWeight: 500,
                          sx: { fontSize: '0.875rem' }
                        }
                      }}
                    />
                    {isOpen ? <DashboardIcon icon={IconChevronUp} size={16} whiteInDarkMode={true} /> : <DashboardIcon icon={IconChevronDown} size={16} whiteInDarkMode={true} />}
                  </>
                )}
              </ListItemButton>
            </Box>
          </Tooltip>
          {drawerOpen && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List sx={{ py: 0, pl: 1, ml: 1 }}>
                {item.children?.map((child: MenuItem) => renderMenuItem(child, level + 1))}
              </List>
            </Collapse>
          )}
        </Box>
      );
    }

    const tooltipTitle = !drawerOpen ? item.title : '';
    return (
      <Tooltip key={item.id} title={tooltipTitle} placement="right" arrow>
        <Box>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isSelected}
            sx={{
              pl: drawerOpen ? (level > 1 ? 4 : 2.5) : 1,
              pr: 2,
              py: 1.25,
              mx: 1,
              borderRadius: 1,
              minHeight: 44,
              color: theme.palette.text.primary,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: '#ffffff',
                fontWeight: 600,
                '& .MuiListItemIcon-root': {
                  color: '#ffffff'
                },
                '&:hover': {
                  bgcolor: 'primary.dark',
                  color: '#ffffff',
                }
              },
              '&.Mui-focusVisible': {
                bgcolor: 'primary.light',
                color: theme.palette.text.primary,
              },
              '&:hover': {
                bgcolor: 'action.hover',
                color: theme.palette.text.primary,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : 'auto', justifyContent: 'center' }}>
              {renderIcon(item.icon)}
            </ListItemIcon>
            {drawerOpen && (
              <ListItemText 
                primary={item.title}
                slotProps={{
                  primary: {
                    variant: 'body2',
                    fontWeight: isSelected ? 600 : 500,
                    sx: { fontSize: '0.875rem' }
                  }
                }}
              />
            )}
          </ListItemButton>
        </Box>
      </Tooltip>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Menu Items */}
      <Box sx={{ 
        flexGrow: 1, 
        pt: 1, // Reduced padding top for tighter layout
        pb: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'divider',
          borderRadius: '2px',
        }
      }}>
        {menuItems.map((item: MenuItem) => renderMenuItem(item))}
      </Box>

      {/* Bottom Actions - Home & Logout */}
      <Box sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: 1
      }}>
        <List sx={{ py: 0 }}>
          {/* Home Button */}
          <Tooltip title={!drawerOpen ? 'Home' : ''} placement="right" arrow>
            <Box>
              <ListItemButton
                onClick={() => onNavigate('/')}
                sx={{
                  pl: drawerOpen ? 2.5 : 1,
                  pr: 2,
                  py: 1.25,
                  mx: 1,
                  borderRadius: 1,
                  minHeight: 44,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : 'auto', justifyContent: 'center' }}>
                  <IconHome stroke={1.5} size="20px" />
                </ListItemIcon>
                {drawerOpen && (
                  <ListItemText 
                    primary="Home"
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        fontWeight: 500,
                        sx: { fontSize: '0.875rem' }
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </Box>
          </Tooltip>

          {/* Logout Button */}
          {onLogout && (
            <Tooltip title={!drawerOpen ? 'Logout' : ''} placement="right" arrow>
              <Box>
                <ListItemButton
                  onClick={onLogout}
                  sx={{
                    pl: drawerOpen ? 2.5 : 1,
                    pr: 2,
                    py: 1.25,
                    mx: 1,
                    borderRadius: 1,
                    minHeight: 44,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : 'auto', justifyContent: 'center' }}>
                    <IconLogout stroke={1.5} size="20px" />
                  </ListItemIcon>
                  {drawerOpen && (
                    <ListItemText 
                      primary="Logout"
                      slotProps={{
                        primary: {
                          variant: 'body2',
                          fontWeight: 500,
                          sx: { fontSize: '0.875rem' }
                        }
                      }}
                    />
                  )}
                </ListItemButton>
              </Box>
            </Tooltip>
          )}
        </List>
      </Box>

      {/* Version */}
      {drawerOpen && (
        <Box sx={{ 
          p: 1.5, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Chip 
            label="v1.2.0" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ 
              width: '100%',
              fontWeight: 600,
              fontSize: '0.7rem'
            }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box 
      component="nav" 
      sx={{ 
        flexShrink: { md: 0 }, 
        width: { xs: 'auto', md: drawerOpen ? drawerWidth : miniDrawerWidth },
        transition: theme.transitions.create(['width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        })
      }} 
    >
      <Drawer
        variant={downMD ? 'temporary' : 'permanent'}
        anchor="left"
        open={downMD ? drawerOpen : true}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : miniDrawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            // Glass-morphism effect - improved opacity for better text visibility
            bgcolor: downMD ? 'background.default' : (theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)'),
            backdropFilter: downMD ? 'none' : 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: downMD ? 'none' : 'blur(24px) saturate(200%)',
            backgroundImage: 'none',
            transition: theme.transitions.create(['width', 'background-color'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            mt: downMD ? 0 : { xs: '106px', sm: '116px' },
            mb: 2,
            height: downMD ? '100%' : { xs: 'calc(100% - 106px)', sm: 'calc(100% - 116px)' },
            boxShadow: downMD ? '0 0 10px rgba(0,0,0,0.05)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export default memo(Sidebar);