'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Chip, Avatar, Box, Typography, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Tab, Tabs,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon, X as CancelIcon, Eye as VisibilityIcon,
  MapPin as LocationOnIcon, Building as BusinessIcon, Search as SearchIcon,
  FileText as FileTextIcon, Download as DownloadIcon, Lock as LockIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Business {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
  location?: string;
  county?: string;
  town?: string;
  country?: string;
  physicalAddress?: string;
  coordinates?: string;
  logoUrl?: string;

  // Registration-owned fields (from exporter registration)
  registrationNumber?: string;
  kraPin?: string;
  dateOfIncorporation?: string;
  legalStructure?: string;
  serviceOffering?: string;
  primaryContactFirstName?: string;
  primaryContactLastName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  companyEmail?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Business profile fields
  kenyanNationalId?: string;
  licenceNumber?: string;
  exportLicense?: string;
  typeOfBusiness?: string;
  businessUserOrganisation?: string;
  companySize?: string;
  numberOfEmployees?: string;
  mobileNumber?: string;
  managementTeam?: string;
  whatsappNumber?: string;
  website?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  productHsCode?: string;
  exportVolumePast3Years?: string;
  currentExportMarkets?: string;
  productionCapacityPast3?: string;
  companyStory?: string;

  // Documents
  registrationCertificateUrl?: string;
  pinCertificateUrl?: string;
  kenyanNationalIdUrl?: string;
  incorporationCertificateUrl?: string;
  exportLicenseUrl?: string;

  owner?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  products?: any[];
  certifications?: any[];
}

// Small helper for a labelled info row
const InfoRow = ({ label, value, fromReg }: { label: string; value?: string | null; fromReg?: boolean }) => {
  if (!value) return null;
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
        {fromReg && (
          <Box display="flex" alignItems="center" gap={0.3}
            sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 1, px: 0.5, py: 0.1 }}>
            <LockIcon size={10} style={{ color: '#d97706' }} />
            <Typography variant="caption" sx={{ color: 'warning.700', fontSize: '0.6rem' }}>reg</Typography>
          </Box>
        )}
      </Box>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
};

export function BusinessVerificationTab() {
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<Business | null>(null);
  const [detailsTabValue, setDetailsTabValue] = useState(0);
  const { toast } = useToast();

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getBusinesses();
      setAllBusinesses(response.businesses as Business[]);
    } catch {
      setAllBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBusinesses = useMemo(() => {
    let result = [...allBusinesses];
    if (statusFilter !== 'ALL') result = result.filter(b => b.verificationStatus === statusFilter);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.name?.toLowerCase().includes(s) ||
        b.owner?.firstName?.toLowerCase().includes(s) ||
        b.owner?.lastName?.toLowerCase().includes(s) ||
        b.contactEmail?.toLowerCase().includes(s) ||
        b.companyEmail?.toLowerCase().includes(s) ||
        b.sector?.toLowerCase().includes(s) ||
        b.registrationNumber?.toLowerCase().includes(s) ||
        b.kraPin?.toLowerCase().includes(s) ||
        b.location?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allBusinesses, searchTerm, statusFilter]);

  const handleVerification = async (businessId: string, businessName: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    try {
      setIsVerifying(businessId);
      await apiClient.verifyBusiness(businessId, status);
      toast({ title: `Business ${status.toLowerCase()}`, description: `${businessName} has been ${status.toLowerCase()}${reason ? `: ${reason}` : '.'}` });
      await fetchBusinesses();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update verification status.' });
    } finally {
      setIsVerifying(null);
      setShowRejectDialog(null);
      setRejectionReason('');
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    if (status === 'VERIFIED') return 'success';
    if (status === 'REJECTED') return 'error';
    return 'warning';
  };

  const RejectionReasonDialog = () => {
    if (!showRejectDialog) return null;
    return (
      <Dialog open={!!showRejectDialog} onClose={() => { setShowRejectDialog(null); setRejectionReason(''); }}
        maxWidth="sm" fullWidth
        sx={{ '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, zIndex: 9999 }, '& .MuiBackdrop-root': { zIndex: 9998 } }}>
        <DialogTitle>Reject Business Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Provide a reason for rejecting <strong>{showRejectDialog.name}</strong>. This will be shared with the business owner.
          </Typography>
          <TextField fullWidth multiline rows={4} label="Rejection Reason" value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter the reason for rejection..." required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowRejectDialog(null); setRejectionReason(''); }}>Cancel</Button>
          <Button color="error" variant="contained"
            onClick={() => {
              if (!rejectionReason.trim()) {
                toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for rejection.' });
                return;
              }
              handleVerification(showRejectDialog.id, showRejectDialog.name, 'REJECTED', rejectionReason);
            }}
            disabled={isVerifying === showRejectDialog.id}>
            {isVerifying === showRejectDialog.id ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const BusinessDetailsDialog = ({ business, open, onClose }: { business: Business; open: boolean; onClose: () => void }) => {
    if (!business) return null;

    let coordinates: { lat: number; lng: number } | null = null;
    if (business.coordinates) {
      try { coordinates = typeof business.coordinates === 'string' ? JSON.parse(business.coordinates) : business.coordinates; } catch { /* ignore */ }
    }

    const docCount = [
      business.registrationCertificateUrl,
      business.pinCertificateUrl,
      business.kenyanNationalIdUrl,
      business.incorporationCertificateUrl,
      business.exportLicenseUrl,
    ].filter(Boolean).length;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 3 }, maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 }, '& .MuiBackdrop-root': { zIndex: 9998 } }}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={business.logoUrl} alt={business.name} sx={{ width: 48, height: 48 }}>
              <BusinessIcon />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6">{business.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {business.sector}{business.industry ? ` · ${business.industry}` : ''} · {business.location}
              </Typography>
            </Box>
            <Chip label={business.verificationStatus} color={getStatusColor(business.verificationStatus)} size="small" />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Tabs value={detailsTabValue} onChange={(_, v) => setDetailsTabValue(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
            <Tab label="Registration Info" />
            <Tab label="Business Details" />
            <Tab label="Location & Contact" />
            <Tab label={`Documents (${docCount})`} />
            <Tab label="Export & Capacity" />
          </Tabs>

          {/* TAB 0 — Registration Info (reg-owned fields) */}
          {detailsTabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1.5, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 1 }}>
                  <LockIcon size={14} style={{ color: '#d97706' }} />
                  <Typography variant="caption" sx={{ color: 'warning.800' }}>
                    Fields marked with a lock icon are sourced from the Exporter Registration form and cannot be edited in the Business Profile.
                  </Typography>
                </Box>
              </Grid>

              {/* Business Identity */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Business Identity</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Business Name" value={business.name} fromReg />
                      <InfoRow label="Business Reg. No." value={business.registrationNumber} fromReg />
                      <InfoRow label="KRA PIN" value={business.kraPin} fromReg />
                      <InfoRow label="Date of Incorporation" value={business.dateOfIncorporation} fromReg />
                      <InfoRow label="Legal Structure" value={business.legalStructure} fromReg />
                      <InfoRow label="Kenyan National ID" value={business.kenyanNationalId} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sector & Products */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Sector & Products</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Industry" value={business.industry} fromReg />
                      <InfoRow label="Sector" value={business.sector} fromReg />
                      <InfoRow label="Products / Services" value={business.serviceOffering} fromReg />
                      <InfoRow label="Product HS Code" value={business.productHsCode} />
                      <InfoRow label="Business Organisation" value={business.businessUserOrganisation} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Primary Contact */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Primary Contact (from Registration)</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoRow label="First Name" value={business.primaryContactFirstName} fromReg />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoRow label="Last Name" value={business.primaryContactLastName} fromReg />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoRow label="Email" value={business.primaryContactEmail} fromReg />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoRow label="Phone" value={business.primaryContactPhone} fromReg />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Account Owner */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Account Owner</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Name" value={`${business.owner?.firstName || ''} ${business.owner?.lastName || ''}`.trim()} />
                      <InfoRow label="Email" value={business.owner?.email} />
                      <InfoRow label="Phone" value={business.owner?.phoneNumber} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Submission Timeline */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Submission</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Submitted On" value={new Date(business.createdAt).toLocaleString()} />
                      {business.updatedAt && <InfoRow label="Last Updated" value={new Date(business.updatedAt).toLocaleString()} />}
                      <InfoRow label="Verification Status" value={business.verificationStatus} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 1 — Business Details */}
          {detailsTabValue === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Company Details</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Number of Employees" value={business.numberOfEmployees} />
                      <InfoRow label="Company Size" value={business.companySize} />
                      <InfoRow label="Export License No." value={business.exportLicense} />
                      <InfoRow label="Licence Number" value={business.licenceNumber} />
                      {business.managementTeam && (() => {
                        try {
                          const dirs = JSON.parse(business.managementTeam);
                          if (Array.isArray(dirs) && dirs.length > 0) {
                            return (
                              <Box>
                                <Typography variant="subtitle2" color="textSecondary">Directors</Typography>
                                {dirs.map((d: { name: string; role: string }, i: number) => (
                                  <Typography key={i} variant="body2">{d.name}{d.role ? ` — ${d.role}` : ''}</Typography>
                                ))}
                              </Box>
                            );
                          }
                        } catch { return null; }
                        return null;
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Company Story</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {business.companyStory || 'No company story provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Products & Certifications</Typography>
                    <Box display="flex" gap={4}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Total Products</Typography>
                        <Typography variant="body2">{business.products?.length || 0}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Total Certifications</Typography>
                        <Typography variant="body2">{business.certifications?.length || 0}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 2 — Location & Contact */}
          {detailsTabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Location</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Physical Address" value={business.physicalAddress} fromReg />
                      <InfoRow label="Town / City" value={business.town} fromReg />
                      <InfoRow label="County" value={business.county} fromReg />
                      <InfoRow label="Country" value={business.country || 'Kenya'} />
                      {coordinates && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">GPS Coordinates</Typography>
                          <Typography variant="body2">Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Contact</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Company Email" value={business.companyEmail} fromReg />
                      <InfoRow label="Contact Phone" value={business.contactPhone} fromReg />
                      <InfoRow label="Mobile Number" value={business.mobileNumber} />
                      <InfoRow label="WhatsApp" value={business.whatsappNumber} />
                      <InfoRow label="Website" value={business.website} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {(business.twitterUrl || business.instagramUrl) && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Social Media</Typography>
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <InfoRow label="Twitter" value={business.twitterUrl} />
                        <InfoRow label="Instagram" value={business.instagramUrl} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* TAB 3 — Documents */}
          {detailsTabValue === 3 && (
            <Grid container spacing={2}>
              {[
                { label: 'Registration Certificate', url: business.registrationCertificateUrl },
                { label: 'PIN Certificate', url: business.pinCertificateUrl },
                { label: 'Kenyan National ID', url: business.kenyanNationalIdUrl },
                { label: 'Certificate of Incorporation', url: business.incorporationCertificateUrl },
                { label: 'Export License', url: business.exportLicenseUrl },
              ].map(({ label, url }) => url ? (
                <Grid item xs={12} sm={6} key={label}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <FileTextIcon size={18} style={{ color: '#3b82f6' }} />
                        <Typography variant="subtitle2">{label}</Typography>
                      </Box>
                      <Button size="small" startIcon={<DownloadIcon size={14} />} href={url} target="_blank" rel="noopener noreferrer">
                        View / Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ) : null)}
              {docCount === 0 && (
                <Grid item xs={12}>
                  <Box textAlign="center" py={4}>
                    <FileTextIcon size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <Typography variant="body2" color="textSecondary">No documents uploaded yet</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {/* TAB 4 — Export & Capacity */}
          {detailsTabValue === 4 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Export Information</Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <InfoRow label="Export Markets" value={business.currentExportMarkets} />
                      <InfoRow label="Export Volume (Past 3 Years)" value={business.exportVolumePast3Years} />
                      <InfoRow label="Production Capacity (Past 3 Years)" value={business.productionCapacityPast3} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button color="error" startIcon={<CancelIcon size={16} />}
            onClick={() => { setShowRejectDialog(business); onClose(); }}
            disabled={isVerifying === business.id}>
            Reject
          </Button>
          <Button color="success" variant="contained" startIcon={<CheckCircleIcon size={16} />}
            onClick={() => handleVerification(business.id, business.name, 'VERIFIED')}
            disabled={isVerifying === business.id}>
            {isVerifying === business.id ? 'Verifying...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Business Verification ({filteredBusinesses.length} businesses)</Typography>
        <Button variant="outlined" onClick={fetchBusinesses} disabled={isLoading}>Refresh</Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, email, KRA PIN, reg no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon size={20} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="VERIFIED">Verified</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
            <MenuItem value="ALL">All</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Reg. No. / KRA PIN</TableCell>
              <TableCell>Sector / Industry</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBusinesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <BusinessIcon size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <Typography variant="body2" color="textSecondary">No businesses found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar src={business.logoUrl} alt={business.name} sx={{ width: 36, height: 36 }}>
                        {business.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{business.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{business.owner?.firstName} {business.owner?.lastName}</Typography>
                    <Typography variant="caption" color="textSecondary">{business.owner?.email || business.contactEmail}</Typography>
                  </TableCell>
                  <TableCell>
                    {business.registrationNumber && (
                      <Typography variant="body2">{business.registrationNumber}</Typography>
                    )}
                    {business.kraPin && (
                      <Typography variant="caption" color="textSecondary">{business.kraPin}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{business.sector}</Typography>
                    {business.industry && (
                      <Typography variant="caption" color="textSecondary">{business.industry}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <LocationOnIcon size={14} />
                      <Typography variant="body2">{business.town || business.location}</Typography>
                    </Box>
                    {business.county && (
                      <Typography variant="caption" color="textSecondary">{business.county}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={business.verificationStatus} color={getStatusColor(business.verificationStatus)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      <Button size="small" startIcon={<VisibilityIcon size={14} />}
                        onClick={() => { setSelectedBusiness(business); setDetailsTabValue(0); }}>
                        View
                      </Button>
                      {business.verificationStatus === 'PENDING' && (
                        <>
                          <Button size="small" color="success" startIcon={<CheckCircleIcon size={14} />}
                            onClick={() => handleVerification(business.id, business.name, 'VERIFIED')}
                            disabled={isVerifying === business.id}>
                            {isVerifying === business.id ? '...' : 'Approve'}
                          </Button>
                          <Button size="small" color="error" startIcon={<CancelIcon size={14} />}
                            onClick={() => setShowRejectDialog(business)}
                            disabled={isVerifying === business.id}>
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedBusiness && (
        <BusinessDetailsDialog business={selectedBusiness} open={!!selectedBusiness} onClose={() => setSelectedBusiness(null)} />
      )}
      <RejectionReasonDialog />
    </Box>
  );
}
