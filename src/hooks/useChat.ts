'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSocket, type Conversation, type ChatMessage } from './useSocket';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  role: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  role: string;
  displayName: string;
  business?: {
    id: string;
    name: string;
    verificationStatus: string;
  };
}

interface UseChatOptions {
  /** Current authenticated user */
  user: User | null;
  /** WebSocket URL for real-time communication */
  wsUrl?: string;
  /** Enable real-time features */
  realTimeEnabled?: boolean;
  /** Callback when conversations are loaded */
  onConversationsLoaded?: (conversations: Conversation[]) => void;
}

interface UseChatReturn {
  // State
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  isConnected: boolean;
  
  // Typing state
  typingUsers: Map<string, string[]>; // conversationId -> user names
  
  // Online presence
  onlineUsers: Set<string>;
  
  // Actions
  selectConversation: (conversationId: string) => void;
  sendMessage: (message: string, file?: File) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  refreshConversations: () => Promise<void>;
  createConversation: (contactId: string, subject: string) => Promise<Conversation>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  pinConversation: (conversationId: string) => Promise<void>;
  unpinConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string) => Promise<void>;
  unmuteConversation: (conversationId: string) => Promise<void>;
}

/**
 * useChat - Main chat functionality hook
 * 
 * Features:
 * - Real-time message handling with optimistic updates
 * - Conversation management
 * - Typing indicators
 * - Online presence tracking
 * - Message delivery states
 */
export function useChat(options: UseChatOptions): UseChatReturn {
  const { 
    user, 
    wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    realTimeEnabled = true,
    onConversationsLoaded 
  } = options;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Refs
  const pendingMessagesRef = useRef<Map<string, ChatMessage>>(new Map());

  // Socket connection
  const socket = useSocket({
    url: wsUrl,
    autoConnect: realTimeEnabled && !!user,
    onConnect: () => {
      // Authenticate after connection
      if (user) {
        socket.emit('auth:login', { userId: user.id });
      }
    },
  });

  // Get selected conversation
  const selectedConversation = useMemo(() => 
    conversations.find(c => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      const loadedConversations: Conversation[] = data.conversations || [];
      
      // Sort by last message time, with pinned conversations at top
      loadedConversations.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
      
      setConversations(loadedConversations);
      onConversationsLoaded?.(loadedConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user, onConversationsLoaded]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Handle new message from socket
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = socket.on('message:new', (message: ChatMessage) => {
      setConversations(prev => {
        const conversationIndex = prev.findIndex(c => c.id === message.conversationId);
        if (conversationIndex === -1) return prev;
        
        const updatedConversations = [...prev];
        const conversation = { ...updatedConversations[conversationIndex] };
        
        // Add message to conversation
        conversation.messages = [...(conversation.messages || []), message];
        conversation.lastMessageAt = message.createdAt;
        
        // Update participant's unread count if not selected
        if (conversation.id !== selectedConversationId) {
          conversation.participants = conversation.participants.map(p => ({
            ...p,
            unreadCount: p.userId === user?.id ? p.unreadCount : p.unreadCount + 1
          }));
        }
        
        updatedConversations[conversationIndex] = conversation;
        
        // Re-sort
        updatedConversations.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
        
        return updatedConversations;
      });
    });

    return unsubscribe;
  }, [realTimeEnabled, socket, user?.id, selectedConversationId]);

  // Handle message status updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = socket.on('message:delivered', (data: { messageId: string; conversationId: string }) => {
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id !== data.conversationId) return conv;
          return {
            ...conv,
            messages: conv.messages?.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, status: 'delivered' as const }
                : msg
            )
          };
        });
      });
    });

    return unsubscribe;
  }, [realTimeEnabled, socket]);

  // Handle message read receipts
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = socket.on('message:read', (data: { messageId: string; conversationId: string }) => {
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id !== data.conversationId) return conv;
          return {
            ...conv,
            messages: conv.messages?.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, status: 'read' as const }
                : msg
            )
          };
        });
      });
    });

    return unsubscribe;
  }, [realTimeEnabled, socket]);

  // Handle typing indicators
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = socket.on('conversation:typing', (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return; // Ignore own typing
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const currentTyping = newMap.get(data.conversationId) || [];
        
        if (data.isTyping && !currentTyping.includes(data.userName)) {
          newMap.set(data.conversationId, [...currentTyping, data.userName]);
        } else if (!data.isTyping) {
          newMap.set(data.conversationId, currentTyping.filter(name => name !== data.userName));
        }
        
        return newMap;
      });
    });

    return unsubscribe;
  }, [realTimeEnabled, socket, user?.id]);

  // Handle online/offline presence
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribeOnline = socket.on('user:online', (userId: string) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    const unsubscribeOffline = socket.on('user:offline', (userId: string) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [realTimeEnabled, socket]);

  // Select a conversation
  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    // Mark as read when selecting
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation && user) {
      const unreadParticipant = conversation.participants.find(p => p.userId === user.id);
      if (unreadParticipant && unreadParticipant.unreadCount > 0) {
        socket.markAsRead(conversationId, conversation.messages?.[0]?.id || '');
        
        // Update local state
        setConversations(prev => prev.map(c => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            participants: c.participants.map(p => 
              p.userId === user.id ? { ...p, unreadCount: 0 } : p
            )
          };
        }));
      }
    }
  }, [conversations, user, socket]);

  // Send a message with optimistic update
  const sendMessage = useCallback(async (message: string, file?: File) => {
    if (!selectedConversationId || !user) return;

    // Generate temporary ID for optimistic update
    const temporaryId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: temporaryId,
      conversationId: selectedConversationId,
      senderId: user.id,
      message,
      createdAt: new Date().toISOString(),
      messageType: file ? 'FILE' : 'TEXT',
      status: 'sending',
      attachmentUrl: file ? URL.createObjectURL(file) : undefined,
      attachmentName: file?.name,
      attachmentType: file?.type,
      attachmentSize: file?.size,
    };

    // Optimistically add message
    setConversations(prev => prev.map(c => {
      if (c.id !== selectedConversationId) return c;
      return {
        ...c,
        messages: [...(c.messages || []), optimisticMessage],
        lastMessageAt: optimisticMessage.createdAt,
      };
    }));

    // Store for potential rollback
    pendingMessagesRef.current.set(temporaryId, optimisticMessage);

    try {
      // Send via REST API (or WebSocket if available)
      const formData = new FormData();
      formData.append('message', message);
      formData.append('conversationId', selectedConversationId);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Replace optimistic message with real one
      setConversations(prev => prev.map(c => {
        if (c.id !== selectedConversationId) return c;
        return {
          ...c,
          messages: c.messages?.map(msg => 
            msg.id === temporaryId 
              ? { ...data.message, status: 'sent' as const }
              : msg
          )
        };
      }));

      // Clean up
      pendingMessagesRef.current.delete(temporaryId);

      // Also emit via socket if connected
      if (socket.isConnected) {
        socket.sendMessage(selectedConversationId, message, temporaryId);
      }
    } catch (error) {
      // Rollback on error - mark as failed
      setConversations(prev => prev.map(c => {
        if (c.id !== selectedConversationId) return c;
        return {
          ...c,
          messages: c.messages?.map(msg => 
            msg.id === temporaryId 
              ? { ...msg, status: 'failed' as const }
              : msg
          )
        };
      }));
      
      throw error;
    }
  }, [selectedConversationId, user, socket]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string) => {
    if (!user) return;
    
    socket.markAsRead(conversationId, '');
    
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        participants: c.participants.map(p => 
          p.userId === user.id ? { ...p, unreadCount: 0 } : p
        )
      };
    }));
  }, [user, socket]);

  // Set typing status
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!user) return;
    socket.sendTyping(conversationId, isTyping);
  }, [user, socket]);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  // Create new conversation
  const createConversation = useCallback(async (contactId: string, subject: string): Promise<Conversation> => {
    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, subject }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    
    const data = await response.json();
    const newConversation: Conversation = data.conversation;
    
    setConversations(prev => [newConversation, ...prev]);
    
    return newConversation;
  }, []);

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}/archive`, {
      method: 'POST',
      credentials: 'include',
    });
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
  }, [selectedConversationId]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
  }, [selectedConversationId]);

  // Pin conversation
  const pinConversation = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}/pin`, {
      method: 'POST',
      credentials: 'include',
    });
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isPinned: true } : c
    ));
  }, []);

  // Unpin conversation
  const unpinConversation = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}/unpin`, {
      method: 'POST',
      credentials: 'include',
    });
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isPinned: false } : c
    ));
  }, []);

  // Mute conversation
  const muteConversation = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}/mute`, {
      method: 'POST',
      credentials: 'include',
    });
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isMuted: true } : c
    ));
  }, []);

  // Unmute conversation
  const unmuteConversation = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}/unmute`, {
      method: 'POST',
      credentials: 'include',
    });
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isMuted: false } : c
    ));
  }, []);

  return {
    // State
    conversations,
    selectedConversation,
    isLoading,
    error,
    connectionState: socket.connectionState,
    isConnected: socket.isConnected,
    
    // Typing
    typingUsers,
    
    // Presence
    onlineUsers,
    
    // Actions
    selectConversation,
    sendMessage,
    markAsRead,
    setTyping,
    refreshConversations,
    createConversation,
    archiveConversation,
    deleteConversation,
    pinConversation,
    unpinConversation,
    muteConversation,
    unmuteConversation,
  };
}

export default useChat;
