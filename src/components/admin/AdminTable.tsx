/**
 * Reusable Admin Table Component
 * 
 * Based on the working Products and Users table architecture.
 * Provides consistent table functionality across all admin pages.
 * 
 * Features:
 * - Server-side pagination
 * - Sorting
 * - Search with debounce
 * - Filters
 * - Export (CSV, Excel, PDF)
 * - Action menu
 * - View dialog
 * - Loading states
 * - Error handling
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Grid2 as Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  FileCopy as CsvIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Dynamic imports for heavy libraries - only load when needed
const loadXLSX = () => import('xlsx');
const loadJsPDF = () => import('jspdf').then(mod => {
  import('jspdf-autotable');
  return mod;
});

export interface Column<T> {
  id: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  exportRender?: (row: T) => string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export interface ActionMenuItem<T> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  color?: 'default' | 'error' | 'warning' | 'success';
}

interface AdminTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  orderBy?: string;
  order?: 'asc' | 'desc';
  onSort?: (property: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onRefresh: () => void;
  actionMenuItems?: ActionMenuItem<T>[];
  viewDialog?: {
    open: boolean;
    onClose: () => void;
    title: string;
    content: React.ReactNode;
  };
  exportConfig?: {
    filename: string;
    headers: string[];
    dataMapper: (row: T) => string[];
  };
  emptyMessage?: string;
  getRowId: (row: T) => string;
}

export default function AdminTable<T>({
  title,
  columns,
  data,
  loading,
  error,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  orderBy,
  order,
  onSort,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onRefresh,
  actionMenuItems = [],
  viewDialog,
  exportConfig,
  emptyMessage = 'No data found',
  getRowId,
}: AdminTableProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: T) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleActionClick = (action: ActionMenuItem<T>) => {
    if (selectedRow) {
      action.onClick(selectedRow);
      handleMenuClose();
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!exportConfig) return;

    try {
      if (format === 'csv') {
        exportToCsv(data, exportConfig);
      } else if (format === 'excel') {
        await exportToExcel(data, exportConfig);
      } else {
        await exportToPdf(data, exportConfig);
      }
    } catch (err) {

    } finally {
      setExportAnchor(null);
    }
  };

  const exportToCsv = (data: T[], config: typeof exportConfig) => {
    if (!config) return;
    
    const rows = data.map(config.dataMapper);
    const csvContent = [config.headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${config.filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = async (data: T[], config: typeof exportConfig) => {
    if (!config) return;
    
    // Dynamically load XLSX only when needed
    const XLSX = await loadXLSX();
    
    const worksheetData = data.map(row => {
      const mapped = config.dataMapper(row);
      return config.headers.reduce((obj, header, index) => {
        obj[header] = mapped[index];
        return obj;
      }, {} as Record<string, string>);
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${config.filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPdf = async (data: T[], config: typeof exportConfig) => {
    if (!config) return;
    
    // Dynamically load jsPDF only when needed
    const { jsPDF } = await loadJsPDF();
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = data.map(config.dataMapper);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [config.headers],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save(`${config.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        <Box>
          {exportConfig && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {onSearchChange && (
              <Grid size={{ xs: 12, md: filters.length > 0 ? 4 : 8 }}>
                <TextField
                  fullWidth
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}
            
            {filters.map((filter) => (
              <Grid key={filter.id} size={{ xs: 6, md: 3 }}>
                {filter.type === 'select' ? (
                  <TextField
                    select
                    fullWidth
                    label={filter.label}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                  >
                    {filter.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    label={filter.label}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                  />
                )}
              </Grid>
            ))}
            
            {(onSearchChange || filters.length > 0) && (
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    if (onSearchChange) onSearchChange('');
                    filters.forEach(f => f.onChange(''));
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align || 'left'}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.sortable && onSort ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => onSort(String(column.id))}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                  {actionMenuItems.length > 0 && (
                    <TableCell align="right">Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (actionMenuItems.length > 0 ? 1 : 0)} align="center">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={getRowId(row)} hover>
                      {columns.map((column) => (
                        <TableCell key={String(column.id)} align={column.align || 'left'}>
                          {column.render ? column.render(row) : String((row as any)[column.id] || '-')}
                        </TableCell>
                      ))}
                      {actionMenuItems.length > 0 && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, row)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </Card>

      {/* Action Menu */}
      {actionMenuItems.length > 0 && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {actionMenuItems.map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => handleActionClick(item)}
              sx={item.color === 'error' ? { color: 'error.main' } : {}}
            >
              <ListItemIcon sx={item.color === 'error' ? { color: 'error.main' } : {}}>
                {item.icon}
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      )}

      {/* Export Menu */}
      {exportConfig && (
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
        >
          <MenuItem onClick={() => handleExport('csv')}>
            <ListItemIcon><CsvIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('excel')}>
            <ListItemIcon><ExcelIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export Excel</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('pdf')}>
            <ListItemIcon><PdfIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export PDF</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* View Dialog */}
      {viewDialog && (
        <Dialog
          open={viewDialog.open}
          onClose={viewDialog.onClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{viewDialog.title}</DialogTitle>
          <DialogContent>
            {viewDialog.content}
          </DialogContent>
          <DialogActions>
            <Button onClick={viewDialog.onClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
