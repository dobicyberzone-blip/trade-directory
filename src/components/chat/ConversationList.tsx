'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, MessageSquare, X } from 'lucide-react';
import { useThemeMode } from '@/components/ui-dashboard/theme/theme-provider';

interface ConversationListProps {
  children: ReactNode;
  onNewConversation: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  conversationCount?: number;
}

export function ConversationList({
  children,
  onNewConversation,
  searchValue = '',
  onSearchChange,
  conversationCount = 0,
}: ConversationListProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  // Fade colors that match the actual background
  const bgSolid = isDark ? 'rgba(17,24,39,1)' : 'rgba(255,255,255,1)';
  const bgTransparent = isDark ? 'rgba(17,24,39,0)' : 'rgba(255,255,255,0)';

  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 8);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  };

  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener('scroll', updateFades, { passive: true });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateFades);
      ro.disconnect();
    };
  }, [conversationCount]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange?.(value), 300);
  };

  const clearSearch = () => {
    setLocalSearchValue('');
    onSearchChange?.('');
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-500" />
            Messages
            {conversationCount > 0 && (
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                ({conversationCount})
              </span>
            )}
          </h2>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs gap-1 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <Input
            ref={inputRef}
            placeholder="Search conversations..."
            value={localSearchValue}
            onChange={handleSearchChange}
            className="pl-8 pr-8 h-8 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800 rounded-lg"
          />
          {localSearchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list with fade hints */}
      <div className="flex-1 relative min-h-0">
        {/* Top fade — matches background color */}
        <div
          className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: showTopFade ? 1 : 0,
            background: `linear-gradient(to bottom, ${bgSolid} 0%, ${bgTransparent} 100%)`,
          }}
        />

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#374151 transparent' : '#d1d5db transparent',
          }}
        >
          {conversationCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-[160px] leading-relaxed">
                Start messaging with exporters and admins
              </p>
              <Button onClick={onNewConversation} variant="outline" size="sm" className="text-xs h-8 dark:border-gray-700 dark:text-gray-300">
                <Plus className="h-3 w-3 mr-1" />
                New Conversation
              </Button>
            </div>
          ) : (
            <div className="py-1">{children}</div>
          )}
        </div>

        {/* Bottom fade — matches background color */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: showBottomFade ? 1 : 0,
            background: `linear-gradient(to top, ${bgSolid} 0%, ${bgTransparent} 100%)`,
          }}
        />
      </div>
    </div>
  );
}
