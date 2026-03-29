'use client';

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
} from '@mui/material';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminEmailDialogProps {
  open: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
}

export function AdminEmailDialog({ open, onClose, recipientEmail, recipientName }: AdminEmailDialogProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleClose = () => {
    setSubject('');
    setMessage('');
    onClose();
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: 'Subject and message are required' });
      return;
    }
    setSending(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: recipientEmail, toName: recipientName, subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      toast({ title: 'Email sent', description: `Message delivered to ${recipientEmail}` });
      handleClose();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to send email', description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          borderRadius: 2,
          zIndex: 9999,
        },
        zIndex: 9998,
      }}
      slotProps={{
        backdrop: { sx: { zIndex: 9998 } }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Mail size={20} />
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Send Email to {recipientName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important', px: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary">
          To: <strong>{recipientEmail}</strong>
        </Typography>
        <TextField
          label="Subject *"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          fullWidth size="small" autoFocus
        />
        <TextField
          label="Message *"
          value={message}
          onChange={e => setMessage(e.target.value)}
          fullWidth multiline rows={5} size="small"
          placeholder="Type your message here…"
        />
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 }, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={sending}
          variant="outlined"
          sx={{ flex: { xs: 1, sm: 'none' }, minHeight: 44 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={sending}
          startIcon={sending ? <CircularProgress size={14} /> : <Mail size={14} />}
          sx={{ flex: { xs: 1, sm: 'none' }, minHeight: 44, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
        >
          {sending ? 'Sending…' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
