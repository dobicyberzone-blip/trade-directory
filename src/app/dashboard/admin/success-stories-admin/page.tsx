'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip, InputAdornment, TextField, Paper, useMediaQuery, useTheme } from '@mui/material';

import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { CheckCircle, Star, StarBorder, Visibility, Search, Download, PersonAdd, FilterList } from '@mui/icons-material';

export default function SuccessStoriesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const columns: TableColumn[] = [
    { 
      field: 'title', 
      headerName: 'Story Title', 
      flex: 1, 
      minWidth: isMobile ? 150 : 250,
    },
    { 
      field: 'companyName', 
      headerName: 'Company Name', 
      width: 180,
    },
    { 
      field: 'exporterName', 
      headerName: 'Exporter Name', 
      width: 180,
    },
    { 
      field: 'productCategory', 
      headerName: 'Product Category', 
      width: 150,
    },
    { 
      field: 'exportDestination', 
      headerName: 'Export Destination', 
      width: 150,
    },
    {
      field: 'isApproved',
      headerName: 'Approval Status',
      width: 140,
      renderCell: (params: any) => (
        <Chip label={params.row.isApproved ? 'Approved' : 'Pending'} color={params.row.isApproved ? 'success' : 'warning'} size="small" />
      ),
    },
    {
      field: 'isFeatured',
      headerName: 'Featured Status',
      width: 140,
      renderCell: (params: any) => (
        <Chip label={params.row.isFeatured ? 'Featured' : 'Regular'} color={params.row.isFeatured ? 'primary' : 'default'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Story">
            <IconButton size="small" color="primary">
              <Visibility sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {!params.row?.isApproved && (
            <Tooltip title="Approve Story">
              <IconButton size="small" color="success" onClick={() => handleApprove(params.row?.id)}>
                <CheckCircle sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={params.row?.isFeatured ? 'Remove from Featured' : 'Add to Featured'}>
            <IconButton size="small" color="warning" onClick={() => handleToggleFeature(params.row?.id, params.row?.isFeatured)}>
              {params.row?.isFeatured ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: paginationModel.page.toString(),
        pageSize: paginationModel.pageSize.toString(),
        sortField: sortModel[0]?.field || 'createdAt',
        sortOrder: sortModel[0]?.sort || 'desc',
        search: searchQuery,
      });

      const response = await fetch(`/api/admin/success-stories-admin?${params}`, {
        headers: authHeader(),
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to load success stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, searchQuery]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/admin/success-stories-admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ id, isApproved: true }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed: ${response.status}`);
      }
      fetchData();
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleToggleFeature = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/success-stories-admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ id, isFeatured: !currentStatus }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed: ${response.status}`);
      }
      fetchData();
    } catch (error) {
      console.error('Toggle feature failed:', error);
    }
  };

  const handleBulkApprove = async () => {
    const ids = selectedRows;
    try {
      const response = await fetch('/api/admin/success-stories-admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action: 'approve', ids }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed: ${response.status}`);
      }
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      console.error('Bulk approve failed:', error);
    }
  };

  const handleExport = () => {
    window.open(`/api/admin/success-stories-admin/export?search=${searchQuery}`, '_blank');
  };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
          Success Stories
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and feature export success stories
        </Typography>
      </Box>

      {/* Search and Actions Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Field */}
          <TextField
            placeholder="Search success stories..."
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

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Download CSV">
              <IconButton 
                size="small" 
                onClick={handleExport}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filters">
              <IconButton 
                size="small"
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <FilterList fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Bulk Actions */}
        {(selectedRows).length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Chip 
              label={`${(selectedRows).length} selected`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Button 
              size="small" 
              variant="contained" 
              color="success" 
              onClick={handleBulkApprove}
              startIcon={<CheckCircle />}
            >
              Approve
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
    </Box>
  );
}
