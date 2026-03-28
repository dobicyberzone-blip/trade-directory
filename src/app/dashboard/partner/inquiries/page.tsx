'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Inbox, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ChatParticipant {
  userId: string; role: string; unreadCount: number;
  user: { id: string; firstName: string; lastName: string; email: string; role: string; avatar?: string };
}
interface ChatMessage {
  id: string; message: string; messageType: string; isRead: boolean; createdAt: string;
  sender: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
}
interface Conversation {
  id: string; subject?: string; status: string; lastMessageAt: string; createdAt: string;
  participants: ChatParticipant[]; messages: ChatMessage[]; unreadCount: number;
}

export default function PartnerInquiriesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const response = await apiClient.getInquiryConversations();
        setConversations(response.conversations as unknown as Conversation[]);
      } catch { setConversations([]); } finally { setIsLoading(false); }
    };
    fetchConversations();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'ARCHIVED': return <Badge variant="secondary">Archived</Badge>;
      case 'CLOSED': return <Badge variant="outline">Closed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOtherParticipant = (c: Conversation) => c.participants.find(p => p.userId !== user?.id)?.user;

  return (
    <div className="pt-4">
      <Card>
        <CardHeader>
          <CardTitle>My Inquiries</CardTitle>
          <CardDescription>Track and manage your conversations with exporters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exporter</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  const lastMessage = conversation.messages[0];
                  return (
                    <TableRow key={conversation.id} className={conversation.unreadCount > 0 ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && <Circle className="h-2 w-2 fill-primary text-primary" />}
                          <div>
                            <div>{otherUser?.firstName} {otherUser?.lastName}</div>
                            <div className="text-sm text-muted-foreground">{otherUser?.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{conversation.subject || 'General Inquiry'}</TableCell>
                      <TableCell>
                        {lastMessage ? (
                          <div className="text-muted-foreground">
                            <div className="truncate max-w-xs">{lastMessage.message}</div>
                            <div className="text-xs">{formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}</div>
                          </div>
                        ) : <span className="text-muted-foreground">No messages yet</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/chat/${conversation.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {conversation.unreadCount > 0 ? `${conversation.unreadCount} New` : 'View Chat'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="text-center p-8 text-muted-foreground">
                      <Inbox className="mx-auto h-12 w-12" />
                      <p className="mt-4">You have not sent any inquiries yet.</p>
                      <p className="text-sm">Start exploring the directory to connect with exporters.</p>
                      <Button asChild className="mt-4"><Link href="/directory">Browse Directory</Link></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
