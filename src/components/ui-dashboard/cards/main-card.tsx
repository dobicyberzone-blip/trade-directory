'use client';

import React from 'react';
import { Card, CardContent, CardHeader, Typography, Divider, Box } from '@mui/material';

interface MainCardProps {
  title?: string;
  children: React.ReactNode;
  secondary?: React.ReactNode;
  content?: boolean;
  sx?: object;
  darkTitle?: boolean;
  darkFooter?: boolean;
}

export function MainCard({ 
  title, 
  children, 
  secondary, 
  content = true, 
  sx = {},
  darkTitle = false,
  darkFooter = false
}: MainCardProps) {
  return (
    <Card sx={{ 
      border: 1, 
      borderColor: 'divider', 
      bgcolor: darkTitle ? 'primary.main' : undefined,
      color: darkTitle ? 'white' : undefined,
      ...sx 
    }}>
      {title && (
        <>
          <CardHeader
            title={
              <Typography 
                variant="h6" 
                sx={{ 
                  color: darkTitle ? 'white' : 'inherit',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                }}
              >
                {title}
              </Typography>
            }
            action={secondary}
            sx={{ 
              pb: 0,
              px: { xs: 2, sm: 2.5, md: 3 },
              pt: { xs: 2, sm: 2.5, md: 3 }
            }}
          />
          <Divider sx={{ borderColor: darkTitle ? 'rgba(255,255,255,0.2)' : 'divider' }} />
        </>
      )}
      {content ? (
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          {children}
        </CardContent>
      ) : (
        children
      )}
      {darkFooter && (
        <Box sx={{ 
          bgcolor: 'black', 
          color: 'white', 
          p: { xs: 1.5, sm: 2 },
          mt: 'auto'
        }}>
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            Market trends and supplier recommendations will be displayed here
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 0.5,
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            Get insights on pricing trends, new suppliers, and market opportunities
          </Typography>
        </Box>
      )}
    </Card>
  );
}