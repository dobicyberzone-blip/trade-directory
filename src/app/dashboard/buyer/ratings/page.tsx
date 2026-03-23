'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Typography, Box, Card, CardContent, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { Star, MapPin, Edit, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, Rating } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { MainCard } from '@/components/ui-dashboard';
import { RatingDialog } from '@/components/rating-dialog';
import { formatDistanceToNow } from 'date-fns';

export default function BuyerRatingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const loadRatings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRatings();
      // Filter to only show ratings by current user
      const userRatings = response.ratings.filter(rating => rating.userId === user?.id);
      setRatings(userRatings);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load your ratings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.role === 'BUYER') {
      loadRatings();
    }
  }, [user, loadRatings]);

  const handleEditRating = (rating: Rating) => {
    setSelectedBusiness(rating.business);
    setRatingOpen(true);
  };

  const handleDeleteRating = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to delete your rating for ${businessName}?`)) {
      return;
    }

    try {
      await apiClient.deleteRating(businessId);
      toast({
        title: 'Success',
        description: 'Rating deleted successfully.',
      });
      loadRatings();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete rating.',
        variant: 'destructive',
      });
    }
  };

  const handleViewBusiness = (businessId: string) => {
    router.push(`/directory?business=${businessId}`);
  };

  const handleRatingSubmitted = () => {
    loadRatings();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
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
    <Box sx={{ 
      pt: { xs: 1, sm: 2 },
      px: { xs: 1, sm: 0 },
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {ratings.length === 0 ? (
        <MainCard>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Star size={64} className="mx-auto mb-4 text-gray-400" />
            <Typography variant="h6" sx={{ mb: 2 }}>
              No Ratings Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Start rating businesses you&apos;ve worked with to help other buyers make informed decisions.
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
          {ratings.map((rating) => (
            <Grid item xs={12} md={6} lg={4} key={rating.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {rating.business?.name}
                      </Typography>
                      {getVerificationChip(rating.business?.verificationStatus || 'PENDING')}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit rating">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditRating(rating)}
                        >
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete rating">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRating(rating.businessId, rating.business?.name || 'this business')}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Rating Display */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {renderStars(rating.rating)}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {rating.rating}/5
                    </Typography>
                  </Box>

                  {/* Review Text */}
                  {rating.review && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        &quot;{rating.review}&quot;
                      </Typography>
                    </Box>
                  )}

                  {/* Business Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MapPin size={16} />
                    <Typography variant="body2">
                      {rating.business?.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip 
                      label={rating.business?.sector} 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>

                  {/* Rating Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Calendar size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Rated {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink size={16} />}
                      onClick={() => handleViewBusiness(rating.businessId)}
                      sx={{ flexGrow: 1 }}
                    >
                      View Business
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Stats */}
      {ratings.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <MainCard title="Rating Summary">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {ratings.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Ratings
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {ratings.filter(r => r.review && r.review.trim().length > 0).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Reviews
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {new Set(ratings.map(r => r.business?.sector)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different Sectors
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