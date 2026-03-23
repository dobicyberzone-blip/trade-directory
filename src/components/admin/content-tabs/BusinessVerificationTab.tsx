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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  Visibility,
  CheckCircle,
  Cancel,
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
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export default function BusinessVerificationTab() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [data, setData] = useState<{ data: Business[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewBusiness, setViewBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      field: 'verificationStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
          APPROVED: 'success',
          PENDING: 'warning',
          REJECTED: 'error',
        };
        return (
          <Chip
            label={params.row.verificationStatus}
            color={colorMap[params.row.verificationStatus] || 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
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
          {params.row.verificationStatus === 'PENDING' && (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => handleVerify(params.row.id, 'APPROVED')}>
                  <CheckCircle sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => handleVerify(params.row.id, 'REJECTED')}>
                  <Cancel sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
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
      });

      if (statusFilter) params.append('status', statusFilter);

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
  }, [paginationModel, sortModel, searchQuery, statusFilter, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (business: Business) => {
    setViewBusiness(business);
    setViewDialogOpen(true);
  };

  const handleVerify = async (id: string, status: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/businesses/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify business');
      }

      setSuccess(`Business ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      setError('Failed to verify business');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({ search: searchQuery });
    if (statusFilter) params.append('status', statusFilter);
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
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
                  Status
                </Typography>
                <Chip label={viewBusiness.verificationStatus} color="success" size="small" />
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
          {viewBusiness && viewBusiness.verificationStatus === 'PENDING' && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleVerify(viewBusiness.id, 'APPROVED');
                  setViewDialogOpen(false);
                }}
                startIcon={<CheckCircle />}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  handleVerify(viewBusiness.id, 'REJECTED');
                  setViewDialogOpen(false);
                }}
                startIcon={<Cancel />}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
