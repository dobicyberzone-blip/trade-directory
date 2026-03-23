'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip, TextField, InputAdornment, Paper, useMediaQuery, useTheme } from '@mui/material';

import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { ResponsiveDialog } from '@/components/admin/ResponsiveDialog';
import { Add, Delete, ToggleOn, ToggleOff, Search, Download, PersonAdd, FilterList } from '@mui/icons-material';

export default function NewsletterPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'subscribedDate', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const columns: TableColumn[] = [
    { 
      field: 'email', 
      headerName: 'Email Address', 
      flex: 1, 
      minWidth: isMobile ? 200 : 300,
    },
    {
      field: 'subscribedDate',
      headerName: 'Subscription Date',
      width: 180,
      renderCell: (params: any) => {
        const date = params.row.subscribedDate || params.value;
        if (!date) return '—';
        try {
          return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        } catch {
          return '—';
        }
      },
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => (
        <Chip label={params.row.active ? 'Active' : 'Inactive'} color={params.row.active ? 'success' : 'default'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={params.row?.active ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              color={params.row?.active ? 'warning' : 'success'}
              onClick={() => handleToggleActive(params.row?.id, params.row?.active)}
            >
              {params.row?.active ? <ToggleOff sx={{ fontSize: 18 }} /> : <ToggleOn sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row?.id)}>
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: paginationModel.page.toString(),
        pageSize: paginationModel.pageSize.toString(),
        sortField: sortModel[0]?.field || 'subscribedDate',
        sortOrder: sortModel[0]?.sort || 'desc',
        search: searchQuery,
      });

      const response = await fetch(`/api/admin/newsletter?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, searchQuery]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/admin/newsletter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentStatus }),
      });
      fetchData();
    } catch (error) {

    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscriber?')) return;
    try {
      await fetch(`/api/admin/newsletter?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {

    }
  };

  const handleAddSubscriber = async () => {
    try {
      await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      setDialogOpen(false);
      setNewEmail('');
      fetchData();
    } catch (error) {

    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedRows;
    if (!confirm(`Delete ${ids.length} subscribers?`)) return;
    try {
      await fetch('/api/admin/newsletter/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      });
      setSelectedRows([]);
      fetchData();
    } catch (error) {

    }
  };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
          Newsletter Subscribers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage newsletter subscriptions and email campaigns
        </Typography>
      </Box>

      {/* Search and Actions Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Field */}
          <TextField
            placeholder="Search subscribers..."
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
                onClick={() => window.open('/api/admin/newsletter/export', '_blank')}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Add Subscriber">
              <IconButton 
                size="small"
                onClick={() => setDialogOpen(true)}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <PersonAdd fontSize="small" />
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
              color="error" 
              onClick={handleBulkDelete}
              startIcon={<Delete />}
            >
              Delete
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

      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Newsletter Subscriber"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubscriber} variant="contained">Add</Button>
          </>
        }
      >
        <TextField
          label="Email Address"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          fullWidth
          required
          autoFocus
        />
      </ResponsiveDialog>
    </Box>
  );
}
