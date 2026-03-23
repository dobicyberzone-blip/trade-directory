'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  X as CancelIcon,
  Eye as VisibilityIcon,
  Package as PackageIcon,
  Building as BusinessIcon,
  DollarSign as PriceIcon,
  Search as SearchIcon,
  Download,
} from 'lucide-react';
import { FilterList } from '@mui/icons-material';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function ProductVerificationTab() {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    category: '',
    priceRange: '',
    businessSector: '',
    businessCounty: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProducts();
      setAllProducts(response.products);
    } catch (error) {

      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search and status filter
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    
    // Filter by verification status
    if (statusFilter === 'PENDING') {
      result = result.filter(p => !p.verified);
    } else if (statusFilter === 'VERIFIED') {
      result = result.filter(p => p.verified);
    }
    // 'ALL' shows all products
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.category?.toLowerCase().includes(search) ||
        p.business?.name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }
    
    // Advanced filters
    if (advancedFilters.category) {
      result = result.filter(p => p.category === advancedFilters.category);
    }
    
    if (advancedFilters.priceRange) {
      result = result.filter(p => {
        const price = parseFloat(p.price) || 0;
        switch (advancedFilters.priceRange) {
          case 'under-100':
            return price < 100;
          case '100-500':
            return price >= 100 && price <= 500;
          case '500-1000':
            return price >= 500 && price <= 1000;
          case 'over-1000':
            return price > 1000;
          case 'on-request':
            return !p.price || p.price === '' || p.price === 'On request';
          default:
            return true;
        }
      });
    }
    
    if (advancedFilters.businessSector) {
      result = result.filter(p => p.business?.sector === advancedFilters.businessSector);
    }
    
    if (advancedFilters.businessCounty) {
      result = result.filter(p => p.business?.county === advancedFilters.businessCounty);
    }
    
    return result;
  }, [allProducts, searchTerm, statusFilter, advancedFilters]);

  const handleVerification = async (productId: string, productName: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      setIsVerifying(productId);
      await apiClient.verifyProduct(productId, status);
      
      toast({
        title: `Product ${status.toLowerCase()}`,
        description: `${productName} has been ${status.toLowerCase()}.`,
      });

      await fetchProducts();
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update product verification status.',
      });
    } finally {
      setIsVerifying(null);
    }
  };

  const getStatusColor = (verified: boolean): 'success' | 'warning' => {
    return verified ? 'success' : 'warning';
  };

  const ProductDetailsDialog = ({ product, open, onClose }: { product: any; open: boolean; onClose: () => void }) => {
    if (!product) return null;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={product.imageUrl} alt={product.name}>
              <PackageIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{product.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {product.category}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Product Information</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                      <Typography variant="body2">{product.description || 'No description provided'}</Typography>
                    </Box>
                    <Box display="flex" gap={4}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                        <Typography variant="body2">{product.category}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Price</Typography>
                        <Typography variant="body2">
                          {product.price ? `${product.price}` : 'Price on request'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            color="error"
            startIcon={<CancelIcon size={16} />}
            onClick={() => {
              handleVerification(product.id, product.name, 'REJECTED');
              onClose();
            }}
            disabled={isVerifying === product.id}
          >
            Reject
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckCircleIcon size={16} />}
            onClick={() => {
              handleVerification(product.id, product.name, 'VERIFIED');
              onClose();
            }}
            disabled={isVerifying === product.id}
          >
            {isVerifying === product.id ? 'Verifying...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Product Verification ({filteredProducts.length} products)
        </Typography>
        <Button variant="outlined" onClick={fetchProducts} disabled={isLoading}>
          Refresh
        </Button>
      </Box>
      
      {/* Search and Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, category, business..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} />
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
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="VERIFIED">Verified</MenuItem>
            <MenuItem value="ALL">All Status</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Advanced Filters">
            <IconButton 
              size="small"
              onClick={() => setFilterDialogOpen(true)}
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
                minWidth: '40px',
                height: '40px',
              }}
            >
              <FilterList fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Business</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={4}>
                    <PackageIcon size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <Typography variant="body2" color="textSecondary">
                      No products found matching your criteria
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar src={product.imageUrl} alt={product.name}>
                        <PackageIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Created {new Date(product.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{product.category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {product.business?.name || 'Unknown Business'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {product.price ? `${product.price}` : 'On request'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.verified ? 'VERIFIED' : 'PENDING'} 
                      color={getStatusColor(product.verified)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon size={16} />}
                        onClick={() => setSelectedProduct(product)}
                      >
                        View
                      </Button>
                      {!product.verified && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircleIcon size={16} />}
                            onClick={() => handleVerification(product.id, product.name, 'VERIFIED')}
                            disabled={isVerifying === product.id}
                          >
                            {isVerifying === product.id ? '...' : 'Approve'}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<CancelIcon size={16} />}
                            onClick={() => handleVerification(product.id, product.name, 'REJECTED')}
                            disabled={isVerifying === product.id}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Advanced Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={advancedFilters.category}
                label="Category"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, category: e.target.value })}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Fruits">Fruits</MenuItem>
                <MenuItem value="Vegetables">Vegetables</MenuItem>
                <MenuItem value="Herbs & Spices">Herbs & Spices</MenuItem>
                <MenuItem value="Coffee">Coffee</MenuItem>
                <MenuItem value="Tea">Tea</MenuItem>
                <MenuItem value="Nuts">Nuts</MenuItem>
                <MenuItem value="Flowers">Flowers</MenuItem>
                <MenuItem value="Grains">Grains</MenuItem>
                <MenuItem value="Processed Foods">Processed Foods</MenuItem>
                <MenuItem value="Textiles">Textiles</MenuItem>
                <MenuItem value="Handicrafts">Handicrafts</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Price Range</InputLabel>
              <Select
                value={advancedFilters.priceRange}
                label="Price Range"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, priceRange: e.target.value })}
              >
                <MenuItem value="">All Prices</MenuItem>
                <MenuItem value="under-100">Under $100</MenuItem>
                <MenuItem value="100-500">$100 - $500</MenuItem>
                <MenuItem value="500-1000">$500 - $1,000</MenuItem>
                <MenuItem value="over-1000">Over $1,000</MenuItem>
                <MenuItem value="on-request">Price on Request</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Business Sector</InputLabel>
              <Select
                value={advancedFilters.businessSector}
                label="Business Sector"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, businessSector: e.target.value })}
              >
                <MenuItem value="">All Sectors</MenuItem>
                <MenuItem value="Horticulture">Horticulture</MenuItem>
                <MenuItem value="Coffee">Coffee</MenuItem>
                <MenuItem value="Tea">Tea</MenuItem>
                <MenuItem value="Fisheries">Fisheries</MenuItem>
                <MenuItem value="Agriculture">Agriculture</MenuItem>
                <MenuItem value="Textiles & Apparel">Textiles & Apparel</MenuItem>
                <MenuItem value="Manufacturing">Manufacturing</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Business County</InputLabel>
              <Select
                value={advancedFilters.businessCounty}
                label="Business County"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, businessCounty: e.target.value })}
              >
                <MenuItem value="">All Counties</MenuItem>
                <MenuItem value="Nairobi">Nairobi</MenuItem>
                <MenuItem value="Mombasa">Mombasa</MenuItem>
                <MenuItem value="Kiambu">Kiambu</MenuItem>
                <MenuItem value="Kericho">Kericho</MenuItem>
                <MenuItem value="Uasin Gishu">Uasin Gishu</MenuItem>
                <MenuItem value="Nakuru">Nakuru</MenuItem>
                <MenuItem value="Kisumu">Kisumu</MenuItem>
                <MenuItem value="Machakos">Machakos</MenuItem>
                <MenuItem value="Murang'a">Murang'a</MenuItem>
                <MenuItem value="Nyeri">Nyeri</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAdvancedFilters({ category: '', priceRange: '', businessSector: '', businessCounty: '' });
              setFilterDialogOpen(false);
            }}
          >
            Clear Filters
          </Button>
          <Button 
            onClick={() => setFilterDialogOpen(false)}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
