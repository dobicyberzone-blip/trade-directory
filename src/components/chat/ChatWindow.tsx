'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatWindowProps {
  header: ReactNode;
  messages: ReactNode;
  messageInput: ReactNode;
  isEmpty?: boolean;
  onStartConversation?: () => void;
}

export function ChatWindow({
  header,
  messages,
  messageInput,
  isEmpty = false,
  onStartConversation,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="bg-green-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mb-4 sm:mb-6">
          <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Welcome to Messages</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
          Select a conversation from the list or start a new one to begin messaging with exporters and admins
        </p>
        {onStartConversation && (
          <Button onClick={onStartConversation} size="lg" className="bg-green-600 hover:bg-green-700 shadow-md">
            <MessageSquare className="h-5 w-5 mr-2" />
            Start New Conversation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      {header}

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
      >
        <div className="p-3 sm:p-4 space-y-1">
          {messages}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        {messageInput}
      </div>
    </div>
  );
}

// Keep SimpleChatHeader export so index.ts doesn't break
export function SimpleChatHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-16 px-4 flex items-center gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}
