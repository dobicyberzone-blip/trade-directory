'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Grid, Chip, Select, MenuItem,
  FormControl, InputLabel, useTheme, CircularProgress,
} from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { MainCard, StatCard } from '@/components/ui-dashboard';
import { useThemeMode } from '@/components/ui-dashboard/theme/theme-provider';
import { Users, Building2, Package, MessageSquare, TrendingUp, Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

interface OverviewMetrics {
  totalUsers: { value: number; growth: number };
  totalBusinesses: { value: number; growth: number };
  totalProducts: { value: number; growth: number };
  totalInquiries: { value: number; growth: number };
  activeUsers: { value: number; period: string };
  verificationPending: { value: number };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [periodData, setPeriodData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tickColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    if (!isSuperAdmin) router.replace('/dashboard/admin');
  }, [isSuperAdmin, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, periodRes] = await Promise.all([
        fetch('/api/admin/analytics/overview', { headers }),
        fetch(`/api/admin/analytics?period=${period}`, { headers }),
      ]);

      if (overviewRes.ok) {
        const json = await overviewRes.json();
        setMetrics(json.metrics);
      }
      if (periodRes.ok) {
        const json = await periodRes.json();
        setPeriodData(json.data);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isSuperAdmin) return null;

  const statCards = metrics ? [
    { title: 'Total Users', value: metrics.totalUsers.value, growth: metrics.totalUsers.growth, icon: <Users size={24} />, color: '#1976d2' },
    { title: 'Total Businesses', value: metrics.totalBusinesses.value, growth: metrics.totalBusinesses.growth, icon: <Building2 size={24} />, color: '#2e7d32' },
    { title: 'Total Products', value: metrics.totalProducts.value, growth: metrics.totalProducts.growth, icon: <Package size={24} />, color: '#ed6c02' },
    { title: 'Total Inquiries', value: metrics.totalInquiries.value, growth: metrics.totalInquiries.growth, icon: <MessageSquare size={24} />, color: '#9c27b0' },
    { title: 'Active Users (30d)', value: metrics.activeUsers.value, icon: <TrendingUp size={24} />, color: '#0288d1' },
    { title: 'Pending Verifications', value: metrics.verificationPending.value, icon: <Clock size={24} />, color: '#d32f2f' },
  ] : [];

  const barData = periodData ? {
    labels: ['Users', 'Businesses', 'Products', 'Inquiries'],
    datasets: [
      {
        label: `New this ${period}`,
        data: [periodData.users?.new, periodData.businesses?.new, periodData.products?.new, periodData.inquiries?.new],
        backgroundColor: ['rgba(25,118,210,0.7)', 'rgba(46,125,50,0.7)', 'rgba(237,108,2,0.7)', 'rgba(156,39,176,0.7)'],
        borderRadius: 6,
      },
    ],
  } : null;

  const doughnutData = metrics ? {
    labels: ['Users', 'Businesses', 'Products'],
    datasets: [{
      data: [metrics.totalUsers.value, metrics.totalBusinesses.value, metrics.totalProducts.value],
      backgroundColor: ['rgba(25,118,210,0.8)', 'rgba(46,125,50,0.8)', 'rgba(237,108,2,0.8)'],
      borderWidth: 2,
      borderColor: isDark ? '#1e1e1e' : '#fff',
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: tickColor, font: { size: 12 } } },
      tooltip: { backgroundColor: isDark ? '#333' : '#fff', titleColor: tickColor, bodyColor: tickColor, borderColor: gridColor, borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor } },
    },
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp size={24} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Platform Analytics</Typography>
            <Typography variant="body2" color="text.secondary">Key metrics and growth indicators</Typography>
          </Box>
        </Box>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={e => setPeriod(e.target.value as 'week' | 'month')}>
            <MenuItem value="week">Last 7 days</MenuItem>
            <MenuItem value="month">Last 30 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stat Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2, mb: 3 }}>
            {statCards.map(card => (
              <Paper key={card.title} sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${card.color}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: card.color }}>
                  {card.icon}
                </Box>
                <Typography variant="h5" fontWeight={700}>{card.value.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                {card.growth !== undefined && (
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={`${card.growth >= 0 ? '+' : ''}${card.growth}%`}
                      size="small"
                      color={card.growth >= 0 ? 'success' : 'error'}
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  </Box>
                )}
              </Paper>
            ))}
          </Box>

          {/* Charts */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            {/* Bar chart */}
            <MainCard title={`New Registrations — ${period === 'week' ? 'Last 7 days' : 'Last 30 days'}`}>
              <Box sx={{ height: 280 }}>
                {barData ? (
                  <Bar data={barData} options={chartOptions as any} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No data available</Typography>
                  </Box>
                )}
              </Box>
            </MainCard>

            {/* Doughnut chart */}
            <MainCard title="Platform Distribution">
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {doughnutData ? (
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: tickColor, font: { size: 11 } } },
                      },
                    }}
                  />
                ) : (
                  <Typography color="text.secondary">No data available</Typography>
                )}
              </Box>
            </MainCard>
          </Box>

          {/* Summary table */}
          {periodData && (
            <MainCard title="Period Summary" sx={{ mt: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                {[
                  { label: 'New Users', total: periodData.users?.total, new: periodData.users?.new },
                  { label: 'New Businesses', total: periodData.businesses?.total, new: periodData.businesses?.new },
                  { label: 'New Products', total: periodData.products?.total, new: periodData.products?.new },
                  { label: 'New Inquiries', total: periodData.inquiries?.total, new: periodData.inquiries?.new },
                ].map(item => (
                  <Paper key={item.label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="h6" fontWeight={700}>{item.total?.toLocaleString() ?? '—'}</Typography>
                    <Typography variant="caption" color="success.main">+{item.new ?? 0} this period</Typography>
                  </Paper>
                ))}
              </Box>
            </MainCard>
          )}
        </>
      )}
    </Box>
  );
}
