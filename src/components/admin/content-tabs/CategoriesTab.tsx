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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Download,
  Refresh,
  Edit,
  Delete,
  Add,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import {
  AdminTableWrapper,
  TableColumn,
  PaginationModel,
  SortModel,
} from '@/components/admin/AdminTableWrapper';

interface Category {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  isActive: boolean;
  order: number;
  _count?: {
    subcategories: number;
  };
}

export default function CategoriesTab() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'order', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<{ data: Category[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sector: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const columns: TableColumn[] = [
    {
      field: 'order',
      headerName: 'Order',
      width: 80,
    },
    {
      field: 'name',
      headerName: 'Category Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => params.row.description || 'N/A',
    },
    {
      field: 'sector',
      headerName: 'Sector',
      width: 150,
      renderCell: (params) => params.row.sector || 'N/A',
    },
    {
      field: 'subcategories',
      headerName: 'Subcategories',
      width: 130,
      renderCell: (params) => params.row._count?.subcategories || 0,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? 'Active' : 'Inactive'}
          color={params.row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Move Up">
            <IconButton size="small" onClick={() => handleReorder(params.row.id, 'up')}>
              <ArrowUpward sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move Down">
            <IconButton size="small" onClick={() => handleReorder(params.row.id, 'down')}>
              <ArrowDownward sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
              <Edit sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
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
      const token = getAuthToken();
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();
      const categories = result.categories || [];
      
      // Filter by search query
      const filtered = searchQuery
        ? categories.filter((cat: Category) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : categories;

      setData({ data: filtered, total: filtered.length });
    } catch (error) {

      setError('Failed to load categories');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', sector: '' });
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      sector: category.sector || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const token = getAuthToken();
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save category');
      }

      setSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all its subcategories.')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setSuccess('Category deleted successfully');
      fetchData();
    } catch (error) {
      setError('Failed to delete category');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/categories/${id}/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder category');
      }

      fetchData();
    } catch (error) {
      setError('Failed to reorder category');
    }
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
            placeholder="Search categories..."
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
            <Tooltip title="Add Category">
              <IconButton
                size="small"
                onClick={handleAdd}
                sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1, color: 'primary.main' }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download">
              <IconButton
                size="small"
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
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
      sx={{
        "& .MuiDialog-paper": {
          m: { xs: 2, sm: 3 },
          maxHeight: { xs: "calc(100% - 32px)", sm: "calc(100% - 64px)" },
          zIndex: 9999,
        },
        zIndex: 9998,
      }}>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Sector</InputLabel>
              <Select
                value={categoryForm.sector}
                label="Sector"
                onChange={(e) => setCategoryForm({ ...categoryForm, sector: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Agriculture">Agriculture</MenuItem>
                <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                <MenuItem value="Services">Services</MenuItem>
                <MenuItem value="Technology">Technology</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!categoryForm.name}>
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

