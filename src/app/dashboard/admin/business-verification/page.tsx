/**
 * Unified Business Verification Page
 * Combines functionality from both /businesses and /business-verifications
 * Uses the new v2 API endpoint for all operations
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Paper, Avatar } from '@mui/material';
import { useAuth } from '@/contexts/auth-context';
import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { DocumentPreviewDialog } from '@/components/admin/document-preview-dialog';
import { 
  CheckCircle, 
  Cancel, 
  Visibility,
  Star,
  StarBorder,
  Download,
  PersonAdd,
  Search,
  FilterList,
  PublishedWithChanges,
  UnpublishedOutlined,
  DeleteForever,
  Email,
} from '@mui/icons-material';
import { toast } from '@/hooks/use-toast';
import { ALL_SECTORS, COUNTIES, RATING_FILTERS } from '@/lib/constants';

export default function BusinessVerificationPage() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.isSuperAdmin === true;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [previewBusiness, setPreviewBusiness] = useState<any>(null);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [businessToReject, setBusinessToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [businessToVerify, setBusinessToVerify] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    sector: '',
    county: '',
    featured: '',
    rating: '',
    published: '',
  });
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [featureConfirmOpen, setFeatureConfirmOpen] = useState(false);
  const [businessToFeature, setBusinessToFeature] = useState<string | null>(null);
  const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
  const [businessToHardDelete, setBusinessToHardDelete] = useState<string | null>(null);

  // Fetch available sectors from database, but always include ALL_SECTORS as fallback
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/admin/business-verification-v2?page=1&pageSize=1000', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          // Extract unique sectors from businesses
          const dbSectors = Array.from(new Set(
            result.data
              .map((business: any) => business.sector)
              .filter((sector: string) => sector && sector.trim() !== '')
          )).sort();
          
          // Merge database sectors with ALL_SECTORS constant, removing duplicates
          const mergedSectors = [...new Set([...ALL_SECTORS, ...dbSectors])];
          setAvailableSectors(mergedSectors as string[]);
        } else {
          // If API fails, use ALL_SECTORS constant
          setAvailableSectors([...ALL_SECTORS]);
        }
      } catch (error) {
        console.error('Failed to fetch sectors:', error);
        // Fallback to ALL_SECTORS constant if fetch fails
        setAvailableSectors([...ALL_SECTORS]);
      }
    };

    fetchSectors();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const columns: TableColumn[] = [
    { 
      field: 'name', 
      headerName: 'Business Name', 
      flex: 1, 
      minWidth: isMobile ? 200 : 250,
      renderCell: (params: any) => {
        try {
          const row = params.row;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar 
                src={row.logoUrl} 
                sx={{ width: 36, height: 36 }}
                variant="rounded"
              >
                {row.name?.charAt(0) || 'B'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                  {row.name}
                </Typography>
                {row.sector && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {row.sector}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        } catch (error) {
          return <Typography variant="body2">{params.row?.name || 'N/A'}</Typography>;
        }
      },
    },
    { 
      field: 'contactEmail', 
      headerName: 'Email', 
      width: isTablet ? 180 : 200,
    },
    { 
      field: 'contactPhone', 
      headerName: 'Phone', 
      width: 150,
    },
    { 
      field: 'location', 
      headerName: 'Location', 
      width: 150,
    },
    { 
      field: 'sector', 
      headerName: 'Sector', 
      width: 150,
    },
    {
      field: 'certifications',
      headerName: 'Certs',
      width: 80,
      renderCell: (params: any) => {
        const certs = params.row?.certifications || [];
        const count = Array.isArray(certs) ? certs.length : 0;
        return count > 0 ? (
          <Chip 
            label={count} 
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">0</Typography>
        );
      },
    },
    {
      field: 'documents',
      headerName: 'Docs',
      width: 80,
      renderCell: (params: any) => {
        const hasDocs = !!(params.row?.registrationCertificateUrl || params.row?.pinCertificateUrl || params.row?.incorporationCertificateUrl || params.row?.exportLicenseUrl || params.row?.taxCertificateUrl);
        return hasDocs ? (
          <Chip 
            label="Yes" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">No</Typography>
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
      field: 'verificationStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params: any) => {
        const status = params.row?.verificationStatus || 'UNKNOWN';
        const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
          VERIFIED: 'success',
          APPROVED: 'success',
          PENDING: 'warning',
          REJECTED: 'error',
        };
        return (
          <Chip
            label={status}
            color={colorMap[status] || 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 180,
      renderCell: (params: any) => {
        const owner = params.row?.owner;
        if (!owner) {
          return <Typography variant="body2" color="text.secondary">No Owner</Typography>;
        }
        const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
        return <Typography variant="body2">{fullName || owner.email || 'Unknown'}</Typography>;
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
                      description: 'Unable to load business details. Please refresh and try again.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  setPreviewBusiness(row);
                }}
              >
                <Visibility sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Email">
              <IconButton
                size="small"
                color="info"
                onClick={() => {
                  const email = row?.contactEmail || row?.companyEmail || row?.owner?.email;
                  if (!email) return;
                  const a = document.createElement('a');
                  a.href = `mailto:${email}`;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Email sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.featured ? 'Unfeature' : 'Feature'}>
              <IconButton 
                size="small" 
                color="warning"
                onClick={() => {
                  setBusinessToFeature(row.id);
                  setFeatureConfirmOpen(true);
                }}
              >
                {row.featured ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            {(row?.verificationStatus === 'PENDING' || row?.verificationStatus === 'REJECTED') && (
              <Tooltip title="Verify">
                <IconButton size="small" color="success" onClick={() => {
                  setBusinessToVerify(row?.id);
                  setVerifyDialogOpen(true);
                }}>
                  <CheckCircle sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {(row?.verificationStatus === 'PENDING' || row?.verificationStatus === 'VERIFIED') && (
              <Tooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => {
                  setBusinessToReject(row?.id);
                  setRejectDialogOpen(true);
                }}>
                  <Cancel sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={row.published === false ? 'Publish (make visible in directory)' : 'Unpublish (hide from directory)'}>
              <IconButton 
                size="small" 
                color={row.published === false ? 'success' : 'warning'}
                onClick={() => {
                  setBusinessToDelete(row.id);
                  setDeleteConfirmOpen(true);
                }}
              >
                {row.published === false 
                  ? <PublishedWithChanges sx={{ fontSize: 18 }} /> 
                  : <UnpublishedOutlined sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            {isSuperAdmin && (
              <Tooltip title="Delete Business (Super Admin)">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setBusinessToHardDelete(row.id);
                    setHardDeleteConfirmOpen(true);
                  }}
                >
                  <DeleteForever sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  const fetchData = async () => {
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

      // Add advanced filters
      if (advancedFilters.sector) {
        params.append('sector', advancedFilters.sector);
      }
      if (advancedFilters.county) {
        params.append('county', advancedFilters.county);
      }
      if (advancedFilters.featured) {
        params.append('featured', advancedFilters.featured);
      }
      if (advancedFilters.rating) {
        params.append('minRating', advancedFilters.rating);
      }
      if (advancedFilters.published !== '') {
        params.append('published', advancedFilters.published);
      }

      const response = await fetch(`/api/admin/business-verification-v2?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      
      const result = await response.json();

      setData(result);
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to load businesses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, debouncedSearch, statusFilter, advancedFilters]);

  const handleApprove = async (id: string, note?: string) => {
    try {
      const response = await fetch(`/api/admin/business-verification-v2`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id,
          action: 'approve',
          notes: note || undefined,
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
          item.id === id ? { ...item, verificationStatus: 'VERIFIED' } : item
        )
      }));
      
      toast({
        title: 'Success',
        description: result.message || 'Business verified successfully',
      });
      
      fetchData();
    } catch (error) {

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve business',
        variant: 'destructive',
      });
      fetchData();
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/business-verification-v2`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id,
          action: 'reject',
          notes: reason || rejectionReason || 'Business does not meet verification requirements',
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
          item.id === id ? { ...item, verificationStatus: 'REJECTED', verificationNotes: reason || rejectionReason } : item
        )
      }));
      
      toast({
        title: 'Success',
        description: result.message || 'Business rejected successfully',
      });
      
      // Reset rejection dialog state
      setRejectDialogOpen(false);
      setBusinessToReject(null);
      setRejectionReason('');
      
      fetchData();
    } catch (error) {

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject business',
        variant: 'destructive',
      });
      fetchData();
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus?: boolean) => {
    // Ensure currentStatus is a boolean (default to false if undefined)
    const isFeatured = currentStatus === true;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/business-verification-v2/feature', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, featured: !isFeatured }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update featured status');
      }
      
      const result = await response.json();
      
      setData((prevData: any) => ({
        ...prevData,
        data: prevData.data.map((item: any) => 
          item.id === id ? { ...item, featured: !isFeatured } : item
        )
      }));
      
      toast({
        title: 'Success',
        description: result.message || `Business ${!isFeatured ? 'featured' : 'unfeatured'} successfully`,
      });

      fetchData();
    } catch (error) {

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update featured status',
        variant: 'destructive',
      });
      fetchData();
    }
  };

  const handleBulkApprove = async () => {
    const ids = selectedRows;
    try {
      await Promise.all(ids.map(id => handleApprove(id)));
      setSelectedRows([]);
      fetchData();
    } catch (error) {

    }
  };

  const handleBulkReject = async () => {
    if (!confirm('Are you sure you want to reject all selected businesses? You will need to provide a reason.')) {
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
      fetchData();
    } catch (error) {

    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL businesses (no pagination) with all fields
      const params = new URLSearchParams({
        page: '0',
        pageSize: '10000', // Large number to get all
        sortField: 'createdAt',
        sortOrder: 'desc',
        search: debouncedSearch,
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Add advanced filters
      if (advancedFilters.sector) params.append('sector', advancedFilters.sector);
      if (advancedFilters.county) params.append('county', advancedFilters.county);
      if (advancedFilters.featured) params.append('featured', advancedFilters.featured);
      if (advancedFilters.rating) params.append('minRating', advancedFilters.rating);
      if (advancedFilters.published !== '') params.append('published', advancedFilters.published);

      const response = await fetch(`/api/admin/business-verification-v2?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data for export');
      
      const result = await response.json();
      const businesses = result.data || [];

      // CSV Headers - All fields from view details
      const headers = [
        // Basic Info
        'Business Name',
        'Description',
        'Company Story',
        'Verification Status',
        'Rating',
        'Featured',
        'Profile Complete',

        // Location
        'Location',
        'County',
        'Town',
        'Sector',
        'Industry',
        'Physical Address',
        'Coordinates',

        // Business Details
        'Type of Business',
        'Organization',
        'Company Size',
        'Number of Employees',
        'Date of Incorporation',
        'Legal Structure',

        // Registration
        'Registration Number',
        'KRA PIN',
        'Export License',
        'Licence Number',
        'National ID',

        // Products & Services
        'Products / Services',
        'Product HS Code',

        // Primary Contact (from Registration)
        'Primary Contact First Name',
        'Primary Contact Last Name',
        'Primary Contact Email',
        'Primary Contact Phone',

        // Contact
        'Contact Email',
        'Company Email',
        'Contact Phone',
        'Mobile Number',
        'WhatsApp Number',
        'Website',
        'Instagram',
        'Twitter',

        // Export Info
        'Current Export Markets',
        'Export Volume (3yrs)',
        'Production Capacity (3yrs)',

        // Owner Info
        'Owner Name',
        'Owner Email',
        'Owner Phone',

        // Verification
        'Verification Notes',
        'Featured At',
        'Featured By',
        'Documents Uploaded At',
        'Created At',
        'Updated At',
      ];

      // CSV Rows
      const rows = businesses.map((b: any) => {
        const owner = b.owner || {};
        const ownerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'N/A';

        return [
          // Basic Info
          b.name || '',
          b.description || '',
          b.companyStory || '',
          b.verificationStatus || '',
          b.rating || '',
          b.featured ? 'Yes' : 'No',
          b.profileComplete ? 'Yes' : 'No',

          // Location
          b.location || '',
          b.county || '',
          b.town || '',
          b.sector || '',
          b.industry || '',
          b.physicalAddress || '',
          b.coordinates || '',

          // Business Details
          b.typeOfBusiness || '',
          b.businessUserOrganisation || '',
          b.companySize || '',
          b.numberOfEmployees || '',
          b.dateOfIncorporation || '',
          b.legalStructure || '',

          // Registration
          b.registrationNumber || '',
          b.kraPin || '',
          b.exportLicense || '',
          b.licenceNumber || '',
          b.kenyanNationalId || '',

          // Products & Services
          b.serviceOffering || '',
          b.productHsCode || '',

          // Primary Contact (from Registration)
          b.primaryContactFirstName || '',
          b.primaryContactLastName || '',
          b.primaryContactEmail || '',
          b.primaryContactPhone || '',

          // Contact
          b.contactEmail || '',
          b.companyEmail || '',
          b.contactPhone || '',
          b.mobileNumber || '',
          b.whatsappNumber || '',
          b.website || '',
          b.instagramUrl || '',
          b.twitterUrl || '',

          // Export Info
          b.currentExportMarkets || '',
          b.exportVolumePast3Years || '',
          b.productionCapacityPast3 || '',

          // Owner Info
          ownerName,
          owner.email || '',
          owner.phoneNumber || '',

          // Verification
          b.verificationNotes || '',
          b.featuredAt ? new Date(b.featuredAt).toLocaleString() : '',
          b.featuredBy || '',
          b.documentsUploadedAt ? new Date(b.documentsUploadedAt).toLocaleString() : '',
          b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
          b.updatedAt ? new Date(b.updatedAt).toLocaleString() : '',
        ].map(field => {
          // Escape fields containing commas, quotes, or newlines
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `business-verification-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Exported ${businesses.length} businesses to CSV`,
      });
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!businessToDelete) return;

    // Find current published state
    const business = data.data.find((b: any) => b.id === businessToDelete);
    const currentlyPublished = business?.published !== false; // default true
    const newPublished = !currentlyPublished;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/business-verification-v2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: businessToDelete, action: 'togglePublish', published: newPublished }),
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      setData((prev: any) => ({
        ...prev,
        data: prev.data.map((b: any) => b.id === businessToDelete ? { ...b, published: newPublished } : b),
      }));

      toast({
        title: 'Success',
        description: newPublished ? 'Business is now visible in the directory' : 'Business is now hidden from the directory',
      });
      setDeleteConfirmOpen(false);
      setBusinessToDelete(null);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update business visibility',
        variant: 'destructive',
      });
    }
  };

  const handleHardDelete = async () => {
    if (!businessToHardDelete) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/businesses/${businessToHardDelete}/delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast({ title: 'Business Deleted', description: 'The business has been permanently deleted.' });
      setHardDeleteConfirmOpen(false);
      setBusinessToHardDelete(null);
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete business', variant: 'destructive' });
    }
  };

  return (
    <Box sx={{ 
      pt: { xs: 1, sm: 2 }, 
      px: { xs: 1, sm: 0 }, 
      maxWidth: '100%', 
      overflow: 'hidden',
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
          Business Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and manage business verification requests
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ 
        p: 2, 
        mb: 3, 
        border: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        backgroundImage: 'none',
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search businesses..."
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
              <MenuItem value="all">All ({data.total || 0})</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="VERIFIED">Verified</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, order: { xs: 3, sm: 0 } }}>
            <Tooltip title="Download CSV">
              <IconButton 
                size="small" 
                onClick={handleExport}
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
            
            <Tooltip title="Register Business">
              <IconButton 
                size="small"
                onClick={() => setRegisterDialogOpen(true)}
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  flex: 1,
                  minWidth: '40px',
                  height: '40px',
                }}
              >
                <PersonAdd fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Advanced Filters">
              <IconButton 
                size="small"
                onClick={() => setFilterDialogOpen(true)}
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  flex: 1,
                  minWidth: '40px',
                  height: '40px',
                }}
              >
                <FilterList fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

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
              Approve ({selectedRows.length})
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

      <DocumentPreviewDialog
        open={!!previewBusiness}
        onClose={() => setPreviewBusiness(null)}
        business={previewBusiness}
        onApprove={(id) => {
          setBusinessToVerify(id);
          setVerifyDialogOpen(true);
          setPreviewBusiness(null);
        }}
        onReject={(id) => {
          setBusinessToReject(id);
          setRejectDialogOpen(true);
          setPreviewBusiness(null);
        }}
        onToggleFeatured={handleToggleFeatured}
        onDelete={(id) => {
          setBusinessToDelete(id);
          setDeleteConfirmOpen(true);
          setPreviewBusiness(null);
        }}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBusinessToDelete(null);
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
        <DialogTitle>Publish/Unpublish Business</DialogTitle>
        <DialogContent>
          <Typography>
            {data.data.find((b: any) => b.id === businessToDelete)?.published === false
              ? 'This business is currently hidden. Publish it to make it visible in the directory?'
              : 'This business is currently visible. Unpublish it to hide it from the directory?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setBusinessToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTogglePublish}
            color={data.data.find((b: any) => b.id === businessToDelete)?.published === false ? 'success' : 'warning'}
            variant="contained"
          >
            {data.data.find((b: any) => b.id === businessToDelete)?.published === false ? 'Publish' : 'Unpublish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feature Confirmation Dialog */}
      <Dialog
        open={featureConfirmOpen}
        onClose={() => {
          setFeatureConfirmOpen(false);
          setBusinessToFeature(null);
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
        <DialogTitle>Feature/Unfeature Business</DialogTitle>
        <DialogContent>
          <Typography>
            {data.data.find((b: any) => b.id === businessToFeature)?.featured
              ? 'This business is currently featured. Remove it from the featured section on the homepage?'
              : 'Feature this business? It will be highlighted in the featured section on the homepage.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFeatureConfirmOpen(false);
              setBusinessToFeature(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!businessToFeature) return;
              const business = data.data.find((b: any) => b.id === businessToFeature);
              handleToggleFeatured(businessToFeature, !!business?.featured);
              setFeatureConfirmOpen(false);
              setBusinessToFeature(null);
            }}
            color={data.data.find((b: any) => b.id === businessToFeature)?.featured ? 'error' : 'success'}
            variant="contained"
          >
            {data.data.find((b: any) => b.id === businessToFeature)?.featured ? 'Unfeature' : 'Yes, Feature'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false);
          setBusinessToVerify(null);
          setVerificationNote('');
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            zIndex: 9999,
          },
          '& .MuiBackdrop-root': { zIndex: 9998 },
          zIndex: 9998,
        }}
        slotProps={{ backdrop: { sx: { zIndex: 9998 } } }}
      >
        <DialogTitle>Verify Business</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to verify this business. Optionally add a note that will be sent to the business owner.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            label="Verification Note (optional)"
            placeholder="e.g., All documents verified. Welcome to the directory!"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setVerifyDialogOpen(false);
              setBusinessToVerify(null);
              setVerificationNote('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (businessToVerify) {
                handleApprove(businessToVerify, verificationNote || undefined);
                setVerifyDialogOpen(false);
                setBusinessToVerify(null);
                setVerificationNote('');
              }
            }}
            color="success"
            variant="contained"
          >
            Confirm Verification
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setBusinessToReject(null);
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
        <DialogTitle>Reject Business Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this business. This will be sent to the business owner.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Rejection Reason"
            placeholder="e.g., Missing required documents, Invalid registration number, etc."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="outlined"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRejectDialogOpen(false);
              setBusinessToReject(null);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (businessToReject) {
                handleReject(businessToReject, rejectionReason);
              }
            }}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Reject Business
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
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
        <DialogTitle sx={{ pb: 1 }}>
          <Box component="span" sx={{ fontWeight: 600, display: 'block' }}>
            Advanced Filters
          </Box>
          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
            Filter businesses by sector, location, and other criteria
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Sector Filter */}
            <FormControl fullWidth>
              <InputLabel id="sector-filter-label">Sector / Industry</InputLabel>
              <Select
                labelId="sector-filter-label"
                value={advancedFilters.sector}
                label="Sector / Industry"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, sector: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 400,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      },
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  sx: {
                    zIndex: 10000,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  All Sectors
                </MenuItem>
                {availableSectors.map((sector) => (
                  <MenuItem key={sector} value={sector}>
                    {sector}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* County Filter */}
            <FormControl fullWidth>
              <InputLabel id="county-filter-label">County / Location</InputLabel>
              <Select
                labelId="county-filter-label"
                value={advancedFilters.county}
                label="County / Location"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, county: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 400,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      },
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  sx: {
                    zIndex: 10000,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  All Counties
                </MenuItem>
                {COUNTIES.map((county) => (
                  <MenuItem key={county} value={county}>
                    {county}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Featured Filter */}
            <FormControl fullWidth>
              <InputLabel id="featured-filter-label">Featured Status</InputLabel>
              <Select
                labelId="featured-filter-label"
                value={advancedFilters.featured}
                label="Featured Status"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, featured: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      },
                    },
                  },
                  sx: {
                    zIndex: 10000,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  All Businesses
                </MenuItem>
                <MenuItem value="true">Featured Only</MenuItem>
                <MenuItem value="false">Not Featured</MenuItem>
              </Select>
            </FormControl>

            {/* Rating Filter */}
            <FormControl fullWidth>
              <InputLabel id="rating-filter-label">Minimum Rating</InputLabel>
              <Select
                labelId="rating-filter-label"
                value={advancedFilters.rating}
                label="Minimum Rating"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, rating: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      },
                    },
                  },
                  sx: {
                    zIndex: 10000,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  All Ratings
                </MenuItem>
                {RATING_FILTERS.map((rating) => (
                  <MenuItem key={rating.value} value={rating.value}>
                    {rating.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Listed / Published Filter */}
            <FormControl fullWidth>
              <InputLabel id="published-filter-label">Directory Listing</InputLabel>
              <Select
                labelId="published-filter-label"
                value={advancedFilters.published}
                label="Directory Listing"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, published: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: 'primary.light' },
                        },
                      },
                    },
                  },
                  sx: { zIndex: 10000 },
                }}
              >
                <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>All</MenuItem>
                <MenuItem value="true">Listed (Visible)</MenuItem>
                <MenuItem value="false">Unlisted (Hidden)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button 
            onClick={() => {
              setAdvancedFilters({ sector: '', county: '', featured: '', rating: '', published: '' });
              setFilterDialogOpen(false);
            }}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Clear All
          </Button>
          <Button 
            onClick={() => setFilterDialogOpen(false)}
            variant="contained"
            sx={{ minWidth: 120 }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={registerDialogOpen} 
        onClose={() => setRegisterDialogOpen(false)}
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
        <DialogTitle>Register New Business</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              To register a new business, please direct the business owner to:
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 2 }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/register
            </Typography>
            <Typography variant="body2" color="text.secondary">
              They will need to create an account and complete the business registration form.
              Once submitted, the business will appear here for verification.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register';
              window.open(url, '_blank');
            }}
          >
            Open Registration Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hard Delete Dialog — Super Admin Only */}
      {isSuperAdmin && (
        <Dialog
          open={hardDeleteConfirmOpen}
          onClose={() => { setHardDeleteConfirmOpen(false); setBusinessToHardDelete(null); }}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, zIndex: 9999 },
            '& .MuiBackdrop-root': { zIndex: 9998 },
            zIndex: 9998,
          }}
          slotProps={{ backdrop: { sx: { zIndex: 9998 } } }}
        >
          <DialogTitle sx={{ color: 'error.main' }}>⚠ Permanently Delete Business</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              <strong>This action cannot be undone.</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deleting this business will permanently remove it along with all associated products, certifications, ratings, and inquiries.
              The business owner&apos;s account will remain intact.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, p: 1.5, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark', fontWeight: 600 }}>
              Business: {data.data.find((b: any) => b.id === businessToHardDelete)?.name || businessToHardDelete}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setHardDeleteConfirmOpen(false); setBusinessToHardDelete(null); }}>
              Cancel
            </Button>
            <Button onClick={handleHardDelete} color="error" variant="contained">
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
