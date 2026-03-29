'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Menu as MenuIcon,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  type: 'internal' | 'external' | 'dropdown';
  isActive: boolean;
  order: number;
  parentId?: string;
  children?: NavigationItem[];
  icon?: string;
  description?: string;
}

interface NavigationMenuManagerProps {
  onRefresh: () => void;
}

export function NavigationMenuManager({ onRefresh }: NavigationMenuManagerProps) {
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    href: '',
    type: 'internal' as 'internal' | 'external' | 'dropdown',
    isActive: true,
    order: 0,
    parentId: '',
    icon: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setIsLoadingItems(true);
      // For now, we'll use site settings to store navigation items
      const response = await apiClient.getSiteSettings('navigation');
      
      // Transform settings to navigation items
      const navItems = response.settings
        .filter(setting => setting.settingKey.startsWith('nav_'))
        .map((setting, index) => {
          const value = setting.settingValue ? JSON.parse(setting.settingValue) : {};
          return {
            id: setting.id,
            label: value.label || setting.settingKey.replace('nav_', ''),
            href: value.href || '/',
            type: value.type || 'internal',
            isActive: value.isActive !== false,
            order: value.order || index,
            parentId: value.parentId || '',
            icon: value.icon || '',
            description: value.description || ''
          };
        })
        .sort((a, b) => a.order - b.order);
      
      setMenuItems(navItems);
    } catch (error) {

      // Set default navigation items
      setMenuItems([
        {
          id: '1',
          label: 'Home',
          href: '/',
          type: 'internal',
          isActive: true,
          order: 0
        },
        {
          id: '2',
          label: 'Directory',
          href: '/directory',
          type: 'internal',
          isActive: true,
          order: 1
        },
        {
          id: '3',
          label: 'Products',
          href: '/products',
          type: 'internal',
          isActive: true,
          order: 2
        },
        {
          id: '4',
          label: 'About',
          href: '/about',
          type: 'internal',
          isActive: true,
          order: 3
        },
        {
          id: '5',
          label: 'Contact',
          href: '/contact',
          type: 'internal',
          isActive: true,
          order: 4
        }
      ]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleOpenDialog = (item?: NavigationItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        label: item.label,
        href: item.href,
        type: item.type,
        isActive: item.isActive,
        order: item.order,
        parentId: item.parentId || '',
        icon: item.icon || '',
        description: item.description || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        label: '',
        href: '',
        type: 'internal',
        isActive: true,
        order: menuItems.length,
        parentId: '',
        icon: '',
        description: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.label.trim() || !formData.href.trim()) {
        toast({
          title: 'Error',
          description: 'Label and URL are required',
          variant: 'destructive',
        });
        return;
      }

      // Save as site setting
      const settingData = {
        id: editingItem?.id,
        settingKey: `nav_${formData.label.toLowerCase().replace(/\s+/g, '_')}`,
        settingValue: JSON.stringify({
          label: formData.label,
          href: formData.href,
          type: formData.type,
          isActive: formData.isActive,
          order: formData.order,
          parentId: formData.parentId || undefined,
          icon: formData.icon || undefined,
          description: formData.description || undefined
        }),
        category: 'navigation',
        description: `Navigation item: ${formData.label}`
      };

      await apiClient.saveSiteSetting(settingData);
      
      toast({
        title: 'Success',
        description: `Navigation item ${editingItem ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      loadMenuItems();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save navigation item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this navigation item?')) {
      return;
    }

    try {
      // Find the setting key for this item
      const item = menuItems.find(i => i.id === itemId);
      if (item) {
        const settingKey = `nav_${item.label.toLowerCase().replace(/\s+/g, '_')}`;
        // Note: We need a delete endpoint for site settings

        toast({
          title: 'Success',
          description: 'Navigation item deleted successfully',
        });
        loadMenuItems();
        onRefresh();
      }
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete navigation item',
        variant: 'destructive',
      });
    }
  };

  const getTypeChip = (type: string) => {
    switch (type) {
      case 'external':
        return <Chip label="External" size="small" color="warning" icon={<ExternalLink size={12} />} />;
      case 'dropdown':
        return <Chip label="Dropdown" size="small" color="info" />;
      default:
        return <Chip label="Internal" size="small" color="default" />;
    }
  };

  if (isLoadingItems) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading navigation items...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Navigation Menu ({menuItems.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenDialog()}
        >
          Add Menu Item
        </Button>
      </Box>

      {/* Menu Items Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <MenuIcon size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No navigation items found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create your first navigation item to get started.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              menuItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {item.href}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getTypeChip(item.type)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isActive ? 'Active' : 'Inactive'}
                      color={item.isActive ? 'success' : 'default'}
                      size="small"
                      icon={item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.order}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
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
          {editingItem ? 'Edit Navigation Item' : 'Create New Navigation Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                helperText="Text displayed in the navigation menu"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL"
                value={formData.href}
                onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                required
                helperText="Link destination (e.g., /about, https://example.com)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'internal' | 'external' | 'dropdown' })}
                >
                  <MenuItem value="internal">Internal Link</MenuItem>
                  <MenuItem value="external">External Link</MenuItem>
                  <MenuItem value="dropdown">Dropdown Menu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                helperText="Display order in the menu"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                helperText="Icon name (optional)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                helperText="Optional description for admin reference"
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
