'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Box, Typography, CircularProgress, Tabs, Tab, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, Select, MenuItem, FormControl,
  InputLabel, Chip, Tooltip, InputAdornment,
} from '@mui/material';
import { Plus, Pencil, Trash2, Search, ChevronRight, Building2, Layers, Tag, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bustMasterDataCache } from '@/hooks/use-master-data';

interface Industry { id: string; name: string; description?: string; isActive: boolean; sortOrder: number; _count?: { sectors: number } }
interface Sector { id: string; name: string; description?: string; isActive: boolean; sortOrder: number; industryId: string; industry?: { id: string; name: string }; _count?: { businessOrganizations: number } }
interface BizOrg { id: string; name: string; description?: string; isActive: boolean; sortOrder: number; sectorId: string; sector?: { id: string; name: string; industry?: { id: string; name: string } } }

type EntityType = 'industry' | 'sector' | 'organization';

const BASE = '/api/admin/master-data';

export default function MasterDataPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [orgs, setOrgs] = useState<BizOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterSector, setFilterSector] = useState('');

  // Sort state per tab: field + direction
  const [industrySort, setIndustrySort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'sortOrder', dir: 'asc' });
  const [sectorSort, setSectorSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'sortOrder', dir: 'asc' });
  const [orgSort, setOrgSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'sortOrder', dir: 'asc' });

  // Active filter per tab: 'all' | 'active' | 'inactive'
  const [industryActiveFilter, setIndustryActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sectorActiveFilter, setSectorActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [orgActiveFilter, setOrgActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  /** Toggle sort: same field flips dir, new field defaults to asc */
  const toggleSort = (
    current: { field: string; dir: 'asc' | 'desc' },
    set: (s: { field: string; dir: 'asc' | 'desc' }) => void,
    field: string
  ) => {
    set(current.field === field ? { field, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  };

  /** Sort icon indicator */
  const SortIcon = ({ sort, field }: { sort: { field: string; dir: string }; field: string }) => (
    <span style={{ marginLeft: 4, opacity: sort.field === field ? 1 : 0.3, fontSize: 11 }}>
      {sort.field === field && sort.dir === 'desc' ? '▼' : '▲'}
    </span>
  );

  /** Sortable header cell */
  const SortCell = ({ label, field, sort, onSort, align = 'left' }: { label: string; field: string; sort: { field: string; dir: 'asc' | 'desc' }; onSort: (f: string) => void; align?: 'left' | 'center' }) => (
    <TableCell align={align} sx={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => onSort(field)}>
      {label}<SortIcon sort={sort} field={field} />
    </TableCell>
  );

  /** Apply sort to an array */
  function applySort<T extends Record<string, any>>(arr: T[], sort: { field: string; dir: 'asc' | 'desc' }): T[] {
    return [...arr].sort((a, b) => {
      // Support dot-notation for nested fields e.g. '_count.sectors'
      const get = (obj: any, path: string) => path.split('.').reduce((o, k) => o?.[k], obj) ?? '';
      const av = get(a, sort.field);
      const bv = get(b, sort.field);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  // Pagination — 10 rows per page, one page state per tab
  const PAGE_SIZE = 10;
  const [industryPage, setIndustryPage] = useState(1);
  const [sectorPage, setSectorPage] = useState(1);
  const [orgPage, setOrgPage] = useState(1);

  // Dialog state
  const [dialog, setDialog] = useState<{ open: boolean; type: EntityType; item?: any }>({ open: false, type: 'industry' });
  const [form, setForm] = useState({ name: '', description: '', isActive: true, sortOrder: 0, industryId: '', sectorId: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: EntityType; item?: any }>({ open: false, type: 'industry' });

  const getHeaders = () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = getHeaders();
      const [iRes, sRes, oRes] = await Promise.all([
        fetch(`${BASE}?type=industries`, { headers: h }),
        fetch(`${BASE}?type=sectors`, { headers: h }),
        fetch(`${BASE}?type=organizations`, { headers: h }),
      ]);
      const [iData, sData, oData] = await Promise.all([iRes.json(), sRes.json(), oRes.json()]);
      setIndustries(iData.data || []);
      setSectors(sData.data || []);
      setOrgs(oData.data || []);
    } catch { toast({ variant: 'destructive', title: 'Failed to load data' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = (type: EntityType) => {
    setForm({ name: '', description: '', isActive: true, sortOrder: 0, industryId: filterIndustry, sectorId: filterSector });
    setDialog({ open: true, type });
  };

  const openEdit = (type: EntityType, item: any) => {
    setForm({
      name: item.name, description: item.description || '', isActive: item.isActive,
      sortOrder: item.sortOrder, industryId: item.industryId || '', sectorId: item.sectorId || '',
    });
    setDialog({ open: true, type, item });
  };

  const save = async () => {
    if (!form.name.trim()) { toast({ variant: 'destructive', title: 'Name is required' }); return; }
    setSaving(true);
    try {
      const isEdit = !!dialog.item;
      const body = isEdit
        ? { type: dialog.type, id: dialog.item.id, ...form }
        : { type: dialog.type, ...form };
      const res = await fetch(BASE, { method: isEdit ? 'PUT' : 'POST', headers: getHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: isEdit ? 'Updated successfully' : 'Created successfully' });
      bustMasterDataCache();
      setDialog({ open: false, type: 'industry' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: e.message });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleteConfirm.item) return;
    try {
      const res = await fetch(`${BASE}?type=${deleteConfirm.type}&id=${deleteConfirm.item.id}`, { method: 'DELETE', headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Deleted successfully' });
      bustMasterDataCache();
      setDeleteConfirm({ open: false, type: 'industry' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: e.message });
    }
  };

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return <Box p={3}><Typography color="error">Access Denied</Typography></Box>;
  }

  const filteredIndustries = industries
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => industryActiveFilter === 'all' ? true : industryActiveFilter === 'active' ? i.isActive : !i.isActive);
  const filteredSectors = sectors
    .filter(s => (!filterIndustry || s.industryId === filterIndustry) && s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => sectorActiveFilter === 'all' ? true : sectorActiveFilter === 'active' ? s.isActive : !s.isActive);
  const filteredOrgs = orgs
    .filter(o => (!filterSector || o.sectorId === filterSector) && o.name.toLowerCase().includes(search.toLowerCase()))
    .filter(o => orgActiveFilter === 'all' ? true : orgActiveFilter === 'active' ? o.isActive : !o.isActive);

  // Sorted then paginated
  const sortedIndustries = applySort(filteredIndustries, industrySort);
  const sortedSectors    = applySort(filteredSectors, sectorSort);
  const sortedOrgs       = applySort(filteredOrgs, orgSort);

  const pagedIndustries = sortedIndustries.slice((industryPage - 1) * PAGE_SIZE, industryPage * PAGE_SIZE);
  const pagedSectors    = sortedSectors.slice((sectorPage - 1) * PAGE_SIZE, sectorPage * PAGE_SIZE);
  const pagedOrgs       = sortedOrgs.slice((orgPage - 1) * PAGE_SIZE, orgPage * PAGE_SIZE);

  const totalIndustryPages = Math.max(1, Math.ceil(filteredIndustries.length / PAGE_SIZE));
  const totalSectorPages   = Math.max(1, Math.ceil(filteredSectors.length / PAGE_SIZE));
  const totalOrgPages      = Math.max(1, Math.ceil(filteredOrgs.length / PAGE_SIZE));

  /** Shared MenuProps matching the business-verification advanced filter style */
  const filterMenuProps = {
    PaperProps: {
      sx: {
        maxHeight: 400,
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
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    sx: { zIndex: 10000 },
  };
  const PaginationRow = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
    if (total <= 1) return null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Page {page} of {total}
        </Typography>
        <IconButton size="small" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></IconButton>
        <IconButton size="small" disabled={page >= total} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></IconButton>
      </Box>
    );
  };

  const tabData = [
    { label: 'Industries', icon: <Layers size={16} />, count: industries.length },
    { label: 'Sectors', icon: <Tag size={16} />, count: sectors.length },
    { label: 'Business Organizations', icon: <Building2 size={16} />, count: orgs.length },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Master Data Management</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage the hierarchical master data: Industries → Sectors → Business Organizations.
          Changes apply immediately across the entire application.
        </Typography>
      </Box>

      {/* Breadcrumb hint */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
        <Chip label="Industry" size="small" color="primary" />
        <ChevronRight size={14} />
        <Chip label="Sector" size="small" color="secondary" />
        <ChevronRight size={14} />
        <Chip label="Business Organization" size="small" color="default" />
      </Box>

      {/* Search */}
      <TextField
        size="small" placeholder="Search by name…" value={search}
        onChange={e => { setSearch(e.target.value); setIndustryPage(1); setSectorPage(1); setOrgPage(1); }} sx={{ mb: 2, width: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
      />

      {/* Tabs */}
      <Paper sx={{ mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); setIndustryPage(1); setSectorPage(1); setOrgPage(1); }} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {tabData.map((t, i) => (
            <Tab key={i} label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t.icon} {t.label}
                <Chip label={t.count} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
            } />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* ── INDUSTRIES ── */}
            {tab === 0 && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(['all', 'active', 'inactive'] as const).map(f => (
                      <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} size="small"
                        color={industryActiveFilter === f ? 'primary' : 'default'}
                        variant={industryActiveFilter === f ? 'filled' : 'outlined'}
                        onClick={() => { setIndustryActiveFilter(f); setIndustryPage(1); }}
                        sx={{ cursor: 'pointer' }} />
                    ))}
                  </Box>
                  <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => openCreate('industry')}>Add Industry</Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <SortCell label="Name" field="name" sort={industrySort} onSort={f => { toggleSort(industrySort, setIndustrySort, f); setIndustryPage(1); }} />
                        <TableCell>Description</TableCell>
                        <SortCell label="Sectors" field="_count.sectors" sort={industrySort} onSort={f => { toggleSort(industrySort, setIndustrySort, f); setIndustryPage(1); }} align="center" />
                        <SortCell label="Order" field="sortOrder" sort={industrySort} onSort={f => { toggleSort(industrySort, setIndustrySort, f); setIndustryPage(1); }} align="center" />
                        <SortCell label="Active" field="isActive" sort={industrySort} onSort={f => { toggleSort(industrySort, setIndustrySort, f); setIndustryPage(1); }} align="center" />
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedIndustries.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{row.description || '—'}</Typography></TableCell>
                          <TableCell align="center"><Chip label={row._count?.sectors ?? 0} size="small" color="primary" variant="outlined" /></TableCell>
                          <TableCell align="center">{row.sortOrder}</TableCell>
                          <TableCell align="center"><Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} /></TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit('industry', row)}><Pencil size={14} /></IconButton></Tooltip>
                            {user?.isSuperAdmin && (
                              <Tooltip title="Delete (cascades to sectors & organizations)">
                                <IconButton size="small" color="error" onClick={() => setDeleteConfirm({ open: true, type: 'industry', item: row })}><Trash2 size={14} /></IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredIndustries.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No industries found</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <PaginationRow page={industryPage} total={totalIndustryPages} onChange={setIndustryPage} />
              </Box>
            )}

            {/* ── SECTORS ── */}
            {tab === 1 && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Filter by Industry</InputLabel>
                    <Select value={filterIndustry} label="Filter by Industry" onChange={e => { setFilterIndustry(e.target.value); setSectorPage(1); }}
                      MenuProps={filterMenuProps}>
                      <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>All Industries</MenuItem>
                      {industries.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(['all', 'active', 'inactive'] as const).map(f => (
                      <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} size="small"
                        color={sectorActiveFilter === f ? 'primary' : 'default'}
                        variant={sectorActiveFilter === f ? 'filled' : 'outlined'}
                        onClick={() => { setSectorActiveFilter(f); setSectorPage(1); }}
                        sx={{ cursor: 'pointer' }} />
                    ))}
                  </Box>
                  <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => openCreate('sector')} sx={{ ml: 'auto' }}>Add Sector</Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <SortCell label="Name" field="name" sort={sectorSort} onSort={f => { toggleSort(sectorSort, setSectorSort, f); setSectorPage(1); }} />
                        <SortCell label="Industry" field="industry.name" sort={sectorSort} onSort={f => { toggleSort(sectorSort, setSectorSort, f); setSectorPage(1); }} />
                        <TableCell>Description</TableCell>
                        <SortCell label="Orgs" field="_count.businessOrganizations" sort={sectorSort} onSort={f => { toggleSort(sectorSort, setSectorSort, f); setSectorPage(1); }} align="center" />
                        <SortCell label="Order" field="sortOrder" sort={sectorSort} onSort={f => { toggleSort(sectorSort, setSectorSort, f); setSectorPage(1); }} align="center" />
                        <SortCell label="Active" field="isActive" sort={sectorSort} onSort={f => { toggleSort(sectorSort, setSectorSort, f); setSectorPage(1); }} align="center" />
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedSectors.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                          <TableCell><Chip label={row.industry?.name || '—'} size="small" color="primary" variant="outlined" /></TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{row.description || '—'}</Typography></TableCell>
                          <TableCell align="center"><Chip label={row._count?.businessOrganizations ?? 0} size="small" color="secondary" variant="outlined" /></TableCell>
                          <TableCell align="center">{row.sortOrder}</TableCell>
                          <TableCell align="center"><Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} /></TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit('sector', row)}><Pencil size={14} /></IconButton></Tooltip>
                            {user?.isSuperAdmin && (
                              <Tooltip title="Delete (cascades to organizations)">
                                <IconButton size="small" color="error" onClick={() => setDeleteConfirm({ open: true, type: 'sector', item: row })}><Trash2 size={14} /></IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSectors.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No sectors found</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <PaginationRow page={sectorPage} total={totalSectorPages} onChange={p => { setSectorPage(p); }} />
              </Box>
            )}

            {/* ── BUSINESS ORGANIZATIONS ── */}
            {tab === 2 && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Industry</InputLabel>
                    <Select value={filterIndustry} label="Filter by Industry" onChange={e => { setFilterIndustry(e.target.value); setFilterSector(''); setOrgPage(1); }}
                      MenuProps={filterMenuProps}>
                      <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>All Industries</MenuItem>
                      {industries.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Sector</InputLabel>
                    <Select value={filterSector} label="Filter by Sector" onChange={e => { setFilterSector(e.target.value); setOrgPage(1); }}
                      MenuProps={filterMenuProps}>
                      <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>All Sectors</MenuItem>
                      {sectors.filter(s => !filterIndustry || s.industryId === filterIndustry).map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(['all', 'active', 'inactive'] as const).map(f => (
                      <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} size="small"
                        color={orgActiveFilter === f ? 'primary' : 'default'}
                        variant={orgActiveFilter === f ? 'filled' : 'outlined'}
                        onClick={() => { setOrgActiveFilter(f); setOrgPage(1); }}
                        sx={{ cursor: 'pointer' }} />
                    ))}
                  </Box>
                  <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => openCreate('organization')} sx={{ ml: 'auto' }}>Add Organization</Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <SortCell label="Name" field="name" sort={orgSort} onSort={f => { toggleSort(orgSort, setOrgSort, f); setOrgPage(1); }} />
                        <SortCell label="Sector" field="sector.name" sort={orgSort} onSort={f => { toggleSort(orgSort, setOrgSort, f); setOrgPage(1); }} />
                        <SortCell label="Industry" field="sector.industry.name" sort={orgSort} onSort={f => { toggleSort(orgSort, setOrgSort, f); setOrgPage(1); }} />
                        <TableCell>Description</TableCell>
                        <SortCell label="Order" field="sortOrder" sort={orgSort} onSort={f => { toggleSort(orgSort, setOrgSort, f); setOrgPage(1); }} align="center" />
                        <SortCell label="Active" field="isActive" sort={orgSort} onSort={f => { toggleSort(orgSort, setOrgSort, f); setOrgPage(1); }} align="center" />
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedOrgs.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                          <TableCell><Chip label={row.sector?.name || '—'} size="small" color="secondary" variant="outlined" /></TableCell>
                          <TableCell><Chip label={row.sector?.industry?.name || '—'} size="small" color="primary" variant="outlined" /></TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{row.description || '—'}</Typography></TableCell>
                          <TableCell align="center">{row.sortOrder}</TableCell>
                          <TableCell align="center"><Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} /></TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit('organization', row)}><Pencil size={14} /></IconButton></Tooltip>
                            {user?.isSuperAdmin && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => setDeleteConfirm({ open: true, type: 'organization', item: row })}><Trash2 size={14} /></IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredOrgs.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No organizations found</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <PaginationRow page={orgPage} total={totalOrgPages} onChange={setOrgPage} />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, type: 'industry' })}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
          zIndex: 9998,
        }}
        slotProps={{ backdrop: { sx: { zIndex: 9998 } } }}
      >
        <DialogTitle>{dialog.item ? 'Edit' : 'Add'} {dialog.type === 'industry' ? 'Industry' : dialog.type === 'sector' ? 'Sector' : 'Business Organization'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {/* Parent selectors */}
          {dialog.type === 'sector' && (
            <FormControl fullWidth size="small" required>
              <InputLabel>Industry *</InputLabel>
              <Select value={form.industryId} label="Industry *" onChange={e => setForm(f => ({ ...f, industryId: e.target.value }))}
                MenuProps={filterMenuProps}>
                {industries.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {dialog.type === 'organization' && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Industry (filter)</InputLabel>
                <Select value={filterIndustry} label="Industry (filter)" onChange={e => { setFilterIndustry(e.target.value); setForm(f => ({ ...f, sectorId: '' })); }}
                  MenuProps={filterMenuProps}>
                  <MenuItem value="">All</MenuItem>
                  {industries.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" required>
                <InputLabel>Sector *</InputLabel>
                <Select value={form.sectorId} label="Sector *" onChange={e => setForm(f => ({ ...f, sectorId: e.target.value }))}
                  MenuProps={filterMenuProps}>
                  {sectors.filter(s => !filterIndustry || s.industryId === filterIndustry).map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </>
          )}
          <TextField label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" autoFocus />
          <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" multiline rows={2} />
          <TextField label="Sort Order" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} size="small" sx={{ width: 140 }} />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} color="success" />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, type: 'industry' })}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: 'industry' })}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
          zIndex: 9998,
        }}
        slotProps={{ backdrop: { sx: { zIndex: 9998 } } }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteConfirm.item?.name}</strong>?
            {deleteConfirm.type === 'industry' && ' This will also delete all its sectors and business organizations.'}
            {deleteConfirm.type === 'sector' && ' This will also delete all its business organizations.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, type: 'industry' })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
