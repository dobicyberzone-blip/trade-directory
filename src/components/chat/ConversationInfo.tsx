'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building, 
  Shield, 
  Mail, 
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationInfoProps {
  conversation: {
    id: string;
    subject: string;
    status: string;
    createdAt?: string;
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
        business?: {
          id: string;
          name: string;
          verificationStatus: string;
          description?: string;
          location?: string;
        };
      };
    }[];
    messages: {
      id: string;
      message: string;
      createdAt: string;
    }[];
  };
  currentUserId: string;
  onClose: () => void;
}

export function ConversationInfo({ conversation, currentUserId, onClose }: ConversationInfoProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'EXPORTER':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EXPORTER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Conversation Info</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Subject */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Subject</span>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">{conversation.subject}</p>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Status</span>
            </div>
            <Badge 
              className={
                conversation.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
              }
            >
              {conversation.status}
            </Badge>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Created</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(conversation.createdAt || null)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Last Message</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(conversation.lastMessageAt)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Message Count */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Messages</span>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">{conversation.messages.length} messages</p>
          </div>

          <Separator />

          {/* Participants */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Participants</h4>
            <div className="space-y-3">
              {conversation.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={participant.user.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-50 text-green-700">
                        {getRoleIcon(participant.user.role)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {participant.user.firstName} {participant.user.lastName}
                        </p>
                        {participant.userId === currentUserId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{participant.user.email}</span>
                      </div>
                      <Badge className={getRoleBadgeColor(participant.user.role)}>
                        {participant.user.role}
                      </Badge>
                      
                      {/* Business Info for Exporters */}
                      {participant.user.role === 'EXPORTER' && participant.user.business && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="h-3 w-3 text-gray-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {participant.user.business.name}
                            </p>
                          </div>
                          {participant.user.business.verificationStatus === 'VERIFIED' && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {participant.user.business.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                              {participant.user.business.description}
                            </p>
                          )}
                          {participant.user.business.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              📍 {participant.user.business.location}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          {otherParticipant?.user.role === 'EXPORTER' && otherParticipant.user.business && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    window.open(`/directory?business=${otherParticipant.user.business?.id}`, '_blank');
                  }}
                >
                  <Building className="h-4 w-4 mr-2" />
                  View Business Profile
                </Button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
