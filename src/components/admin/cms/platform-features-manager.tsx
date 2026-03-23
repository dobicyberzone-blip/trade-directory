'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// material-ui
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Search,
  Map,
  MessageSquare,
  BarChart,
  FileText,
  Languages
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Feature {
  name: string;
  description: string;
  icon: string;
  order: number;
}

interface PlatformFeaturesManagerProps {
  onRefresh: () => void;
}

const defaultFeatures: Feature[] = [
  { name: "Advanced Search", description: "Filter by product, location, certification", icon: "search", order: 1 },
  { name: "Interactive Map", description: "Visual exporter discovery", icon: "map", order: 2 },
  { name: "Secure Messaging", description: "Protected communication", icon: "message-square", order: 3 },
  { name: "Export Analytics", description: "Performance insights", icon: "bar-chart", order: 4 },
  { name: "Document Management", description: "Upload certificates", icon: "file-text", order: 5 },
  { name: "Multi-language", description: "English & Swahili support", icon: "languages", order: 6 },
];

const iconMap: Record<string, React.ReactNode> = {
  'search': <Search size={24} />,
  'map': <Map size={24} />,
  'message-square': <MessageSquare size={24} />,
  'bar-chart': <BarChart size={24} />,
  'file-text': <FileText size={24} />,
  'languages': <Languages size={24} />,
};

export function PlatformFeaturesManager({ onRefresh }: PlatformFeaturesManagerProps) {
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<{ feature: Feature; index: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'search',
    order: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setIsLoadingData(true);
      const response = await apiClient.getSiteSettingOptional('platform_features');
      
      if (response.setting?.settingValue) {
        const data = JSON.parse(response.setting.settingValue);
        setFeatures(data.features || defaultFeatures);
      } else {
        setFeatures(defaultFeatures);
      }
    } catch (error) {

      setFeatures(defaultFeatures);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenDialog = (feature?: Feature, index?: number) => {
    if (feature && index !== undefined) {
      setEditingFeature({ feature, index });
      setFormData({
        name: feature.name,
        description: feature.description,
        icon: feature.icon,
        order: feature.order
      });
    } else {
      setEditingFeature(null);
      setFormData({
        name: '',
        description: '',
        icon: 'search',
        order: features.length + 1
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFeature(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.name.trim() || !formData.description.trim()) {
        toast({
          title: 'Error',
          description: 'Name and description are required',
          variant: 'destructive',
        });
        return;
      }

      const newFeature: Feature = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        order: formData.order
      };

      const updatedFeatures = [...features];

      if (editingFeature) {
        updatedFeatures[editingFeature.index] = newFeature;
      } else {
        updatedFeatures.push(newFeature);
      }

      // Sort by order
      updatedFeatures.sort((a, b) => a.order - b.order);

      // Save to database
      await apiClient.saveSiteSetting({
        settingKey: 'platform_features',
        settingValue: JSON.stringify({ features: updatedFeatures }),
        category: 'home',
        description: 'Platform features section'
      });
      
      setFeatures(updatedFeatures);
      
      toast({
        title: 'Success',
        description: `Feature ${editingFeature ? 'updated' : 'added'} successfully`,
      });

      handleCloseDialog();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save feature',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this feature?')) {
      return;
    }

    try {
      const updatedFeatures = features.filter((_, i) => i !== index);

      await apiClient.saveSiteSetting({
        settingKey: 'platform_features',
        settingValue: JSON.stringify({ features: updatedFeatures }),
        category: 'home',
        description: 'Platform features section'
      });
      
      setFeatures(updatedFeatures);
      
      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });
      
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete feature',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading platform features...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Platform Features ({features.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenDialog()}
        >
          Add Feature
        </Button>
      </Box>

      {/* Features List */}
      <Card>
        <CardContent>
          <List>
            {features.map((feature, index) => (
              <ListItem 
                key={index} 
                divider={index < features.length - 1}
                secondaryAction={
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleOpenDialog(feature, index)}
                        sx={{ mr: 1 }}
                      >
                        <Edit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDelete(index)}
                        color="error"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1, pr: 10 }}>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 2, 
                    bgcolor: 'primary.light', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'primary.main'
                  }}>
                    {iconMap[feature.icon] || <Search size={24} />}
                  </Box>
                  <ListItemText
                    primary={feature.name}
                    secondary={`${feature.description} • Order: ${feature.order}`}
                    slotProps={{
                      primary: { style: { fontWeight: 600 } }
                    }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>

          {features.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No features added yet. Click &ldquo;Add Feature&rdquo; to create one.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingFeature ? 'Edit Feature' : 'Add New Feature'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Feature Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Advanced Search"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Brief description of the feature"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                slotProps={{
                  select: { native: true }
                }}
              >
                <option value="search">Search</option>
                <option value="map">Map</option>
                <option value="message-square">Message Square</option>
                <option value="bar-chart">Bar Chart</option>
                <option value="file-text">File Text</option>
                <option value="languages">Languages</option>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />
            </Box>
          </Box>
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
