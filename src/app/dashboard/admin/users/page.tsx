'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, User } from '@/lib/api';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  AdminTableWrapper, 
  TableColumn, 
  PaginationModel, 
  SortModel 
} from '@/components/admin/AdminTableWrapper';
import { 
  Delete,
  Visibility,
  Search,
  Download,
  PersonAdd,
  FilterList,
  Shield,
  Block,
  LockOpen,
  Email as EmailIcon,
} from '@mui/icons-material';

import { UserDetailsDialog } from '@/components/admin/user-details-dialog';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';
import { AdminEmailDialog } from '@/components/admin/admin-email-dialog';
import { toast } from '@/hooks/use-toast';

export default function UserManagementPage() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [emailDialogUser, setEmailDialogUser] = useState<{ email: string; name: string } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    role: '',
    emailVerified: '',
    businessStatus: '',
  });
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<{ id: string; suspended: boolean; name: string } | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const getRoleChipColor = (role: string): 'error' | 'info' | 'success' | 'default' => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'EXPORTER':
        return 'info';
      case 'BUYER':
        return 'success';
      default:
        return 'default';
    }
  };

  const columns: TableColumn[] = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: isMobile ? 200 : 250,
      renderCell: (params) => {
        try {
          const row = params.row;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={row.profileImage || row.avatar} sx={{ width: 36, height: 36 }}>
                {row.firstName?.charAt(0) || row.email?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.firstName} {row.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.email}
                </Typography>
              </Box>
            </Box>
          );
        } catch (error) {

          return 'N/A';
        }
      },
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value as string}
          color={getRoleChipColor(params.value as string)}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'business',
      headerName: 'Business',
      width: isTablet ? 150 : 200,
      valueGetter: (params) => {
        try {
          return params?.row?.business?.name || 'No business';
        } catch (error) {

          return 'N/A';
        }
      },
    },
    {
      field: 'verificationStatus',
      headerName: 'Business Status',
      width: 150,
      renderCell: (params) => {
        try {
          const business = params?.row?.business;
          if (!business) return <Typography variant="caption" color="text.secondary">-</Typography>;
          return (
            <Chip
              label={business.verificationStatus}
              size="small"
              color={business.verificationStatus === 'VERIFIED' || business.verificationStatus === 'APPROVED' ? 'success' : 'warning'}
              variant="outlined"
            />
          );
        } catch (error) {

          return '-';
        }
      },
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" color="text.secondary">No Date</Typography>;
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return <Typography variant="body2" color="text.secondary">Invalid Date</Typography>;
        return <Typography variant="body2">{date.toLocaleDateString()}</Typography>;
      },
    },
    {
      field: 'emailVerified',
      headerName: 'Email Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Verified' : 'Pending'}
          size="small"
          color={params.value ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'suspended',
      headerName: 'Account',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Suspended' : 'Active'}
          size="small"
          color={params.value ? 'error' : 'success'}
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleViewUser(params.row)}>
              <Visibility sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.suspended ? 'Unsuspend User' : 'Suspend User'}>
            <IconButton
              size="small"
              color={params.row.suspended ? 'success' : 'warning'}
              onClick={() => {
                setUserToSuspend({
                  id: params.row.id,
                  suspended: params.row.suspended,
                  name: `${params.row.firstName} ${params.row.lastName}`,
                });
                setSuspendConfirmOpen(true);
              }}
            >
              {params.row.suspended ? <LockOpen sx={{ fontSize: 18 }} /> : <Block sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          {isSuperAdmin && (
            <Tooltip title="Delete User">
              <IconButton size="small" color="error" onClick={() => {
                setUserToDelete(params?.row?.id);
                setDeleteConfirmOpen(true);
              }}>
                <Delete sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={`Send email to ${params.row.email}`}>
            <IconButton size="small" color="info" onClick={() => setEmailDialogUser({ email: params.row.email, name: `${params.row.firstName} ${params.row.lastName}`.trim() })}>
              <EmailIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check if user has valid token before making request
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to access this page',
          variant: 'destructive'
        });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const response = await apiClient.getUsers();
      let users = response.users;

      // Regular admins cannot see other admins — filter them out
      if (!isSuperAdmin) {
        users = users.filter((u: User) => u.role !== 'ADMIN');
      }

      // Apply search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        users = users.filter((u: User) =>
          u.firstName?.toLowerCase().includes(search) ||
          u.lastName?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.business?.name?.toLowerCase().includes(search)
        );
      }

      // Apply advanced filters
      if (advancedFilters.role) {
        users = users.filter((u: User) => u.role === advancedFilters.role);
      }

      if (advancedFilters.emailVerified) {
        const isVerified = advancedFilters.emailVerified === 'true';
        users = users.filter((u: User) => u.emailVerified === isVerified);
      }

      if (advancedFilters.businessStatus) {
        users = users.filter((u: User) => 
          u.business?.verificationStatus === advancedFilters.businessStatus
        );
      }

      // Apply sorting
      if (sortModel.length > 0) {
        const { field, sort } = sortModel[0];
        users.sort((a: any, b: any) => {
          let aVal = a[field];
          let bVal = b[field];
          
          if (field === 'business') {
            aVal = a.business?.name || '';
            bVal = b.business?.name || '';
          }
          
          if (aVal < bVal) return sort === 'asc' ? -1 : 1;
          if (aVal > bVal) return sort === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // Apply pagination
      const start = paginationModel.page * paginationModel.pageSize;
      const end = start + paginationModel.pageSize;
      const paginatedUsers = users.slice(start, end);

      setData({ data: paginatedUsers, total: users.length });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && (
        error.message.includes('Unauthorized') || 
        error.message.includes('Authentication required') ||
        error.message.includes('session has expired')
      )) {
        // Clear all auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }

      toast({
        title: 'Error',
        description: 'Failed to load users. Please try refreshing the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchData();
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, paginationModel, sortModel, debouncedSearch, advancedFilters]);

  const handleViewUser = (userData: User) => {
    setSelectedUser(userData);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteUser = async (directId?: string) => {
    const id = directId || userToDelete;
    if (!id) return;

    try {
      await apiClient.deleteUser(id);
      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend) return;
    try {
      const response = await fetch(`/api/admin/users/${userToSuspend.id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ suspended: !userToSuspend.suspended }),
      });
      if (!response.ok) throw new Error('Failed to update suspension status');
      toast({
        title: 'Success',
        description: userToSuspend.suspended
          ? `${userToSuspend.name} has been unsuspended`
          : `${userToSuspend.name} has been suspended`,
      });
      setSuspendConfirmOpen(false);
      setUserToSuspend(null);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user suspension status',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {    const ids = Array.isArray(selectedRows) ? selectedRows : Array.from(selectedRows);
    if (!confirm(`Delete ${ids.length} users? This action cannot be undone.`)) return;
    
    try {
      const result = await apiClient.bulkDeleteUsers(ids.map(String));
      toast({
        title: 'Success',
        description: result.message || `${result.count} users deleted successfully`
      });
      setSelectedRows([]);
      fetchData();
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to delete users',
        variant: 'destructive'
      });
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      let users = response.users;

      // Apply same filters as current view
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        users = users.filter((u: User) =>
          u.firstName?.toLowerCase().includes(search) ||
          u.lastName?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.business?.name?.toLowerCase().includes(search)
        );
      }

      if (advancedFilters.role) {
        users = users.filter((u: User) => u.role === advancedFilters.role);
      }

      if (advancedFilters.emailVerified) {
        const isVerified = advancedFilters.emailVerified === 'true';
        users = users.filter((u: User) => u.emailVerified === isVerified);
      }

      if (advancedFilters.businessStatus) {
        users = users.filter((u: User) => 
          u.business?.verificationStatus === advancedFilters.businessStatus
        );
      }

      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Role',
        'Super Admin',
        'Suspended',
        'Email Verified',
        'Phone Number',
        'Location',
        'Company',
        'Position',
        'Business Name',
        'Business Status',
        'Joined Date',
        'Last Login',
      ];

      const rows = users.map((u: User) => [
        u.firstName || '',
        u.lastName || '',
        u.email || '',
        u.role || '',
        (u as any).isSuperAdmin ? 'Yes' : 'No',
        (u as any).suspended ? 'Yes' : 'No',
        u.emailVerified ? 'Yes' : 'No',
        u.phoneNumber || 'N/A',
        (u as any).location || 'N/A',
        (u as any).company || 'N/A',
        (u as any).position || 'N/A',
        u.business?.name || 'N/A',
        u.business?.verificationStatus || 'N/A',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
        (u as any).lastLoginAt ? new Date((u as any).lastLoginAt).toLocaleString() : 'N/A',
      ].map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }));

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Exported ${users.length} users to CSV`,
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

  if (!user || user.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Shield sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Access Denied
        </Typography>
        <Typography color="text.secondary">
          You need admin privileges to access user management.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
          User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system users, roles, and permissions
        </Typography>
      </Box>

      {/* Search and Actions Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        {/* Role Toggle Strip */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
          {(['', ...(isSuperAdmin ? ['ADMIN'] : []), 'EXPORTER', 'BUYER'] as const).map((role) => {
            const label = role === '' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase();
            const isActive = advancedFilters.role === role;
            return (
              <Button
                key={role}
                size="small"
                variant={isActive ? 'contained' : 'outlined'}
                color={isActive ? (role === 'ADMIN' ? 'error' : role === 'EXPORTER' ? 'info' : role === 'BUYER' ? 'success' : 'primary') : 'inherit'}
                onClick={() => setAdvancedFilters({ ...advancedFilters, role })}
                sx={{ 
                  minWidth: 80, 
                  textTransform: 'none', 
                  fontWeight: isActive ? 600 : 400,
                  borderColor: isActive ? undefined : 'divider',
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Field */}
          <TextField
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Tooltip title="Download CSV">
              <IconButton 
                size="small" 
                onClick={handleExport}
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  flex: { xs: 1, sm: 0 },
                  minWidth: '40px',
                  height: '40px',
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isSuperAdmin && (
              <Tooltip title="Add User">
                <IconButton 
                  size="small"
                  onClick={() => setIsCreateDialogOpen(true)}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    flex: { xs: 1, sm: 0 },
                    minWidth: '40px',
                    height: '40px',
                  }}
                >
                  <PersonAdd fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Advanced Filters">
              <IconButton 
                size="small"
                onClick={() => setFilterDialogOpen(true)}
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  flex: { xs: 1, sm: 0 },
                  minWidth: '40px',
                  height: '40px',
                }}
              >
                <FilterList fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Bulk Actions */}
        {Array.isArray(selectedRows) && selectedRows.length > 0 && isSuperAdmin && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Chip 
              label={`${selectedRows.length} selected`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Button 
              size="small" 
              variant="contained" 
              color="error" 
              onClick={handleBulkDelete}
              startIcon={<Delete />}
            >
              Delete
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

      {/* Error State */}
      {error && !loading && (
        <Paper elevation={0} sx={{ p: 3, mt: 2, textAlign: 'center', border: '1px solid', borderColor: 'error.main' }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRetry}
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        </Paper>
      )}

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={fetchData}
        isSuperAdmin={isSuperAdmin}
        onDeleteUser={(userId) => {
          setUserToDelete(userId);
          setIsDetailsDialogOpen(false);
          setSelectedUser(null);
          handleDeleteUser(userId);
        }}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onUserCreated={fetchData}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
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
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setUserToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteUser()}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <Dialog
        open={suspendConfirmOpen}
        onClose={() => { setSuspendConfirmOpen(false); setUserToSuspend(null); }}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, zIndex: 9999 },
          zIndex: 9998,
        }}
      >
        <DialogTitle>
          {userToSuspend?.suspended ? 'Unsuspend User' : 'Suspend User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {userToSuspend?.suspended
              ? `Are you sure you want to unsuspend ${userToSuspend?.name}? They will regain access to the platform.`
              : `Are you sure you want to suspend ${userToSuspend?.name}? They will lose access to the platform.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSuspendConfirmOpen(false); setUserToSuspend(null); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSuspendUser}
            color={userToSuspend?.suspended ? 'success' : 'warning'}
            variant="contained"
          >
            {userToSuspend?.suspended ? 'Unsuspend' : 'Suspend'}
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
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={advancedFilters.role}
                label="Role"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, role: e.target.value })}
                MenuProps={{
                  sx: {
                    zIndex: 10000,
                  },
                  disablePortal: false,
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {isSuperAdmin && <MenuItem value="ADMIN">Admin</MenuItem>}
                <MenuItem value="EXPORTER">Exporter</MenuItem>
                <MenuItem value="BUYER">Buyer</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Email Status</InputLabel>
              <Select
                value={advancedFilters.emailVerified}
                label="Email Status"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, emailVerified: e.target.value })}
                MenuProps={{
                  sx: {
                    zIndex: 10000,
                  },
                  disablePortal: false,
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Verified</MenuItem>
                <MenuItem value="false">Not Verified</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Business Status</InputLabel>
              <Select
                value={advancedFilters.businessStatus}
                label="Business Status"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, businessStatus: e.target.value })}
                MenuProps={{
                  sx: {
                    zIndex: 10000,
                  },
                  disablePortal: false,
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAdvancedFilters({ role: '', emailVerified: '', businessStatus: '' });
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

      {/* Admin Email Dialog */}
      {emailDialogUser && (
        <AdminEmailDialog
          open={!!emailDialogUser}
          onClose={() => setEmailDialogUser(null)}
          recipientEmail={emailDialogUser.email}
          recipientName={emailDialogUser.name}
        />
      )}
    </Box>
  );
}