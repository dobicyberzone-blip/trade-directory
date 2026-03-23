'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Switch,
  Tooltip,
} from '@mui/material';

import { toast } from '@/hooks/use-toast';

// Icons
import { Search, Star, Building2, MapPin, CheckCircle } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  location: string;
  sector: string;
  verificationStatus: string;
  logoUrl?: string;
  featured?: boolean;
}

export default function FeaturedExportersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all verified businesses
      const response = await apiClient.getBusinesses({ verified: true });
      const allBusinesses = response.businesses || [];
      
      // Load featured exporters from settings
      try {
        const settingResponse = await apiClient.getSiteSettingOptional('featured_exporters');
        if (settingResponse.setting?.settingValue) {
          const featuredData = JSON.parse(settingResponse.setting.settingValue);
          setFeaturedIds(featuredData);
        }
      } catch {

        setFeaturedIds([]);
      }
      
      // Mark businesses as featured
      const businessesWithFeatured = allBusinesses.map((business: Business) => ({
        ...business,
        featured: featuredIds.includes(business.id),
      }));
      
      setBusinesses(businessesWithFeatured);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load businesses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (businessId: string, currentStatus: boolean) => {
    try {
      let newFeaturedIds: string[];
      
      if (currentStatus) {
        // Remove from featured
        newFeaturedIds = featuredIds.filter(id => id !== businessId);
      } else {
        // Add to featured
        newFeaturedIds = [...featuredIds, businessId];
      }
      
      // Update in database
      await apiClient.saveSiteSetting({
        settingKey: 'featured_exporters',
        settingValue: JSON.stringify(newFeaturedIds),
      });
      
      setFeaturedIds(newFeaturedIds);
      
      // Update local state
      setBusinesses(prev => prev.map(b => 
        b.id === businessId ? { ...b, featured: !currentStatus } : b
      ));
      
      toast({
        title: 'Success',
        description: currentStatus ? 'Removed from featured exporters' : 'Added to featured exporters',
        variant: 'default',
      });
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const searchLower = searchTerm.toLowerCase();
    return (
      business.name.toLowerCase().includes(searchLower) ||
      business.location.toLowerCase().includes(searchLower) ||
      business.sector.toLowerCase().includes(searchLower)
    );
  });

  // Sort: featured first, then by name
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to view this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2, md: 3 },
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Featured Exporters Management
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Select verified exporters to feature on the homepage
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <TextField
          fullWidth
          placeholder="Search by business name, location, or sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: { xs: '100%', sm: 600 },
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
        />
      </Box>

      {/* Stats Summary */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3 }, 
        display: 'flex', 
        gap: { xs: 1.5, sm: 2, md: 3 }, 
        flexWrap: 'wrap' 
      }}>
        <Chip 
          icon={<Building2 size={16} />} 
          label={`${businesses.length} Verified Businesses`} 
          color="primary" 
          variant="outlined"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        />
        <Chip 
          icon={<Star size={16} />} 
          label={`${featuredIds.length} Currently Featured`} 
          color="success" 
          variant="filled"
        />
        <Chip 
          label={`${filteredBusinesses.length} Results`} 
          variant="outlined"
        />
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: 2,
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: { xs: 600, sm: 650 }
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 2 }
                }}>Business</TableCell>
                <TableCell sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 2 },
                  display: { xs: 'none', sm: 'table-cell' }
                }}>Location</TableCell>
                <TableCell sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 2 }
                }}>Sector</TableCell>
                <TableCell sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 2 },
                  display: { xs: 'none', md: 'table-cell' }
                }}>Status</TableCell>
                <TableCell sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 2 }
                }} align="center">Featured</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBusinesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No businesses found matching your search' : 'No verified businesses available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedBusinesses.map((business) => (
                  <TableRow 
                    key={business.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: business.featured ? 'success.lighter' : 'inherit',
                    }}
                  >
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                        <Avatar 
                          src={business.logoUrl || undefined}
                          sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
                        >
                          <Building2 size={20} />
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
                            }}
                          >
                            {business.name}
                          </Typography>
                          {business.featured && (
                            <Chip 
                              icon={<Star size={12} />} 
                              label="Featured" 
                              size="small" 
                              color="success"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      py: { xs: 1.5, sm: 2 },
                      display: { xs: 'none', sm: 'table-cell' }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={16} color="#666" />
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {business.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Chip 
                        label={business.sector} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      py: { xs: 1.5, sm: 2 },
                      display: { xs: 'none', md: 'table-cell' }
                    }}>
                      <Chip 
                        icon={<CheckCircle size={14} />}
                        label="Verified" 
                        size="small" 
                        color="success"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Tooltip title={business.featured ? 'Remove from featured' : 'Add to featured'}>
                        <Switch
                          checked={business.featured || false}
                          onChange={() => handleToggleFeatured(business.id, business.featured || false)}
                          color="success"
                        />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

