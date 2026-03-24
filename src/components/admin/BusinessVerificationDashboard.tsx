'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2 as Grid,
  Alert,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Card,
  CardContent,
  CardMedia,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText as MuiListItemText,
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Add,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Star,
  StarBorder,
  MoreVert,
  CloudDownload,
  Print,
  History,
  Flag,
  ZoomIn,
  RotateRight,
  Close,
  ExpandMore,
  Person,
  Business,
  Description,
  DateRange,
  Refresh,
} from '@mui/icons-material';
import {
  AdminTableWrapper,
  TableColumn,
  PaginationModel,
  SortModel,
} from '@/components/admin/AdminTableWrapper';

// Types
interface BusinessListing {
  id: string;
  businessName: string;
  logo: string | null;
  ownerName: string;
  kenyanId: {
    number: string;
    frontImage: string | null;
    backImage: string | null;
  };
  email: string;
  phone: string;
  registrationCertificate: string | null;
  pinCertificate: string | null;
  businessProfile: Record<string, any>;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 're_verification';
  isFeatured: boolean;
  submissionDate: string;
  verificationNotes: VerificationNote[];
  rejectionReason: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  category: string;
  registrationNumber: string;
  pinNumber: string;
}

interface VerificationNote {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface FilterState {
  search: string;
  verificationStatus: string;
  featuredStatus: string;
  dateFrom: string;
  dateTo: string;
  documentCompleteness: string;
}

export default function BusinessVerificationDashboard() {
  // State management
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'submissionDate', sort: 'desc' }]);
  const [data, setData] = useState<{ data: BusinessListing[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    verificationStatus: '',
    featuredStatus: '',
    dateFrom: '',
    dateTo: '',
    documentCompleteness: '',
  });
  
  // Dialog states
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; business: BusinessListing | null }>({
    open: false,
    business: null,
  });
  const [documentDialog, setDocumentDialog] = useState<{
    open: boolean;
    url: string;
    title: string;
    type: 'image' | 'pdf';
  }>({
    open: false,
    url: '',
    title: '',
    type: 'image',
  });
  const [registerDialog, setRegisterDialog] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean;
    business: BusinessListing | null;
    action: 'approve' | 'reject';
  }>({
    open: false,
    business: null,
    action: 'approve',
  });
  
  // Form states
  const [verificationForm, setVerificationForm] = useState({
    notes: '',
    rejectionReason: '',
    notifyOwner: true,
  });
  const [registerForm, setRegisterForm] = useState({
    businessName: '',
    ownerName: '',
    kenyanIdNumber: '',
    email: '',
    phone: '',
    category: '',
    registrationNumber: '',
    pinNumber: '',
    kenyanIdFront: null as File | null,
    kenyanIdBack: null as File | null,
    registrationCert: null as File | null,
    pinCert: null as File | null,
    logo: null as File | null,
  });
  
  // UI states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    business: BusinessListing | null;
  }>({
    anchorEl: null,
    business: null,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      field: 'businessInfo',
      headerName: 'Business Info',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={params.row.logo}
            sx={{ width: 40, height: 40 }}
            variant="rounded"
          >
            <Business />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {params.row.businessName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.category}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'owner',
      headerName: 'Owner/ID',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.ownerName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              ID: {params.row.kenyanId.number}
            </Typography>
            {params.row.kenyanId.frontImage && (
              <IconButton
                size="small"
                onClick={() => handleViewDocument(params.row.kenyanId.frontImage!, 'Kenyan ID - Front', 'image')}
              >
                <Visibility sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'documents',
      headerName: 'Documents',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {params.row.registrationCertificate && (
            <Tooltip title="Registration Certificate">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleViewDocument(params.row.registrationCertificate!, 'Registration Certificate', 'pdf')}
              >
                <Description sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {params.row.pinCertificate && (
            <Tooltip title="PIN Certificate">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => handleViewDocument(params.row.pinCertificate!, 'PIN Certificate', 'pdf')}
              >
                <Description sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Download All">
            <IconButton
              size="small"
              onClick={() => handleDownloadAll(params.row)}
            >
              <CloudDownload sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'verificationStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const statusColors: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
          pending: 'warning',
          verified: 'success',
          rejected: 'error',
          re_verification: 'info',
        };
        
        const status = params.row.verificationStatus as keyof typeof statusColors;
        
        return (
          <Chip
            label={params.row.verificationStatus.replace('_', ' ').toUpperCase()}
            color={statusColors[status] || 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'isFeatured',
      headerName: 'Featured',
      width: 100,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleToggleFeature(params.row.id, !params.row.isFeatured)}
          color={params.row.isFeatured ? 'warning' : 'default'}
        >
          {params.row.isFeatured ? <Star /> : <StarBorder />}
        </IconButton>
      ),
    },
    {
      field: 'submissionDate',
      headerName: 'Submitted',
      width: 120,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.row.submissionDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => setActionMenu({ anchorEl: e.currentTarget, business: params.row })}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  // API functions
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sortField = sortModel[0]?.field || 'submissionDate';
      const sortOrder = sortModel[0]?.sort || 'desc';

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        sortBy: sortField,
        order: sortOrder,
        ...filters,
      });

      const token = getAuthToken();
      const response = await fetch(`/api/admin/business-verification?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business listings');
      }

      const result = await response.json();
      setData({ data: result.businesses || [], total: result.total || 0 });
    } catch (error) {

      showSnackbar('Failed to load business listings', 'error');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, filters, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Event handlers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleViewDocument = (url: string, title: string, type: 'image' | 'pdf') => {
    setDocumentDialog({ open: true, url, title, type });
  };

  const handleDownloadAll = async (business: BusinessListing) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/business-verification/${business.id}/download-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download documents');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${business.businessName}-documents.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showSnackbar('Failed to download documents', 'error');
    }
  };

  const handleToggleFeature = async (id: string, featured: boolean) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/business-verification/${id}/feature`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured }),
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      showSnackbar(`Business ${featured ? 'featured' : 'unfeatured'} successfully`, 'success');
      fetchData();
    } catch (error) {
      showSnackbar('Failed to update featured status', 'error');
    }
  };

  const handleVerificationAction = (business: BusinessListing, action: 'approve' | 'reject') => {
    setVerificationDialog({ open: true, business, action });
    setActionMenu({ anchorEl: null, business: null });
  };

  const handleSubmitVerification = async () => {
    if (!verificationDialog.business) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/business-verification/${verificationDialog.business.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: verificationDialog.action,
          notes: verificationForm.notes,
          rejectionReason: verificationForm.rejectionReason,
          notifyOwner: verificationForm.notifyOwner,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      showSnackbar(
        `Business ${verificationDialog.action === 'approve' ? 'approved' : 'rejected'} successfully`,
        'success'
      );
      setVerificationDialog({ open: false, business: null, action: 'approve' });
      setVerificationForm({ notes: '', rejectionReason: '', notifyOwner: true });
      fetchData();
    } catch (error) {
      showSnackbar('Failed to update verification status', 'error');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'feature' | 'unfeature') => {
    if (selectedRows.length === 0) return;

    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/business-verification/bulk', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedRows,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      showSnackbar(`Bulk ${action} completed successfully`, 'success');
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      showSnackbar('Failed to perform bulk action', 'error');
    }
  };

  const handleRegisterBusiness = async () => {
    try {
      const formData = new FormData();
      Object.entries(registerForm).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value) {
          formData.append(key, value.toString());
        }
      });

      const token = getAuthToken();
      const response = await fetch('/api/admin/business-verification/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to register business');
      }

      showSnackbar('Business registered successfully', 'success');
      setRegisterDialog(false);
      setRegisterForm({
        businessName: '',
        ownerName: '',
        kenyanIdNumber: '',
        email: '',
        phone: '',
        category: '',
        registrationNumber: '',
        pinNumber: '',
        kenyanIdFront: null,
        kenyanIdBack: null,
        registrationCert: null,
        pinCert: null,
        logo: null,
      });
      fetchData();
    } catch (error) {
      showSnackbar('Failed to register business', 'error');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({ format, ...filters });
      
      const response = await fetch(`/api/admin/business-verification/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-listings.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showSnackbar('Failed to export data', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
            Business Verification Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and verify business registrations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setRegisterDialog(true)}
        >
          Register New Business
        </Button>
      </Box>

      {/* Filters and Search */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              placeholder="Search businesses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.verificationStatus}
                label="Status"
                onChange={(e) => setFilters({ ...filters, verificationStatus: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="re_verification">Re-verification</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Featured</InputLabel>
              <Select
                value={filters.featuredStatus}
                label="Featured"
                onChange={(e) => setFilters({ ...filters, featuredStatus: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Featured</MenuItem>
                <MenuItem value="false">Not Featured</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Advanced Filters">
                <IconButton
                  size="small"
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <FilterList fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Export CSV">
                <IconButton
                  size="small"
                  onClick={() => handleExport('csv')}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={fetchData}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedRows.length} selected
            </Typography>
            <Button size="small" variant="contained" color="success" onClick={() => handleBulkAction('approve')}>
              Bulk Approve
            </Button>
            <Button size="small" variant="contained" color="error" onClick={() => handleBulkAction('reject')}>
              Bulk Reject
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleBulkAction('feature')}>
              Bulk Feature
            </Button>
          </Box>
        )}
      </Paper>

      {/* Data Table */}
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
        checkboxSelection
        onRowSelectionModelChange={setSelectedRows}
        rowSelectionModel={selectedRows}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={() => setActionMenu({ anchorEl: null, business: null })}
      >
        <MenuItem onClick={() => actionMenu.business && setPreviewDialog({ open: true, business: actionMenu.business })}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        
        {actionMenu.business?.verificationStatus === 'pending' && (
          <>
            <MenuItem onClick={() => actionMenu.business && handleVerificationAction(actionMenu.business, 'approve')}>
              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
              <ListItemText>Approve</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => actionMenu.business && handleVerificationAction(actionMenu.business, 'reject')}>
              <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Reject</ListItemText>
            </MenuItem>
          </>
        )}
        
        <MenuItem onClick={() => actionMenu.business && handleDownloadAll(actionMenu.business)}>
          <ListItemIcon><CloudDownload fontSize="small" /></ListItemIcon>
          <ListItemText>Download All</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Quick Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Flag fontSize="small" /></ListItemIcon>
          <ListItemText>Flag Suspicious</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {}}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Document Preview Dialog */}
      <Dialog
        open={documentDialog.open}
        onClose={() => setDocumentDialog({ open: false, url: '', title: '', type: 'image' })}
        maxWidth="lg"
        fullWidth
        container={() => document.getElementById('main-content') || document.body}
        style={{ position: 'absolute' }}
        BackdropProps={{
          style: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        PaperProps={{
          sx: {
            position: 'absolute',
            m: 2,
            maxHeight: 'calc(100vh - 200px)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {documentDialog.title}
          <Box>
            <IconButton onClick={() => {}}>
              <ZoomIn />
            </IconButton>
            <IconButton onClick={() => {}}>
              <RotateRight />
            </IconButton>
            <IconButton onClick={() => {
              if (!documentDialog.url) return;
              
              // Handle data URLs (base64 content)
              if (documentDialog.url.startsWith('data:')) {
                try {
                  const html = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>${documentDialog.title}</title>
                        <meta charset="UTF-8">
                        <style>
                          body {
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            background: #f5f5f5;
                          }
                          img {
                            max-width: 100%;
                            max-height: 90vh;
                            object-fit: contain;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            background: white;
                            padding: 10px;
                            border-radius: 4px;
                          }
                        </style>
                      </head>
                      <body>
                        <img src="${documentDialog.url}" alt="${documentDialog.title}" onerror="document.body.innerHTML='<p style=color:red>Failed to load document</p>'" />
                      </body>
                    </html>
                  `;
                  
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(html);
                    newWindow.document.close();
                  }
                } catch (error) {
                  console.error('Error opening document:', error);
                  alert('Failed to open document. Please try again.');
                }
              } else {
                window.open(documentDialog.url, '_blank');
              }
            }}>
              <Download />
            </IconButton>
            <IconButton onClick={() => setDocumentDialog({ open: false, url: '', title: '', type: 'image' })}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {documentDialog.type === 'image' ? (
            <img
              src={documentDialog.url}
              alt={documentDialog.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <iframe
              src={documentDialog.url}
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title={documentDialog.title}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Business Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, business: null })}
        maxWidth="lg"
        fullWidth
        container={() => document.getElementById('main-content') || document.body}
        style={{ position: 'absolute' }}
        BackdropProps={{
          style: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        PaperProps={{
          sx: {
            position: 'absolute',
            m: 2,
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'auto',
          },
        }}
      >
        <DialogTitle>Business Preview - {previewDialog.business?.businessName}</DialogTitle>
        <DialogContent>
          {previewDialog.business && (
            <Box>
              <Tabs value={previewTab} onChange={(_, newValue) => setPreviewTab(newValue)}>
                <Tab label="Basic Info" />
                <Tab label="Documents" />
                <Tab label="Profile Fields" />
                <Tab label="Verification History" />
              </Tabs>
              
              {previewTab === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Business Information</Typography>
                          <Typography><strong>Name:</strong> {previewDialog.business.businessName}</Typography>
                          <Typography><strong>Category:</strong> {previewDialog.business.category}</Typography>
                          <Typography><strong>Registration:</strong> {previewDialog.business.registrationNumber}</Typography>
                          <Typography><strong>PIN:</strong> {previewDialog.business.pinNumber}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Owner Information</Typography>
                          <Typography><strong>Name:</strong> {previewDialog.business.ownerName}</Typography>
                          <Typography><strong>Email:</strong> {previewDialog.business.email}</Typography>
                          <Typography><strong>Phone:</strong> {previewDialog.business.phone}</Typography>
                          <Typography><strong>ID Number:</strong> {previewDialog.business.kenyanId.number}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {previewTab === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    {previewDialog.business.logo && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="200"
                            image={previewDialog.business.logo}
                            alt="Business Logo"
                          />
                          <CardContent>
                            <Typography variant="subtitle2">Business Logo</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    {/* Add more document previews */}
                  </Grid>
                </Box>
              )}
              
              {previewTab === 2 && (
                <Box sx={{ mt: 2 }}>
                  {Object.entries(previewDialog.business.businessProfile).map(([key, value]) => (
                    <Accordion key={key}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography>{JSON.stringify(value, null, 2)}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
              
              {previewTab === 3 && (
                <Box sx={{ mt: 2 }}>
                  <List>
                    {previewDialog.business.verificationNotes.map((note) => (
                      <ListItem key={note.id} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: note.type === 'error' ? 'error.main' : 
                                    note.type === 'success' ? 'success.main' :
                                    note.type === 'warning' ? 'warning.main' : 'primary.main',
                            width: 32, 
                            height: 32 
                          }}>
                            {note.type === 'error' ? '!' : 
                             note.type === 'success' ? '✓' :
                             note.type === 'warning' ? '⚠' : 'i'}
                          </Avatar>
                        </ListItemAvatar>
                        <MuiListItemText
                          primary={note.note}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              By {note.createdBy} • {new Date(note.createdAt).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                    {previewDialog.business.verificationNotes.length === 0 && (
                      <ListItem>
                        <MuiListItemText
                          primary="No verification history"
                          secondary="This business has no verification notes yet."
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, business: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Verification Action Dialog */}
      <Dialog
        open={verificationDialog.open}
        onClose={() => setVerificationDialog({ open: false, business: null, action: 'approve' })}
        maxWidth="sm"
        fullWidth
        container={() => document.getElementById('main-content') || document.body}
        style={{ position: 'absolute' }}
        BackdropProps={{
          style: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        PaperProps={{
          sx: {
            position: 'absolute',
            m: 2,
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'auto',
          },
        }}
      >
        <DialogTitle>
          {verificationDialog.action === 'approve' ? 'Approve Business' : 'Reject Business'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={verificationDialog.action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              value={verificationDialog.action === 'approve' ? verificationForm.notes : verificationForm.rejectionReason}
              onChange={(e) => setVerificationForm({
                ...verificationForm,
                [verificationDialog.action === 'approve' ? 'notes' : 'rejectionReason']: e.target.value
              })}
              multiline
              rows={4}
              fullWidth
              required={verificationDialog.action === 'reject'}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={verificationForm.notifyOwner}
                  onChange={(e) => setVerificationForm({ ...verificationForm, notifyOwner: e.target.checked })}
                />
              }
              label="Notify business owner via email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog({ open: false, business: null, action: 'approve' })}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitVerification}
            variant="contained"
            color={verificationDialog.action === 'approve' ? 'success' : 'error'}
            disabled={verificationDialog.action === 'reject' && !verificationForm.rejectionReason}
          >
            {verificationDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Business Dialog */}
      <Dialog
        open={registerDialog}
        onClose={() => setRegisterDialog(false)}
        maxWidth="md"
        fullWidth
        container={() => document.getElementById('main-content') || document.body}
        style={{ position: 'absolute' }}
        BackdropProps={{
          style: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        PaperProps={{
          sx: {
            position: 'absolute',
            m: 2,
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'auto',
          },
        }}
      >
        <DialogTitle>Register New Business</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Business Name"
                  value={registerForm.businessName}
                  onChange={(e) => setRegisterForm({ ...registerForm, businessName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Owner Name"
                  value={registerForm.ownerName}
                  onChange={(e) => setRegisterForm({ ...registerForm, ownerName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Kenyan ID Number"
                  value={registerForm.kenyanIdNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, kenyanIdNumber: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Phone"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={registerForm.category}
                    label="Category"
                    onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                  >
                    <MenuItem value="Agriculture">Agriculture</MenuItem>
                    <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                    <MenuItem value="Services">Services</MenuItem>
                    <MenuItem value="Technology">Technology</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* File uploads would go here */}
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Document Uploads
                </Typography>
                {/* Add file upload components */}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialog(false)}>Cancel</Button>
          <Button onClick={handleRegisterBusiness} variant="contained">
            Register Business
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}