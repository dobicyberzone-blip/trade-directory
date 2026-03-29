'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, TextField, InputAdornment, Chip, Avatar,
  Select, MenuItem, FormControl, InputLabel, Paper, Tooltip,
  Tab, Tabs, Button, ButtonGroup,
} from '@mui/material';
import { Search, Refresh, Download } from '@mui/icons-material';
import { AdminTableWrapper, TableColumn, PaginationModel, SortModel } from '@/components/admin/AdminTableWrapper';
import { MainCard } from '@/components/ui-dashboard';
import { FileText, User, Activity, Shield, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string; role: string } | null;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot: string | null;
  afterSnapshot: string | null;
  ipAddress: string | null;
  timestamp: string;
  adminUser: { id: string; email: string; firstName: string; lastName: string; role: string } | null;
}

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  USER_DELETED: 'error', BUSINESS_DELETED: 'error', DELETE: 'error',
  USER_CREATED: 'success', BUSINESS_VERIFIED: 'success', CREATE: 'success',
  USER_UPDATED: 'info', BUSINESS_UPDATED: 'info', UPDATE: 'info',
  USER_SUSPENDED: 'warning', LOGIN: 'default',
};

export default function SystemLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Super Admin: tab 0 = Audit, tab 1 = Activity. Normal Admin: only tab 0 = Activity.
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<(ActivityLog | AuditLog)[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 50 });
  const [sortModel, setSortModel] = useState<SortModel[]>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // No longer needed — tab always starts at 0
  }, [isSuperAdmin, tab]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const buildParams = useCallback((extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      page: String(paginationModel.page + 1),
      limit: String(paginationModel.pageSize),
      // Super Admin: tab 0 = audit, tab 1 = activity. Normal Admin: tab 0 = activity.
      type: (isSuperAdmin && tab === 0) ? 'audit' : 'activity',
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(actionFilter && { action: actionFilter }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(userIdFilter && { userId: userIdFilter }),
      ...extra,
    });
    return params;
  }, [paginationModel, debouncedSearch, actionFilter, startDate, endDate, userIdFilter, tab]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/audit-logs?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setRows(json.logs || []);
      setTotal(json.pagination?.total || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setActionFilter('');
  }, [tab]);

  const handleExport = async (fmt: 'csv' | 'json') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = buildParams({ export: fmt, limit: '10000', page: '1' });
      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${isAuditTab ? 'audit' : 'activity'}-logs-${Date.now()}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* silently fail */ }
    finally { setExporting(false); }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setUserIdFilter('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const hasActiveFilters = !!(debouncedSearch || actionFilter || startDate || endDate || userIdFilter);

  const activityColumns: TableColumn[] = [
    {
      field: 'user', headerName: 'User', width: 200,
      renderCell: (params: any) => {
        const u = params.row.user;
        if (!u) return <Typography variant="caption" color="text.secondary">System</Typography>;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
              {u.firstName?.[0]}{u.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500} noWrap>{u.firstName} {u.lastName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'action', headerName: 'Action', width: 180,
      renderCell: (params: any) => (
        <Chip label={params.value?.replace(/_/g, ' ')} size="small"
          color={ACTION_COLORS[params.value] || 'default'} variant="outlined"
          sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
      ),
    },
    {
      field: 'description', headerName: 'Details', flex: 1,
      renderCell: (params: any) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{params.value || '—'}</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'ipAddress', headerName: 'IP Address', width: 130,
      renderCell: (params: any) => (
        <Typography variant="caption" color="text.secondary">{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'createdAt', headerName: 'Timestamp', width: 170,
      renderCell: (params: any) => (
        <Typography variant="caption">{new Date(params.value).toLocaleString()}</Typography>
      ),
    },
  ];

  const auditColumns: TableColumn[] = [
    {
      field: 'adminUser', headerName: 'Admin', width: 200,
      renderCell: (params: any) => {
        const u = params.row.adminUser;
        if (!u) return <Typography variant="caption" color="text.secondary">System</Typography>;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'warning.main' }}>
              {u.firstName?.[0]}{u.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500} noWrap>{u.firstName} {u.lastName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'action', headerName: 'Action', width: 140,
      renderCell: (params: any) => (
        <Chip label={params.value?.replace(/_/g, ' ')} size="small"
          color={ACTION_COLORS[params.value] || 'default'} variant="outlined"
          sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
      ),
    },
    {
      field: 'entityType', headerName: 'Entity', width: 120,
      renderCell: (params: any) => (
        <Chip label={params.value} size="small" variant="filled" sx={{ fontSize: '0.7rem' }} />
      ),
    },
    {
      field: 'entityId', headerName: 'Entity ID', width: 160,
      renderCell: (params: any) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {params.value?.slice(0, 12)}...
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'ipAddress', headerName: 'IP Address', width: 130,
      renderCell: (params: any) => (
        <Typography variant="caption" color="text.secondary">{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'timestamp', headerName: 'Timestamp', width: 170,
      renderCell: (params: any) => (
        <Typography variant="caption">{new Date(params.value).toLocaleString()}</Typography>
      ),
    },
  ];

  // Determine which log type is active
  const isAuditTab = isSuperAdmin && tab === 0;

  const uniqueUsers = [...new Set(rows.map((l: any) => (l.user?.id || l.adminUser?.id)).filter(Boolean))].length;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FileText size={24} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {isSuperAdmin ? 'System Audit Logs' : 'My Activity Logs'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSuperAdmin
                ? 'Track all admin actions and system activities'
                : 'View your own actions and activity history'}
            </Typography>
          </Box>
        </Box>
        {/* Export buttons — Super Admin only */}
        {isSuperAdmin && (
          <ButtonGroup size="small" variant="outlined" disabled={exporting}>
            <Button startIcon={<Download />} onClick={() => handleExport('csv')}>CSV</Button>
            <Button onClick={() => handleExport('json')}>JSON</Button>
          </ButtonGroup>
        )}
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total Logs', value: total, icon: <Activity size={20} />, color: 'primary.main' },
          { label: 'This Page', value: rows.length, icon: <FileText size={20} />, color: 'success.main' },
          { label: 'Users Tracked', value: uniqueUsers, icon: <User size={20} />, color: 'warning.main' },
        ].map(stat => (
          <Paper key={stat.label} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
            <Box sx={{ color: stat.color }}>{stat.icon}</Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{stat.value.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <MainCard>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {isSuperAdmin && (
            <Tab icon={<Shield size={16} />} iconPosition="start" label="Admin Audit Logs" />
          )}
          <Tab icon={<Activity size={16} />} iconPosition="start" label={isSuperAdmin ? 'User Activity Logs' : 'My Activity'} />
        </Tabs>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search logs..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Action</InputLabel>
            <Select value={actionFilter} label="Action" onChange={e => setActionFilter(e.target.value)}>
              <MenuItem value="">All Actions</MenuItem>
              {(isAuditTab
                ? ['CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'SUSPEND', 'RESTORE']
                : ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_SUSPENDED',
                   'BUSINESS_VERIFIED', 'BUSINESS_UPDATED', 'PRODUCT_VERIFIED', 'LOGIN']
              ).map(a => <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>)}
            </Select>
          </FormControl>
          {/* Date range */}
          <TextField
            size="small" type="date" label="From"
            value={startDate} onChange={e => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
          />
          <TextField
            size="small" type="date" label="To"
            value={endDate} onChange={e => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
          />
          {/* User ID filter */}
          <TextField
            size="small" placeholder="Filter by User ID"
            value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            {hasActiveFilters && (
              <Tooltip title="Clear filters">
                <Button size="small" variant="outlined" color="warning" onClick={clearFilters}
                  startIcon={<Filter size={14} />}>
                  Clear
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Refresh">
              <span>
                <button onClick={fetchLogs} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Refresh fontSize="small" />
                </button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <AdminTableWrapper
          columns={isAuditTab ? auditColumns : activityColumns}
          rows={rows}
          rowCount={total}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          checkboxSelection={false}
          getRowId={(row: any) => row.id}
          emptyMessage={isAuditTab ? 'No admin audit logs found' : 'No user activity logs found'}
        />
      </MainCard>
    </Box>
  );
}
