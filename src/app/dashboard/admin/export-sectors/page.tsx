'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { StatsCard } from '@/components/ui-dashboard';

import { ExportSectorsManager } from '@/components/admin/cms/export-sectors-manager';
import { toast } from '@/hooks/use-toast';

// Icons
import { BarChart3, CheckCircle } from 'lucide-react';

export default function ExportSectorsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSectors: 0,
    activeSectors: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.makeRequest<{ sectors: Array<{ isActive: boolean }> }>('/cms/sectors');
      const sectors = response.sectors || [];
      const activeCount = sectors.filter((s) => s.isActive).length;
      setStats({
        totalSectors: sectors.length,
        activeSectors: activeCount,
      });
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to view this page.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Export Sectors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage export sectors with full CRUD operations
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
        <StatsCard
          title="Total Sectors"
          count={stats.totalSectors}
          icon={BarChart3}
          color="primary"
        />
        <StatsCard
          title="Active Sectors"
          count={stats.activeSectors}
          icon={CheckCircle}
          color="success"
        />
      </Box>

      {/* Export Sectors Manager */}
      <Card>
        <CardContent>
          <ExportSectorsManager onRefresh={loadStats} />
        </CardContent>
      </Card>
    </Box>
  );
}

