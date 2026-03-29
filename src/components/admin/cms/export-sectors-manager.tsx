'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  Factory,
  Leaf,
  Utensils,
  Palette,
  Building,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SubSector {
  id: string;
  name: string;
  description: string;
  products: string;
}

interface ExportSectorContent {
  exporters?: number;
  products?: string;
  productCategories?: string[];
  subSectors?: SubSector[];
}

interface ExportSector {
  id: string;
  sectionKey?: string;
  type?: string;
  title: string;
  subtitle: string;
  content: string;
  iconName: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  suggested?: boolean;
}

interface ExportSectorsManagerProps {
  onRefresh?: () => void;
}

const iconOptions = [
  { value: 'Leaf', label: 'Agriculture (Leaf)', icon: <Leaf size={20} /> },
  { value: 'Factory', label: 'Manufacturing (Factory)', icon: <Factory size={20} /> },
  { value: 'Utensils', label: 'Food Processing (Utensils)', icon: <Utensils size={20} /> },
  { value: 'Palette', label: 'Handicrafts (Palette)', icon: <Palette size={20} /> },
  { value: 'Building', label: 'Services (Building)', icon: <Building size={20} /> },
];

export function ExportSectorsManager({ onRefresh }: ExportSectorsManagerProps) {
  const [sectors, setSectors] = useState<ExportSector[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<ExportSector | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggested, setIsSuggested] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    iconName: 'Building',
    isActive: true,
    order: 0,
    exporters: 0,
    products: '',
    productCategories: '',
    subSectors: [] as SubSector[]
  });

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.makeRequest<{ sectors: ExportSector[]; suggested?: boolean }>('/cms/sectors');
      setSectors(response.sectors);
      setIsSuggested(response.suggested || false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {

      // Handle specific error cases
      if (error.message.includes('Cannot connect to API server')) {
        toast({
          title: 'Connection Error',
          description: 'Cannot connect to the backend server. Please ensure the server is running on port 3005.',
          variant: 'destructive',
        });
      } else if (error.message.includes('401') || error.message.includes('403')) {
        toast({
          title: 'Authentication Error',
          description: 'You need to be logged in as an admin to access this feature.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to load export sectors: ${error.message}`,
          variant: 'destructive',
        });
      }
      
      // Set empty sectors array to show the empty state
      setSectors([]);
      setIsSuggested(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (sector?: ExportSector) => {
    if (sector) {
      setEditingSector(sector);
      const contentData: ExportSectorContent = sector.content ? JSON.parse(sector.content) : {};
      setFormData({
        title: sector.title || '',
        subtitle: sector.subtitle || '',
        content: sector.content || '',
        iconName: sector.iconName || 'Building',
        isActive: sector.isActive,
        order: sector.order,
        exporters: contentData.exporters || 0,
        products: contentData.products || '',
        productCategories: Array.isArray(contentData.productCategories) 
          ? contentData.productCategories.join(', ') 
          : contentData.productCategories || '',
        subSectors: contentData.subSectors || []
      });
    } else {
      setEditingSector(null);
      setFormData({
        title: '',
        subtitle: '',
        content: '',
        iconName: 'Building',
        isActive: true,
        order: sectors.length,
        exporters: 0,
        products: '',
        productCategories: '',
        subSectors: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSector(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.title.trim()) {
        toast({
          title: 'Error',
          description: 'Sector name is required',
          variant: 'destructive',
        });
        return;
      }

      const contentData: ExportSectorContent = {
        exporters: formData.exporters,
        products: formData.products,
        productCategories: formData.productCategories.split(',').map(cat => cat.trim()).filter(cat => cat),
        subSectors: formData.subSectors || []
      };

      const sectorData = {
        id: editingSector?.id,
        title: formData.title,
        subtitle: formData.subtitle,
        content: JSON.stringify(contentData),
        iconName: formData.iconName,
        isActive: formData.isActive,
        order: formData.order
      };

      await apiClient.makeRequest('/cms/sectors', {
        method: 'POST',
        body: JSON.stringify(sectorData),
      });
      
      toast({
        title: 'Success',
        description: `Sector ${editingSector ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      loadSectors();
      onRefresh?.();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save sector',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sectorId: string) => {
    if (!confirm('Are you sure you want to delete this sector?')) {
      return;
    }

    try {
      await apiClient.makeRequest(`/cms/sectors/${sectorId}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'Sector deleted successfully',
      });
      loadSectors();
      onRefresh?.();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete sector',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (sector: ExportSector) => {
    try {
      const updatedSector = { 
        ...sector, 
        isActive: !sector.isActive 
      };
      
      await apiClient.makeRequest('/cms/sectors', {
        method: 'POST',
        body: JSON.stringify(updatedSector),
      });
      
      toast({
        title: 'Success',
        description: `Sector ${updatedSector.isActive ? 'activated' : 'deactivated'}`,
      });
      loadSectors();
      onRefresh?.();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update sector',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAllSuggested = async () => {
    try {
      setIsLoading(true);
      
      // Save all suggested sectors
      for (const sector of sectors) {
        if (sector.suggested) {
          await apiClient.makeRequest('/cms/sectors', {
            method: 'POST',
            body: JSON.stringify({
              title: sector.title,
              subtitle: sector.subtitle,
              content: sector.content,
              iconName: sector.iconName,
              isActive: sector.isActive,
              order: sector.order
            }),
          });
        }
      }
      
      toast({
        title: 'Success',
        description: 'All suggested sectors saved successfully',
      });
      
      loadSectors();
      onRefresh?.();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save suggested sectors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.makeRequest('/cms/sectors/public');
      toast({
        title: 'Connection Test',
        description: 'Successfully connected to the backend server!',
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: 'Connection Test Failed',
        description: `Cannot connect to backend: ${error.message}`,
        variant: 'destructive',
      });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Export Sectors ({sectors.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw />}
            onClick={loadSectors}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={testConnection}
            disabled={isLoading}
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => handleOpenDialog()}
          >
            Add Sector
          </Button>
        </Box>
      </Box>

      {/* Suggested Sectors Alert */}
      {isSuggested && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleSaveAllSuggested}
              disabled={isLoading}
              startIcon={<Save />}
            >
              Save All
            </Button>
          }
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Suggested Sectors Available
            </Typography>
            <Typography variant="body2">
              We found {sectors.length} sectors based on your verified businesses. 
              You can save them all or edit individual sectors before saving.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Sectors Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sector</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Exporters</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sectors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Factory size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No export sectors found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create your first export sector to showcase on the homepage.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sectors
                .sort((a, b) => a.order - b.order)
                .map((sector) => {
                  const contentData = sector.content ? JSON.parse(sector.content) : {};
                  const IconComponent = iconOptions.find(opt => opt.value === sector.iconName)?.icon || <Building size={20} />;
                  
                  return (
                    <TableRow key={sector.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {sector.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sector.subtitle}
                          </Typography>
                          {sector.suggested && (
                            <Chip 
                              label="Suggested" 
                              size="small" 
                              color="info" 
                              icon={<Lightbulb size={12} />}
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {IconComponent}
                          <Typography variant="caption" color="text.secondary">
                            {sector.iconName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contentData.exporters || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sector.isActive ? 'Active' : 'Inactive'}
                          color={sector.isActive ? 'success' : 'default'}
                          size="small"
                          icon={sector.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sector.order}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title={sector.isActive ? 'Deactivate' : 'Activate'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleActive(sector)}
                              color={sector.isActive ? 'success' : 'default'}
                            >
                              {sector.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(sector)}
                            >
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          {!sector.suggested && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(sector.id)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit/Create Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          zIndex: 9999,
        },
        zIndex: 9998,
      }}>
        <DialogTitle>
          {editingSector ? 'Edit Export Sector' : 'Create New Export Sector'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Sector Name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                helperText="e.g., Agriculture & Horticulture"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Icon</InputLabel>
                <Select
                  value={formData.iconName}
                  label="Icon"
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                >
                  {iconOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                helperText="Brief description of this sector"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Exporters"
                value={formData.exporters}
                onChange={(e) => setFormData({ ...formData, exporters: parseInt(e.target.value) || 0 })}
                helperText="Number of verified exporters in this sector"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                helperText="Order in which this sector appears"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Products"
                value={formData.products}
                onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                helperText="Main products in this sector (comma-separated)"
                placeholder="Tea, Coffee, Flowers, Avocados"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Categories"
                value={formData.productCategories}
                onChange={(e) => setFormData({ ...formData, productCategories: e.target.value })}
                helperText="Detailed product categories (comma-separated)"
                placeholder="Fresh Produce, Beverages, Cut Flowers"
              />
            </Grid>
            {/* Sub-sectors Section */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ fontSize: '1.2rem' }}>📂</Box>
                  Sub-Sectors
                </Typography>
                
                {/* Add new sub-sector */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Add New Sub-Sector</Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Sub-Sector Name"
                        placeholder="e.g., Tea Production"
                        id="newSubSectorName"
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Description"
                        placeholder="Brief description"
                        id="newSubSectorDesc"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button 
                        variant="contained" 
                        size="small"
                        startIcon={<Plus />}
                        onClick={() => {
                          const nameInput = document.getElementById('newSubSectorName') as HTMLInputElement;
                          const descInput = document.getElementById('newSubSectorDesc') as HTMLInputElement;
                          if (nameInput?.value?.trim()) {
                            const newSubSector: SubSector = {
                              id: `subsector_${Date.now()}`,
                              name: nameInput.value.trim(),
                              description: descInput?.value?.trim() || '',
                              products: ''
                            };
                            setFormData({
                              ...formData,
                              subSectors: [...formData.subSectors, newSubSector]
                            });
                            nameInput.value = '';
                            descInput.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Existing sub-sectors list */}
                {formData.subSectors && formData.subSectors.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.subSectors.map((subSector, index) => (
                          <TableRow key={subSector.id}>
                            <TableCell>{subSector.name}</TableCell>
                            <TableCell>{subSector.description}</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => {
                                  const newSubSectors = formData.subSectors.filter((_, i) => i !== index);
                                  setFormData({ ...formData, subSectors: newSubSectors });
                                }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No sub-sectors added yet. Add sub-sectors to organize this sector further.
                  </Alert>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active (visible on homepage)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<X />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isLoading}
            startIcon={<Save />}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
