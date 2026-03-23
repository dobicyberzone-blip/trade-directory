'use client';

import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Inbox, MessageSquare, Circle, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';

interface ChatParticipant {
  userId: string;
  role: string;
  unreadCount: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  subject?: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
}

const PAGE_SIZE = 10;

export default function ExporterInquiriesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'CLOSED'>('ALL');
  const [page, setPage] = useState(1);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await apiClient.getInquiryConversations();
      setConversations(response.conversations as unknown as Conversation[]);
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const getOtherParticipant = (c: Conversation) =>
    c.participants.find(p => p.userId !== user?.id)?.user;

  const getLastMessage = (c: Conversation) => c.messages[0];

  const filtered = useMemo(() => {
    return conversations.filter(c => {
      const other = getOtherParticipant(c);
      const name = `${other?.firstName} ${other?.lastName}`.toLowerCase();
      const email = (other?.email || '').toLowerCase();
      const subject = (c.subject || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || subject.includes(q);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, search, statusFilter, user]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const unreadTotal = conversations.reduce((sum, c) => {
    const p = c.participants.find(p => p.userId === user?.id);
    return sum + (p?.unreadCount || 0);
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':   return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'ARCHIVED': return <Badge variant="secondary">Archived</Badge>;
      case 'CLOSED':   return <Badge variant="outline">Closed</Badge>;
      default:         return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="pt-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Received Inquiries
                {unreadTotal > 0 && (
                  <Badge className="bg-green-600 text-white text-xs">{unreadTotal} unread</Badge>
                )}
              </CardTitle>
              <CardDescription>View and respond to inquiries from potential buyers.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConversations} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by buyer name, email or subject..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['ALL', 'ACTIVE', 'ARCHIVED', 'CLOSED'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={statusFilter === s ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="pl-6 w-[220px]">Buyer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">Last Message</TableHead>
                <TableHead className="hidden sm:table-cell w-[100px]">Date</TableHead>
                <TableHead className="w-[90px] text-center">Status</TableHead>
                <TableHead className="text-right pr-6 w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-8 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full mx-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  const currentUserParticipant = conversation.participants.find(p => p.userId === user?.id);
                  const unreadCount = currentUserParticipant?.unreadCount || 0;
                  const lastMessage = getLastMessage(conversation);
                  return (
                    <TableRow
                      key={conversation.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${unreadCount > 0 ? 'bg-green-50/40 dark:bg-green-900/10' : ''}`}
                    >
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <Circle className="h-2 w-2 flex-shrink-0 fill-green-500 text-green-500" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-sm">
                              {otherUser?.firstName} {otherUser?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{otherUser?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-1">{conversation.subject || 'General Inquiry'}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {lastMessage ? (
                          <div>
                            <div className="text-sm truncate max-w-[240px] text-muted-foreground">
                              {lastMessage.message}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No messages yet</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {lastMessage
                          ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
                          : formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(conversation.status)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="outline" size="sm" asChild className="gap-1.5">
                          <Link href={`/dashboard/chat/${conversation.id}`}>
                            <MessageSquare className="h-3.5 w-3.5" />
                            {unreadCount > 0 ? (
                              <span className="font-semibold text-green-700">{unreadCount} New</span>
                            ) : 'View Chat'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Inbox className="h-10 w-10 mb-3 opacity-40" />
                      <p className="font-medium">
                        {search || statusFilter !== 'ALL' ? 'No inquiries match your filters' : 'No inquiries yet'}
                      </p>
                      <p className="text-sm mt-1">
                        {search || statusFilter !== 'ALL'
                          ? 'Try adjusting your search or filter'
                          : 'Buyers will contact you through the directory once your profile is verified.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-medium">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
