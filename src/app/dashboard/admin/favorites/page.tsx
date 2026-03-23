'use client';

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Card, CardContent, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { Heart, MapPin, Phone, Mail, Globe, Star, Trash2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, Favorite } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { MainCard } from '@/components/ui-dashboard';
import { RatingDialog } from '@/components/rating-dialog';

export default function AdminFavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getFavorites();
      setFavorites(response.favorites);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load your favorites.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (businessId: string) => {
    if (!confirm('Are you sure you want to remove this business from your favorites?')) {
      return;
    }

    try {
      await apiClient.removeFromFavorites(businessId);
      toast({
        title: 'Success',
        description: 'Business removed from favorites.',
      });
      loadFavorites();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to remove from favorites.',
        variant: 'destructive',
      });
    }
  };

  const handleViewBusiness = (businessId: string) => {
    router.push(`/directory?business=${businessId}`);
  };

  const handleRateBusiness = (business: any) => {
    setSelectedBusiness(business);
    setRatingOpen(true);
  };

  const handleRatingSubmitted = () => {
    // Refresh favorites to get updated ratings
    loadFavorites();
  };

  const getVerificationChip = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Chip label="Verified" color="success" size="small" />;
      case 'PENDING':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'REJECTED':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Unverified" color="default" size="small" />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 2 }}>
      {favorites.length === 0 ? (
        <MainCard>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Heart size={64} className="mx-auto mb-4 text-gray-400" />
            <Typography variant="h6" sx={{ mb: 2 }}>
              No Favorites Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Start exploring businesses and add them to your favorites for quick access.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/directory')}
            >
              Browse Directory
            </Button>
          </Box>
        </MainCard>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((favorite) => (
            <Grid item xs={12} md={6} lg={4} key={favorite.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {favorite.business?.name}
                      </Typography>
                      {getVerificationChip(favorite.business?.verificationStatus || 'PENDING')}
                    </Box>
                    <Tooltip title="Remove from favorites">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFavorite(favorite.businessId)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {favorite.business?.description || 'No description available'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapPin size={16} />
                      <Typography variant="body2">
                        {favorite.business?.location}
                      </Typography>
                    </Box>
                    
                    {favorite.business?.contactEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Mail size={16} />
                        <Typography variant="body2">
                          {favorite.business?.contactEmail}
                        </Typography>
                      </Box>
                    )}

                    {favorite.business?.contactPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone size={16} />
                        <Typography variant="body2">
                          {favorite.business?.contactPhone}
                        </Typography>
                      </Box>
                    )}

                    {favorite.business?.website && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Globe size={16} />
                        <Typography variant="body2">
                          {favorite.business?.website}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip 
                      label={favorite.business?.sector} 
                      variant="outlined" 
                      size="small" 
                    />
                    {favorite.business?.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star size={16} fill="currentColor" />
                        <Typography variant="body2">
                          {favorite.business?.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink size={16} />}
                      onClick={() => handleViewBusiness(favorite.businessId)}
                      sx={{ flexGrow: 1 }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Star size={16} />}
                      onClick={() => handleRateBusiness(favorite.business)}
                      color="warning"
                    >
                      Rate
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Stats */}
      {favorites.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <MainCard title="Favorites Summary">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {favorites.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Favorites
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {favorites.filter(f => f.business?.verificationStatus === 'VERIFIED').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified Businesses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {new Set(favorites.map(f => f.business?.sector)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different Sectors
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {new Set(favorites.map(f => f.business?.location)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different Locations
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </MainCard>
        </Box>
      )}

      {/* Rating Dialog */}
      <RatingDialog 
        isOpen={ratingOpen} 
        onOpenChange={setRatingOpen} 
        business={selectedBusiness}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </Box>
  );
}
