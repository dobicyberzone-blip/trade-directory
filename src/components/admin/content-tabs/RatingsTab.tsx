'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Rating as MuiRating,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  Delete,
  Visibility,
} from '@mui/icons-material';
import {
  AdminTableWrapper,
  TableColumn,
  PaginationModel,
  SortModel,
} from '@/components/admin/AdminTableWrapper';

interface Rating {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  business: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function RatingsTab() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<{ data: Rating[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewRating, setViewRating] = useState<Rating | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState<Rating | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const columns: TableColumn[] = [
    {
      field: 'business',
      headerName: 'Business Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => params.row.business?.name || 'N/A',
    },
    {
      field: 'user',
      headerName: 'Reviewer',
      width: 180,
      renderCell: (params) => {
        const user = params.row.user;
        return user ? `${user.firstName} ${user.lastName}` : 'N/A';
      },
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 150,
      renderCell: (params) => <MuiRating value={params.row.rating} readOnly size="small" />,
    },
    {
      field: 'review',
      headerName: 'Review',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => new Date(params.row.createdAt).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleView(params.row)}>
              <Visibility sx={{ fontSize: 18 }} />
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
        page: paginationModel.page.toString(),
        pageSize: paginationModel.pageSize.toString(),
        sortField,
        sortOrder,
        search: searchQuery,
      });

      const token = getAuthToken();
      const response = await fetch(`/api/admin/ratings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ratings');
      }

      const result = await response.json();
      setData({ data: result.data || [], total: result.total || 0 });
    } catch (error) {

      setError('Failed to load ratings');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, searchQuery, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (rating: Rating) => {
    setViewRating(rating);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (rating: Rating) => {
    setRatingToDelete(rating);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ratingToDelete) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/ratings?id=${ratingToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete rating');
      }

      setSuccess('Rating deleted successfully');
      fetchData();
    } catch (error) {
      setError('Failed to delete rating');
    }
    setDeleteDialogOpen(false);
    setRatingToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Delete ${selectedRows.length} ratings?`)) return;

    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/ratings/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', ids: selectedRows }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete ratings');
      }

      setSuccess(`${selectedRows.length} ratings deleted successfully`);
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      setError('Failed to delete ratings');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({ search: searchQuery });
    const token = getAuthToken();
    window.open(`/api/admin/ratings/export?${params}&token=${token}`, '_blank');
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search ratings..."
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

            <Tooltip title="Download CSV">
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

        {selectedRows.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedRows.length} selected
            </Typography>
            <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} startIcon={<Delete />}>
              Delete Selected
            </Button>
          </Box>
        )}
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
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth
      sx={{
        "& .MuiDialog-paper": {
          m: { xs: 2, sm: 3 },
          maxHeight: { xs: "calc(100% - 32px)", sm: "calc(100% - 64px)" },
          zIndex: 9999,
        },
        zIndex: 9998,
      }}>
        <DialogTitle>Rating Details</DialogTitle>
        <DialogContent dividers>
          {viewRating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Business
                </Typography>
                <Typography variant="body1">{viewRating.business?.name || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Reviewer
                </Typography>
                <Typography variant="body1">
                  {viewRating.user ? `${viewRating.user.firstName} ${viewRating.user.lastName}` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {viewRating.user?.email}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Rating
                </Typography>
                <MuiRating value={viewRating.rating} readOnly />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Review
                </Typography>
                <Typography variant="body1">{viewRating.review}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">{new Date(viewRating.createdAt).toLocaleString()}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Rating</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this rating? This action cannot be undone.</Typography>
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

