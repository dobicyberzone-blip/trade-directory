'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Search, Building, Shield, User, X, Archive, Trash2, Info } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  avatar?: string | null;
  role: string;
  status?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
  onViewInfo?: () => void;
}

export function ChatHeader({
  name,
  avatar,
  role,
  status = 'Active',
  onBack,
  showBackButton = false,
  onArchive,
  onDelete,
  onViewInfo,
}: ChatHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getRoleIcon = () => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'EXPORTER':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
      {/* Back Button (Mobile) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Avatar and Name */}
      {!isSearchOpen && (
        <>
          <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-green-100">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback className="bg-green-50 text-green-700 text-sm">
              {getRoleIcon()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate leading-tight">{name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 leading-tight">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
              {status}
            </p>
          </div>
        </>
      )}

      {/* Search Input */}
      {isSearchOpen && (
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Search in conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <button
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {!isSearchOpen && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <Search className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onViewInfo && (
                <>
                  <DropdownMenuItem onClick={onViewInfo}>
                    <Info className="h-4 w-4 mr-2" />
                    View Info
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
