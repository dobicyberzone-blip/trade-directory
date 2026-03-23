'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Socket event types
export interface SocketEvents {
  // Message events
  'message:new': (message: ChatMessage) => void;
  'message:delivered': (data: { messageId: string; conversationId: string }) => void;
  'message:read': (data: { messageId: string; conversationId: string }) => void;
  
  // Conversation events
  'conversation:update': (conversation: Conversation) => void;
  'conversation:typing': (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void;
  
  // Presence events
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: Error) => void;
}

// Re-export types for use in hooks
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
  messageType?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: string;
  subject: string;
  status: string;
  lastMessageAt: string | null;
  participants: {
    userId: string;
    role: string;
    unreadCount: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
      role: string;
      isOnline?: boolean;
      lastSeen?: string;
    };
  }[];
  messages?: ChatMessage[];
  isPinned?: boolean;
}

export interface UseSocketOptions {
  /** WebSocket server URL */
  url: string;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Reconnection attempts */
  reconnectionAttempts?: number;
  /** Reconnection delay in ms */
  reconnectionDelay?: number;
  /** Callback when connection is established */
  onConnect?: () => void;
  /** Callback when disconnected */
  onDisconnect?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseSocketReturn {
  /** Whether currently connected */
  isConnected: boolean;
  /** Current connection state */
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  /** Emit an event to the server */
  emit: <T>(event: string, data: T) => void;
  /** Subscribe to an event */
  on: <K extends keyof SocketEvents>(
    event: K, 
    callback: SocketEvents[K]
  ) => () => void;
  /** Send a message */
  sendMessage: (conversationId: string, message: string, temporaryId: string) => void;
  /** Mark messages as read */
  markAsRead: (conversationId: string, messageId: string) => void;
  /** Send typing indicator */
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  /** Connect manually */
  connect: () => void;
  /** Disconnect manually */
  disconnect: () => void;
}

/**
 * useSocket - WebSocket connection hook with reconnection handling
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Event subscription system
 * - Optimistic UI support
 * - Typing indicators
 */
export function useSocket(options: UseSocketOptions): UseSocketReturn {
  const {
    url,
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<UseSocketReturn['connectionState']>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
        
        // Emit connect event to listeners
        const connectListeners = listenersRef.current.get('connect');
        connectListeners?.forEach(listener => listener());
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;
          
          // Emit to specific event listeners
          const eventListeners = listenersRef.current.get(type);
          eventListeners?.forEach(listener => listener(payload));
          
          // Also emit to wildcard listeners
          const wildcardListeners = listenersRef.current.get('*');
          wildcardListeners?.forEach(listener => listener(type, payload));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionState('disconnected');
        onDisconnect?.();
        
        // Emit disconnect event
        const disconnectListeners = listenersRef.current.get('disconnect');
        disconnectListeners?.forEach(listener => listener());

        // Attempt reconnection if not a clean close
        if (!event.wasClean && reconnectAttemptsRef.current < reconnectionAttempts) {
          const delay = reconnectionDelay * Math.pow(2, reconnectAttemptsRef.current);
          setConnectionState('reconnecting');
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        setConnectionState('error');
        onError?.(new Error('WebSocket error'));
        
        const errorListeners = listenersRef.current.get('error');
        errorListeners?.forEach(listener => listener(new Error('WebSocket error')));
      };
    } catch (error) {
      setConnectionState('error');
      onError?.(error as Error);
    }
  }, [url, reconnectionAttempts, reconnectionDelay, onConnect, onDisconnect, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  // Emit an event to the server
  const emit = useCallback(<T>(event: string, data: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: event, payload: data }));
    }
  }, []);

  // Subscribe to an event
  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    
    const eventListeners = listenersRef.current.get(event)!;
    eventListeners.add(callback as Function);
    
    // Return unsubscribe function
    return () => {
      eventListeners.delete(callback as Function);
    };
  }, []);

  // Send a message
  const sendMessage = useCallback((conversationId: string, message: string, temporaryId: string) => {
    emit('message:send', {
      id: temporaryId,
      conversationId,
      message,
      createdAt: new Date().toISOString(),
    });
  }, [emit]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    emit('message:read', { conversationId, messageId });
  }, [emit]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    emit('typing:start', { conversationId, isTyping });
  }, [emit]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionState,
    emit,
    on,
    sendMessage,
    markAsRead,
    sendTyping,
    connect,
    disconnect,
  };
}

export default useSocket;
