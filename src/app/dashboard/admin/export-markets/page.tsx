'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Public as GlobalIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { useToast } from '@/hooks/use-toast';

interface ExportMarket {
  id: string;
  name: string;
  region: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  region: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const regions = [
  'Africa',
  'Asia',
  'Europe',
  'Middle East',
  'North America',
  'South America',
  'Oceania',
  'Caribbean',
];

export default function ExportMarketsManagementPage() {
  const { toast } = useToast();
  const [markets, setMarkets] = useState<ExportMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    region: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchMarkets();
  }, [searchQuery]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/export-markets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMarkets(data.markets || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch export markets',
          variant: 'destructive',
        });
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to fetch export markets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (market?: ExportMarket) => {
    if (market) {
      setEditingId(market.id);
      setFormData({
        name: market.name,
        region: market.region,
        description: market.description || '',
        isActive: market.isActive,
        sortOrder: market.sortOrder,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        region: '',
        description: '',
        isActive: true,
        sortOrder: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      name: '',
      region: '',
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.region) {
      toast({
        title: 'Validation Error',
        description: 'Market name and region are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const url = editingId
        ? `/api/admin/export-markets/${editingId}`
        : '/api/admin/export-markets';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Export market ${editingId ? 'updated' : 'created'} successfully`,
        });
        handleCloseDialog();
        fetchMarkets();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save export market',
          variant: 'destructive',
        });
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save export market',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this export market?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/export-markets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Export market deleted successfully',
        });
        fetchMarkets();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete export market',
          variant: 'destructive',
        });
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete export market',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    window.open(`/api/admin/export-markets/export?search=${searchQuery}`, '_blank');
  };

  const columns: TableColumn[] = [
    {
      field: 'name',
      headerName: 'Market/Country',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'region',
      headerName: 'Region',
      width: 150,
      renderCell: (params: any) => (
        <Chip label={params.row.region} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 300,
    },
    {
      field: 'sortOrder',
      headerName: 'Order',
      width: 100,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => (
        <Chip label={params.row.isActive ? 'Active' : 'Inactive'} color={params.row.isActive ? 'success' : 'default'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const stats = {
    total: markets.length,
    active: markets.filter((m) => m.isActive).length,
    inactive: markets.filter((m) => !m.isActive).length,
    byRegion: markets.reduce((acc, m) => {
      acc[m.region] = (acc[m.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Export Markets Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Manage export destinations and markets for exporters to select
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleExport}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            title="Export to Excel"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Market
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Markets
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Regions Covered
              </Typography>
              <Typography variant="h4" color="primary.main">
                {Object.keys(stats.byRegion).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search export markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Tip:</strong> Add countries and regions where Kenyan exporters can sell their products. These will appear as multiselect options in business profiles.
          </Alert>

          <AdminTableWrapper
            rows={markets}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            pageSizeOptions={[10, 25, 50, 100]}
            rowCount={markets.length}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Export Market' : 'Add New Export Market'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Market/Country Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              helperText="e.g., United States, Germany, China, East Africa"
            />
            <FormControl fullWidth required>
              <InputLabel>Region</InputLabel>
              <Select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                label="Region"
              >
                {regions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              helperText="Optional details about this market"
            />
            <TextField
              label="Display Order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Lower numbers appear first"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
