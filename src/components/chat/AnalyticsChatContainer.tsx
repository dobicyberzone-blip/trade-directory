'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { MessageSquare, TrendingUp, Clock, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import Image from 'next/image';

// Types
export interface AnalyticsChatMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  messageType?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead?: boolean;
}

export interface AnalyticsChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  status?: 'online' | 'offline' | 'away';
}

interface AnalyticsChatContainerProps {
  participant: AnalyticsChatParticipant;
  messages: AnalyticsChatMessage[];
  currentUserId: string;
  onSendMessage?: (message: string, attachment?: File) => Promise<void>;
  onViewFullChat?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Format time
const formatMessageTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
};

// Mini message bubble for analytics cards
interface MiniMessageBubbleProps {
  message: AnalyticsChatMessage;
  isOwn: boolean;
}

function MiniMessageBubble({ message, isOwn }: MiniMessageBubbleProps) {
  return (
    <div
      className={`flex gap-2 mb-2 ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isOwn && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={message.sender.avatar || undefined} />
          <AvatarFallback className="bg-green-100 text-green-700 text-[10px]">
            {message.sender.firstName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`
          max-w-[75%] rounded-lg px-2 py-1.5
          ${isOwn 
            ? 'bg-green-600 text-white' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
          }
        `}
      >
        <p className="text-xs sm:text-sm line-clamp-2">{message.message}</p>
        <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// Analytics metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  );
}

// Main Analytics Chat Container
export function AnalyticsChatContainer({
  participant,
  messages,
  currentUserId,
  onSendMessage,
  onViewFullChat,
  isLoading = false,
  className = '',
}: AnalyticsChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get recent messages (last 10)
  const recentMessages = messages.slice(-10);
  
  // Calculate metrics
  const totalMessages = messages.length;
  const unreadCount = messages.filter(m => !m.isRead && m.sender.id !== currentUserId).length;
  const todayMessages = messages.filter(m => {
    const msgDate = new Date(m.createdAt);
    return isToday(msgDate);
  }).length;

  return (
    <Card className={`shadow-lg border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Analytics Header */}
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Live Chat
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {participant.firstName} {participant.lastName}
              </p>
            </div>
          </div>
          
          {/* Online Status Badge */}
          <Badge 
            variant={participant.status === 'online' ? 'default' : 'secondary'}
            className={participant.status === 'online' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`}></span>
            {participant.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>

      {/* Analytics Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
        <MetricCard
          title="Messages"
          value={totalMessages}
          icon={<MessageSquare className="h-4 w-4 text-green-600" />}
        />
        <MetricCard
          title="Today"
          value={todayMessages}
          change={todayMessages > 0 ? 100 : 0}
          trend={todayMessages > 0 ? 'up' : 'down'}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <MetricCard
          title="Unread"
          value={unreadCount}
          change={unreadCount > 0 ? 100 : 0}
          trend={unreadCount > 0 ? 'up' : 'down'}
          icon={<Clock className="h-4 w-4 text-green-600" />}
        />
      </div>

      {/* Chat Preview Area */}
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] sm:h-[320px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="p-3 sm:p-4">
            {recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start the conversation</p>
              </div>
            ) : (
              <>
                {recentMessages.map((message) => (
                  <MiniMessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender.id === currentUserId}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* View Full Chat Button */}
        {onViewFullChat && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Button 
              onClick={onViewFullChat}
              variant="outline" 
              className="w-full text-sm border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              View Full Conversation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AnalyticsChatContainer;
