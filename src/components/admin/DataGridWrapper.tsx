'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridSortModel,
  GridFilterModel,
  GridPaginationModel,
} from '@mui/x-data-grid';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';

export interface DataGridWrapperProps<T> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  error?: Error | null;
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;
  filterModel?: GridFilterModel;
  onFilterModelChange?: (model: GridFilterModel) => void;
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  onRetry?: () => void;
  onRefresh?: () => void;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  getRowId?: (row: T) => string;
  mobileCardRenderer?: (row: T) => React.ReactNode;
  mobileTableView?: boolean; // Use simple table instead of cards on mobile
  ariaLabel?: string;
}

export function DataGridWrapper<T extends Record<string, any>>({
  rows,
  columns,
  loading = false,
  error = null,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 25, 50, 100],
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  onRetry,
  onRefresh,
  emptyStateMessage = 'No data available',
  emptyStateIcon,
  getRowId,
  mobileCardRenderer,
  mobileTableView = false,
  ariaLabel = 'Data table',
}: DataGridWrapperProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [announceMessage, setAnnounceMessage] = useState('');

  // Safe defaults - CRITICAL: Prevent undefined crashes
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) && columns.length > 0 ? columns : [];
  const safeRowCount = typeof rowCount === 'number' && rowCount >= 0 ? rowCount : 0;
  
  // Ensure pageSizeOptions is valid and has at least one option
  const safePageSizeOptions = Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0 
    ? pageSizeOptions 
    : [10, 25, 50, 100];

  // Ensure paginationModel is valid with safe defaults
  const safePaginationModel = {
    page: typeof paginationModel?.page === 'number' ? paginationModel.page : 0,
    pageSize: typeof paginationModel?.pageSize === 'number' ? paginationModel.pageSize : safePageSizeOptions[0],
  };

  // Validate pagination model values
  if (safePaginationModel.page < 0) safePaginationModel.page = 0;
  if (!safePageSizeOptions.includes(safePaginationModel.pageSize)) {
    safePaginationModel.pageSize = safePageSizeOptions[0];
  }

  // Ensure rowSelectionModel is properly formatted
  const safeRowSelectionModel = React.useMemo(() => {
    if (!checkboxSelection) return undefined;
    return rowSelectionModel;
  }, [checkboxSelection, rowSelectionModel]);

  // Announce changes for screen readers
  useEffect(() => {
    if (loading) {
      setAnnounceMessage('Loading data...');
    } else if (error) {
      setAnnounceMessage(`Error: ${error.message}`);
    } else if (safeRows.length === 0) {
      setAnnounceMessage('No data available');
    } else {
      setAnnounceMessage(`Showing ${safeRows.length} of ${safeRowCount} items`);
    }
  }, [loading, error, safeRows.length, safeRowCount]);

  // Handle sort change
  const handleSortModelChange = useCallback((model: GridSortModel) => {
    if (onSortModelChange) {
      onSortModelChange(model);
      if (model.length > 0) {
        const { field, sort } = model[0];
        setAnnounceMessage(`Sorted by ${field} in ${sort}ending order`);
      }
    }
  }, [onSortModelChange]);

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    const safeModel = {
      page: typeof model?.page === 'number' ? Math.max(0, model.page) : 0,
      pageSize: typeof model?.pageSize === 'number' ? model.pageSize : 25,
    };
    onPaginationModelChange(safeModel);
    const totalPages = Math.ceil(safeRowCount / safeModel.pageSize);
    setAnnounceMessage(`Page ${safeModel.page + 1} of ${totalPages || 1}`);
  }, [onPaginationModelChange, safeRowCount]);

  // Handle selection change
  const handleSelectionChange = useCallback((model: GridRowSelectionModel) => {
    if (onRowSelectionModelChange) {
      onRowSelectionModelChange(model);
      const count = Array.isArray(model) ? model.length : model instanceof Set ? model.size : 0;
      setAnnounceMessage(`${count} items selected`);
    }
  }, [onRowSelectionModelChange]);

  // Loading skeleton
  if (loading && safeRows.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
        }}
        role="status"
        aria-label="Loading data"
      >
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        {[...Array(5)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={52}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="rectangular" width={200} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={300} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        sx={{
          textAlign: 'center',
          py: 6,
          bgcolor: 'error.lighter',
          border: '1px solid',
          borderColor: 'error.light',
        }}
        role="alert"
        aria-live="assertive"
      >
        <CardContent>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="error.main">
            Error Loading Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error.message || 'An unexpected error occurred'}
          </Typography>
          {onRetry && (
            <Button
              variant="contained"
              color="error"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              aria-label="Retry loading data"
            >
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
      <Card
        sx={{
          textAlign: 'center',
          py: 6,
          bgcolor: 'background.paper',
        }}
        role="status"
        aria-label="No data available"
      >
        <CardContent>
          {emptyStateIcon || <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
          <Typography variant="h6" gutterBottom color="text.secondary">
            {emptyStateMessage}
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
        <Box
          component="div"
          sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announceMessage}
        </Box>

        {safeRows.map((row, index) => (
          <Card
            key={getRowId ? getRowId(row) : row.id || index}
            sx={{ mb: 2 }}
            role="listitem"
            tabIndex={0}
            aria-label={`Item ${index + 1} of ${safeRows.length}`}
          >
            <CardContent>{mobileCardRenderer(row)}</CardContent>
          </Card>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button
            size="small"
            disabled={safePaginationModel.page === 0}
            onClick={() => handlePaginationModelChange({ ...safePaginationModel, page: safePaginationModel.page - 1 })}
            aria-label="Previous page"
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
            onClick={() => handlePaginationModelChange({ ...safePaginationModel, page: safePaginationModel.page + 1 })}
            aria-label="Next page"
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  }

  // Mobile simple table view (alternative to cards)
  if (isMobile && mobileTableView) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box
          component="div"
          sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announceMessage}
        </Box>

        <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
          <Table size="small" aria-label={ariaLabel}>
            <TableHead>
              <TableRow>
                {safeColumns.map(col => (
                  <TableCell 
                    key={col.field}
                    sx={{ 
                      fontWeight: 600,
                      bgcolor: 'grey.50',
                      whiteSpace: 'nowrap',
                      minWidth: col.minWidth || 100,
                    }}
                  >
                    {col.headerName || col.field}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {safeRows.map((row, index) => (
                <TableRow 
                  key={getRowId ? getRowId(row) : row.id || index}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {safeColumns.map(col => (
                    <TableCell key={col.field}>
                      {col.renderCell 
                        ? col.renderCell({ row, value: row[col.field], field: col.field } as any)
                        : row[col.field] || '-'
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button
            size="small"
            disabled={safePaginationModel.page === 0}
            onClick={() => handlePaginationModelChange({ ...safePaginationModel, page: safePaginationModel.page - 1 })}
            aria-label="Previous page"
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
            onClick={() => handlePaginationModelChange({ ...safePaginationModel, page: safePaginationModel.page + 1 })}
            aria-label="Next page"
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  }

  // Desktop DataGrid view
  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box
        component="div"
        sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announceMessage}
      </Box>

      {onRefresh && (
        <Box sx={{ position: 'absolute', top: -48, right: 0, zIndex: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={onRefresh}
              size="small"
              aria-label="Refresh data"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={safeRows}
          columns={safeColumns}
          rowCount={safeRowCount}
          loading={loading}
          paginationModel={safePaginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={safePageSizeOptions}
          paginationMode="server"
          autoHeight
          disableRowSelectionOnClick
          checkboxSelection={checkboxSelection}
          rowSelectionModel={safeRowSelectionModel}
          onRowSelectionModelChange={handleSelectionChange}
          sortModel={sortModel || []}
          onSortModelChange={handleSortModelChange}
          sortingMode={sortModel && onSortModelChange ? 'server' : undefined}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          filterMode={filterModel && onFilterModelChange ? 'server' : undefined}
          getRowId={getRowId}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            minWidth: 650,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
              borderBottom: '2px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'action.hover',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            },
          }}
          aria-label={ariaLabel}
        />
      </Box>
    </Box>
  );
}

export default DataGridWrapper;
