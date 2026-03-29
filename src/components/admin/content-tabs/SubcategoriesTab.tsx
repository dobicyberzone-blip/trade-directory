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
}

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  order: number;
  categoryId: string;
  category: {
    name: string;
  };
}

export default function SubcategoriesTab() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'order', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<{ data: Subcategory[]; total: number }>({ data: [], total: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', categoryId: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const columns: TableColumn[] = [
    {
      field: 'name',
      headerName: 'Subcategory Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 200,
      renderCell: (params) => params.row.category?.name || 'N/A',
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => params.row.description || 'N/A',
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
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
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
      const [subcategoriesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/categories/subcategories', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/categories', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!subcategoriesRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const subcategoriesData = await subcategoriesRes.json();
      const categoriesData = await categoriesRes.json();

      const subcategories = subcategoriesData.subcategories || [];
      setCategories(categoriesData.categories || []);

      // Filter by search query
      const filtered = searchQuery
        ? subcategories.filter((sub: Subcategory) =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : subcategories;

      setData({ data: filtered, total: filtered.length });
    } catch (error) {

      setError('Failed to load subcategories');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingSubcategory(null);
    setSubcategoryForm({ name: '', description: '', categoryId: '' });
    setDialogOpen(true);
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description || '',
      categoryId: subcategory.categoryId,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const token = getAuthToken();
      const url = editingSubcategory
        ? `/api/admin/categories/subcategories/${editingSubcategory.id}`
        : '/api/admin/categories/subcategories';

      const response = await fetch(url, {
        method: editingSubcategory ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subcategoryForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save subcategory');
      }

      setSuccess(editingSubcategory ? 'Subcategory updated successfully' : 'Subcategory created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save subcategory');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/categories/subcategories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete subcategory');
      }

      setSuccess('Subcategory deleted successfully');
      fetchData();
    } catch (error) {
      setError('Failed to delete subcategory');
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
            placeholder="Search subcategories..."
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
            <Tooltip title="Add Subcategory">
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
        <DialogTitle>{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={subcategoryForm.categoryId}
                label="Category"
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, categoryId: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Subcategory Name"
              value={subcategoryForm.name}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={subcategoryForm.description}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!subcategoryForm.name || !subcategoryForm.categoryId}>
            {editingSubcategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

