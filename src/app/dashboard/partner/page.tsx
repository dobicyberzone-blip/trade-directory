'use client';

import React, { useState, useEffect } from 'react';
import { Box, Alert, AlertTitle, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  Search as SearchIcon,
  Heart as HeartIcon,
  Mail as EmailIcon,
  Eye as EyeIcon,
  TrendingUp as TrendingUpIcon,
  MessageSquare as ChatIcon,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { MainCard } from '@/components/ui-dashboard';
import { StatCard, ProgressCard, QuickActionCard } from '@/components/ui-dashboard';
import { useRoleGuard } from '@/hooks/use-role-guard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useThemeMode } from '@/components/ui-dashboard/theme/theme-provider';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

export default function PartnerDashboard() {
  const router = useRouter();
  const { user } = useRoleGuard('partner');
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const tickColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const [stats, setStats] = useState({
    totalSearches: 0, totalFavorites: 0, totalInquiries: 0, businessesViewed: 0,
    searchGrowth: 0, favoriteGrowth: 0, inquiryGrowth: 0, viewsGrowth: 0,
    activeConversations: 0, responseRate: 0, avgResponseTime: '0h',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any>(null);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiClient.getBuyerStatistics();
      const { statistics, monthlyData: apiMonthlyData, categoryData: apiCategoryData } = response;
      setStats({
        totalSearches: statistics.totalSearches, totalFavorites: statistics.totalFavorites,
        totalInquiries: statistics.totalInquiries, businessesViewed: statistics.businessesViewed,
        searchGrowth: statistics.searchGrowth, favoriteGrowth: statistics.favoriteGrowth,
        inquiryGrowth: statistics.inquiryGrowth, viewsGrowth: statistics.viewsGrowth,
        activeConversations: statistics.activeConversations, responseRate: statistics.responseRate,
        avgResponseTime: statistics.avgResponseTime,
      });
      setMonthlyData(apiMonthlyData);
      setCategoryData(apiCategoryData.length > 0 ? apiCategoryData : [{ name: 'No data yet', value: 1 }]);
      setEngagementData({
        searches: statistics.totalSearches, favorites: statistics.totalFavorites,
        inquiries: statistics.totalInquiries, views: statistics.businessesViewed,
      });
      setLoading(false);
    } catch {
      setError('Failed to load dashboard statistics. Please try refreshing the page.');
      setLoading(false);
    }
  };

  const quickActions = [
    { id: '1', label: 'Browse Directory', icon: <SearchIcon />, color: 'primary' as const, onClick: () => router.push('/directory') },
    { id: '2', label: 'View Favourites', icon: <HeartIcon />, color: 'error' as const, onClick: () => router.push('/dashboard/partner/favorites') },
    { id: '3', label: 'My Inquiries', icon: <EmailIcon />, color: 'info' as const, onClick: () => router.push('/dashboard/partner/inquiries') },
    { id: '4', label: 'Messages', icon: <ChatIcon />, color: 'success' as const, onClick: () => router.push('/dashboard/chat') },
  ];

  const monthlyActivityChartData = {
    labels: monthlyData.map(i => i.month),
    datasets: [
      { label: 'Searches', data: monthlyData.map(i => i.searches || 0), backgroundColor: (c: any) => { const g = c.chart.ctx.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(59,130,246,0.4)'); g.addColorStop(1,'rgba(59,130,246,0.05)'); return g; }, borderColor: 'rgb(59,130,246)', borderWidth: 4, tension: 0.4, fill: true, pointRadius: 6, pointHoverRadius: 9, pointBackgroundColor: 'rgb(59,130,246)', pointBorderColor: '#fff', pointBorderWidth: 3 },
      { label: 'Inquiries', data: monthlyData.map(i => i.inquiries || 0), backgroundColor: (c: any) => { const g = c.chart.ctx.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(16,185,129,0.4)'); g.addColorStop(1,'rgba(16,185,129,0.05)'); return g; }, borderColor: 'rgb(16,185,129)', borderWidth: 4, tension: 0.4, fill: true, pointRadius: 6, pointHoverRadius: 9, pointBackgroundColor: 'rgb(16,185,129)', pointBorderColor: '#fff', pointBorderWidth: 3 },
      { label: 'Favourites', data: monthlyData.map(i => i.favorites || 0), backgroundColor: (c: any) => { const g = c.chart.ctx.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(239,68,68,0.4)'); g.addColorStop(1,'rgba(239,68,68,0.05)'); return g; }, borderColor: 'rgb(239,68,68)', borderWidth: 4, tension: 0.4, fill: true, pointRadius: 6, pointHoverRadius: 9, pointBackgroundColor: 'rgb(239,68,68)', pointBorderColor: '#fff', pointBorderWidth: 3 },
    ],
  };

  const categoryChartData = {
    labels: categoryData.map(i => i.name),
    datasets: [{ data: categoryData.map(i => i.value), backgroundColor: ['rgba(59,130,246,0.95)','rgba(16,185,129,0.95)','rgba(168,85,247,0.95)','rgba(245,158,11,0.95)','rgba(239,68,68,0.95)'], borderColor: ['rgb(59,130,246)','rgb(16,185,129)','rgb(168,85,247)','rgb(245,158,11)','rgb(239,68,68)'], borderWidth: 3, hoverOffset: 20 }],
  };

  const engagementChartData = {
    labels: ['Searches', 'Favourites', 'Inquiries', 'Views'],
    datasets: [{ label: 'Activity', data: engagementData ? [engagementData.searches, engagementData.favorites, engagementData.inquiries, engagementData.views] : [0,0,0,0], backgroundColor: (c: any) => { const g = c.chart.ctx.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(59,130,246,0.9)'); g.addColorStop(1,'rgba(59,130,246,0.6)'); return g; }, borderColor: 'rgb(59,130,246)', borderWidth: 0, borderRadius: 10, barThickness: 40 }],
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const, labels: { boxWidth: 15, padding: 20, font: { size: 13, weight: 600, family: "'Inter','Roboto','Helvetica','Arial',sans-serif" }, color: tickColor } }, tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', padding: 16, titleFont: { size: 14, weight: 'bold' as const }, bodyFont: { size: 13 }, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, cornerRadius: 8 } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: { size: 12 }, color: tickColor } }, x: { grid: { display: false }, ticks: { font: { size: 12 }, color: tickColor } } } };
  const pieChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const, labels: { boxWidth: 20, padding: 20, font: { size: 13, weight: 600 }, color: tickColor } }, tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', padding: 16, cornerRadius: 8 } } };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {error && (
        <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>{error}
        </Alert>
      )}
      <Grid2 container spacing={{ xs: 2, sm: 3 }}>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><StatCard title="Total Searches" value={stats.totalSearches} change={stats.searchGrowth} changeLabel="from last month" icon={<SearchIcon />} color="primary" loading={loading} /></Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><StatCard title="Favourites" value={stats.totalFavorites} change={stats.favoriteGrowth} changeLabel="from last month" icon={<HeartIcon />} color="error" loading={loading} /></Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><StatCard title="Inquiries Sent" value={stats.totalInquiries} change={stats.inquiryGrowth} changeLabel="from last month" icon={<EmailIcon />} color="success" loading={loading} /></Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><StatCard title="Businesses Viewed" value={stats.businessesViewed} change={stats.viewsGrowth} changeLabel="from last month" icon={<EyeIcon />} color="info" loading={loading} /></Grid2>

        <Grid2 size={{ xs: 12, lg: 8 }}>
          <MainCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><TrendingUpIcon size={20} />Activity Trends</Typography>
                <Typography variant="caption" sx={{ bgcolor: 'success.light', color: 'success.dark', px: 1.5, py: 0.5, borderRadius: 1.5, fontWeight: 600 }}>Last 6 Months</Typography>
              </Box>
              <Box sx={{ height: { xs: 280, sm: 320, md: 340 } }}>
                {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Typography color="text.secondary">Loading chart...</Typography></Box> : <Line data={monthlyActivityChartData} options={chartOptions} />}
              </Box>
            </Box>
          </MainCard>
        </Grid2>

        <Grid2 size={{ xs: 12, lg: 4 }}>
          <MainCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><PieChart size={20} />Category Interest</Typography>
              <Box sx={{ height: { xs: 280, sm: 320, md: 340 } }}>
                {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Typography color="text.secondary">Loading chart...</Typography></Box> : <Doughnut data={categoryChartData} options={pieChartOptions as any} />}
              </Box>
            </Box>
          </MainCard>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <MainCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}><BarChart3 size={20} />Engagement Overview</Typography>
                <Typography variant="caption" sx={{ bgcolor: 'info.light', color: 'info.dark', px: 1.5, py: 0.5, borderRadius: 1.5, fontWeight: 600 }}>Current Month</Typography>
              </Box>
              <Box sx={{ height: { xs: 260, sm: 300, md: 320 } }}>
                {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Typography color="text.secondary">Loading chart...</Typography></Box> : <Bar data={engagementChartData} options={chartOptions} />}
              </Box>
            </Box>
          </MainCard>
        </Grid2>

        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><ProgressCard title="Response Rate" value={stats.responseRate} total={100} label="Inquiries Responded" color="success" /></Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><ProgressCard title="Active Conversations" value={stats.activeConversations} total={stats.totalInquiries} label="Ongoing Discussions" color="primary" /></Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><ProgressCard title="Avg Response Time" value={2.5} total={24} label={stats.avgResponseTime} color="info" /></Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}><ProgressCard title="Satisfaction" value={4.5} total={5} label="Platform Experience" color="warning" /></Grid2>

        <Grid2 size={{ xs: 12 }}><QuickActionCard title="Quick Actions" actions={quickActions} /></Grid2>
      </Grid2>
    </Box>
  );
}
