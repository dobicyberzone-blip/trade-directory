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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { ProductPreviewDialog } from '@/components/admin/product-preview-dialog';
import { 
  CheckCircle, 
  Visibility, 
  Search, 
  Download, 
  Cancel,
  PublishedWithChanges,
  UnpublishedOutlined,
} from '@mui/icons-material';
import { toast } from '@/hooks/use-toast';

interface ProductWithBusiness {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  unit?: string;
  minOrder?: number;
  verified?: boolean;
  availability?: boolean;
  verificationNotes?: string;
  imageUrl?: string;
  views?: number;
  createdAt?: string;
  businessName?: string;
  businessId?: string;
  business?: {
    name: string;
    id: string;
    verificationStatus?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ProductsManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<ProductWithBusiness | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [productToReject, setProductToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const sortField = sortModel[0]?.field || 'createdAt';
      const sortOrder = sortModel[0]?.sort || 'desc';
      
      const params = new URLSearchParams({
        page: paginationModel.page.toString(),
        pageSize: paginationModel.pageSize.toString(),
        sortField,
        sortOrder,
        search: debouncedSearch,
        _t: Date.now().toString(),
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      if (publishedFilter !== '') {
        params.append('published', publishedFilter);
      }

      const response = await fetch(`/api/admin/product-verification-v2?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const result = await response.json();

      setData(result);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [paginationModel, sortModel, debouncedSearch, statusFilter, categoryFilter, publishedFilter]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/product-verification-v2`, {
        method: 'PATCH',
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
      
      setData((prevData: any) => ({
        ...prevData,
        data: prevData.data.map((item: any) => 
          item.id === id ? { ...item, verified: true } : item
        )
      }));
      
      toast({
        title: 'Success',
        description: result.message || 'Product verified successfully',
      });
      
      fetchProducts();
    } catch (error) {

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve product',
        variant: 'destructive',
      });
      fetchProducts();
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/product-verification-v2`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id,
          action: 'reject',
          notes: reason || rejectionReason || 'Product does not meet verification requirements',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject');
      }
      
      const result = await response.json();
      
      setData((prevData: any) => ({
        ...prevData,
        data: prevData.data.map((item: any) => 
          item.id === id ? { ...item, verified: false, verificationNotes: reason || rejectionReason } : item
        )
      }));
      
      toast({
        title: 'Success',
        description: result.message || 'Product rejected successfully',
      });
      
      // Reset rejection dialog state
      setRejectDialogOpen(false);
      setProductToReject(null);
      setRejectionReason('');
      
      fetchProducts();
    } catch (error) {

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject product',
        variant: 'destructive',
      });
      fetchProducts();
    }
  };

  const handleTogglePublish = async () => {
    if (!productToDelete) return;

    const product = data.data.find((p: any) => p.id === productToDelete);
    const currentlyPublished = product?.published !== false;
    const newPublished = !currentlyPublished;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/product-verification-v2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: productToDelete, action: 'togglePublish', published: newPublished }),
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      setData((prev: any) => ({
        ...prev,
        data: prev.data.map((p: any) => p.id === productToDelete ? { ...p, published: newPublished } : p),
      }));

      toast({
        title: 'Success',
        description: newPublished ? 'Product is now visible in the directory' : 'Product is now hidden from the directory',
      });
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product visibility',
        variant: 'destructive',
      });
    }
  };

  const handleBulkApprove = async () => {
    const ids = selectedRows;
    try {
      await Promise.all(ids.map(id => handleApprove(id)));
      setSelectedRows([]);
      fetchProducts();
    } catch (error) {

    }
  };

  const handleBulkReject = async () => {
    if (!confirm('Are you sure you want to reject all selected products? You will need to provide a reason.')) {
      return;
    }
    
    const reason = prompt('Please provide a rejection reason:');
    if (!reason || !reason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        variant: 'destructive',
      });
      return;
    }

    const ids = selectedRows;
    try {
      await Promise.all(ids.map(id => handleReject(id, reason)));
      setSelectedRows([]);
      fetchProducts();
    } catch (error) {

    }
  };

  const columns: TableColumn[] = [
    { 
      field: 'name', 
      headerName: 'Product Name', 
      flex: 1, 
      minWidth: isMobile ? 150 : 200,
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 150,
    },
    {
      field: 'business',
      headerName: 'Business Name',
      width: isTablet ? 180 : 200,
      renderCell: (params: any) => {
        const business = params.row?.business;
        if (!business) {
          return <Typography variant="body2" color="text.secondary">No Business</Typography>;
        }
        return <Typography variant="body2">{business.name || 'N/A'}</Typography>;
      },
    },
    {
      field: 'user',
      headerName: 'Product Owner',
      width: 180,
      renderCell: (params: any) => {
        const user = params.row?.user;
        if (!user) {
          return <Typography variant="body2" color="text.secondary">No Owner</Typography>;
        }
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return <Typography variant="body2">{fullName || user.email || 'Unknown'}</Typography>;
      },
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      renderCell: (params: any) => {
        if (!params.row?.price) {
          return <Typography variant="body2" color="text.secondary">Contact</Typography>;
        }
        return <Typography variant="body2">${params.row.price}</Typography>;
      },
    },
    {
      field: 'verified',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => {
        const verified = params.row?.verified || false;
        return (
          <Chip
            label={verified ? 'Verified' : 'Pending'}
            color={verified ? 'success' : 'warning'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'availability',
      headerName: 'Stock',
      width: 120,
      renderCell: (params: any) => {
        const available = params.row?.availability ?? true;
        return (
          <Chip 
            label={available ? 'In Stock' : 'Out'} 
            color={available ? 'success' : 'default'} 
            size="small" 
          />
        );
      },
    },
    {
      field: 'published',
      headerName: 'Listed',
      width: 90,
      renderCell: (params: any) => {
        const pub = params.row?.published !== false;
        return (
          <Chip
            label={pub ? 'Listed' : 'Unlisted'}
            color={pub ? 'success' : 'default'}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params: any) => {
        if (!params.row?.createdAt) {
          return <Typography variant="body2" color="text.secondary">No Date</Typography>;
        }
        const date = new Date(params.row.createdAt);
        if (isNaN(date.getTime())) {
          return <Typography variant="body2" color="text.secondary">Invalid Date</Typography>;
        }
        return <Typography variant="body2">{date.toLocaleDateString()}</Typography>;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params: any) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => {

                  if (!row || !row.id) {

                    toast({
                      title: 'Error',
                      description: 'Unable to load product details. Please refresh and try again.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  setPreviewProduct(row);
                }}
              >
                <Visibility sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            {!row?.verified && (
              <Tooltip title="Verify Product">
                <IconButton size="small" color="success" onClick={() => handleApprove(row?.id)}>
                  <CheckCircle sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {!row?.verified && (
              <Tooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => {
                  setProductToReject(row?.id);
                  setRejectDialogOpen(true);
                }}>
                  <Cancel sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={row.published === false ? 'Publish (make visible)' : 'Unpublish (hide from directory)'}>
              <IconButton 
                size="small" 
                color={row.published === false ? 'success' : 'warning'}
                onClick={() => {
                  setProductToDelete(row.id);
                  setDeleteConfirmOpen(true);
                }}
              >
                {row.published === false 
                  ? <PublishedWithChanges sx={{ fontSize: 18 }} /> 
                  : <UnpublishedOutlined sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const stats = {
    total: data.total || 0,
    pending: data.data?.filter((p: any) => !p.verified).length || 0,
    approved: data.data?.filter((p: any) => p.verified).length || 0,
  };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
          Product Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and manage product verification requests
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid2 container spacing={2} sx={{ mb: 3 }}>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Products
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending Verification
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Verified
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Search and Actions Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All ({stats.total})</MenuItem>
              <MenuItem value="PENDING">Pending ({stats.pending})</MenuItem>
              <MenuItem value="VERIFIED">Verified ({stats.approved})</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            <InputLabel>Listed</InputLabel>
            <Select
              value={publishedFilter}
              label="Listed"
              onChange={(e) => setPublishedFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Listed</MenuItem>
              <MenuItem value="false">Unlisted</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, order: { xs: 3, sm: 0 } }}>
            <Tooltip title="Download CSV">
              <IconButton 
                size="small" 
                onClick={() => window.open('/api/admin/products-admin/export', '_blank')}
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  flex: 1,
                  minWidth: '40px',
                  height: '40px',
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip 
              label={`${selectedRows.length} selected`}
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
              Verify ({selectedRows.length})
            </Button>
            <Button 
              size="small" 
              variant="contained" 
              color="error" 
              onClick={handleBulkReject}
              startIcon={<Cancel />}
            >
              Reject ({selectedRows.length})
            </Button>
          </Box>
        )}
      </Paper>

      <AdminTableWrapper
        key={JSON.stringify(data.data.map((d: any) => ({ id: d.id, verified: d.verified })))}
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

      <ProductPreviewDialog
        open={!!previewProduct}
        onClose={() => setPreviewProduct(null)}
        product={previewProduct}
        onApprove={handleApprove}
        onReject={(id) => {
          setProductToReject(id);
          setRejectDialogOpen(true);
          setPreviewProduct(null);
        }}
        onDelete={(id) => {
          setProductToDelete(id);
          setDeleteConfirmOpen(true);
          setPreviewProduct(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setProductToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            zIndex: 9999,
          },
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
        <DialogTitle>Publish/Unpublish Product</DialogTitle>
        <DialogContent>
          <Typography>
            {data.data.find((p: any) => p.id === productToDelete)?.published === false
              ? 'This product is currently hidden. Publish it to make it visible in the directory?'
              : 'This product is currently visible. Unpublish it to hide it from the directory?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setProductToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTogglePublish}
            color={data.data.find((p: any) => p.id === productToDelete)?.published === false ? 'success' : 'warning'}
            variant="contained"
          >
            {data.data.find((p: any) => p.id === productToDelete)?.published === false ? 'Publish' : 'Unpublish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setProductToReject(null);
          setRejectionReason('');
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            zIndex: 9999,
          },
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
        <DialogTitle>Reject Product Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this product. This will be sent to the product owner.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Rejection Reason"
            placeholder="e.g., Incomplete product information, Invalid images, etc."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRejectDialogOpen(false);
              setProductToReject(null);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (productToReject) {
                handleReject(productToReject, rejectionReason);
              }
            }}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Reject Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
