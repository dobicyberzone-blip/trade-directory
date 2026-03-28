'use client';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';

// icons
import { 
  IconMenu2, 
  IconBell, 
  IconUser, 
  IconLogout, 
  IconSettings, 
  IconCircleFilled, 
  IconCheck, 
  IconMessage,
  IconSun,
  IconMoon,
  IconHelp
} from '@tabler/icons-react';
import { DashboardIcon } from '../icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// project imports
import LogoSection from './LogoSection';
import { apiClient, User, Notification } from '@/lib/api';
import { useThemeMode } from '../theme/theme-provider';

interface HeaderProps {
  drawerOpen?: boolean;
  onDrawerToggle: () => void;
  user: User | null;
  onLogout: () => void;
}

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// Static admin activity placeholders removed — real notifications come from DB via sendAdminAlert()
export default function Header({ drawerOpen, onDrawerToggle, user, onLogout }: HeaderProps) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  
  // Get avatar source with priority: profileImage > avatar
  const avatarSrc = user?.profileImage || user?.avatar;
  
  // Use theme context for dark mode
  const { mode, toggleTheme } = useThemeMode();
  const isDarkMode = mode === 'dark';
  
  // Common icon color for dark mode - white with slight opacity
  const iconColor = isDarkMode ? '#FFFFFF' : theme.palette.text.primary;
  const iconHoverColor = isDarkMode ? '#FFFFFF' : theme.palette.primary.main;
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };


  // Recent activities for admin users — use module-level constant to avoid re-render loops

  // Fetch notifications on mount and when user changes
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingNotifications(true);
    try {
      const response = await apiClient.getNotifications();
      setNotifications(response.notifications || []);
      
      // Use only real API unread count
      setUnreadCount(response.unreadCount || 0);
      
      // Also fetch message unread count
      try {
        const messageResponse = await apiClient.getUnreadCount();
        setMessageUnreadCount(messageResponse.unreadCount || 0);
      } catch (msgError) {

      }
    } catch (error) {

    } finally {
      setLoadingNotifications(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 10 seconds — fast enough for near-real-time updates
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {

    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await apiClient.markAllNotificationsAsRead();
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {

    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    router.push('/dashboard/settings/profile');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push('/dashboard/settings');
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const handleMessagesClick = () => {
    // Reset unread count when user clicks on messages
    // Messages will be marked as read when viewed in the chat
    setMessageUnreadCount(0);
    router.push('/dashboard/chat');
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    handleNotificationClose();

    // Navigate based on type
    if (notification.type === 'CHAT_MESSAGE') {
      router.push('/dashboard/chat');
    } else {
      router.push('/dashboard/notifications');
    }
  };

  // Format notification time
  const formatTimeAgo = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
      case 'CRITICAL':
        return theme.palette.error.main;
      case 'MEDIUM':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <>
      {/* logo & toggler button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: downSM ? 1 : 1.5,
      }}>
        {/* Mobile Menu Toggle */}
        <IconButton
          onClick={onDrawerToggle}
          sx={{
            color: iconColor,
            width: downSM ? 36 : 40,
            height: downSM ? 36 : 40,
            borderRadius: '10px',
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              backgroundColor: theme.palette.primary.light,
              borderColor: theme.palette.primary.main,
              color: iconHoverColor,
              '& svg': { opacity: 1 }
            },
            transition: 'all 0.2s ease-in-out',
            '& svg': { opacity: isDarkMode ? 0.85 : 1, transition: 'opacity 0.2s ease-in-out' }
          }}
        >
          <DashboardIcon icon={IconMenu2} size={downSM ? 18 : 20} whiteInDarkMode={true} />
        </IconButton>

        {/* Logo - Desktop only */}
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' } }}>
          <LogoSection />
        </Box>
      </Box>

      {/* Welcome Message - Desktop only */}
      {!downMD && user && (
        <Box sx={{ 
          ml: 3,
          pl: 3,
          borderLeft: `2px solid ${theme.palette.divider}`,
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1
            }}
          >
            {getGreeting()}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 700,
              fontSize: '1.1rem',
              lineHeight: 1.4,
              mt: 0.3
            }}
          >
            {user.firstName} {user.lastName}
          </Typography>
        </Box>
      )}

      {/* spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Action Icons Container */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: downSM ? 0.5 : 1,
        mr: downSM ? 0 : 1
      }}>
        {/* Help Icon */}
        <Tooltip title="Help & Support" arrow>
          <IconButton
            onClick={() => router.push('/faq')}
            sx={{ 
              width: downSM ? 36 : 40,
              height: downSM ? 36 : 40,
              borderRadius: '10px',
              color: iconColor,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.info.main,
                color: iconHoverColor,
                '& svg': { opacity: 1 }
              },
              transition: 'all 0.2s ease-in-out',
              '& svg': { opacity: isDarkMode ? 0.85 : 1, transition: 'opacity 0.2s ease-in-out' }
            }}
          >
            <DashboardIcon icon={IconHelp} size={downSM ? 18 : 20} whiteInDarkMode={true} />
          </IconButton>
        </Tooltip>

        {/* Dark Mode Toggle — disabled until next release */}
        {/* <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"} arrow>
          <IconButton
            onClick={toggleTheme}
            sx={{ 
              width: downSM ? 36 : 40,
              height: downSM ? 36 : 40,
              borderRadius: '10px',
              color: iconColor,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.warning.main,
                color: iconHoverColor,
                '& svg': { opacity: 1 }
              },
              transition: 'all 0.2s ease-in-out',
              '& svg': { opacity: isDarkMode ? 0.85 : 1, transition: 'opacity 0.2s ease-in-out' }
            }}
          >
            {isDarkMode ? (
              <DashboardIcon icon={IconSun} size={downSM ? 18 : 20} whiteInDarkMode={true} />
            ) : (
              <DashboardIcon icon={IconMoon} size={downSM ? 18 : 20} whiteInDarkMode={true} />
            )}
          </IconButton>
        </Tooltip> */}

        {/* Divider */}
        <Box sx={{ 
          width: '1px', 
          height: '32px', 
          backgroundColor: theme.palette.divider,
          mx: downSM ? 0.5 : 1
        }} />

        {/* Messages - Clean minimal design */}
        <Tooltip title="Messages" arrow>
          <IconButton
            onClick={handleMessagesClick}
            sx={{ 
              width: downSM ? 40 : 44,
              height: downSM ? 40 : 44,
              borderRadius: '10px',
              color: iconColor,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
                color: iconHoverColor,
                '& svg': { opacity: 1 }
              },
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              '& svg': { opacity: isDarkMode ? 0.85 : 1, transition: 'opacity 0.2s ease-in-out' }
            }}
          >
            <Badge 
              badgeContent={messageUnreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  height: 18,
                  minWidth: 18,
                  fontWeight: 600,
                  border: `2px solid ${theme.palette.background.paper}`,
                }
              }}
            >
              <DashboardIcon icon={IconMessage} size={downSM ? 20 : 22} whiteInDarkMode={true} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notifications Bell */}
        <Tooltip title="Notifications" arrow>
          <IconButton
            onClick={handleNotificationOpen}
            sx={{ 
              width: downSM ? 40 : 44,
              height: downSM ? 40 : 44,
              borderRadius: '10px',
              color: iconColor,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
                color: iconHoverColor,
                '& svg': { opacity: 1 }
              },
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              '& svg': { opacity: isDarkMode ? 0.85 : 1, transition: 'opacity 0.2s ease-in-out' }
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  height: 18,
                  minWidth: 18,
                  fontWeight: 600,
                  border: `2px solid ${theme.palette.background.paper}`,
                }
              }}
            >
              <DashboardIcon icon={IconBell} size={downSM ? 20 : 22} whiteInDarkMode={true} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Divider */}
        <Box sx={{ 
          width: '1px', 
          height: '32px', 
          backgroundColor: theme.palette.divider,
          mx: downSM ? 0.5 : 1
        }} />

        {/* Profile Avatar - Clean minimal design */}
        <Tooltip title="Account Settings" arrow>
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ 
              width: downSM ? 36 : 40,
              height: downSM ? 36 : 40,
              borderRadius: '10px',
              border: `1px solid ${theme.palette.divider}`,
              p: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
              },
              transition: 'all 0.2s ease-in-out'
            }}
            aria-label="Profile menu"
          >
            <Avatar
              src={avatarSrc}
              alt={`${user?.firstName} ${user?.lastName}`}
              imgProps={{
                onError: (e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }
              }}
              sx={{
                width: downSM ? 28 : 32,
                height: downSM ? 28 : 32,
                fontSize: downSM ? '0.8rem' : '0.875rem',
                bgcolor: theme.palette.primary.main,
                color: theme.palette.common.white,
                fontWeight: 600,
              }}
            >
              {!avatarSrc && (user?.firstName?.[0]?.toUpperCase() || <IconUser stroke={1.5} size="18px" />)}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 1.5,
              minWidth: downSM ? 260 : 280,
              maxWidth: downSM ? '90vw' : 320,
              borderRadius: 2,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.palette.divider}`,
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                margin: '4px 8px',
                padding: downSM ? '10px 12px' : '12px 16px',
                minHeight: downSM ? 44 : 48, // Touch-friendly height
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  transform: 'translateX(4px)'
                },
                '&:active': {
                  backgroundColor: theme.palette.action.selected,
                }
              }
            }
          }
        }}
        MenuListProps={{
          sx: {
            py: 0,
          }
        }}
        sx={{
          zIndex: theme.zIndex.modal + 100, // Ensure it's above everything
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <Box sx={{ 
          p: downSM ? 2 : 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          background: theme.palette.background.paper
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: downSM ? 1.5 : 2, mb: 1 }}>
            <Avatar
              src={avatarSrc}
              alt={`${user?.firstName} ${user?.lastName}`}
              imgProps={{
                onError: (e) => {

                  (e.target as HTMLImageElement).style.display = 'none';
                },
              }}
              sx={{
                width: downSM ? 40 : 48,
                height: downSM ? 40 : 48,
                bgcolor: theme.palette.warning.main,
                color: theme.palette.common.white,
                fontWeight: 600,
                border: `2px solid ${theme.palette.common.white}`,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              {!avatarSrc && user?.firstName?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={downSM ? "subtitle1" : "h6"} 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: downSM ? '0.8rem' : '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.email}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: downSM ? '0.65rem' : '0.7rem'
                }}
              >
                {user?.role === 'PARTNER' && (user as any)?.partnerType ? ((user as any).partnerType.startsWith('Other: ') ? (user as any).partnerType.replace('Other: ', '') : (user as any).partnerType) : user?.role}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ py: 1 }}>
          <MenuItem 
            onClick={handleProfileClick}
            sx={{
              touchAction: 'manipulation', // Improve touch responsiveness
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <DashboardIcon icon={IconUser} size={downSM ? 16 : 18} whiteInDarkMode={true} />
            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: downSM ? '0.875rem' : '1rem' }}>Profile</Typography>
          </MenuItem>
          <MenuItem 
            onClick={handleSettingsClick}
            sx={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <DashboardIcon icon={IconSettings} size={downSM ? 16 : 18} whiteInDarkMode={true} />
            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: downSM ? '0.875rem' : '1rem' }}>Settings</Typography>
          </MenuItem>
          <MenuItem 
            onClick={handleLogout}
            sx={{
              color: 'error.main',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              },
              '&:active': {
                backgroundColor: theme.palette.error.light,
              }
            }}
          >
            <DashboardIcon icon={IconLogout} size={downSM ? 16 : 18} whiteInDarkMode={true} />
            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: downSM ? '0.875rem' : '1rem' }}>Logout</Typography>
          </MenuItem>
        </Box>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 1.5,
              width: downSM ? '90vw' : 360,
              maxWidth: 400,
              maxHeight: downSM ? '70vh' : 480,
              borderRadius: 2,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.palette.divider}`
            }
          }
        }}
        sx={{
          zIndex: theme.zIndex.modal + 100,
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2,
          borderBottom: 1, 
          borderColor: 'divider',
          background: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DashboardIcon icon={IconBell} size={14} whiteInDarkMode={true} />
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Typography>
          )}
        </Box>

        {/* Notifications List */}
        {loadingNotifications ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading notifications...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <DashboardIcon icon={IconBell} size={48} whiteInDarkMode={true} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <Box
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  backgroundColor: notification.read ? 'transparent' : `${theme.palette.warning.light}20`,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  },
                  transition: 'background-color 0.2s ease-in-out'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Urgency indicator */}
                  <Box sx={{ flexShrink: 0, pt: 0.5 }}>
                    <DashboardIcon icon={IconCircleFilled} size={8} whiteInDarkMode={false} />
                  </Box>
                  
                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.read ? 500 : 700,
                          color: 'text.primary'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          sx={{ 
                            p: 0.5,
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.light
                            }
                          }}
                        >
                          <IconCheck size="14px" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mt: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {formatTimeAgo(notification.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Footer - View all */}
        <Box
          onClick={() => { handleNotificationClose(); router.push('/dashboard/notifications'); }}
          sx={{
            p: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': { backgroundColor: theme.palette.action.hover },
            transition: 'background-color 0.2s ease-in-out',
          }}
        >
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
            View all notifications
          </Typography>
        </Box>
      </Menu>
    </>
  );
}