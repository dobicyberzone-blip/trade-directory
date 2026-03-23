'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, Business } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// Material-UI
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';

// Icons
import { 
  Star, 
  Eye, 
  Edit, 
  Save, 
  RefreshCw as Refresh,
  Building2 as BusinessIcon,
  CheckCircle,
  X as Cancel,
  Award as Featured,
} from 'lucide-react';

interface FeaturedExporter extends Business {
  isFeatured?: boolean;
  featuredOrder?: number;
}

export function FeaturedExportersManager({ onRefresh }: { onRefresh?: () => void }) {
  const [businesses, setBusinesses] = useState<FeaturedExporter[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<FeaturedExporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<FeaturedExporter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadBusinesses();
    loadFeaturedBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getBusinesses({ verified: true });
      setBusinesses(response.businesses.map(b => ({ ...b, isFeatured: false, featuredOrder: 0 })));
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load verified businesses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeaturedBusinesses = async () => {
    try {
      // For now, we'll use a site setting to store featured business IDs
      // In a real implementation, you might want a separate table
      try {
        const response = await apiClient.getSiteSettingOptional('featured_exporters');
        if (response.setting?.settingValue) {
          const featuredIds = JSON.parse(response.setting.settingValue);
          const featuredData = featuredIds.map((item: any) => ({
            id: item.businessId,
            featuredOrder: item.order,
            isFeatured: true,
          }));
          
          // Update businesses with featured status
          setBusinesses(prev => prev.map(business => {
            const featured = featuredData.find((f: any) => f.id === business.id);
            return featured 
              ? { ...business, isFeatured: true, featuredOrder: featured.featuredOrder }
              : { ...business, isFeatured: false, featuredOrder: 0 };
          }));

          // Set featured businesses
          const featured = businesses.filter(b => featuredData.some((f: any) => f.id === b.id))
            .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
          setFeaturedBusinesses(featured);
        } else {
          // No featured exporters configured yet

          setBusinesses(prev => prev.map(business => ({ 
            ...business, 
            isFeatured: false, 
            featuredOrder: 0 
          })));
          setFeaturedBusinesses([]);
        }
      } catch (error: any) {
        // Setting doesn't exist yet - this is normal for first time setup

        setBusinesses(prev => prev.map(business => ({ 
          ...business, 
          isFeatured: false, 
          featuredOrder: 0 
        })));
        setFeaturedBusinesses([]);
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to load featured businesses configuration",
        variant: "destructive"
      });
    }
  };

  const saveFeaturedBusinesses = async () => {
    try {
      setIsSaving(true);
      
      const featuredData = featuredBusinesses.map((business, index) => ({
        businessId: business.id,
        order: index + 1,
      }));

      await apiClient.saveSiteSetting({
        settingKey: 'featured_exporters',
        settingValue: JSON.stringify(featuredData),
        description: 'Featured exporters displayed on homepage',
        category: 'homepage',
      });

      toast({
        title: 'Success',
        description: 'Featured exporters updated successfully',
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save featured exporters',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeatured = (business: FeaturedExporter) => {
    if (business.isFeatured) {
      // Remove from featured
      setFeaturedBusinesses(prev => prev.filter(b => b.id !== business.id));
      setBusinesses(prev => prev.map(b => 
        b.id === business.id ? { ...b, isFeatured: false, featuredOrder: 0 } : b
      ));
    } else {
      // Add to featured (max 6)
      if (featuredBusinesses.length >= 6) {
        toast({
          title: 'Limit Reached',
          description: 'You can only feature up to 6 exporters on the homepage',
          variant: 'destructive',
        });
        return;
      }
      
      const newFeatured = { ...business, isFeatured: true, featuredOrder: featuredBusinesses.length + 1 };
      setFeaturedBusinesses(prev => [...prev, newFeatured]);
      setBusinesses(prev => prev.map(b => 
        b.id === business.id ? newFeatured : b
      ));
    }
  };

  const moveFeatured = (business: FeaturedExporter, direction: 'up' | 'down') => {
    const currentIndex = featuredBusinesses.findIndex(b => b.id === business.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= featuredBusinesses.length) return;

    const newFeatured = [...featuredBusinesses];
    [newFeatured[currentIndex], newFeatured[newIndex]] = [newFeatured[newIndex], newFeatured[currentIndex]];
    
    // Update order numbers
    const updatedFeatured = newFeatured.map((business, index) => ({
      ...business,
      featuredOrder: index + 1,
    }));

    setFeaturedBusinesses(updatedFeatured);
  };

  const handleViewBusiness = (business: FeaturedExporter) => {
    setSelectedBusiness(business);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Featured Exporters Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select up to 6 verified exporters to feature on the homepage
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { loadBusinesses(); loadFeaturedBusinesses(); }}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveFeaturedBusinesses}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Featured Exporters Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Featured />
            Currently Featured ({featuredBusinesses.length}/6)
          </Typography>
          
          {featuredBusinesses.length === 0 ? (
            <Alert severity="info">
              No exporters are currently featured. Select businesses from the list below to feature them on the homepage.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {featuredBusinesses.map((business, index) => (
                <Grid item xs={12} sm={6} md={4} key={business.id}>
                  <Card variant="outlined" sx={{ position: 'relative' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar src={business.logoUrl} sx={{ width: 40, height: 40 }}>
                          {business.name.substring(0, 2)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {business.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {business.location}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          color="primary" 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            onClick={() => moveFeatured(business, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            size="small"
                            onClick={() => moveFeatured(business, 'down')}
                            disabled={index === featuredBusinesses.length - 1}
                          >
                            ↓
                          </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleViewBusiness(business)}>
                            <Eye size={16} />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleFeatured(business)} color="error">
                            <Cancel size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Available Businesses */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon />
            Verified Exporters ({businesses.filter(b => !b.isFeatured).length})
          </Typography>
          
          <Grid container spacing={2}>
            {businesses.filter(b => !b.isFeatured).map((business) => (
              <Grid item xs={12} sm={6} md={4} key={business.id}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={business.logoUrl} sx={{ width: 40, height: 40 }}>
                        {business.name.substring(0, 2)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {business.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {business.location} • {business.sector}
                        </Typography>
                      </Box>
                      <Chip 
                        icon={<CheckCircle size={14} />}
                        label="Verified" 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    </Box>
                    
                    {business.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Star size={16} fill="currentColor" color="#fbbf24" />
                        <Typography variant="caption">
                          {business.rating.toFixed(1)} rating
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => toggleFeatured(business)}
                        disabled={featuredBusinesses.length >= 6}
                      >
                        Feature
                      </Button>
                      <IconButton size="small" onClick={() => handleViewBusiness(business)}>
                        <Eye size={16} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Business Details Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>
          {selectedBusiness?.name}
        </DialogTitle>
        <DialogContent>
          {selectedBusiness && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{selectedBusiness.location}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Sector</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{selectedBusiness.sector}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Contact Email</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{selectedBusiness.contactEmail}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Verification Status</Typography>
                  <Chip 
                    label={selectedBusiness.verificationStatus} 
                    color="success" 
                    size="small" 
                    sx={{ mb: 2 }}
                  />
                  
                  {selectedBusiness.rating && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">Rating</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Star size={16} fill="currentColor" color="#fbbf24" />
                        <Typography variant="body2">{selectedBusiness.rating.toFixed(1)}</Typography>
                      </Box>
                    </>
                  )}
                  
                  <Typography variant="subtitle2" color="text.secondary">Website</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedBusiness.website || 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedBusiness.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{selectedBusiness.description}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}