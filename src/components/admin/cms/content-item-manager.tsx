'use client';

import React, { useState } from 'react';
import { ContentSection, ContentItem, apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Tabs,
  Tab,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  FileText,
  Image,
  Link,
  Star
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ContentItemManagerProps {
  sections: ContentSection[];
  items: Record<string, ContentItem[]>;
  onRefresh: () => void;
}

export function ContentItemManager({ sections, items, onRefresh }: ContentItemManagerProps) {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({
    sectionKey: '',
    type: 'text',
    title: '',
    subtitle: '',
    content: '',
    imageUrl: '',
    iconName: '',
    linkUrl: '',
    linkText: '',
    backgroundColor: '',
    textColor: '',
    isActive: true,
    order: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const selectedSection = sections[selectedSectionIndex];
  const sectionItems = selectedSection ? items[selectedSection.sectionKey] || [] : [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedSectionIndex(newValue);
  };

  const handleOpenDialog = (item?: ContentItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sectionKey: item.sectionKey,
        type: item.type,
        title: item.title || '',
        subtitle: item.subtitle || '',
        content: item.content || '',
        imageUrl: item.imageUrl || '',
        iconName: item.iconName || '',
        linkUrl: item.linkUrl || '',
        linkText: item.linkText || '',
        backgroundColor: item.backgroundColor || '',
        textColor: item.textColor || '',
        isActive: item.isActive,
        order: item.order
      });
    } else {
      setEditingItem(null);
      setFormData({
        sectionKey: selectedSection?.sectionKey || '',
        type: 'text',
        title: '',
        subtitle: '',
        content: '',
        imageUrl: '',
        iconName: '',
        linkUrl: '',
        linkText: '',
        backgroundColor: '',
        textColor: '',
        isActive: true,
        order: sectionItems.length
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
      
      if (!formData.sectionKey) {
        toast({
          title: 'Error',
          description: 'Section is required',
          variant: 'destructive',
        });
        return;
      }

      const itemData = {
        ...formData,
        id: editingItem?.id
      };

      if (editingItem) {
        await apiClient.updateContentItem(editingItem.id, itemData);
      } else {
        await apiClient.createContentItem(itemData);
      }
      
      toast({
        title: 'Success',
        description: `Content item ${editingItem ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save content item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) {
      return;
    }

    try {
      await apiClient.deleteContentItem(itemId);
      toast({
        title: 'Success',
        description: 'Content item deleted successfully',
      });
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete content item',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (item: ContentItem) => {
    try {
      const updatedItem = { ...item, isActive: !item.isActive };
      await apiClient.updateContentItem(item.id, updatedItem);
      toast({
        title: 'Success',
        description: `Content item ${updatedItem.isActive ? 'activated' : 'deactivated'}`,
      });
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update content item',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={16} aria-label="Image content type" />;
      case 'link': return <Link size={16} aria-label="Link content type" />;
      case 'feature': return <Star size={16} aria-label="Feature content type" />;
      default: return <FileText size={16} aria-label="Text content type" />;
    }
  };

  if (sections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <FileText size={48} color="#9CA3AF" style={{ marginBottom: 16 }} aria-label="No sections available" />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          No sections available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create content sections first to manage content items.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Section Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedSectionIndex} onChange={handleTabChange}>
          {sections.map((section) => (
            <Tab
              key={section.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {section.sectionKey}
                  <Chip
                    label={items[section.sectionKey]?.length || 0}
                    size="small"
                    color="primary"
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {sections.map((section, sectionIndex) => (
        <TabPanel key={section.id} value={selectedSectionIndex} index={sectionIndex}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {section.sectionKey} Content ({sectionItems.length} items)
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => handleOpenDialog()}
            >
              Add Content Item
            </Button>
          </Box>

          {/* Content Items Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Content</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <FileText size={48} color="#9CA3AF" style={{ marginBottom: 16 }} aria-label="No content items" />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No content items
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add your first content item to this section.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  sectionItems
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {item.title || 'No title'}
                            </Typography>
                            {item.subtitle && (
                              <Typography variant="caption" color="text.secondary">
                                {item.subtitle}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getTypeIcon(item.type)}
                            label={item.type}
                            size="small"
                            variant="outlined"
                          />
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
                            <Tooltip title={item.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleActive(item)}
                                color={item.isActive ? 'success' : 'default'}
                              >
                                {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                              </IconButton>
                            </Tooltip>
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
        </TabPanel>
      ))}

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
          {editingItem ? 'Edit Content Item' : 'Create New Content Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.sectionKey}
                  label="Section"
                  onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.sectionKey}>
                      {section.sectionKey}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="feature">Feature</MenuItem>
                  <MenuItem value="statistic">Statistic</MenuItem>
                  <MenuItem value="link">Link</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                helperText="JSON content or plain text"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Icon Name"
                value={formData.iconName}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                helperText="Lucide icon name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Link URL"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Link Text"
                value={formData.linkText}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Background Color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                placeholder="#ffffff"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Text Color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                placeholder="#000000"
              />
            </Grid>
            <Grid item xs={12}>
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
