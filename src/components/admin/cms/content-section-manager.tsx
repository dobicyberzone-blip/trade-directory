'use client';

import React, { useState } from 'react';
import { ContentSection, apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
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
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  ArrowUpward,
  ArrowDownward,
  Layout
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ContentSectionManagerProps {
  sections: ContentSection[];
  onSectionsChange: (sections: ContentSection[]) => void;
  onRefresh: () => void;
}

export function ContentSectionManager({ sections, onSectionsChange, onRefresh }: ContentSectionManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [formData, setFormData] = useState({
    sectionKey: '',
    title: '',
    subtitle: '',
    content: '',
    imageUrl: '',
    backgroundColor: '',
    textColor: '',
    isActive: true,
    order: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenDialog = (section?: ContentSection) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        sectionKey: section.sectionKey,
        title: section.title || '',
        subtitle: section.subtitle || '',
        content: section.content || '',
        imageUrl: section.imageUrl || '',
        backgroundColor: section.backgroundColor || '',
        textColor: section.textColor || '',
        isActive: section.isActive,
        order: section.order
      });
    } else {
      setEditingSection(null);
      setFormData({
        sectionKey: '',
        title: '',
        subtitle: '',
        content: '',
        imageUrl: '',
        backgroundColor: '',
        textColor: '',
        isActive: true,
        order: sections.length
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSection(null);
    setFormData({
      sectionKey: '',
      title: '',
      subtitle: '',
      content: '',
      imageUrl: '',
      backgroundColor: '',
      textColor: '',
      isActive: true,
      order: 0
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.sectionKey.trim()) {
        toast({
          title: 'Error',
          description: 'Section key is required',
          variant: 'destructive',
        });
        return;
      }

      const sectionData = {
        ...formData,
        id: editingSection?.id
      };

      await apiClient.saveContentSection(sectionData);
      
      toast({
        title: 'Success',
        description: `Section ${editingSection ? 'updated' : 'created'} successfully`,
      });

      handleCloseDialog();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save section',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sectionKey: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await apiClient.deleteContentSection(sectionKey);
      toast({
        title: 'Success',
        description: 'Section deleted successfully',
      });
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (section: ContentSection) => {
    try {
      const updatedSection = { ...section, isActive: !section.isActive };
      await apiClient.saveContentSection(updatedSection);
      toast({
        title: 'Success',
        description: `Section ${updatedSection.isActive ? 'activated' : 'deactivated'}`,
      });
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to update section',
        variant: 'destructive',
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Content Sections ({sections.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenDialog()}
        >
          Add Section
        </Button>
      </Box>

      {/* Sections Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Section</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Layout size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No sections found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create your first content section to get started.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <TableRow key={section.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {section.sectionKey}
                        </Typography>
                        {section.subtitle && (
                          <Typography variant="caption" color="text.secondary">
                            {section.subtitle}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {section.title || 'No title'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={section.isActive ? 'Active' : 'Inactive'}
                        color={section.isActive ? 'success' : 'default'}
                        size="small"
                        icon={section.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {section.order}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title={section.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(section)}
                            color={section.isActive ? 'success' : 'default'}
                          >
                            {section.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(section)}
                          >
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(section.sectionKey)}
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
        fullWidth
      >
        <DialogTitle>
          {editingSection ? 'Edit Section' : 'Create New Section'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Section Key"
                value={formData.sectionKey}
                onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                disabled={!!editingSection}
                helperText="Unique identifier for this section"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
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
                type="number"
                label="Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Background Color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                placeholder="#ffffff"
              />
            </Grid>
            <Grid item xs={12} md={6}>
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