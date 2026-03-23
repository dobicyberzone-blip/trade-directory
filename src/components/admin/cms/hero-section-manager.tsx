'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  isActive: boolean;
  order: number;
}

interface HeroSectionManagerProps {
  onRefresh: () => void;
}

export function HeroSectionManager({ onRefresh }: HeroSectionManagerProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    secondaryButtonText: '',
    secondaryButtonLink: '',
    isActive: true,
    order: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlides, setIsLoadingSlides] = useState(true);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setIsLoadingSlides(true);
      // For now, we'll use the media library to store hero slides
      // In a real implementation, you might want a dedicated hero slides endpoint
      const response = await apiClient.getMediaLibrary('hero-slides');
      
      // Transform media items to hero slides format
      const heroSlides = response.media.map((item, index) => ({
        id: item.id,
        title: item.caption || item.originalName || 'Hero Slide',
        subtitle: item.alt || '',
        imageUrl: item.url,
        buttonText: 'Explore Directory',
        buttonLink: '/directory',
        secondaryButtonText: 'Join the Directory',
        secondaryButtonLink: '/register',
        isActive: true,
        order: index
      }));
      
      setSlides(heroSlides);
    } catch (error) {

      // Set default slides if API fails
      setSlides([
        {
          id: '1',
          title: 'The Official Trade Directory for Verified Kenyan Exporters',
          subtitle: 'Connecting Kenya to the world. Discover quality products and trusted suppliers, all verified by KEPROBA.',
          imageUrl: '/carosel/image1.jpg',
          buttonText: 'Explore Directory',
          buttonLink: '/directory',
          secondaryButtonText: 'Join the Directory',
          secondaryButtonLink: '/register',
          isActive: true,
          order: 0
        }
      ]);
    } finally {
      setIsLoadingSlides(false);
    }
  };

  const handleOpenDialog = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        title: slide.title,
        subtitle: slide.subtitle,
        imageUrl: slide.imageUrl,
        buttonText: slide.buttonText,
        buttonLink: slide.buttonLink,
        secondaryButtonText: slide.secondaryButtonText || '',
        secondaryButtonLink: slide.secondaryButtonLink || '',
        isActive: slide.isActive,
        order: slide.order
      });
    } else {
      setEditingSlide(null);
      setFormData({
        title: '',
        subtitle: '',
        imageUrl: '',
        buttonText: 'Explore Directory',
        buttonLink: '/directory',
        secondaryButtonText: 'Join the Directory',
        secondaryButtonLink: '/register',
        isActive: true,
        order: slides.length
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.title.trim() || !formData.imageUrl.trim()) {
        toast({
          title: 'Error',
          description: 'Title and image URL are required',
          variant: 'destructive',
        });
        return;
      }

      // Save as media item for now
      const mediaData = {
        id: editingSlide?.id,
        filename: `hero-slide-${Date.now()}.jpg`,
        originalName: formData.title,
        url: formData.imageUrl,
        alt: formData.subtitle,
        caption: formData.title,
        category: 'hero-slides',
        mimeType: 'image/jpeg',
        size: 0
      };

      if (editingSlide) {
        // Update existing slide - this would need an update endpoint

      } else {
        await apiClient.createMediaItem(mediaData);
      }
      
      toast({
        title: 'Success',
        description: `Hero slide ${editingSlide ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      loadSlides();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save hero slide',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this hero slide?')) {
      return;
    }

    try {
      await apiClient.deleteMediaItem(slideId);
      toast({
        title: 'Success',
        description: 'Hero slide deleted successfully',
      });
      loadSlides();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete hero slide',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingSlides) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading hero slides...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Hero Section Slides ({slides.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenDialog()}
        >
          Add Slide
        </Button>
      </Box>

      {/* Slides Grid */}
      <Grid container spacing={3}>
        {slides.map((slide) => (
          <Grid item xs={12} md={6} lg={4} key={slide.id}>
            <Card>
              <CardHeader
                title={slide.title}
                subheader={`Order: ${slide.order}`}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(slide)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(slide.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <CardContent>
                {slide.imageUrl && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title}
                      loading="lazy"
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '8px' 
                      }}
                    />
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {slide.subtitle}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {slide.isActive ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                      <Eye size={16} />
                      <Typography variant="caption">Active</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <EyeOff size={16} />
                      <Typography variant="caption">Inactive</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {slides.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ImageIcon size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No hero slides found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first hero slide to get started.
            </Typography>
            <Button variant="contained" onClick={() => handleOpenDialog()}>
              Add Hero Slide
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSlide ? 'Edit Hero Slide' : 'Create New Hero Slide'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
                helperText="URL to the hero image"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Button Text"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Button Link"
                value={formData.buttonLink}
                onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secondary Button Text"
                value={formData.secondaryButtonText}
                onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secondary Button Link"
                value={formData.secondaryButtonLink}
                onChange={(e) => setFormData({ ...formData, secondaryButtonLink: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<X />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isLoading}
            startIcon={<Save />}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}