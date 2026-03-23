'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Rating as MuiRating, IconButton, Tooltip, InputAdornment, TextField, Paper, Chip, useMediaQuery, useTheme } from '@mui/material';
import { AdminTableWrapper, TableColumn, PaginationModel, SortModel } from '@/components/admin/AdminTableWrapper';
import { Delete, Visibility, Search, Download, FilterList } from '@mui/icons-material';

export default function RatingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const formatDate = (val: any) => {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  };

  const columns: TableColumn[] = [
    {
      field: 'business',
      headerName: 'Business Name',
      flex: 1,
      minWidth: isMobile ? 150 : 200,
      renderCell: (params: any) => params.row?.business?.name || 'N/A',
    },
    {
      field: 'user',
      headerName: 'Reviewer Name',
      width: 180,
      renderCell: (params: any) => {
        const u = params.row?.user;
        if (!u) return 'N/A';
        return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A';
      },
    },
    {
      field: 'rating',
      headerName: 'Rating Score',
      width: 150,
      renderCell: (params: any) => <MuiRating value={params.row.rating as number} readOnly size="small" />,
    },
    { field: 'review', headerName: 'Review Text', flex: 1, minWidth: 300 },
    {
      field: 'createdAt',
      headerName: 'Review Date',
      width: 150,
      renderCell: (params: any) => formatDate(params.row.createdAt),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary"><Visibility sx={{ fontSize: 18 }} /></IconButton>
          </Tooltip>
          <Tooltip title="Delete Review">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row?.id)}>
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ].filter((col) => {
    if (isMobile && ['user', 'createdAt'].includes(col.field)) return false;
    if (isTablet && !isMobile && ['review'].includes(col.field)) return false;
    return true;
  });

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
      const response = await fetch(`/api/admin/ratings?${params}`);
      const result = await response.json();
      setData(result);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [paginationModel, sortModel, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rating?')) return;
    try {
      await fetch(`/api/admin/ratings?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch { /* silent */ }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedRows.length} ratings?`)) return;
    try {
      await fetch('/api/admin/ratings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedRows }),
      });
      setSelectedRows([]);
      fetchData();
    } catch { /* silent */ }
  };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>Ratings & Reviews</Typography>
        <Typography variant="body2" color="text.secondary">Monitor and manage customer ratings and reviews</Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search ratings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Download CSV">
              <IconButton size="small" onClick={() => window.open(`/api/admin/ratings/export?search=${searchQuery}`, '_blank')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filters">
              <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <FilterList fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {selectedRows.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Chip label={`${selectedRows.length} selected`} size="small" color="primary" variant="outlined" />
            <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} startIcon={<Delete />}>Delete</Button>
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
