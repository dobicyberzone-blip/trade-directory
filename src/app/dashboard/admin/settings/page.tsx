'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to notification settings
    router.replace('/dashboard/admin/settings/notifications');
  }, [router]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Redirecting to notification settings...
      </Typography>
    </Box>
  );
}
