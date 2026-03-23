'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid2 as Grid,
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  Visibility,
  CheckCircle,
  Cancel,
  Star,
  StarBorder,
} from '@mui/icons-material';
import {
  AdminTableWrapper,
  TableColumn,
  PaginationModel,
  SortModel,
} from '@/components/admin/AdminTableWrapper';

interface Business {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  county: string;
  sector: string;
  verificationStatus: string;
  featured: boolean;
  featuredAt: string | null;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  rating: number | null;
  createdAt: string;
}

export default function BusinessFeaturingTab() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<{ data: Business[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewBusiness, setViewBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [featureConfirmOpen, setFeatureConfirmOpen] = useState(false);
  const [featureTarget, setFeatureTarget] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const [bulkFeatureConfirmOpen, setBulkFeatureConfirmOpen] = useState(false);
  const [bulkFeatureAction, setBulkFeatureAction] = useState<boolean>(true);

  const columns: TableColumn[] = [
    {
      field: 'name',
      headerName: 'Business Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'contactEmail',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'sector',
      headerName: 'Sector',
      width: 150,
    },
    {
      field: 'county',
      headerName: 'County',
      width: 130,
    },
    {
      field: 'featured',
      headerName: 'Featured',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.featured ? 'Featured' : 'Not Featured'}
          color={params.row.featured ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          ⭐ {params.row.rating?.toFixed(1) || 'N/A'}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleView(params.row)}>
              <Visibility sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {!params.row.featured ? (
            <Tooltip title="Feature Business">
              <IconButton size="small" color="success" onClick={() => {
                setFeatureTarget({ id: params.row.id, name: params.row.name, currentStatus: false });
                setFeatureConfirmOpen(true);
              }}>
                <CheckCircle sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Unfeature Business">
              <IconButton size="small" color="error" onClick={() => {
                setFeatureTarget({ id: params.row.id, name: params.row.name, currentStatus: true });
                setFeatureConfirmOpen(true);
              }}>
                <Cancel sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
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
        status: 'APPROVED',
      });

      const token = getAuthToken();
      const response = await fetch(`/api/admin/businesses?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const result = await response.json();
      setData({ data: result.businesses || [], total: result.total || 0 });
    } catch (error) {

      setError('Failed to load businesses');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, searchQuery, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (business: Business) => {
    setViewBusiness(business);
    setViewDialogOpen(true);
  };

  const handleFeature = async (id: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/businesses/feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, featured: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to feature business');
      }

      setSuccess('Business featured successfully');
      fetchData();
    } catch (error) {
      setError('Failed to feature business');
    }
  };

  const handleUnfeature = async (id: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/businesses/feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, featured: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to unfeature business');
      }

      setSuccess('Business unfeatured successfully');
      fetchData();
    } catch (error) {
      setError('Failed to unfeature business');
    }
  };

  const handleBulkFeature = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/businesses/bulk-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedRows, featured: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk feature');
      }

      setSuccess(`${selectedRows.length} businesses featured successfully`);
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      setError('Failed to bulk feature');
    }
  };

  const handleBulkUnfeature = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/businesses/bulk-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedRows, featured: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk unfeature');
      }

      setSuccess(`${selectedRows.length} businesses unfeatured successfully`);
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      setError('Failed to bulk unfeature');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({ search: searchQuery, status: 'APPROVED' });
    const token = getAuthToken();
    window.open(`/api/admin/businesses/export?${params}&token=${token}`, '_blank');
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
            placeholder="Search businesses..."
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

        {selectedRows.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedRows.length} selected
            </Typography>
            <Button size="small" variant="contained" color="success" onClick={() => { setBulkFeatureAction(true); setBulkFeatureConfirmOpen(true); }} startIcon={<CheckCircle />}>
              Feature
            </Button>
            <Button size="small" variant="contained" color="error" onClick={() => { setBulkFeatureAction(false); setBulkFeatureConfirmOpen(true); }} startIcon={<Cancel />}>
              Unfeature
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
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Business Details</DialogTitle>
        <DialogContent dividers>
          {viewBusiness && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Business Name
                </Typography>
                <Typography variant="body1">{viewBusiness.name}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sector
                </Typography>
                <Typography variant="body1">{viewBusiness.sector}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{viewBusiness.contactEmail}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{viewBusiness.contactPhone || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">{viewBusiness.location}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  County
                </Typography>
                <Typography variant="body1">{viewBusiness.county}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Featured
                </Typography>
                <Chip label={viewBusiness.featured ? 'Yes' : 'No'} color={viewBusiness.featured ? 'primary' : 'default'} size="small" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Rating
                </Typography>
                <Typography variant="body1">⭐ {viewBusiness.rating?.toFixed(1) || 'N/A'}</Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Owner
                </Typography>
                <Typography variant="body1">
                  {viewBusiness.owner.firstName} {viewBusiness.owner.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {viewBusiness.owner.email}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {viewBusiness && (
            <>
              {!viewBusiness.featured ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setFeatureTarget({ id: viewBusiness.id, name: viewBusiness.name, currentStatus: false });
                    setFeatureConfirmOpen(true);
                  }}
                  startIcon={<CheckCircle />}
                >
                  Feature Business
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setFeatureTarget({ id: viewBusiness.id, name: viewBusiness.name, currentStatus: true });
                    setFeatureConfirmOpen(true);
                  }}
                  startIcon={<Cancel />}
                >
                  Unfeature Business
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
      {/* Feature Confirmation Dialog */}
      <Dialog
        open={featureConfirmOpen}
        onClose={() => setFeatureConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 9999, '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {featureTarget?.currentStatus ? <StarBorder color="warning" /> : <Star color="warning" />}
          {featureTarget?.currentStatus ? 'Unfeature Business' : 'Feature Business'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {featureTarget?.currentStatus
              ? `Are you sure you want to remove "${featureTarget?.name}" from featured businesses? It will no longer appear in the featured section on the homepage.`
              : `Are you sure you want to feature "${featureTarget?.name}"? It will be highlighted in the featured section on the homepage.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeatureConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={featureTarget?.currentStatus ? 'error' : 'success'}
            onClick={async () => {
              if (!featureTarget) return;
              setFeatureConfirmOpen(false);
              if (featureTarget.currentStatus) {
                await handleUnfeature(featureTarget.id);
              } else {
                await handleFeature(featureTarget.id);
              }
              setFeatureTarget(null);
            }}
          >
            {featureTarget?.currentStatus ? 'Yes, Unfeature' : 'Yes, Feature'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Feature Confirmation Dialog */}
      <Dialog
        open={bulkFeatureConfirmOpen}
        onClose={() => setBulkFeatureConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 9999, '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {bulkFeatureAction ? <Star color="warning" /> : <StarBorder color="warning" />}
          {bulkFeatureAction ? 'Feature Businesses' : 'Unfeature Businesses'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {bulkFeatureAction
              ? `Are you sure you want to feature ${selectedRows.length} selected business${selectedRows.length !== 1 ? 'es' : ''}?`
              : `Are you sure you want to unfeature ${selectedRows.length} selected business${selectedRows.length !== 1 ? 'es' : ''}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkFeatureConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={bulkFeatureAction ? 'success' : 'error'}
            onClick={async () => {
              setBulkFeatureConfirmOpen(false);
              if (bulkFeatureAction) {
                await handleBulkFeature();
              } else {
                await handleBulkUnfeature();
              }
            }}
          >
            {bulkFeatureAction ? 'Yes, Feature' : 'Yes, Unfeature'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
