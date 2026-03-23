'use client';

import { useState, useEffect } from 'react';

// material-ui
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { Search } from 'lucide-react';

// Types
interface Column {
  field: string;
  headerName: string;
  type?: string;
  align?: 'left' | 'center' | 'right';
  renderCell?: (row: any, value?: any) => React.ReactNode;
  chipColor?: (value: any) => string;
  chipVariant?: 'filled' | 'outlined';
}

interface Action {
  icon: React.ReactNode;
  tooltip?: string;
  label?: string;
  color?: string;
  onClick: (row: any) => void;
}

interface DataTableProps {
  title?: string;
  data?: any[];
  columns?: Column[];
  searchable?: boolean;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<any>;
  onRowClick?: (row: any) => void;
  actions?: Action[];
  [key: string]: any;
}

// ==============================|| DATA TABLE ||============================== //

const DataTable: React.FC<DataTableProps> = ({
  title,
  data = [],
  columns = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon,
  onRowClick,
  actions = [],
  ...others
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Adjust rows per page for mobile
  useEffect(() => {
    if (isSmallMobile) {
      setRowsPerPage(5);
    }
  }, [isSmallMobile]);

  // Filter data based on search term
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return columns.some((column) => {
      const value = row[column.field];
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Paginate data
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderCellContent = (row: any, column: Column) => {
    const value = row[column.field];

    if (column.renderCell) {
      return column.renderCell(row, value);
    }

    switch (column.type) {
      case 'avatar':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={value?.avatar} sx={{ width: 40, height: 40 }}>
              {value?.name?.charAt(0) || value?.email?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {value?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {value?.email}
              </Typography>
            </Box>
          </Box>
        );
      case 'chip':
        return (
          <Chip
            label={value}
            size="small"
            color={column.chipColor?.(value) as any || 'default'}
            variant={column.chipVariant || 'filled'}
          />
        );
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'actions':
        return (
          <Box sx={{ 
            display: 'flex', 
            gap: isSmallMobile ? 0.5 : 1, 
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}>
            {actions.map((action, index) => (
              <Tooltip key={index} title={action.tooltip || action.label}>
                <IconButton
                  size={isSmallMobile ? 'small' : 'small'}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(row);
                  }}
                  color={action.color as any || 'default'}
                  sx={{ 
                    minWidth: isSmallMobile ? '32px' : '36px',
                    minHeight: isSmallMobile ? '32px' : '36px',
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        );
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box {...others} sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header with search */}
      {(title || searchable) && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isSmallMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isSmallMobile ? 'stretch' : 'center', 
          mb: 2,
          gap: isSmallMobile ? 1 : 0,
        }}>
          {title && (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: isSmallMobile ? '1rem' : '1.25rem',
              }}
            >
              {title}
            </Typography>
          )}
          {searchable && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={isSmallMobile ? 16 : 20} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: isSmallMobile ? '100%' : 250,
                maxWidth: isSmallMobile ? '100%' : 300,
              }}
              inputProps={{
                'aria-label': searchPlaceholder,
              }}
            />
          )}
        </Box>
      )}

      {/* Mobile Card View */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, index) => (
              <Card 
                key={row.id || index} 
                variant="outlined"
                onClick={() => onRowClick?.(row)}
                sx={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  '&:hover': onRowClick ? {
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                  } : {},
                }}
              >
                <CardContent sx={{ p: isSmallMobile ? 1.5 : 2, '&:last-child': { pb: isSmallMobile ? 1.5 : 2 } }}>
                  {columns.map((column, colIndex) => (
                    <Box 
                      key={column.field} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        py: 0.5,
                        borderBottom: colIndex < columns.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}
                      >
                        {column.headerName}
                      </Typography>
                      <Box sx={{ textAlign: 'right', maxWidth: '60%' }}>
                        {renderCellContent(row, column)}
                      </Box>
                    </Box>
                  ))}
                </CardContent>
                {actions.length > 0 && (
                  <CardActions sx={{ px: isSmallMobile ? 1.5 : 2, pb: isSmallMobile ? 1 : 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
                      {actions.map((action, index) => (
                        <Tooltip key={index} title={action.tooltip || action.label}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            color={action.color as any || 'default'}
                          >
                            {action.icon}
                          </IconButton>
                        </Tooltip>
                      ))}
                    </Box>
                  </CardActions>
                )}
              </Card>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              {EmptyIcon && <EmptyIcon size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />}
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {emptyMessage}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    align={column.align || 'left'}
                    sx={{ fontWeight: 600, bgcolor: 'grey.50' }}
                  >
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={row.id || index}
                    hover
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.field} align={column.align || 'left'}>
                        {renderCellContent(row, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {EmptyIcon && <EmptyIcon size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />}
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        {emptyMessage}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {filteredData.length > 0 && (
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={isSmallMobile ? [5, 10] : [5, 10, 25, 50]}
          sx={{
            '.MuiTablePagination-displayedRows': {
              fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
            },
          }}
        />
      )}
    </Box>
  );
};

export default DataTable;