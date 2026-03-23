'use client';

import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Button,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search,
  Download,
  PersonAdd,
  FilterList,
  MoreVert,
} from '@mui/icons-material';

interface ResponsiveSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
  onAdd?: () => void;
  onFilter?: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
  selectedCount?: number;
  bulkActions?: React.ReactNode;
}

export function ResponsiveSearchBar({
  searchQuery,
  onSearchChange,
  onExport,
  onAdd,
  onFilter,
  addLabel = 'Add',
  searchPlaceholder = 'Search...',
  selectedCount = 0,
  bulkActions,
}: ResponsiveSearchBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action?: () => void) => {
    if (action) action();
    handleMenuClose();
  };

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Field */}
        <TextField
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          sx={{ 
            flexGrow: 1, 
            minWidth: { xs: '100%', sm: 200, md: 250 },
            maxWidth: { xs: '100%', sm: 'none' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Action Buttons - Desktop/Tablet */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onExport && (
              <Tooltip title="Download CSV">
                <IconButton 
                  size="small" 
                  onClick={onExport}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {onAdd && (
              <Tooltip title={addLabel}>
                <IconButton 
                  size="small"
                  onClick={onAdd}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <PersonAdd fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {onFilter && (
              <Tooltip title="Filters">
                <IconButton 
                  size="small"
                  onClick={onFilter}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <FilterList fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* Action Menu - Mobile */}
        {isMobile && (
          <>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {onExport && (
                <MenuItem onClick={() => handleMenuAction(onExport)}>
                  <ListItemIcon>
                    <Download fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download CSV</ListItemText>
                </MenuItem>
              )}
              {onAdd && (
                <MenuItem onClick={() => handleMenuAction(onAdd)}>
                  <ListItemIcon>
                    <PersonAdd fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{addLabel}</ListItemText>
                </MenuItem>
              )}
              {onFilter && (
                <MenuItem onClick={() => handleMenuAction(onFilter)}>
                  <ListItemIcon>
                    <FilterList fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Filters</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Box>

      {/* Bulk Actions */}
      {selectedCount > 0 && bulkActions && (
        <Box sx={{ 
          mt: 2, 
          pt: 2, 
          borderTop: '1px solid', 
          borderColor: 'divider', 
          display: 'flex', 
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Chip 
            label={`${selectedCount} selected`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {bulkActions}
        </Box>
      )}
    </Paper>
  );
}
