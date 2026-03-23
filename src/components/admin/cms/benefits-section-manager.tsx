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
  Tabs,
  Tab,
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
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

interface BenefitsData {
  exporterBenefits: Benefit[];
  buyerBenefits: Benefit[];
}

interface BenefitsSectionManagerProps {
  onRefresh: () => void;
}

const defaultBenefits: BenefitsData = {
  exporterBenefits: [
    { title: "Global Visibility", description: "Reach thousands of international buyers actively sourcing from Kenya.", icon: "globe" },
    { title: "Build Credibility", description: "Gain a competitive edge with a government-issued verification badge.", icon: "shield" },
    { title: "Receive Inquiries", description: "Get qualified buyer leads and direct messages through our secure platform.", icon: "mail" },
    { title: "Grow Your Business", description: "Access new markets, trade information, and export opportunities.", icon: "trending-up" },
  ],
  buyerBenefits: [
    { title: "Trusted Suppliers", description: "Source from a pool of exporters pre-verified by a government agency.", icon: "shield-check" },
    { title: "Easy Discovery", description: "Utilize advanced search and filters to find the exact products you need.", icon: "search" },
    { title: "Quality Assurance", description: "Connect with certified exporters who meet international standards.", icon: "award" },
    { title: "Direct Connection", description: "Communicate directly and securely with suppliers to build relationships.", icon: "message-circle" },
  ]
};

export function BenefitsSectionManager({ onRefresh }: BenefitsSectionManagerProps) {
  const [benefits, setBenefits] = useState<BenefitsData>(defaultBenefits);
  const [activeTab, setActiveTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<{ benefit: Benefit; index: number; type: 'exporter' | 'buyer' } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    try {
      setIsLoadingData(true);
      const response = await apiClient.getSiteSettingOptional('home_benefits');
      
      if (response.setting?.settingValue) {
        const data = JSON.parse(response.setting.settingValue);
        setBenefits(data);
      } else {
        // Use default benefits
        setBenefits(defaultBenefits);
      }
    } catch (error) {

      // Use default benefits
      setBenefits(defaultBenefits);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenDialog = (benefit?: Benefit, index?: number, type?: 'exporter' | 'buyer') => {
    if (benefit && index !== undefined && type) {
      setEditingBenefit({ benefit, index, type });
      setFormData({
        title: benefit.title,
        description: benefit.description,
        icon: benefit.icon
      });
    } else {
      setEditingBenefit(null);
      setFormData({
        title: '',
        description: '',
        icon: 'check'
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBenefit(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.title.trim() || !formData.description.trim()) {
        toast({
          title: 'Error',
          description: 'Title and description are required',
          variant: 'destructive',
        });
        return;
      }

      const newBenefit: Benefit = {
        title: formData.title,
        description: formData.description,
        icon: formData.icon || 'check'
      };

      const updatedBenefits = { ...benefits };

      if (editingBenefit) {
        // Update existing benefit
        const type = editingBenefit.type;
        const key = type === 'exporter' ? 'exporterBenefits' : 'buyerBenefits';
        updatedBenefits[key][editingBenefit.index] = newBenefit;
      } else {
        // Add new benefit
        const type = activeTab === 0 ? 'exporter' : 'buyer';
        const key = type === 'exporter' ? 'exporterBenefits' : 'buyerBenefits';
        updatedBenefits[key].push(newBenefit);
      }

      // Save to database
      await apiClient.saveSiteSetting({
        settingKey: 'home_benefits',
        settingValue: JSON.stringify(updatedBenefits),
        category: 'home',
        description: 'Benefits section for exporters and buyers'
      });
      
      setBenefits(updatedBenefits);
      
      toast({
        title: 'Success',
        description: `Benefit ${editingBenefit ? 'updated' : 'added'} successfully`,
      });

      handleCloseDialog();
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to save benefit',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number, type: 'exporter' | 'buyer') => {
    if (!confirm('Are you sure you want to delete this benefit?')) {
      return;
    }

    try {
      const updatedBenefits = { ...benefits };
      const key = type === 'exporter' ? 'exporterBenefits' : 'buyerBenefits';
      updatedBenefits[key].splice(index, 1);

      await apiClient.saveSiteSetting({
        settingKey: 'home_benefits',
        settingValue: JSON.stringify(updatedBenefits),
        category: 'home',
        description: 'Benefits section for exporters and buyers'
      });
      
      setBenefits(updatedBenefits);
      
      toast({
        title: 'Success',
        description: 'Benefit deleted successfully',
      });
      
      onRefresh();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete benefit',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading benefits...</Typography>
      </Box>
    );
  }

  const currentBenefits = activeTab === 0 ? benefits.exporterBenefits : benefits.buyerBenefits;
  const currentType: 'exporter' | 'buyer' = activeTab === 0 ? 'exporter' : 'buyer';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Benefits Section
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenDialog()}
        >
          Add Benefit
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`For Exporters (${benefits.exporterBenefits.length})`} />
        <Tab label={`For Buyers (${benefits.buyerBenefits.length})`} />
      </Tabs>

      {/* Benefits List */}
      <Card>
        <CardContent>
          <List>
            {currentBenefits.map((benefit, index) => (
              <ListItem 
                key={index} 
                divider={index < currentBenefits.length - 1}
                secondaryAction={
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleOpenDialog(benefit, index, currentType)}
                        sx={{ mr: 1 }}
                      >
                        <Edit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDelete(index, currentType)}
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
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'success.light', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check size={20} color="white" />
                  </Box>
                  <ListItemText
                    primary={benefit.title}
                    secondary={benefit.description}
                    slotProps={{
                      primary: { style: { fontWeight: 600 } }
                    }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>

          {currentBenefits.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No benefits added yet. Click &ldquo;Add Benefit&rdquo; to create one.
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
          {editingBenefit ? 'Edit Benefit' : `Add Benefit for ${activeTab === 0 ? 'Exporters' : 'Buyers'}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Global Visibility"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Describe the benefit..."
            />
            <TextField
              fullWidth
              label="Icon Name (optional)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              helperText="Lucide icon name (e.g., globe, shield, mail)"
            />
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
