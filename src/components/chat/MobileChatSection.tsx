'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { MessageSquare, Send, Paperclip, Smile, X, FileIcon, Image as ImageIcon, Loader2, Check, CheckCheck, ArrowLeft, MoreVertical, Search, Phone, Video, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import Image from 'next/image';

// Types
export interface ChatMessage {
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
  attachmentType?: string;
  isRead?: boolean;
}

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface MobileChatSectionProps {
  participant: ChatParticipant;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string, attachment?: File) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// Emoji list for emoji picker
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '❤️', '💙', '💚',
  '✨', '⭐', '🌟', '💫', '✅', '❌', '⚠️', '💯',
];

// Format message time with proper date grouping
const formatMessageTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'HH:mm');
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  } catch {
    return '';
  }
};

// Get relative time
const getRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just now';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Just now';
  }
};

// Get role icon
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return <span className="text-xs">🛡️</span>;
    case 'EXPORTER':
      return <span className="text-xs">🏢</span>;
    default:
      return <span className="text-xs">👤</span>;
  }
};

// Enhanced Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isImage = message.attachmentType?.startsWith('image/') || message.messageType === 'IMAGE';

  return (
    <div
      className={`flex gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar for incoming messages */}
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-auto">
          <AvatarImage src={message.sender.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-50 text-green-700 text-xs">
            {message.sender.firstName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[65%]`}>
        {/* Sender name for incoming messages */}
        {!isOwn && (
          <span className="text-xs text-gray-500 mb-1 px-1 font-medium">
            {message.sender.firstName} {message.sender.lastName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`
            rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm
            ${isOwn 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-sm' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
            }
          `}
        >
          {/* Image Attachment */}
          {message.attachmentUrl && isImage && (
            <div className="mt-1 mb-1">
              <Image
                src={message.attachmentUrl}
                alt={message.attachmentName || 'Image'}
                width={250}
                height={180}
                className="rounded-lg cursor-pointer hover:opacity-90 object-cover max-w-full"
              />
            </div>
          )}

          {/* File Attachment */}
          {message.attachmentUrl && !isImage && (
            <div className="mt-1">
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FileIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate max-w-[150px]">
                  {message.attachmentName || 'Attachment'}
                </span>
              </a>
            </div>
          )}

          {/* Message Text */}
          {message.message && (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {message.message}
            </p>
          )}

          {/* Time and Read Status */}
          <div className={`flex items-center gap-1 mt-1 justify-end ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
            <span className="text-[10px] sm:text-xs">{formatMessageTime(message.createdAt)}</span>
            {isOwn && (
              <span className="ml-0.5">
                {message.isRead ? (
                  <CheckCheck className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Date separator component
interface DateSeparatorProps {
  date: string;
}

function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}

// Group messages by date
function groupMessagesByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: Map<string, ChatMessage[]> = new Map();
  
  messages.forEach((message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(message);
  });
  
  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date: msgs[0].createdAt,
    messages: msgs,
  }));
}

// Mobile-optimized Message Input (WhatsApp-style with bigger area)
interface MessageInputProps {
  onSend: (message: string, file?: File) => Promise<void>;
  disabled?: boolean;
}

function MobileMessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB max
      if (file.size > maxSize) {
        alert('File too large. Maximum size is 10MB');
        return;
      }

      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(message + emoji);
    }
    setIsEmojiOpen(false);
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || disabled || isSending) return;

    try {
      setIsSending(true);
      await onSend(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      setAttachmentPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-2 safe-area-bottom">
      {/* Attachment Preview */}
      {attachmentPreview && (
        <div className="mb-2 relative inline-block">
          <Image
            src={attachmentPreview}
            alt="Preview"
            width={100}
            height={100}
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-lg border-2 border-green-200"
          />
          <button
            onClick={removeAttachment}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {selectedFile && !attachmentPreview && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <FileIcon className="h-5 w-5 shrink-0 text-green-600" />
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">({formatFileSize(selectedFile.size)})</span>
          <button
            onClick={removeAttachment}
            className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Area - WhatsApp style */}
      <div className="flex items-end gap-1 sm:gap-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* Emoji Button */}
        <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isSending}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12"
            >
              <Smile className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 sm:w-80 p-2" align="start">
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {EMOJI_LIST.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Attach Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12"
        >
          <Paperclip className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        {/* Message Input - Bigger area like WhatsApp */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 sm:px-4 py-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            className="flex-1 min-h-[44px] max-h-[150px] resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-base sm:text-lg p-0"
            rows={1}
            style={{ height: 'auto' }}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && !selectedFile)}
          className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12 p-0 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Analytics-style header component
interface AnalyticsChatHeaderProps {
  participant: ChatParticipant;
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onInfo?: () => void;
}

function AnalyticsChatHeader({ participant, onBack, onCall, onVideoCall, onInfo }: AnalyticsChatHeaderProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Analytics-style metric bar */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-2 border-b border-green-100 dark:border-green-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600">
              <MessageSquare className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
              Active Chat
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(participant.status)}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{participant.status || 'offline'}</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="h-14 px-2 sm:px-4 flex items-center gap-2 sm:gap-3">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 sm:h-11 sm:w-11 -ml-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Avatar with status indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-white dark:border-gray-700 shadow-sm">
            <AvatarImage src={participant.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-50 text-green-700">
              {getRoleIcon(participant.role)}
            </AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(participant.status)}`}></span>
        </div>

        {/* Name and role */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
            {participant.firstName} {participant.lastName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
            {participant.role === 'ADMIN' ? 'Administrator' : participant.role === 'EXPORTER' ? 'Exporter' : 'User'}
            {participant.lastSeen && (
              <span className="hidden sm:inline">• Last seen {getRelativeTime(participant.lastSeen)}</span>
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {onCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCall}
              className="h-10 w-10 sm:h-11 sm:w-11 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          {onVideoCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className="h-10 w-10 sm:h-11 sm:w-11 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          {onInfo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onInfo}
              className="h-10 w-10 sm:h-11 sm:w-11 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Mobile Chat Section Component
export function MobileChatSection({
  participant,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isLoading = false,
  disabled = false,
}: MobileChatSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLengthRef = useRef(messages.length);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  };

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Consider "at bottom" if within 50px of the bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    }
  };

  // Only auto-scroll to bottom on new messages if user is already at bottom
  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = prevMessagesLengthRef.current;
    
    // Only auto-scroll if new messages were added (not on initial load or re-renders)
    if (currentLength > prevLength && isAtBottom) {
      scrollToBottom(true);
    }
    
    prevMessagesLengthRef.current = currentLength;
  }, [messages.length, isAtBottom]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] sm:h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] bg-gray-50/50 dark:bg-gray-900 fixed inset-0 sm:relative">
      {/* Analytics-style Header */}
      <AnalyticsChatHeader
        participant={participant}
        onBack={onBack}
        onCall={() => {}}
        onVideoCall={() => {}}
        onInfo={() => {}}
      />

      {/* Messages Area - Full height, scrollable */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900"
        onScroll={handleScroll}
      >
        <div className="p-3 sm:p-4 min-h-full pb-4">
          {/* Welcome/Empty state */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <MessageSquare className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-gray-600 max-w-xs">
                Send a message to begin chatting with {participant.firstName} {participant.lastName}
              </p>
            </div>
          ) : (
            <>
              {/* Messages grouped by date */}
              {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <DateSeparator date={group.date} />
                  {group.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender.id === currentUserId}
                    />
                  ))}
                </div>
              ))}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} className="h-px" />
            </>
          )}
        </div>
      </div>

      {/* Message Input - Fixed at bottom, always visible */}
      <div className="flex-shrink-0 h-20 sm:h-auto">
        <MobileMessageInput
          onSend={onSendMessage}
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );
}

export default MobileChatSection;
