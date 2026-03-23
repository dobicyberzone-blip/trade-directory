'use client';

import PropTypes from 'prop-types';

// material-ui
import { Box, Card, CardContent, Typography } from '@mui/material';

// Types
interface StatsCardProps {
  title: string;
  count?: number;
  icon?: React.ElementType;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  isLoading?: boolean;
  suffix?: string;
  subtitle?: string;
}

// ==============================|| STATS CARD ||============================== //

const StatsCard = ({ 
  title, 
  count, 
  icon: Icon, 
  color = 'primary',
  isLoading = false,
  suffix = '',
  subtitle = ''
}: StatsCardProps) => {

  const getGradientConfig = (colorName: string) => {
    const gradients: Record<string, { background: string; iconBg: string; textColor: string }> = {
      primary: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
      },
      secondary: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
      },
      success: {
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
      },
      error: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
      },
      warning: {
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        iconBg: 'rgba(255, 255, 255, 0.3)',
        textColor: '#ffffff',
      },
      info: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
      },
    };
    return gradients[colorName] || gradients.primary;
  };

  const gradientConfig = getGradientConfig(color);

  return (
    <Card
      sx={{
        background: gradientConfig.background,
        color: gradientConfig.textColor,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 3,
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
        '&:hover': {
          boxShadow: '0 8px 25px 0 rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out',
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          width: 210,
          height: 210,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          top: -85,
          right: -95,
        },
        '&:before': {
          content: '""',
          position: 'absolute',
          width: 210,
          height: 210,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          top: -125,
          right: -15,
        },
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500, 
                color: 'rgba(255, 255, 255, 0.8)', 
                mb: 1,
                fontSize: '0.875rem'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: '#ffffff',
                fontSize: '2rem',
                lineHeight: 1.2
              }}
            >
              {isLoading ? '...' : `${count?.toLocaleString() || '0'}${suffix}`}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.75rem',
                  mt: 0.5,
                  display: 'block'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 2,
              background: gradientConfig.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            {Icon && <Icon size={28} color="#ffffff" />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  isLoading: PropTypes.bool,
  suffix: PropTypes.string,
  subtitle: PropTypes.string,
};

StatsCard.displayName = 'StatsCard';

export default StatsCard;