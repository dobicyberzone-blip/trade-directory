'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { useTheme } from '@mui/material/styles';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
}

export const StatCard = React.memo(({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  color, 
  loading = false 
}: StatCardProps) => {
  const theme = useTheme();

  // Use theme colors with proper contrast ratios for accessibility
  const getColorConfig = (colorName: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      primary: { 
        bg: theme.palette.primary.main, 
        text: theme.palette.primary.contrastText,
        iconBg: theme.palette.primary.dark
      },
      secondary: { 
        bg: theme.palette.secondary.main, 
        text: theme.palette.secondary.contrastText,
        iconBg: theme.palette.secondary.dark
      },
      success: { 
        bg: theme.palette.success.main, 
        text: theme.palette.success.contrastText,
        iconBg: theme.palette.success.dark
      },
      error: { 
        bg: theme.palette.error.main, 
        text: theme.palette.error.contrastText,
        iconBg: theme.palette.error.dark
      },
      warning: { 
        bg: theme.palette.warning.main, 
        text: theme.palette.warning.contrastText,
        iconBg: theme.palette.warning.dark
      },
      info: { 
        bg: theme.palette.info?.main || theme.palette.primary.main, 
        text: theme.palette.info?.contrastText || theme.palette.primary.contrastText,
        iconBg: theme.palette.info?.dark || theme.palette.primary.dark
      },
    };
    return colors[colorName] || colors.primary;
  };

  const colorConfig = getColorConfig(color);

  return (
    <Card
      sx={{
        background: colorConfig.bg,
        color: colorConfig.text,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: theme.shape.borderRadius / 4,
        boxShadow: theme.shadows[4],
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 1, sm: 2 } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9, 
                mb: { xs: 0.5, sm: 1 },
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(0.5) }}>
                {change >= 0 ? (
                  <TrendingUp size={14} aria-hidden="true" />
                ) : (
                  <TrendingDown size={14} aria-hidden="true" />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    color: '#ffffff',
                    opacity: 1
                  }}
                >
                  {Math.abs(change)}% {changeLabel}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              minWidth: { xs: 40, sm: 48, md: 56 },
              minHeight: { xs: 40, sm: 48, md: 56 },
              width: { xs: 40, sm: 48, md: 56 },
              height: { xs: 40, sm: 48, md: 56 },
              borderRadius: theme.shape.borderRadius / 6,
              background: colorConfig.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {React.isValidElement(icon) 
              ? React.cloneElement(icon, { size: 20 } as any)
              : icon
            }
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Progress Card Component
interface ProgressCardProps {
  title: string;
  value: number;
  total: number;
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export const ProgressCard = React.memo(({ title, value, total, label, color }: ProgressCardProps) => {
  const theme = useTheme();
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card 
      sx={{ 
        border: 1, 
        borderColor: 'divider',
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
          }}
        >
          {title}
        </Typography>
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: theme.spacing(1) }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {label}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {value}/{total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={color}
            sx={{ 
              height: { xs: 6, sm: 8 }, 
              borderRadius: theme.shape.borderRadius / 3,
            }}
            aria-label={`${label}: ${percentage.toFixed(1)}% complete`}
          />
        </Box>
        <Typography 
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
        >
          {percentage.toFixed(1)}%
        </Typography>
      </CardContent>
    </Card>
  );
});

ProgressCard.displayName = 'ProgressCard';

// Activity Card Component
interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

interface ActivityCardProps {
  title: string;
  activities: Activity[];
}

export const ActivityCard = React.memo(({ title, activities }: ActivityCardProps) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  return (
    <Card 
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, flex: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
          }}
        >
          {title}
        </Typography>
        {activities.length === 0 ? (
          <Box sx={{ py: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              No recent activities to display
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }} role="list" aria-label={title}>
            {activities.map((activity) => (
              <ListItem 
                key={activity.id} 
                sx={{ 
                  px: 0, 
                  py: { xs: 1, sm: 1.5 },
                  '&:not(:last-child)': {
                    borderBottom: 1,
                    borderColor: 'divider'
                  }
                }}
                role="listitem"
              >
                <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                  <Activity size={18} aria-hidden="true" />
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  primaryTypographyProps={{
                    sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                  }}
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        component="span" 
                        sx={{ 
                          display: 'block', 
                          mb: theme.spacing(0.5),
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        {activity.description}
                      </Typography>
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                        <Clock size={12} aria-hidden="true" />
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          component="span"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          {activity.time}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          component="span"
                          sx={{ 
                            px: { xs: 0.75, sm: 1 }, 
                            py: theme.spacing(0.25), 
                            borderRadius: theme.shape.borderRadius / 6, 
                            border: 1, 
                            borderColor: `${getStatusColor(activity.status)}.main`,
                            color: `${getStatusColor(activity.status)}.main`,
                            fontSize: { xs: '0.6rem', sm: '0.75rem' },
                            textTransform: 'uppercase',
                            fontWeight: 500
                          }}
                        >
                          {activity.status}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
});

ActivityCard.displayName = 'ActivityCard';

// Quick Action Card Component
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  onClick: () => void;
}

interface QuickActionCardProps {
  title: string;
  actions: QuickAction[];
}

export const QuickActionCard = React.memo(({ title, actions }: QuickActionCardProps) => {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, flex: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
          }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          {actions.map((action) => (
            <Box key={action.id}>
              <Button
                fullWidth
                variant="outlined"
                color={action.color}
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{ 
                  justifyContent: 'flex-start', 
                  py: { xs: 1.25, sm: 1.5 },
                  px: { xs: 1.5, sm: 2 },
                  minHeight: 44, // Ensure minimum touch target size
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 1, sm: 1.5 }
                  }
                }}
                aria-label={action.label}
              >
                {action.label}
              </Button>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
});

QuickActionCard.displayName = 'QuickActionCard';