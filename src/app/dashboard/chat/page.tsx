'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Building, 
  Shield,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  ChatLayout,
  ConversationList,
  ConversationItem,
  ChatWindow,
  ChatHeader,
  MessageBubble,
  MessageInput,
  ConversationInfo,
} from '@/components/chat';

interface Conversation {
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
    };
  }[];
  messages: {
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
    attachmentSize?: number;
  }[];
}

interface Contact {
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

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<{ exporters: Contact[]; admins: Contact[]; buyers: Contact[] }>({
    exporters: [],
    admins: [],
    buyers: [],
  });
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [conversationSubject, setConversationSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [contactTab, setContactTab] = useState<'all' | 'exporters' | 'buyers' | 'admins'>('all');
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/conversations?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out archived conversations
        const activeConversations = (data.conversations as Conversation[]).filter(
          conv => conv.status !== 'ARCHIVED'
        );
        setConversations(activeConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/contacts?buyerId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  }, [user]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        
        // Mark messages as read
        const participant = data.conversation.participants.find(
          (p: { userId: string }) => p.userId === user.id
        );
        if (participant?.unreadCount > 0) {
          await fetch(`/api/chat/conversations/${conversationId}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          });
          loadConversations();
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [user, loadConversations]);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadContacts();
    }
  }, [user, loadConversations, loadContacts]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadConversation(conversation.id);
    setShowMobileChat(true);
    setShowInfoPanel(false); // Close info panel when switching conversations
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setShowInfoPanel(false); // Close info panel when going back
  };

  const sendMessage = async (message: string, file?: File) => {
    if (!selectedConversation || (!message.trim() && !file) || !user) return;

    let attachmentUrl = '';
    let messageType = 'TEXT';
    let attachmentName = '';
    
    // Upload attachment if present
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('auth_token');
      const uploadResponse = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        attachmentUrl = uploadData.url;
        attachmentName = uploadData.filename;
        messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      } else {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
    }
    
    const token = localStorage.getItem('auth_token');
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: selectedConversation.id,
        senderId: user.id,
        message,
        messageType,
        attachmentUrl,
        attachmentName,
      }),
    });
    
    loadConversation(selectedConversation.id);
    loadConversations();
  };

  const createConversation = async () => {
    if (!selectedContact || !conversationSubject.trim() || !user) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantIds: [user.id, selectedContact.id],
          subject: conversationSubject,
          roles: ['BUYER', selectedContact.role],
        }),
      });
      const data = await response.json();
      
      setIsNewConversationOpen(false);
      setSelectedContact(null);
      setConversationSubject('');
      setContactTab('all');
      
      loadConversation(data.conversation.id);
      loadConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user) return;

    if (!confirm('Delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSelectedConversation(null);
        setShowMobileChat(false);
        loadConversations();
        alert('Conversation deleted successfully');
      } else {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation || !user) return;

    if (!confirm('Archive this conversation? You can view archived conversations later.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      });

      if (response.ok) {
        setSelectedConversation(null);
        setShowMobileChat(false);
        loadConversations();
        alert('Conversation archived successfully');
      } else {
        throw new Error('Failed to archive conversation');
      }
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      alert('Failed to archive conversation. Please try again.');
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.userId !== user?.id);
  };

  const getContactRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'EXPORTER':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const otherParticipant = getOtherParticipant(c);
    const name = `${otherParticipant?.user.firstName} ${otherParticipant?.user.lastName}`.toLowerCase();
    const subject = c.subject.toLowerCase();
    // Also search in message content
    const messageContent = c.messages?.map(m => m.message).join(' ').toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return name.includes(searchLower) || subject.includes(searchLower) || messageContent.includes(searchLower);
  });

  const filteredContacts = {
    exporters: (contacts.exporters || []).filter(c => 
      c.displayName.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      c.business?.name?.toLowerCase().includes(contactSearchTerm.toLowerCase())
    ),
    buyers: (contacts.buyers || []).filter(c =>
      c.displayName.toLowerCase().includes(contactSearchTerm.toLowerCase())
    ),
    admins: (contacts.admins || []).filter(c => 
      c.displayName.toLowerCase().includes(contactSearchTerm.toLowerCase())
    ),
  };

  // Role-aware: exporters see buyers, buyers see exporters
  const isExporter = user?.role === 'EXPORTER';
  const primaryContacts = isExporter ? filteredContacts.buyers : filteredContacts.exporters;
  const primaryLabel = isExporter ? 'Buyers' : 'Exporters';

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <>
      <ChatLayout
        conversationList={
          <div className="h-full flex flex-col">
            <ConversationList
              onNewConversation={() => setIsNewConversationOpen(true)}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              conversationCount={conversations.length}
            >
              {filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const currentUserParticipant = conversation.participants.find(p => p.userId === user?.id);
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                
                return (
                  <ConversationItem
                    key={conversation.id}
                    id={conversation.id}
                    name={`${otherParticipant?.user.firstName} ${otherParticipant?.user.lastName}`}
                    avatar={otherParticipant?.user.avatar}
                    role={otherParticipant?.user.role || ''}
                    subject={conversation.subject}
                    lastMessage={lastMessage?.message}
                    lastMessageAt={conversation.lastMessageAt}
                    unreadCount={currentUserParticipant?.unreadCount || 0}
                    isSelected={selectedConversation?.id === conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                  />
                );
              })}
            </ConversationList>
          </div>
        }
        chatWindow={
          <div className="flex flex-col h-full w-full">
            <ChatWindow
              isEmpty={!selectedConversation}
              onStartConversation={() => setIsNewConversationOpen(true)}
              header={
                selectedConversation && (
                  <ChatHeader
                    name={`${getOtherParticipant(selectedConversation)?.user.firstName} ${getOtherParticipant(selectedConversation)?.user.lastName}`}
                    avatar={getOtherParticipant(selectedConversation)?.user.avatar}
                    role={getOtherParticipant(selectedConversation)?.user.role || ''}
                    status="Active"
                    onBack={handleBackToList}
                    showBackButton={true}
                    onViewInfo={() => setShowInfoPanel(!showInfoPanel)}
                    onArchive={handleArchiveConversation}
                    onDelete={handleDeleteConversation}
                  />
                )
              }
              messages={
                selectedConversation?.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  selectedConversation?.messages.map((message) => {
                    const isOwn = !!(user?.id && message.sender?.id === user.id);
                    return (
                      <MessageBubble
                        key={message.id}
                        message={message.message}
                        createdAt={message.createdAt}
                        isOwn={isOwn}
                        senderAvatar={message.sender?.avatar}
                        senderName={`${message.sender?.firstName} ${message.sender?.lastName}`}
                        read={true}
                        attachmentUrl={message.attachmentUrl}
                        attachmentName={message.attachmentName}
                        messageType={message.messageType}
                      />
                    );
                  })
                )
              }
              messageInput={
                selectedConversation && (
                  <MessageInput
                    onSend={sendMessage}
                    placeholder="Type a message..."
                  />
                )
              }
            />
          </div>
        }
        infoPanel={
          showInfoPanel && selectedConversation && user && (
            <ConversationInfo
              conversation={selectedConversation}
              currentUserId={user.id}
              onClose={() => setShowInfoPanel(false)}
            />
          )
        }
      />

      {/* Mobile Chat Overlay — slides in from right when conversation selected */}
      <div
        className={`sm:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col transition-transform duration-300 ease-in-out ${
          showMobileChat ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 64 }}
      >
        <ChatWindow
          isEmpty={!selectedConversation}
          onStartConversation={() => { setShowMobileChat(false); setIsNewConversationOpen(true); }}
          header={
            selectedConversation && (
              <ChatHeader
                name={`${getOtherParticipant(selectedConversation)?.user.firstName} ${getOtherParticipant(selectedConversation)?.user.lastName}`}
                avatar={getOtherParticipant(selectedConversation)?.user.avatar}
                role={getOtherParticipant(selectedConversation)?.user.role || ''}
                status="Active"
                onBack={handleBackToList}
                showBackButton={true}
                onViewInfo={() => setShowInfoPanel(!showInfoPanel)}
                onArchive={handleArchiveConversation}
                onDelete={handleDeleteConversation}
              />
            )
          }
          messages={
            selectedConversation?.messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              selectedConversation?.messages.map((message) => {
                const isOwn = !!(user?.id && message.sender?.id === user.id);
                return (
                  <MessageBubble
                    key={message.id}
                    message={message.message}
                    createdAt={message.createdAt}
                    isOwn={isOwn}
                    senderAvatar={message.sender?.avatar}
                    senderName={`${message.sender?.firstName} ${message.sender?.lastName}`}
                    read={true}
                    attachmentUrl={message.attachmentUrl}
                    attachmentName={message.attachmentName}
                    messageType={message.messageType}
                  />
                );
              })
            )
          }
          messageInput={
            selectedConversation && (
              <MessageInput
                onSend={sendMessage}
                placeholder="Type a message..."
              />
            )
          }
        />
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a conversation with an exporter or admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What would you like to discuss?"
                value={conversationSubject}
                onChange={(e) => setConversationSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Search contacts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or business..."
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Horizontal tab nav — role-aware */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              <div
                ref={tabScrollRef}
                className="flex gap-1 overflow-x-auto scrollbar-none flex-1"
                style={{ scrollbarWidth: 'none' }}
              >
                {([
                  { key: 'all', label: `All (${primaryContacts.length + filteredContacts.admins.length})` },
                  { key: isExporter ? 'buyers' : 'exporters', label: `${primaryLabel} (${primaryContacts.length})` },
                  { key: 'admins', label: `Admins (${filteredContacts.admins.length})` },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setContactTab(tab.key as any)}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      contactTab === tab.key
                        ? 'border-green-600 text-green-700'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="h-[200px] sm:h-[260px]">
              {/* Primary contacts (Exporters for buyers, Buyers for exporters) */}
              {(contactTab === 'all' || contactTab === (isExporter ? 'buyers' : 'exporters')) && primaryContacts.length > 0 && (
                <div className="mb-4">
                  {contactTab === 'all' && (
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1 mb-2">{primaryLabel}</p>
                  )}
                  <div className="space-y-1">
                    {primaryContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                          selectedContact?.id === contact.id
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage src={contact.avatar || undefined} />
                          <AvatarFallback>
                            {isExporter ? <User className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {isExporter ? 'Buyer' : (contact.business?.verificationStatus === 'VERIFIED' ? 'Verified Exporter' : 'Exporter')}
                          </p>
                        </div>
                        {!isExporter && contact.business?.verificationStatus === 'VERIFIED' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs flex-shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Admins */}
              {(contactTab === 'all' || contactTab === 'admins') && filteredContacts.admins.length > 0 && (
                <div>
                  {contactTab === 'all' && (
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1 mb-2">Admin Support</p>
                  )}
                  <div className="space-y-1">
                    {filteredContacts.admins.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                          selectedContact?.id === contact.id
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage src={contact.avatar || undefined} />
                          <AvatarFallback><Shield className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Admin Support</p>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">Admin</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {primaryContacts.length === 0 && filteredContacts.admins.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
                  No contacts found
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createConversation} 
              disabled={!selectedContact || !conversationSubject.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
