/**
 * Exporter Analytics Page
 * 
 * Detailed analytics view for exporter business performance
 * Shows comprehensive statistics, trends, and product insights
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Box, Alert, AlertTitle, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  Package as PackageIcon,
  Mail as EmailIcon,
  Eye as EyeIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { MainCard } from '@/components/ui-dashboard';
import { StatCard, ProgressCard } from '@/components/ui-dashboard';
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function ExporterAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const tickColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInquiries: 0,
    totalProfileViews: 0,
    totalFavorites: 0,
    totalRatings: 0,
    averageRating: 0,
    responseRate: 0,
    inquiryGrowth: 0,
    viewsGrowth: 0,
    favoritesGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [inquirySourceData, setInquirySourceData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiClient.getExporterStatistics();

      setStats(response.statistics);
      setMonthlyData(response.monthlyData);
      setTopProducts(response.topProducts);
      
      if (response.inquirySourceData.length > 0) {
        setInquirySourceData(response.inquirySourceData);
      } else {
        setInquirySourceData([{ name: 'No data yet', category: '', value: 1 }]);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Exporter Analytics] Error fetching statistics:', error);
      setError('Failed to load analytics. Please try refreshing the page.');
      setLoading(false);
    }
  };

  // Chart configurations
  const monthlyActivityChartData = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Inquiries',
        data: monthlyData.map(item => item.inquiries || 0),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
          return gradient;
        },
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
      },
      {
        label: 'Profile Views',
        data: monthlyData.map(item => item.views || 0),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
      },
      {
        label: 'Favorites',
        data: monthlyData.map(item => item.favorites || 0),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
          return gradient;
        },
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
      },
    ],
  };

  const inquirySourceChartData = {
    labels: inquirySourceData.map(item => item.name),
    datasets: [
      {
        data: inquirySourceData.map(item => item.value),
        backgroundColor: [
          'rgba(59, 130, 246, 0.95)',
          'rgba(16, 185, 129, 0.95)',
          'rgba(168, 85, 247, 0.95)',
          'rgba(245, 158, 11, 0.95)',
          'rgba(239, 68, 68, 0.95)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(168, 85, 247)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 3,
        hoverOffset: 20,
      },
    ],
  };

  const topProductsChartData = {
    labels: topProducts.map(p => p.name),
    datasets: [
      {
        label: 'Inquiries',
        data: topProducts.map(p => p.inquiries),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.6)');
          return gradient;
        },
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 0,
        borderRadius: 10,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 15,
          padding: 20,
          font: {
            size: 13,
            weight: 600,
            family: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
          color: tickColor,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 16,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
        },
        ticks: {
          font: { size: 12 },
          color: tickColor,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 12 },
          color: tickColor,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 20,
          padding: 20,
          font: {
            size: 13,
            weight: 600,
          },
          color: tickColor,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 16,
        cornerRadius: 8,
      },
    },
  };

  return (
    <Box sx={{ 
      pt: { xs: 1, sm: 2 },
      px: { xs: 1, sm: 0 },
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Business Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive insights into your export business performance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Grid2 container spacing={{ xs: 2, sm: 3 }}>
        {/* Stats Cards */}
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            change={0}
            changeLabel="active listings"
            icon={<PackageIcon />}
            color="primary"
            loading={loading}
          />
        </Grid2>
        
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Inquiries Received"
            value={stats.totalInquiries}
            change={stats.inquiryGrowth}
            changeLabel="from last month"
            icon={<EmailIcon />}
            color="success"
            loading={loading}
          />
        </Grid2>
        
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Profile Views"
            value={stats.totalProfileViews}
            change={stats.viewsGrowth}
            changeLabel="from last month"
            icon={<EyeIcon />}
            color="info"
            loading={loading}
          />
        </Grid2>
        
        <Grid2 size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Favorites"
            value={stats.totalFavorites}
            change={stats.favoritesGrowth}
            changeLabel="from last month"
            icon={<HeartIcon />}
            color="error"
            loading={loading}
          />
        </Grid2>

        {/* Activity Trends Chart */}
        <Grid2 size={{ xs: 12, lg: 8 }}>
          <MainCard sx={{ 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            transition: 'box-shadow 0.3s ease-in-out',
          }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  fontWeight: 700, 
                  fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                }}>
                  <TrendingUpIcon size={20} />
                  Business Activity Trends
                </Typography>
                <Typography variant="caption" sx={{ 
                  bgcolor: 'success.light', 
                  color: 'success.dark', 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 1.5,
                  fontWeight: 600,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                }}>
                  Last 6 Months
                </Typography>
              </Box>
              <Box sx={{ height: { xs: 280, sm: 320, md: 340 } }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Loading chart...</Typography>
                  </Box>
                ) : (
                  <Line data={monthlyActivityChartData} options={chartOptions} />
                )}
              </Box>
            </Box>
          </MainCard>
        </Grid2>

        {/* Inquiry Sources Chart */}
        <Grid2 size={{ xs: 12, lg: 4 }}>
          <MainCard sx={{ 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            transition: 'box-shadow 0.3s ease-in-out',
          }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                fontWeight: 700, 
                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              }}>
                <PieChart size={20} />
                Inquiry Sources
              </Typography>
              <Box sx={{ height: { xs: 280, sm: 320, md: 340 } }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Loading chart...</Typography>
                  </Box>
                ) : (
                  <Doughnut data={inquirySourceChartData} options={pieChartOptions as any} />
                )}
              </Box>
            </Box>
          </MainCard>
        </Grid2>

        {/* Top Products Chart */}
        <Grid2 size={{ xs: 12, lg: 8 }}>
          <MainCard sx={{ 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            transition: 'box-shadow 0.3s ease-in-out',
          }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                fontWeight: 700, 
                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              }}>
                <BarChart3 size={20} />
                Top Performing Products
              </Typography>
              <Box sx={{ height: { xs: 280, sm: 320, md: 340 } }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Loading chart...</Typography>
                  </Box>
                ) : topProducts.length > 0 ? (
                  <Bar data={topProductsChartData} options={chartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      No product data available yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </MainCard>
        </Grid2>

        {/* Performance Metrics */}
        <Grid2 size={{ xs: 12, lg: 4 }}>
          <MainCard sx={{ 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            transition: 'box-shadow 0.3s ease-in-out',
          }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" sx={{ 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                fontWeight: 700, 
                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              }}>
                <Activity size={20} />
                Performance Metrics
              </Typography>
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12 }}>
                  <ProgressCard
                    title="Response Rate"
                    value={stats.responseRate}
                    total={100}
                    label="Inquiries Responded"
                    color="success"
                  />
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'warning.light', 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <Box>
                      <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600 }}>
                        Average Rating
                      </Typography>
                      <Typography variant="caption" color="warning.dark">
                        From {stats.totalRatings} reviews
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon size={24} fill="currentColor" color="rgb(245, 158, 11)" />
                      <Typography variant="h4" color="warning.dark" sx={{ fontWeight: 700 }}>
                        {stats.averageRating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid2>
              </Grid2>
            </Box>
          </MainCard>
        </Grid2>
      </Grid2>
    </Box>
  );
}
