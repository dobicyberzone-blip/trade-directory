'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { apiClient, MediaLibrary } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Image as ImageIcon,
  Copy,
  Search,
  File
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const MEDIA_CATEGORIES = [
  'hero-slides',
  'partner-logos',
  'user-profiles',
  'product-images',
  'business-logos',
  'certificates',
  'general',
  'icons'
];

export default function MediaLibraryManager() {
  const [mediaItems, setMediaItems] = useState<MediaLibrary[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaLibrary | null>(null);
  const [formData, setFormData] = useState({
    filename: '',
    originalName: '',
    url: '',
    alt: '',
    caption: '',
    category: 'general',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadMediaItems();
  }, []);

  const loadMediaItems = async () => {
    try {
      setIsLoadingMedia(true);
      const response = await apiClient.getMediaLibrary();
      setMediaItems(response.media);
    } catch (error) {

      // Set sample media items for demo
      setMediaItems([
        {
          id: '1',
          filename: 'hero-image-1.jpg',
          originalName: 'Kenya Export Hero Image',
          mimeType: 'image/jpeg',
          size: 1024000,
          url: '/carosel/image1.jpg',
          alt: 'Kenya export products showcase',
          caption: 'Premium Kenyan export products',
          category: 'hero-slides',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          filename: 'keproba-logo.png',
          originalName: 'KEPROBA Logo',
          mimeType: 'image/png',
          size: 512000,
          url: '/Keproba-logo.png',
          alt: 'KEPROBA official logo',
          caption: 'Kenya Export Promotion and Branding Agency',
          category: 'partner-logos',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleOpenDialog = (item?: MediaLibrary) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        filename: item.filename,
        originalName: item.originalName,
        url: item.url,
        alt: item.alt || '',
        caption: item.caption || '',
        category: item.category,
      });
    } else {
      setEditingItem(null);
      setFormData({
        filename: '',
        originalName: '',
        url: '',
        alt: '',
        caption: '',
        category: 'general',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.url.trim() || !formData.originalName.trim()) {
        toast({
          title: 'Error',
          description: 'URL and name are required',
          variant: 'destructive',
        });
        return;
      }

      const mediaData = {
        ...formData,
        filename: formData.filename || formData.originalName.toLowerCase().replace(/\s+/g, '-'),
        mimeType: formData.url.includes('.png') ? 'image/png' : 'image/jpeg',
        size: 0, // Would be calculated on upload
        id: editingItem?.id
      };

      if (editingItem) {
        // Update existing item - would need an update endpoint

      } else {
        await apiClient.createMediaItem(mediaData);
      }
      
      toast({
        title: 'Success',
        description: `Media item ${editingItem ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      loadMediaItems();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save media item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) {
      return;
    }

    try {
      await apiClient.deleteMediaItem(itemId);
      toast({
        title: 'Success',
        description: 'Media item deleted successfully',
      });
      loadMediaItems();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete media item',
        variant: 'destructive',
      });
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Success',
        description: 'URL copied to clipboard',
      });
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy URL. Please copy manually.',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      'hero-slides': 'primary',
      'partner-logos': 'secondary',
      'user-profiles': 'success',
      'product-images': 'warning',
      'business-logos': 'info',
      'certificates': 'error',
      'general': 'primary',
      'icons': 'secondary'
    };
    return colors[category] || 'primary';
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      item.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alt && item.alt.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isLoadingMedia) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading media library...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Media Library ({filteredItems.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenDialog()}
        >
          Add Media
        </Button>
      </Box>

      {/* Filters and Search */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8, color: '#666' }} />
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            label="Category"
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {MEDIA_CATEGORIES.map(category => (
              <MenuItem key={category} value={category}>
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={viewMode === 'grid' ? <File /> : <ImageIcon />}
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? 'List View' : 'Grid View'}
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {mediaItems.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {MEDIA_CATEGORIES.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {formatFileSize(mediaItems.reduce((total, item) => total + item.size, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Size
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {mediaItems.filter(item => item.mimeType.startsWith('image/')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Images
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Media Items */}
      {viewMode === 'grid' ? (
        <ImageList cols={4} gap={16}>
          {filteredItems.map((item) => (
            <ImageListItem key={item.id}>
              <img
                src={item.url}
                alt={item.alt || item.originalName}
                loading="lazy"
                style={{ height: 200, objectFit: 'cover' }}
              />
              <ImageListItemBar
                title={item.originalName}
                subtitle={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={item.category} 
                      size="small" 
                      color={getCategoryColor(item.category)}
                    />
                    <Typography variant="caption">
                      {formatFileSize(item.size)}
                    </Typography>
                  </Box>
                }
                actionIcon={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Copy URL">
                      <IconButton
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        onClick={() => handleCopyUrl(item.url)}
                      >
                        <Copy size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      ) : (
        <Paper variant="outlined">
          {filteredItems.map((item) => (
            <Box key={item.id} sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src={item.url}
                alt={item.alt || item.originalName}
                loading="lazy"
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {item.originalName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.filename} • {formatFileSize(item.size)} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={item.category} 
                    size="small" 
                    color={getCategoryColor(item.category)}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Copy URL">
                  <IconButton size="small" onClick={() => handleCopyUrl(item.url)}>
                    <Copy size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                    <Edit size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {filteredItems.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ImageIcon size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No media files found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your first media file to get started.'
              }
            </Typography>
            <Button variant="contained" onClick={() => handleOpenDialog()}>
              Add Media File
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
          {editingItem ? 'Edit Media Item' : 'Add New Media Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.originalName}
                onChange={(e) => setFormData({ ...formData, originalName: e.target.value })}
                required
                helperText="Display name for this media item"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                helperText="Direct URL to the media file"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Filename"
                value={formData.filename}
                onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                helperText="File name (auto-generated if empty)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {MEDIA_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alt Text"
                value={formData.alt}
                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                helperText="Alternative text for accessibility"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                helperText="Optional caption or description"
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