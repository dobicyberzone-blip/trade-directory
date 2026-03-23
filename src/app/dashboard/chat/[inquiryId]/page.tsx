'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Loader2,
  Check,
  CheckCheck
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatParticipant {
  userId: string;
  role: string;
  unreadCount: number;
  lastReadAt?: string;
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

export default function ChatDetailPage({ params }: { params: { inquiryId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await apiClient.getConversation(params.inquiryId);
      setConversation(response.conversation as unknown as Conversation);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [user, params.inquiryId]);

  useEffect(() => {
    if (user) {
      loadConversation();
    }
  }, [user, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const sendReply = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setIsSending(true);
      await apiClient.sendReply(params.inquiryId, newMessage.trim());
      setNewMessage('');
      loadConversation(); // Reload to get updated messages
    } catch (error) {
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return conversation.participants.find(p => p.userId !== user.id)?.user;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffInHours < 168) { // Less than 7 days
      return format(date, 'EEEE, h:mm a');
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

  const isMessageRead = (message: ChatMessage) => {
    if (!conversation || !user) return false;
    // Message is read if sender is not current user AND isRead is true
    // OR if it's from current user (we can see our own read status)
    if (message.sender.id === user.id) {
      return message.isRead;
    }
    return false;
  };

  const otherUser = getOtherParticipant();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full">
          <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold text-foreground">Conversation Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              This conversation may have been deleted or you don&apos;t have access.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/chat')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/chat">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Avatar>
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback>
                  {otherUser ? getInitials(otherUser.firstName, otherUser.lastName) : '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {otherUser?.firstName} {otherUser?.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {otherUser?.role} • {conversation.subject || 'General Inquiry'}
                </p>
              </div>
            </div>
            <Badge variant={conversation.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {conversation.status}
            </Badge>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 py-2">
            <div className="space-y-4">
              {conversation.messages.map((message, index) => {
                const isOwn = message.sender.id === user?.id;
                const showTimestamp = index === 0 || 
                  new Date(message.createdAt).getTime() - new Date(conversation.messages[index - 1].createdAt).getTime() > 300000; // 5 minutes

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="text-center text-xs text-muted-foreground my-4">
                        {formatMessageTime(message.createdAt)}
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.firstName, message.sender.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div 
                            className={`rounded-lg px-4 py-2 ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
                            <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
                            {isOwn && (
                              <span>
                                {isMessageRead(message) ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending || conversation.status === 'CLOSED'}
              className="flex-1"
            />
            <Button 
              onClick={sendReply} 
              disabled={!newMessage.trim() || isSending || conversation.status === 'CLOSED'}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {conversation.status === 'CLOSED' && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              This conversation has been closed.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}