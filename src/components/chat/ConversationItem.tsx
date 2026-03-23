'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building, Shield, User } from 'lucide-react';

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string | null;
  role: string;
  subject: string;
  lastMessage?: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({
  name,
  avatar,
  role,
  subject,
  lastMessage,
  lastMessageAt,
  unreadCount = 0,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const hasUnread = unreadCount > 0;

  const getRoleIcon = () => {
    switch (role) {
      case 'ADMIN':    return <Shield className="h-4 w-4" />;
      case 'EXPORTER': return <Building className="h-4 w-4" />;
      default:         return <User className="h-4 w-4" />;
    }
  };

  const formatTime = () => {
    if (!lastMessageAt) return '';
    try {
      const date = new Date(lastMessageAt);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`
        relative flex items-center gap-3 px-3 py-3 mx-1 my-0.5 rounded-xl cursor-pointer
        transition-all duration-150 select-none outline-none
        focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1
        ${isSelected
          ? 'bg-green-50 dark:bg-green-900/20 shadow-sm'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800'
        }
      `}
    >
      {/* Selected indicator bar */}
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-green-600" />
      )}

      {/* Avatar with unread dot */}
      <div className="relative flex-shrink-0">
        <Avatar className={`h-10 w-10 border-2 transition-all ${isSelected ? 'border-green-200' : 'border-transparent'}`}>
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className={`text-sm ${isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
            {getRoleIcon()}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-green-600 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center px-1">
            <span className="text-white text-[10px] font-bold leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate leading-tight ${hasUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {name}
          </span>
          {lastMessageAt && (
            <span className={`text-[11px] flex-shrink-0 whitespace-nowrap leading-tight ${hasUnread ? 'text-green-600 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatTime()}
            </span>
          )}
        </div>
        <p className={`text-xs truncate leading-snug ${hasUnread ? 'text-gray-600 dark:text-gray-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
          {lastMessage || subject}
        </p>
      </div>
    </div>
  );
}

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full bg-green-600 text-white">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
