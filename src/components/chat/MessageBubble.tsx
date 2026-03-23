'use client';

import { memo, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Clock, FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: string;
  createdAt: string;
  isOwn: boolean;
  senderAvatar?: string | null;
  senderName?: string;
  read?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  messageType?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  showAvatar?: boolean;
  showSenderName?: boolean;
  isGrouped?: boolean;
  isLastInGroup?: boolean;
  onRetry?: () => void;
}

// Use memo to prevent unnecessary re-renders
export const MessageBubble = memo(function MessageBubble({
  message,
  createdAt,
  isOwn,
  senderAvatar,
  senderName,
  read = false,
  attachmentUrl,
  attachmentName,
  messageType,
  status = 'sent',
  showAvatar = true,
  showSenderName = true,
  isGrouped = false,
  isLastInGroup = true,
  onRetry,
}: MessageBubbleProps) {
  // Format timestamp based on date
  const formattedTime = useMemo(() => {
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return 'Just now';
      
      // Show time for all messages
      return format(date, 'h:mm a');
    } catch {
      return 'Just now';
    }
  }, [createdAt]);

  // Format date header
  const dateHeader = useMemo(() => {
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return null;
      
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      if (isThisWeek(date)) return format(date, 'EEEE');
      return format(date, 'MMMM d, yyyy');
    } catch {
      return null;
    }
  }, [createdAt]);

  // Get delivery status icon
  const StatusIcon = useMemo(() => {
    if (status === 'sending') return <Loader2 className="h-3 w-3 animate-spin" />;
    if (status === 'failed') return <AlertCircle className="h-3 w-3" />;
    if (isOwn || read) return <CheckCheck className="h-3 w-3" />;
    return <Check className="h-3 w-3" />;
  }, [status, isOwn, read]);

  // Get delivery status color
  const statusColor = useMemo(() => {
    if (status === 'failed') return 'text-red-400';
    if (isOwn || read) return 'text-blue-400';
    return 'text-white/70';
  }, [status, isOwn, read]);

  // Determine attachment preview type
  const isImage = messageType === 'IMAGE' || (attachmentUrl && attachmentName && 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachmentName));

  return (
    <div
      className={cn(
        'flex gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isOwn ? 'justify-end' : 'justify-start',
        isGrouped && 'mt-0.5'
      )}
    >
      {/* Avatar for incoming grouped messages */}
      {!isOwn && showAvatar && !isGrouped && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || undefined} />
          <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
            {senderName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for grouped incoming messages */}
      {!isOwn && showAvatar && isGrouped && <div className="w-8 flex-shrink-0" />}

      {/* Message Bubble */}
      <div className={cn('flex flex-col max-w-[70%] md:max-w-[60%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name for incoming non-grouped messages */}
        {!isOwn && showSenderName && !isGrouped && senderName && (
          <span className="text-xs text-gray-500 mb-1 px-1">{senderName}</span>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-2 shadow-sm relative',
            isOwn 
              ? 'bg-green-600 text-white rounded-br-sm' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm',
            status === 'failed' && 'bg-red-500 border-red-400',
            isGrouped && !isOwn && 'rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl',
            isLastInGroup && !isOwn && 'rounded-tl-sm'
          )}
        >
          {/* Message Text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message}</p>

          {/* Attachment */}
          {attachmentUrl && (
            <div className="mt-2">
              {isImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  <Image
                    src={attachmentUrl}
                    alt={attachmentName || 'Image'}
                    width={300}
                    height={200}
                    className="rounded-lg cursor-pointer hover:opacity-90 object-cover max-w-full"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                </div>
              ) : (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg transition-colors',
                    isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <FileIcon className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate max-w-[150px]">
                      {attachmentName || 'Attachment'}
                    </span>
                    {attachmentName && (
                      <span className="text-xs opacity-70">
                        {formatFileSize(attachmentName)}
                      </span>
                    )}
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Time and Read Status */}
          <div className={cn('flex items-center gap-1 mt-1 justify-end', isOwn ? 'text-white/70' : 'text-gray-500')}>
            <span className="text-xs">{formattedTime}</span>
            {isOwn && (
              <span className={cn('ml-1', statusColor)}>
                {StatusIcon}
              </span>
            )}
          </div>

          {/* Failed status indicator with retry */}
          {status === 'failed' && (
            <button
              onClick={onRetry}
              className="absolute -bottom-6 left-0 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Helper function to format file size
function formatFileSize(filename: string): string {
  // This is a placeholder - in real implementation, you'd have actual file size
  return '';
}

// Date header component for message groups
export const MessageDateHeader = memo(function MessageDateHeader({ date }: { date: string }) {
  const formattedDate = useMemo(() => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      
      if (isToday(d)) return 'Today';
      if (isYesterday(d)) return 'Yesterday';
      if (isThisWeek(d)) return format(d, 'EEEE');
      return format(d, 'MMMM d, yyyy');
    } catch {
      return null;
    }
  }, [date]);

  if (!formattedDate) return null;

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
      </div>
    </div>
  );
});

export default MessageBubble;
