'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { ActivityList } from '@/components/activity/activity-list';

export default function PartnerActivityPage() {
  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>My Activity</Typography>
        <Typography variant="body2" color="text.secondary">Track your recent actions and account activity</Typography>
      </Box>
      <ActivityList limit={100} />
    </Box>
  );
}
