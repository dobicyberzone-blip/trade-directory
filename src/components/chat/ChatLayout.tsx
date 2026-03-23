'use client';

import { ReactNode } from 'react';

interface ChatLayoutProps {
  conversationList: ReactNode;
  chatWindow: ReactNode;
  infoPanel?: ReactNode;
}

export function ChatLayout({ conversationList, chatWindow, infoPanel }: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100dvh-88px)] sm:h-[calc(100vh-9rem)] bg-gray-50 dark:bg-gray-950 sm:rounded-xl overflow-hidden sm:shadow-lg sm:border border-gray-200 dark:border-gray-700 sm:mt-2 md:mt-4">
      {/* Conversation List — full width on mobile, fixed sidebar on sm+ */}
      <div className="w-full sm:w-72 md:w-80 sm:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 overflow-hidden flex flex-col">
        {conversationList}
      </div>

      {/* Chat Window — hidden on mobile until conversation selected */}
      <div className="hidden sm:flex flex-1 flex-col bg-white dark:bg-gray-900 min-w-0 overflow-hidden">
        {chatWindow}
      </div>

      {/* Info Panel */}
      {infoPanel}
    </div>
  );
}
