'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Paper,
  Grid2 as Grid,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  Visibility,
  CheckCircle,
  Cancel,
  Delete,
  Star,
} from '@mui/icons-material';
import {
  AdminTableWrapper,
  TableColumn,
  PaginationModel,
  SortModel,
} from '@/components/admin/AdminTableWrapper';

interface SuccessStory {
  id: string;
  title: string;
  story: string;
  companyName: string;
  buyerName: string;
  buyerTitle: string | null;
  exporterName: string;
  productCategory: string;
  exportValue: string | null;
  exportDestination: string;
  imageUrl: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SuccessStoriesTab() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvedFilter, setApprovedFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [data, setData] = useState<{ data: SuccessStory[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewStory, setViewStory] = useState<SuccessStory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<SuccessStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const columns: TableColumn[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'companyName',
      headerName: 'Company',
      width: 180,
    },
    {
      field: 'buyerName',
      headerName: 'Buyer',
      width: 150,
    },
    {
      field: 'exporterName',
      headerName: 'Exporter',
      width: 150,
    },
    {
      field: 'productCategory',
      headerName: 'Product',
      width: 150,
    },
    {
      field: 'exportDestination',
      headerName: 'Destination',
      width: 130,
    },
    {
      field: 'isApproved',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.isApproved ? 'Approved' : 'Pending'}
          color={params.row.isApproved ? 'success' : 'warning'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'isFeatured',
      headerName: 'Featured',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.isFeatured ? 'Featured' : 'Not Featured'}
          color={params.row.isFeatured ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleView(params.row)}>
              <Visibility sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isApproved ? 'Unapprove' : 'Approve'}>
            <IconButton size="small" color={params.row.isApproved ? 'warning' : 'success'} onClick={() => handleApprove(params.row)}>
              {params.row.isApproved ? <Cancel sx={{ fontSize: 18 }} /> : <CheckCircle sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isFeatured ? 'Unfeature' : 'Feature'}>
            <IconButton size="small" color="info" onClick={() => handleFeature(params.row)}>
              <Star sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row)}>
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sortField = sortModel[0]?.field || 'createdAt';
      const sortOrder = sortModel[0]?.sort || 'desc';

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        sortBy: sortField,
        order: sortOrder,
        search: searchQuery,
      });

      if (approvedFilter !== '') params.append('approved', approvedFilter);
      if (featuredFilter !== '') params.append('featured', featuredFilter);

      const token = getAuthToken();
      const response = await fetch(`/api/admin/success-stories?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch success stories');
      }

      const result = await response.json();
      setData({ data: result.stories || [], total: result.pagination?.total || 0 });
    } catch (error) {

      setError('Failed to load success stories');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, searchQuery, approvedFilter, featuredFilter, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (story: SuccessStory) => {
    setViewStory(story);
    setViewDialogOpen(true);
  };

  const handleApprove = async (story: SuccessStory) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/success-stories', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: story.id,
          isApproved: !story.isApproved,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update story');
      }

      setSuccess(`Story ${story.isApproved ? 'unapproved' : 'approved'} successfully`);
      fetchData();
    } catch (error) {
      setError('Failed to update story');
    }
  };

  const handleFeature = async (story: SuccessStory) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/success-stories', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: story.id,
          isFeatured: !story.isFeatured,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update story');
      }

      setSuccess(`Story ${story.isFeatured ? 'removed from' : 'added to'} featured successfully`);
      fetchData();
    } catch (error) {
      setError('Failed to update story');
    }
  };

  const handleDeleteClick = (story: SuccessStory) => {
    setStoryToDelete(story);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/success-stories?id=${storyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      setSuccess('Story deleted successfully');
      fetchData();
    } catch (error) {
      setError('Failed to delete story');
    }
    setDeleteDialogOpen(false);
    setStoryToDelete(null);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ search: searchQuery });
    if (approvedFilter !== '') params.append('approved', approvedFilter);
    if (featuredFilter !== '') params.append('featured', featuredFilter);
    const token = getAuthToken();
    window.open(`/api/admin/success-stories/export?${params}&token=${token}`, '_blank');
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search and Actions Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={approvedFilter}
              label="Status"
              onChange={(e) => setApprovedFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Approved</MenuItem>
              <MenuItem value="false">Pending</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Featured</InputLabel>
            <Select
              value={featuredFilter}
              label="Featured"
              onChange={(e) => setFeaturedFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Featured</MenuItem>
              <MenuItem value="false">Not Featured</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={fetchData}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download Excel">
              <IconButton
                size="small"
                onClick={handleExport}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <AdminTableWrapper
        rows={data.data}
        columns={columns}
        loading={loading}
        rowCount={data.total}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100]}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        checkboxSelection
        onRowSelectionModelChange={setSelectedRows}
        rowSelectionModel={selectedRows}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Success Story Details</DialogTitle>
        <DialogContent dividers>
          {viewStory && (
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="h6" fontWeight="bold">
                  {viewStory.title}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Company Name
                </Typography>
                <Typography variant="body1">{viewStory.companyName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Buyer Name
                </Typography>
                <Typography variant="body1">
                  {viewStory.buyerName} {viewStory.buyerTitle && `(${viewStory.buyerTitle})`}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Exporter Name
                </Typography>
                <Typography variant="body1">{viewStory.exporterName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Product Category
                </Typography>
                <Typography variant="body1">{viewStory.productCategory}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Export Destination
                </Typography>
                <Typography variant="body1">{viewStory.exportDestination}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Export Value
                </Typography>
                <Typography variant="body1">{viewStory.exportValue || 'Not specified'}</Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Story
                </Typography>
                <Typography variant="body1">{viewStory.story}</Typography>
              </Grid>
              <Grid size={12}>
                <FormControlLabel control={<Switch checked={viewStory.isApproved} disabled />} label="Approved" />
                <FormControlLabel control={<Switch checked={viewStory.isFeatured} disabled />} label="Featured on Homepage" />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Success Story</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{storyToDelete?.title}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
