'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Send, Notifications, Warning, Info, CheckCircle } from '@mui/icons-material';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  type: 'SYSTEM_ANNOUNCEMENT' | 'MAINTENANCE' | 'FEATURE_UPDATE' | 'SECURITY_ALERT';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  icon: React.ReactNode;
}

export default function AdminNotificationSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'system_maintenance',
      title: 'System Maintenance Notifications',
      description: 'Automatically notify all users about scheduled system maintenance',
      enabled: true,
      type: 'MAINTENANCE',
      urgency: 'CRITICAL',
      icon: <Warning color="error" />,
    },
    {
      id: 'feature_updates',
      title: 'Feature Update Announcements',
      description: 'Notify users about new features and platform improvements',
      enabled: true,
      type: 'FEATURE_UPDATE',
      urgency: 'MEDIUM',
      icon: <Info color="info" />,
    },
    {
      id: 'security_alerts',
      title: 'Security Alerts',
      description: 'Send critical security notifications to all users',
      enabled: true,
      type: 'SECURITY_ALERT',
      urgency: 'CRITICAL',
      icon: <Warning color="error" />,
    },
    {
      id: 'system_announcements',
      title: 'General System Announcements',
      description: 'Broadcast important platform-wide announcements',
      enabled: true,
      type: 'SYSTEM_ANNOUNCEMENT',
      urgency: 'HIGH',
      icon: <Notifications color="primary" />,
    },
    {
      id: 'newsletter',
      title: 'Newsletter to Subscribers',
      description: 'Send newsletter updates to newsletter subscribers only',
      enabled: true,
      type: 'SYSTEM_ANNOUNCEMENT',
      urgency: 'MEDIUM',
      icon: <Send color="primary" />,
    },
  ]);

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<NotificationSetting | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleToggle = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    
    toast({
      title: 'Settings Updated',
      description: 'Notification settings have been saved.',
    });
  };

  const handleOpenSendDialog = (setting: NotificationSetting) => {
    setSelectedSetting(setting);
    
    // Pre-fill with template based on type
    switch (setting.type) {
      case 'MAINTENANCE':
        setNotificationTitle('System Maintenance Scheduled');
        setNotificationMessage('The KEPROBA platform will undergo scheduled maintenance on [DATE] from [START TIME] to [END TIME] EAT. The platform will be temporarily unavailable during this time. We apologize for any inconvenience.');
        break;
      case 'FEATURE_UPDATE':
        setNotificationTitle('New Features Available');
        setNotificationMessage('We\'re excited to announce new features on the KEPROBA platform! [DESCRIBE FEATURES]. Check out the updates in your dashboard.');
        break;
      case 'SECURITY_ALERT':
        setNotificationTitle('Important Security Update');
        setNotificationMessage('We have implemented important security updates to protect your account. Please review your security settings and ensure your password is strong and unique.');
        break;
      case 'SYSTEM_ANNOUNCEMENT':
        if (setting.id === 'newsletter') {
          setNotificationTitle('KEPROBA Newsletter - [MONTH YEAR]');
          setNotificationMessage('Dear KEPROBA Community,\n\n[NEWSLETTER CONTENT]\n\nHighlights this month:\n- [HIGHLIGHT 1]\n- [HIGHLIGHT 2]\n- [HIGHLIGHT 3]\n\nThank you for being part of the KEPROBA community!');
        } else {
          setNotificationTitle('Important Announcement');
          setNotificationMessage('[YOUR ANNOUNCEMENT MESSAGE HERE]');
        }
        break;
    }
    
    setSendDialogOpen(true);
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage || !selectedSetting) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    setSending(true);
    try {
      let userIds: string[] = [];
      let recipientCount = 0;

      // Check if this is a newsletter notification
      if (selectedSetting.id === 'newsletter') {
        // Get newsletter subscribers using direct API call
        const subscribersResponse = await fetch('/api/admin/newsletter?active=true', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!subscribersResponse.ok) {
          throw new Error('Failed to fetch newsletter subscribers');
        }

        const subscribersData = await subscribersResponse.json();
        const activeSubscribers = subscribersData.data || [];
        
        if (activeSubscribers.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Subscribers',
            description: 'There are no active newsletter subscribers',
          });
          setSending(false);
          return;
        }

        // Get all users to match with newsletter subscribers
        const response = await apiClient.getUsers();
        const allUsers = response.users;
        
        // Find users who are also newsletter subscribers
        userIds = allUsers
          .filter(u => activeSubscribers.some((s: { email: string }) => s.email === u.email))
          .map(u => u.id);
        
        recipientCount = activeSubscribers.length;
        
        console.log(`Newsletter: ${recipientCount} subscribers, ${userIds.length} registered users`);
      } else {
        // Get all users for regular notifications
        const response = await apiClient.getUsers();
        userIds = response.users.map(u => u.id);
        recipientCount = userIds.length;
      }

      // Send bulk notification to registered users
      if (userIds.length > 0) {
        await apiClient.createNotification({
          userIds,
          title: notificationTitle,
          message: notificationMessage,
          type: selectedSetting.type,
          urgency: selectedSetting.urgency,
        });

        toast({
          title: 'Notification Sent',
          description: selectedSetting.id === 'newsletter' 
            ? `Successfully sent to ${userIds.length} registered newsletter subscribers`
            : `Successfully sent to ${recipientCount} users`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'No Recipients',
          description: 'No registered users found among newsletter subscribers',
        });
      }

      setSendDialogOpen(false);
      setNotificationTitle('');
      setNotificationMessage('');
      setSelectedSetting(null);
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notification. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography color="text.secondary">
          You need admin privileges to access this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Notification Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage automated notifications and send announcements to all users
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> When enabled, these notifications will automatically send emails to all users when triggered. 
          You can also manually send notifications using the "Send Now" button.
        </Typography>
      </Alert>

      {/* Notification Settings */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {settings.map((setting, index) => (
          <React.Fragment key={setting.id}>
            <Box sx={{ pt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                  <Box sx={{ mt: 0.5 }}>
                    {setting.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {setting.title}
                      </Typography>
                      <Chip
                        label={setting.urgency}
                        size="small"
                        color={
                          setting.urgency === 'CRITICAL' ? 'error' :
                          setting.urgency === 'HIGH' ? 'warning' :
                          setting.urgency === 'MEDIUM' ? 'info' : 'default'
                        }
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {setting.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Send />}
                        onClick={() => handleOpenSendDialog(setting)}
                        disabled={!setting.enabled}
                      >
                        Send Now
                      </Button>
                    </Box>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setting.enabled}
                      onChange={() => handleToggle(setting.id)}
                      color="primary"
                    />
                  }
                  label={setting.enabled ? 'Enabled' : 'Disabled'}
                  labelPlacement="start"
                  sx={{ ml: 2 }}
                />
              </Box>
            </Box>
            {index < settings.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Paper>

      {/* Statistics */}
      <Paper elevation={0} sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Notification Statistics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Active Settings
            </Typography>
            <Typography variant="h4" fontWeight={600} color="primary.main">
              {settings.filter(s => s.enabled).length}/{settings.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Critical Alerts
            </Typography>
            <Typography variant="h4" fontWeight={600} color="error.main">
              {settings.filter(s => s.urgency === 'CRITICAL' && s.enabled).length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Newsletter Enabled
            </Typography>
            <Typography variant="h4" fontWeight={600} color="success.main">
              {settings.find(s => s.id === 'newsletter')?.enabled ? 'Yes' : 'No'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="body1" fontWeight={600}>
                All Systems Operational
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Send Notification Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => !sending && setSendDialogOpen(false)}
        maxWidth="md"
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
        }}
      >
        <DialogTitle>
          Send {selectedSetting?.title}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {selectedSetting?.id === 'newsletter' 
              ? 'This will send an email notification to all active newsletter subscribers.'
              : 'This will send an email notification to ALL users on the platform.'}
          </Alert>
          
          <TextField
            fullWidth
            label="Notification Title"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
            disabled={sending}
          />
          
          <TextField
            fullWidth
            label="Notification Message"
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            multiline
            rows={6}
            disabled={sending}
            helperText="This message will be sent to all users via email and in-app notification"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            disabled={sending || !notificationTitle || !notificationMessage}
            startIcon={sending ? undefined : <Send />}
          >
            {sending ? 'Sending...' : 'Send to All Users'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

