'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Inbox as InboxIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';

/**
 * Column definition for AdminTableWrapper
 * Simplified version without DataGrid dependencies
 */
export interface TableColumn<T = any> {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  renderCell?: (params: { row: T; value: any; field: string }) => React.ReactNode;
  valueGetter?: (params: { row: T }) => any;
  valueFormatter?: (params: { value: any }) => string;
}

/**
 * Pagination model
 */
export interface PaginationModel {
  page: number;
  pageSize: number;
}

/**
 * Sort model
 */
export interface SortModel {
  field: string;
  sort: 'asc' | 'desc';
}

/**
 * Props for AdminTableWrapper
 */
export interface AdminTableWrapperProps<T> {
  rows: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: Error | null;
  rowCount: number;
  paginationModel: PaginationModel;
  onPaginationModelChange: (model: PaginationModel) => void;
  pageSizeOptions?: number[];
  sortModel?: SortModel[];
  onSortModelChange?: (model: SortModel[]) => void;
  checkboxSelection?: boolean;
  rowSelectionModel?: string[];
  onRowSelectionModelChange?: (model: string[]) => void;
  onRetry?: () => void;
  onRefresh?: () => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  getRowId?: (row: T) => string;
  mobileCardRenderer?: (row: T) => React.ReactNode;
  ariaLabel?: string;
}

/**
 * AdminTableWrapper Component
 * 
 * A production-ready table component that replaces DataGrid with pure Material-UI Table.
 * No external dependencies, no .size errors, full control over behavior.
 * 
 * Features:
 * - Server-side pagination
 * - Sorting
 * - Checkbox selection
 * - Loading states
 * - Error handling
 * - Responsive design
 * - Mobile card view
 * - Accessibility
 */
export function AdminTableWrapper<T extends Record<string, any>>({
  rows,
  columns,
  loading = false,
  error = null,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 25, 50, 100],
  sortModel = [],
  onSortModelChange,
  checkboxSelection = false,
  rowSelectionModel = [],
  onRowSelectionModelChange,
  onRetry,
  onRefresh,
  emptyMessage = 'No data available',
  emptyIcon,
  getRowId,
  mobileCardRenderer,
  ariaLabel = 'Data table',
}: AdminTableWrapperProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [announceMessage, setAnnounceMessage] = useState('');

  // Safe defaults
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) && columns.length > 0 ? columns : [];
  const safeRowCount = typeof rowCount === 'number' && rowCount >= 0 ? rowCount : 0;
  const safePageSizeOptions = Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0 
    ? pageSizeOptions 
    : [10, 25, 50, 100];

  const safePaginationModel = {
    page: typeof paginationModel?.page === 'number' ? Math.max(0, paginationModel.page) : 0,
    pageSize: typeof paginationModel?.pageSize === 'number' ? paginationModel.pageSize : safePageSizeOptions[0],
  };

  const safeRowSelectionModel = Array.isArray(rowSelectionModel) ? rowSelectionModel : [];
  const safeSortModel = Array.isArray(sortModel) ? sortModel : [];

  // Get row ID
  const getRowIdSafe = useCallback((row: T, index: number): string => {
    if (getRowId) return getRowId(row);
    if (row.id) return String(row.id);
    return String(index);
  }, [getRowId]);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (!onSortModelChange) return;

    const existingSort = safeSortModel.find(s => s.field === field);
    let newSortModel: SortModel[];

    if (!existingSort) {
      newSortModel = [{ field, sort: 'asc' }];
    } else if (existingSort.sort === 'asc') {
      newSortModel = [{ field, sort: 'desc' }];
    } else {
      newSortModel = [];
    }

    onSortModelChange(newSortModel);
    setAnnounceMessage(`Sorted by ${field} ${newSortModel[0]?.sort || 'none'}`);
  }, [safeSortModel, onSortModelChange]);

  // Handle pagination
  const handlePageChange = useCallback((_event: unknown, newPage: number) => {
    onPaginationModelChange({ ...safePaginationModel, page: newPage });
    setAnnounceMessage(`Page ${newPage + 1}`);
  }, [safePaginationModel, onPaginationModelChange]);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    onPaginationModelChange({ page: 0, pageSize: newPageSize });
    setAnnounceMessage(`Rows per page changed to ${newPageSize}`);
  }, [onPaginationModelChange]);

  // Handle selection
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onRowSelectionModelChange) return;

    if (event.target.checked) {
      const allIds = safeRows.map((row, index) => getRowIdSafe(row, index));
      onRowSelectionModelChange(allIds);
      setAnnounceMessage(`All ${allIds.length} rows selected`);
    } else {
      onRowSelectionModelChange([]);
      setAnnounceMessage('All rows deselected');
    }
  }, [safeRows, onRowSelectionModelChange, getRowIdSafe]);

  const handleSelectRow = useCallback((rowId: string) => {
    if (!onRowSelectionModelChange) return;

    const newSelection = safeRowSelectionModel.includes(rowId)
      ? safeRowSelectionModel.filter(id => id !== rowId)
      : [...safeRowSelectionModel, rowId];

    onRowSelectionModelChange(newSelection);
    setAnnounceMessage(`${newSelection.length} rows selected`);
  }, [safeRowSelectionModel, onRowSelectionModelChange]);

  // Get cell value
  const getCellValue = useCallback((row: T, column: TableColumn<T>) => {
    if (column.valueGetter) {
      return column.valueGetter({ row });
    }
    return row[column.field];
  }, []);

  // Format cell value
  const formatCellValue = useCallback((value: any, column: TableColumn<T>) => {
    if (column.valueFormatter) {
      return column.valueFormatter({ value });
    }
    if (value === null || value === undefined) return '-';
    return String(value);
  }, []);

  // Loading skeleton
  if (loading && safeRows.length === 0) {
    return (
      <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, p: 2 }} role="status">
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={52} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="rectangular" width={200} height={32} />
          <Skeleton variant="rectangular" width={300} height={32} />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }} role="alert">
        <CardContent>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="error.main">
            Error Loading Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error.message || 'An unexpected error occurred'}
          </Typography>
          {onRetry && (
            <Button variant="contained" color="error" startIcon={<RefreshIcon />} onClick={onRetry}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!loading && safeRows.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.paper' }} role="status">
        <CardContent>
          {emptyIcon || <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
          <Typography variant="h6" gutterBottom color="text.secondary">
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no items to display at this time.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Mobile card view
  if (isMobile && mobileCardRenderer) {
    return (
      <Box role="list" aria-label={ariaLabel}>
        <Box component="div" sx={{ position: 'absolute', left: '-10000px' }} role="status" aria-live="polite">
          {announceMessage}
        </Box>

        {safeRows.map((row, index) => (
          <Card key={getRowIdSafe(row, index)} sx={{ mb: 2 }} role="listitem">
            <CardContent>{mobileCardRenderer(row)}</CardContent>
          </Card>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button
            size="small"
            disabled={safePaginationModel.page === 0}
            onClick={() => handlePageChange(null, safePaginationModel.page - 1)}
          >
            Previous
          </Button>
          <Chip
            label={`Page ${safePaginationModel.page + 1} of ${Math.ceil(safeRowCount / safePaginationModel.pageSize) || 1}`}
            size="small"
          />
          <Button
            size="small"
            disabled={safePaginationModel.page >= Math.ceil(safeRowCount / safePaginationModel.pageSize) - 1}
            onClick={() => handlePageChange(null, safePaginationModel.page + 1)}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  }

  // Desktop table view
  const isAllSelected = checkboxSelection && safeRows.length > 0 && safeRows.every((row, index) => 
    safeRowSelectionModel.includes(getRowIdSafe(row, index))
  );
  const isSomeSelected = checkboxSelection && safeRowSelectionModel.length > 0 && !isAllSelected;

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box component="div" sx={{ position: 'absolute', left: '-10000px' }} role="status" aria-live="polite">
        {announceMessage}
      </Box>

      {onRefresh && (
        <Box sx={{ position: 'absolute', top: -48, right: 0, zIndex: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ 
        borderRadius: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        backgroundImage: 'none',
      }}>
        <Table aria-label={ariaLabel}>
          <TableHead sx={{ 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50'
          }}>
            <TableRow>
              {checkboxSelection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'Select all rows' }}
                  />
                </TableCell>
              )}
              {safeColumns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    minWidth: column.minWidth,
                    width: column.width,
                    flex: column.flex,
                  }}
                >
                  {column.sortable !== false && onSortModelChange ? (
                    <TableSortLabel
                      active={safeSortModel.some(s => s.field === column.field)}
                      direction={safeSortModel.find(s => s.field === column.field)?.sort || 'asc'}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((row, index) => {
              const rowId = getRowIdSafe(row, index);
              const isSelected = safeRowSelectionModel.includes(rowId);

              return (
                <TableRow
                  key={rowId}
                  hover
                  selected={isSelected}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {checkboxSelection && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowId)}
                        inputProps={{ 'aria-label': `Select row ${index + 1}` }}
                      />
                    </TableCell>
                  )}
                  {safeColumns.map((column) => {
                    const value = getCellValue(row, column);
                    return (
                      <TableCell key={column.field} align={column.align || 'left'}>
                        {column.renderCell
                          ? column.renderCell({ row, value, field: column.field })
                          : formatCellValue(value, column)
                        }
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={safeRowCount}
        page={safePaginationModel.page}
        onPageChange={handlePageChange}
        rowsPerPage={safePaginationModel.pageSize}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={safePageSizeOptions}
        SelectProps={{
          MenuProps: {
            disableScrollLock: true,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
          },
        }}
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      />
    </Box>
  );
}

export default AdminTableWrapper;
