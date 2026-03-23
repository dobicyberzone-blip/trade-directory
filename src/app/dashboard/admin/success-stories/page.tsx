'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip, 
  InputAdornment, 
  TextField, 
  Paper, 
  useMediaQuery, 
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge
} from '@mui/material';

import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { CheckCircle, Star, StarBorder, Search, Download, FilterList, Close } from '@mui/icons-material';

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
  
  // Filter states
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [tempApprovalFilter, setTempApprovalFilter] = useState<string>('all');
  const [tempFeaturedFilter, setTempFeaturedFilter] = useState<string>('all');

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
        <Chip 
          label={params.row.isApproved ? 'Approved' : 'Pending'} 
          color={params.row.isApproved ? 'success' : 'warning'} 
          size="small" 
        />
      ),
    },
    {
      field: 'isFeatured',
      headerName: 'Featured Status',
      width: 140,
      renderCell: (params: any) => (
        <Chip 
          label={params.row.isFeatured ? 'Featured' : 'Regular'} 
          color={params.row.isFeatured ? 'primary' : 'default'} 
          size="small" 
        />
      ),
    },
    {
      field: 'homepage',
      headerName: 'Homepage',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const showOnHomepage = params.row.isApproved && params.row.isFeatured;
        return (
          <Chip 
            label={showOnHomepage ? 'Visible' : 'Hidden'} 
            color={showOnHomepage ? 'success' : 'default'} 
            size="small"
            variant={showOnHomepage ? 'filled' : 'outlined'}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {!row.isApproved && (
              <Tooltip title="Approve Story">
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={() => handleApprove(row.id)}
                >
                  <CheckCircle sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={row.isFeatured ? 'Remove from Featured' : 'Add to Featured'}>
              <IconButton 
                size="small" 
                color="warning" 
                onClick={() => handleToggleFeature(row.id, row.isFeatured)}
              >
                {row.isFeatured ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

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

      // Add filter params
      if (approvalFilter !== 'all') {
        params.append('approved', approvalFilter);
      }
      if (featuredFilter !== 'all') {
        params.append('featured', featuredFilter);
      }

      const response = await fetch(`/api/admin/success-stories-admin?${params}`);
      const result = await response.json();
      
      setData(result);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, searchQuery, approvalFilter, featuredFilter]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/admin/success-stories-admin/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id,
          action: 'approve',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve');
      }
      
      const result = await response.json();
      
      // Update local state optimistically
      setData((prevData: any) => ({
        ...prevData,
        data: prevData.data.map((item: any) => 
          item.id === id ? { ...item, isApproved: true } : item
        )
      }));
      
      fetchData();
    } catch (error) {

      // Refresh on error to ensure consistency
      fetchData();
    }
  };

  const handleToggleFeature = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/success-stories-admin/feature', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          featured: !currentStatus 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update featured status');
      }
      
      const result = await response.json();
      
      // Update local state optimistically
      setData((prevData: any) => ({
        ...prevData,
        data: prevData.data.map((item: any) => 
          item.id === id ? { ...item, isFeatured: !currentStatus } : item
        )
      }));
    } catch (error) {

      // Refresh on error to ensure consistency
      fetchData();
    }
  };

  const handleBulkApprove = async () => {
    const ids = selectedRows;
    try {
      await Promise.all(ids.map(id => handleApprove(id)));
      setSelectedRows([]);
      fetchData();
    } catch (error) {

    }
  };

  const handleExport = () => {
    window.open(`/api/admin/success-stories-admin/export?search=${searchQuery}`, '_blank');
  };

  const handleOpenFilters = () => {
    setTempApprovalFilter(approvalFilter);
    setTempFeaturedFilter(featuredFilter);
    setFilterDialogOpen(true);
  };

  const handleApplyFilters = () => {
    setApprovalFilter(tempApprovalFilter);
    setFeaturedFilter(tempFeaturedFilter);
    setFilterDialogOpen(false);
    setPaginationModel({ ...paginationModel, page: 0 }); // Reset to first page
  };

  const handleClearFilters = () => {
    setTempApprovalFilter('all');
    setTempFeaturedFilter('all');
    setApprovalFilter('all');
    setFeaturedFilter('all');
    setFilterDialogOpen(false);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const activeFiltersCount = 
    (approvalFilter !== 'all' ? 1 : 0) + 
    (featuredFilter !== 'all' ? 1 : 0);

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

      {/* Info Box */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'info.light', 
          border: '1px solid', 
          borderColor: 'info.main',
          borderRadius: 1
        }}
      >
        <Typography variant="body2" color="info.dark" fontWeight={600} gutterBottom>
          📌 How Success Stories Work:
        </Typography>
        <Typography variant="body2" color="info.dark">
          • <strong>Approve</strong> stories to make them visible to the public<br />
          • <strong>Feature</strong> approved stories to display them on the homepage carousel<br />
          • Only stories that are both <strong>Approved</strong> and <strong>Featured</strong> will appear on the homepage
        </Typography>
      </Paper>

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
                onClick={handleOpenFilters}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <Badge badgeContent={activeFiltersCount} color="primary">
                  <FilterList fontSize="small" />
                </Badge>
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

      {/* Advanced Filters Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            top: 80,
            m: 0,
            zIndex: 9999,
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            zIndex: 9998,
          },
          zIndex: 9998,
        }}
        slotProps={{
          backdrop: {
            sx: {
              zIndex: 9998,
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            Advanced Filters
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setFilterDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Approval Status Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Approval Status</InputLabel>
              <Select
                value={tempApprovalFilter}
                onChange={(e) => setTempApprovalFilter(e.target.value)}
                label="Approval Status"
                MenuProps={{
                  sx: {
                    zIndex: 10000,
                  },
                  disablePortal: false,
                }}
              >
                <MenuItem value="all">All Stories</MenuItem>
                <MenuItem value="true">Approved Only</MenuItem>
                <MenuItem value="false">Pending Only</MenuItem>
              </Select>
            </FormControl>

            {/* Featured Status Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Featured Status</InputLabel>
              <Select
                value={tempFeaturedFilter}
                onChange={(e) => setTempFeaturedFilter(e.target.value)}
                label="Featured Status"
                MenuProps={{
                  sx: {
                    zIndex: 10000,
                  },
                  disablePortal: false,
                }}
              >
                <MenuItem value="all">All Stories</MenuItem>
                <MenuItem value="true">Featured Only</MenuItem>
                <MenuItem value="false">Regular Only</MenuItem>
              </Select>
            </FormControl>

            {/* Active Filters Summary */}
            {(tempApprovalFilter !== 'all' || tempFeaturedFilter !== 'all') && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.light', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.main'
              }}>
                <Typography variant="caption" fontWeight={600} color="primary.main" display="block" mb={1}>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tempApprovalFilter !== 'all' && (
                    <Chip 
                      label={`Approval: ${tempApprovalFilter === 'true' ? 'Approved' : 'Pending'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {tempFeaturedFilter !== 'all' && (
                    <Chip 
                      label={`Featured: ${tempFeaturedFilter === 'true' ? 'Yes' : 'No'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button 
            onClick={handleClearFilters}
            variant="outlined"
            color="inherit"
            size="small"
          >
            Clear All
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button 
            onClick={() => setFilterDialogOpen(false)}
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyFilters}
            variant="contained"
            size="small"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
