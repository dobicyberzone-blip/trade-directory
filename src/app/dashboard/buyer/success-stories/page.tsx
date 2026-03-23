'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Alert,
  Grid2,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Delete,
  Add,
  Edit,
  Star,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, SuccessStory } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { SuccessStoryForm } from '@/components/success-story-form';
import { formatDistanceToNow } from 'date-fns';

export default function BuyerSuccessStoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserSuccessStories();
      setStories(response.stories);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load success stories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStories();
    }
  }, [user]);

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          story.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          story.exporterName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'approved' && story.isApproved) ||
                         (statusFilter === 'pending' && !story.isApproved) ||
                         (statusFilter === 'featured' && story.isFeatured);
    return matchesSearch && matchesStatus;
  });

  const approvedCount = stories.filter(s => s.isApproved).length;
  const pendingCount = stories.filter(s => !s.isApproved).length;
  const featuredCount = stories.filter(s => s.isFeatured).length;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleViewDetails = (story: SuccessStory) => {
    setSelectedStory(story);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleEdit = (story: SuccessStory) => {
    setEditingStory(story);
    handleMenuClose();
  };

  const handleDeleteClick = (story: SuccessStory) => {
    setSelectedStory(story);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedStory) return;
    
    try {
      await apiClient.deleteSuccessStory(selectedStory.id);
      setStories(prev => prev.filter(s => s.id !== selectedStory.id));
      toast({
        title: 'Success',
        description: 'Success story deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedStory(null);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete success story',
        variant: 'destructive',
      });
    }
  };

  const handleEditComplete = () => {
    setEditingStory(null);
    fetchStories();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedStories = filteredStories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusChip = (story: SuccessStory) => {
    if (story.isFeatured) {
      return <Chip label="Featured" color="secondary" size="small" icon={<Star />} />;
    } else if (story.isApproved) {
      return <Chip label="Approved" color="success" size="small" />;
    } else {
      return <Chip label="Pending" color="warning" size="small" />;
    }
  };

  return (
    <Box sx={{ 
      pt: { xs: 1, sm: 2 },
      px: { xs: 1, sm: 0 },
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Edit Form Dialog */}
      {editingStory && (
        <SuccessStoryForm 
          onSuccess={handleEditComplete}
          editingStory={editingStory}
          onCancel={() => setEditingStory(null)}
        />
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Success Stories
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Share your positive experiences with Kenyan exporters
        </Typography>
      </Box>

      {/* Info Alert */}
      {pendingCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {pendingCount} success {pendingCount > 1 ? 'stories' : 'story'} pending admin review. 
          Approved stories will be visible on the public success stories page.
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search stories..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: { xs: '100%', sm: 250 } }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="featured">Featured</MenuItem>
            </Select>
          </FormControl>
          <SuccessStoryForm 
            onSuccess={fetchStories}
            trigger={
              <Button variant="contained" startIcon={<Add />}>
                Add Story
              </Button>
            }
          />
        </Box>
      </Paper>

      {/* Stories Table */}
      <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Exporter</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Loading success stories...
                </TableCell>
              </TableRow>
            ) : paginatedStories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No stories match your filters' 
                      : 'No success stories yet. Click "Add Story" to share your first experience.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedStories.map((story) => (
                <TableRow key={story.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{story.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {story.productCategory}
                    </Typography>
                  </TableCell>
                  <TableCell>{story.companyName}</TableCell>
                  <TableCell>{story.exporterName}</TableCell>
                  <TableCell>{story.exportDestination}</TableCell>
                  <TableCell>{getStatusChip(story)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, story.id)}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredStories.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const story = stories.find(s => s.id === selectedId);
          if (story) handleViewDetails(story);
        }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const story = stories.find(s => s.id === selectedId);
          if (story) handleEdit(story);
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={() => {
          const story = stories.find(s => s.id === selectedId);
          if (story) handleDeleteClick(story);
        }}>
          <Delete sx={{ mr: 1 }} fontSize="small" color="error" /> Delete
        </MenuItem>
      </Menu>

      {/* Story Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Success Story Details</DialogTitle>
        <DialogContent>
          {selectedStory && (
            <Box sx={{ pt: 2 }}>
              {selectedStory.imageUrl && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={selectedStory.imageUrl}
                    alt={selectedStory.title}
                    sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 2 }}
                  />
                </Box>
              )}
              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>{selectedStory.title}</Typography>
                  {getStatusChip(selectedStory)}
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                  <Typography variant="body1">{selectedStory.companyName}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Buyer Name</Typography>
                  <Typography variant="body1">{selectedStory.buyerName}</Typography>
                </Grid2>
                {selectedStory.buyerTitle && (
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Buyer Title</Typography>
                    <Typography variant="body1">{selectedStory.buyerTitle}</Typography>
                  </Grid2>
                )}
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Exporter Name</Typography>
                  <Typography variant="body1">{selectedStory.exporterName}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Product Category</Typography>
                  <Typography variant="body1">{selectedStory.productCategory}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Export Destination</Typography>
                  <Typography variant="body1">{selectedStory.exportDestination}</Typography>
                </Grid2>
                {selectedStory.exportValue && (
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Export Value</Typography>
                    <Typography variant="body1">{selectedStory.exportValue}</Typography>
                  </Grid2>
                )}
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Success Story</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {selectedStory.story}
                  </Typography>
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    Submitted {formatDistanceToNow(new Date(selectedStory.createdAt), { addSuffix: true })}
                  </Typography>
                </Grid2>
              </Grid2>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedStory) handleEdit(selectedStory);
              setDetailsOpen(false);
            }}
          >
            Edit Story
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Delete Success Story</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedStory?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
