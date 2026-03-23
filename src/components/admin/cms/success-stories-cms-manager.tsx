'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, SuccessStory } from '@/lib/api';

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  TrendingUp,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SuccessStoriesCMSManagerProps {
  onRefresh: () => void;
}

export function SuccessStoriesCMSManager({ onRefresh }: SuccessStoriesCMSManagerProps) {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [formData, setFormData] = useState({
    buyerName: '',
    companyName: '',
    story: '',
    productCategory: '',
    exportDestination: '',
    exportValue: '',
    imageUrl: '',
    isApproved: false,
    isFeatured: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setIsLoadingStories(true);
      const response = await apiClient.getSuccessStories(false, 100); // Get all stories for admin
      setStories(response.stories);
    } catch (error) {

      setStories([]);
    } finally {
      setIsLoadingStories(false);
    }
  };

  const handleOpenDialog = (story?: SuccessStory) => {
    if (story) {
      setEditingStory(story);
      setFormData({
        buyerName: story.buyerName,
        companyName: story.companyName,
        story: story.story,
        productCategory: story.productCategory,
        exportDestination: story.exportDestination,
        exportValue: story.exportValue || '',
        imageUrl: story.imageUrl || '',
        isApproved: story.isApproved,
        isFeatured: story.isFeatured,
      });
    } else {
      setEditingStory(null);
      setFormData({
        buyerName: '',
        companyName: '',
        story: '',
        productCategory: '',
        exportDestination: '',
        exportValue: '',
        imageUrl: '',
        isApproved: false,
        isFeatured: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStory(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.buyerName.trim() || !formData.story.trim()) {
        toast({
          title: 'Error',
          description: 'Buyer name and story are required',
          variant: 'destructive',
        });
        return;
      }

      const storyData = {
        ...formData,
        id: editingStory?.id
      };

      if (editingStory) {
        await apiClient.updateSuccessStory(editingStory.id, storyData);
      } else {
        await apiClient.createSuccessStory(storyData);
      }
      
      toast({
        title: 'Success',
        description: `Success story ${editingStory ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      loadStories();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save success story',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this success story?')) {
      return;
    }

    try {
      await apiClient.deleteSuccessStory(storyId);
      toast({
        title: 'Success',
        description: 'Success story deleted successfully',
      });
      loadStories();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete success story',
        variant: 'destructive',
      });
    }
  };

  const handleToggleApproval = async (story: SuccessStory) => {
    try {
      await apiClient.updateSuccessStoryStatus(story.id, !story.isApproved, story.isFeatured);
      toast({
        title: 'Success',
        description: `Story ${!story.isApproved ? 'approved' : 'unapproved'}`,
      });
      loadStories();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update story status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (story: SuccessStory) => {
    try {
      await apiClient.updateSuccessStoryStatus(story.id, story.isApproved, !story.isFeatured);
      toast({
        title: 'Success',
        description: `Story ${!story.isFeatured ? 'featured' : 'unfeatured'}`,
      });
      loadStories();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update story status',
        variant: 'destructive',
      });
    }
  };

  const getStatusChip = (story: SuccessStory) => {
    if (story.isFeatured) {
      return <Chip label="Featured" size="small" color="secondary" icon={<Star size={16} />} />;
    } else if (story.isApproved) {
      return <Chip label="Approved" size="small" color="success" icon={<CheckCircle size={16} />} />;
    } else {
      return <Chip label="Pending" size="small" color="warning" icon={<Clock size={16} />} />;
    }
  };

  const filteredStories = stories.filter(story => {
    switch (filterStatus) {
      case 'pending':
        return !story.isApproved;
      case 'approved':
        return story.isApproved && !story.isFeatured;
      case 'featured':
        return story.isFeatured;
      default:
        return true;
    }
  });

  if (isLoadingStories) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading success stories...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Success Stories ({filteredStories.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterStatus}
              label="Filter"
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <MenuItem value="all">All Stories</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="featured">Featured</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => handleOpenDialog()}
          >
            Add Story
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {stories.filter(s => !s.isApproved).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stories.filter(s => s.isApproved).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Stories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {stories.filter(s => s.isFeatured).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Featured Stories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stories.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Stories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stories Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Story</TableCell>
              <TableCell>Buyer</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TrendingUp size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No success stories found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filterStatus === 'all' 
                        ? 'Create your first success story to get started.'
                        : `No ${filterStatus} stories found.`
                      }
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredStories.map((story) => (
                <TableRow key={story.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={story.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.buyerName)}&background=059669&color=fff`}
                        sx={{ width: 40, height: 40 }}
                      >
                        {story.buyerName.substring(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {story.story.length > 60 ? story.story.substring(0, 60) + '...' : story.story}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {story.exportDestination}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {story.buyerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {story.companyName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {story.productCategory}
                    </Typography>
                    {story.exportValue && (
                      <Typography variant="caption" color="text.secondary">
                        Value: {story.exportValue}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(story)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title={story.isApproved ? 'Unapprove' : 'Approve'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleApproval(story)}
                          color={story.isApproved ? 'success' : 'default'}
                        >
                          {story.isApproved ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={story.isFeatured ? 'Unfeature' : 'Feature'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleFeatured(story)}
                          color={story.isFeatured ? 'secondary' : 'default'}
                        >
                          <Star size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(story)}
                        >
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(story.id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit/Create Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStory ? 'Edit Success Story' : 'Create New Success Story'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buyer Name"
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Success Story"
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                required
                helperText="Share the success story details"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Category"
                value={formData.productCategory}
                onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Export Destination"
                value={formData.exportDestination}
                onChange={(e) => setFormData({ ...formData, exportDestination: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Export Value"
                value={formData.exportValue}
                onChange={(e) => setFormData({ ...formData, exportValue: e.target.value })}
                helperText="e.g., $50,000 USD"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                helperText="Optional buyer/company image"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isApproved}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                  />
                }
                label="Approved"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                }
                label="Featured"
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