'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Avatar,
  Divider
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Reply,
  Delete,
  Send,
  CheckCircle,
  Business,
  Person
} from '@mui/icons-material';
import { toast } from '@/hooks/use-toast';

interface Inquiry {
  id: string;
  senderName: string;
  senderType: 'USER' | 'BUSINESS';
  senderEmail: string;
  recipientBusiness: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'REPLIED' | 'CLOSED';
  createdAt: string;
  productName?: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'createdAt', dir: 'desc' });

  const toggleSort = (field: string) => {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  };
  const SortIcon = ({ field }: { field: string }) => (
    <span style={{ marginLeft: 4, opacity: sort.field === field ? 1 : 0.3, fontSize: 11 }}>
      {sort.field === field && sort.dir === 'desc' ? '▼' : '▲'}
    </span>
  );
  const thStyle = { cursor: 'pointer', userSelect: 'none' as const, whiteSpace: 'nowrap' as const };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockInquiries: Inquiry[] = [
        {
          id: 'inq-1',
          senderName: 'John Smith',
          senderType: 'USER',
          senderEmail: 'john@example.com',
          recipientBusiness: 'Kenya Coffee Exporters Ltd',
          subject: 'Inquiry about coffee export',
          message: 'Hello, I am interested in importing your premium coffee beans to the UK market. Could you please provide information about your minimum order quantity, pricing, and shipping options?',
          status: 'NEW',
          createdAt: '2024-01-15T09:00:00Z',
          productName: 'Premium Arabica Coffee',
        },
        {
          id: 'inq-2',
          senderName: 'Mombasa Tea Company',
          senderType: 'BUSINESS',
          senderEmail: 'export@mombasatea.co.ke',
          recipientBusiness: 'Global Tea Imports',
          subject: 'Partnership opportunity',
          message: 'We would like to discuss a potential partnership for distributing our organic tea products in European markets. Please let us know your interest.',
          status: 'REPLIED',
          createdAt: '2024-01-14T14:30:00Z',
        },
        {
          id: 'inq-3',
          senderName: 'Sarah Johnson',
          senderType: 'USER',
          senderEmail: 'sarah.j@company.com',
          recipientBusiness: 'Fresh Produce Exporters',
          subject: 'Avocado export inquiry',
          message: 'We are looking for suppliers of Hass avocados for the Middle East market. Could you provide your product catalog and pricing?',
          status: 'READ',
          createdAt: '2024-01-14T11:00:00Z',
          productName: 'Hass Avocados',
        },
        {
          id: 'inq-4',
          senderName: 'Euro Foods Ltd',
          senderType: 'BUSINESS',
          senderEmail: 'procurement@eurofoods.eu',
          recipientBusiness: 'Kenya Fruits & Vegetables Co',
          subject: 'Long-term supply agreement',
          message: 'We are interested in establishing a long-term supply agreement for mixed vegetables. Please provide your product list and export capabilities.',
          status: 'CLOSED',
          createdAt: '2024-01-13T16:00:00Z',
        },
        {
          id: 'inq-5',
          senderName: 'Michael Brown',
          senderType: 'USER',
          senderEmail: 'mbrown@trading.com',
          recipientBusiness: 'Kenya Spices Co',
          subject: 'Spice mixture quotation',
          message: 'Please provide a quotation for 500kg of mixed spices including turmeric, ginger, and cumin.',
          status: 'NEW',
          createdAt: '2024-01-15T08:30:00Z',
          productName: 'Mixed Spices',
        },
      ];
      
      setInquiries(mockInquiries);
    } catch {

      toast({
        title: 'Error',
        description: 'Failed to load inquiries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries
    .filter(inquiry => {
      const matchesSearch = inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            inquiry.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            inquiry.recipientBusiness.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const av = (a as any)[sort.field] ?? '';
      const bv = (b as any)[sort.field] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });

  const inquiryCounts = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === 'NEW').length,
    replied: inquiries.filter(i => i.status === 'REPLIED').length,
    closed: inquiries.filter(i => i.status === 'CLOSED').length,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailsOpen(true);
    handleMenuClose();
    
    // Mark as read
    if (inquiry.status === 'NEW') {
      setInquiries(prev => prev.map(inq => 
        inq.id === inquiry.id ? { ...inq, status: 'READ' as const } : inq
      ));
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedInquiry) return;

    setSendingReply(true);
    try {
      // Mock sending reply
      setInquiries(prev => prev.map(inq => 
        inq.id === selectedInquiry.id ? { ...inq, status: 'REPLIED' as const } : inq
      ));
      
      toast({
        title: 'Success',
        description: 'Reply sent successfully',
      });
      
      setReplyContent('');
      setDetailsOpen(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkAsClosed = () => {
    if (!selectedId) return;
    
    setInquiries(prev => prev.map(inq => 
      inq.id === selectedId ? { ...inq, status: 'CLOSED' as const } : inq
    ));
    
    toast({
      title: 'Success',
      description: 'Inquiry marked as closed',
    });
    
    handleMenuClose();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    
    try {
      setInquiries(prev => prev.filter(inq => inq.id !== id));
      toast({
        title: 'Success',
        description: 'Inquiry deleted successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete inquiry',
        variant: 'destructive',
      });
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'error';
      case 'READ': return 'info';
      case 'REPLIED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search inquiries..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="NEW">New</MenuItem>
              <MenuItem value="READ">Read</MenuItem>
              <MenuItem value="REPLIED">Replied</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Inquiries Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={thStyle} onClick={() => toggleSort('senderName')}>Sender<SortIcon field="senderName" /></TableCell>
              <TableCell sx={thStyle} onClick={() => toggleSort('subject')}>Subject<SortIcon field="subject" /></TableCell>
              <TableCell sx={thStyle} onClick={() => toggleSort('recipientBusiness')}>Recipient Business<SortIcon field="recipientBusiness" /></TableCell>
              <TableCell sx={thStyle} onClick={() => toggleSort('productName')}>Product<SortIcon field="productName" /></TableCell>
              <TableCell sx={thStyle} onClick={() => toggleSort('status')}>Status<SortIcon field="status" /></TableCell>
              <TableCell sx={thStyle} onClick={() => toggleSort('createdAt')}>Date<SortIcon field="createdAt" /></TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredInquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No inquiries found</TableCell>
              </TableRow>
            ) : (
              filteredInquiries.map((inquiry) => (
                <TableRow key={inquiry.id} hover sx={{ bgcolor: inquiry.status === 'NEW' ? 'action.hover' : 'inherit' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: inquiry.senderType === 'BUSINESS' ? 'primary.main' : 'secondary.main' }}>
                        {inquiry.senderType === 'BUSINESS' ? <Business /> : <Person />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={inquiry.status === 'NEW' ? 'bold' : 'normal'}>
                          {inquiry.senderName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inquiry.senderEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={inquiry.status === 'NEW' ? 'bold' : 'normal'}>
                      {inquiry.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>{inquiry.recipientBusiness}</TableCell>
                  <TableCell>{inquiry.productName || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={inquiry.status} 
                      color={getStatusColor(inquiry.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(inquiry.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => inquiry.id && handleMenuOpen(e, inquiry.id)}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const inquiry = inquiries.find(i => i.id === selectedId);
          if (inquiry) handleViewDetails(inquiry);
        }}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const inquiry = inquiries.find(i => i.id === selectedId);
          if (inquiry) {
            setSelectedInquiry(inquiry);
            setReplyContent('');
            setDetailsOpen(true);
          }
          handleMenuClose();
        }}>
          <Reply sx={{ mr: 1 }} /> Reply
        </MenuItem>
        <MenuItem onClick={handleMarkAsClosed}>
          <CheckCircle sx={{ mr: 1 }} /> Mark as Closed
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedId) handleDelete(selectedId);
        }}>
          <Delete sx={{ mr: 1 }} color="error" /> Delete
        </MenuItem>
      </Menu>

      {/* Inquiry Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inquiry Details</DialogTitle>
        <DialogContent>
          {selectedInquiry && (
            <Box>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="Details" />
                <Tab label="Reply" />
              </Tabs>
              
              {tabValue === 0 && (
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Sender</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: selectedInquiry.senderType === 'BUSINESS' ? 'primary.main' : 'secondary.main' }}>
                        {selectedInquiry.senderType === 'BUSINESS' ? <Business /> : <Person />}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">{selectedInquiry.senderName}</Typography>
                        <Typography variant="body2" color="text.secondary">{selectedInquiry.senderEmail}</Typography>
                      </Box>
                    </Box>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Recipient Business</Typography>
                    <Typography variant="body1">{selectedInquiry.recipientBusiness}</Typography>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                    <Typography variant="body1">{selectedInquiry.subject}</Typography>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                    <Typography variant="body1">{selectedInquiry.productName || '-'}</Typography>
                  </Grid2>
                  <Grid2 size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">Message</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedInquiry.message}
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedInquiry.status} 
                      color={getStatusColor(selectedInquiry.status)} 
                    />
                  </Grid2>
                </Grid2>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reply to {selectedInquiry.senderName}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {tabValue === 1 && (
            <Button 
              variant="contained" 
              startIcon={<Send />}
              onClick={handleReply}
              disabled={!replyContent.trim() || sendingReply}
            >
              Send Reply
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
