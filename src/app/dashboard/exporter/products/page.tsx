'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Delete,
  Edit,
  FilterList,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, Product as APIProduct } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// Extended Product interface with additional fields
interface Product extends APIProduct {
  verified?: boolean;
  updatedAt?: string;
  businessId?: string;
}

export default function ExporterProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setStatusFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First, get the user's business to get the businessId
      if (!user?.business?.id) {
        // If user doesn't have a business yet, show empty state
        setProducts([]);
        setLoading(false);
        return;
      }
      
      // Fetch products filtered by the user's business ID
      const response = await apiClient.getProducts({ businessId: user.business.id });
      setProducts(response.products);
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
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                                (availabilityFilter === 'available' && product.availability) ||
                                (availabilityFilter === 'unavailable' && !product.availability);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleEdit = (productId: string) => {
    router.push(`/dashboard/exporter/products/${productId}/edit`);
    handleMenuClose();
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await apiClient.deleteProduct(selectedProduct.id);
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      await apiClient.updateProduct(productId, { availability: !currentAvailability });
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, availability: !currentAvailability } : p
      ));
      toast({
        title: 'Success',
        description: `Product ${!currentAvailability ? 'marked as available' : 'marked as unavailable'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product availability',
        variant: 'destructive',
      });
    }
    handleMenuClose();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ 
      pt: { xs: 1, sm: 2 },
      px: { xs: 1, sm: 0 },
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Search and Filters */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          {/* Search and Filters in One Row on Desktop */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' }
          }}>
            {/* Search Bar */}
            <TextField
              placeholder="Search products..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flex: { xs: '1 1 100%', md: '1 1 auto' },
                minWidth: { md: 250 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                }
              }}
            />

            {/* Filters Label (Desktop only) */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center', 
              gap: 1,
              flexShrink: 0
            }}>
              <FilterList color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Filters:
              </Typography>
            </Box>
            
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 }, flexShrink: 0 }}>
              <InputLabel>All Categories</InputLabel>
              <Select
                value={categoryFilter}
                label="All Categories"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>All Categories</Typography>
                    <Chip label={products.length} size="small" />
                  </Box>
                </MenuItem>
                {categories.map(category => {
                  const count = products.filter(p => p.category === category).length;
                  return (
                    <MenuItem key={category} value={category}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                        <Typography>{category}</Typography>
                        <Chip label={count} size="small" />
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Availability Filter */}
            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 }, flexShrink: 0 }}>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availabilityFilter}
                label="Availability"
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>All</Typography>
                    <Chip label={products.length} size="small" />
                  </Box>
                </MenuItem>
                <MenuItem value="available">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Available</Typography>
                    <Chip 
                      label={products.filter(p => p.availability).length} 
                      size="small" 
                      color="success"
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="unavailable">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Unavailable</Typography>
                    <Chip 
                      label={products.filter(p => !p.availability).length} 
                      size="small" 
                    />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Clear Filters Button */}
            {(searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all') && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setAvailabilityFilter('all');
                }}
                sx={{ 
                  minWidth: 'auto',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                Clear All
              </Button>
            )}
          </Box>

          {/* Active Filter Chips */}
          {(searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all') && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap', 
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              alignItems: 'center'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}:
              </Typography>
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  onDelete={() => setSearchTerm('')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {categoryFilter !== 'all' && (
                <Chip
                  label={`Category: ${categoryFilter}`}
                  onDelete={() => setStatusFilter('all')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {availabilityFilter !== 'all' && (
                <Chip
                  label={`Availability: ${availabilityFilter}`}
                  onDelete={() => setAvailabilityFilter('all')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Min Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Loading products...
                </TableCell>
              </TableRow>
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all' 
                      ? 'No products match your filters' 
                      : 'No products yet. Click "Add Product" to create your first listing.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {product.imageUrl && (
                        <Box
                          component="img"
                          src={product.imageUrl}
                          alt={product.name}
                          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                        />
                      )}
                      <Box>
                        <Typography fontWeight="medium">{product.name}</Typography>
                        {product.description && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              display: 'block', 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {product.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    {product.price ? `$${product.price}${product.unit ? `/${product.unit}` : ''}` : '-'}
                  </TableCell>
                  <TableCell>
                    {product.minOrder ? `${product.minOrder} ${product.unit || 'units'}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.verified ? 'Verified' : 'Pending'} 
                      color={product.verified ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.availability ? 'Available' : 'Unavailable'} 
                      color={product.availability ? 'success' : 'default'} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, product.id)}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const product = products.find(p => p.id === selectedId);
          if (product) handleViewDetails(product);
        }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedId) handleEdit(selectedId);
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={() => {
          const product = products.find(p => p.id === selectedId);
          if (product) handleToggleAvailability(product.id, product.availability);
        }}>
          <Tooltip title="Toggle product availability">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} fontSize="small" /> 
              {products.find(p => p.id === selectedId)?.availability ? 'Mark Unavailable' : 'Mark Available'}
            </Box>
          </Tooltip>
        </MenuItem>
        <MenuItem onClick={() => {
          const product = products.find(p => p.id === selectedId);
          if (product) handleDeleteClick(product);
        }}>
          <Delete sx={{ mr: 1 }} fontSize="small" color="error" /> Delete
        </MenuItem>
      </Menu>

      {/* Product Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Product Details</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ pt: 2 }}>
              {selectedProduct.imageUrl && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 2 }}
                  />
                </Box>
              )}
              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Product Name</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedProduct.name}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{selectedProduct.category}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="body1">
                    {selectedProduct.price ? `$${selectedProduct.price}${selectedProduct.unit ? `/${selectedProduct.unit}` : ''}` : 'Not specified'}
                  </Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Minimum Order</Typography>
                  <Typography variant="body1">
                    {selectedProduct.minOrder ? `${selectedProduct.minOrder} ${selectedProduct.unit || 'units'}` : 'Not specified'}
                  </Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Verification Status</Typography>
                  <Chip 
                    label={selectedProduct.verified ? 'Verified' : 'Pending Verification'} 
                    color={selectedProduct.verified ? 'success' : 'warning'} 
                    size="small" 
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Availability</Typography>
                  <Chip 
                    label={selectedProduct.availability ? 'Available' : 'Unavailable'} 
                    color={selectedProduct.availability ? 'success' : 'default'} 
                    size="small" 
                  />
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedProduct.description || 'No description provided'}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body2">{new Date(selectedProduct.createdAt).toLocaleDateString()}</Typography>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2">
                    {selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid2>
              </Grid2>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedProduct) handleEdit(selectedProduct.id);
              setDetailsOpen(false);
            }}
          >
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
