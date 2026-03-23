'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  MapPin, 
  Clock, 
  Shield, 
  AlertTriangle,
  Trash2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Calendar
} from 'lucide-react';
import { apiClient, UserSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function DeviceManagement() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const { toast } = useToast();

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUserSessions();
      setSessions(response.sessions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load device sessions';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setIsRevoking(sessionId);
      await apiClient.revokeSession(sessionId);
      
      // Remove the session from the list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast({
        title: 'Session Revoked',
        description: 'The device session has been successfully revoked.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke session';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      setIsRevokingAll(true);
      const response = await apiClient.revokeAllOtherSessions();
      
      // Keep only the current session
      setSessions(prev => prev.filter(session => session.isCurrent));
      
      toast({
        title: 'Sessions Revoked',
        description: `Successfully revoked ${response.revokedCount} other sessions.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke sessions';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceInfo: UserSession['deviceInfo']) => {
    const deviceType = deviceInfo.device?.type?.toLowerCase();
    
    if (deviceType === 'mobile') {
      return <Smartphone className="h-5 w-5" />;
    } else if (deviceType === 'tablet') {
      return <Tablet className="h-5 w-5" />;
    } else {
      return <Monitor className="h-5 w-5" />;
    }
  };

  const getDeviceDescription = (deviceInfo: UserSession['deviceInfo']) => {
    if (deviceInfo.displayName) {
      return deviceInfo.displayName;
    }
    
    const browser = deviceInfo.browser?.name || 'Unknown Browser';
    const os = deviceInfo.os?.name || 'Unknown OS';
    const device = deviceInfo.device?.type || 'Desktop';
    
    return `${browser} on ${os} (${device})`;
  };

  const getRiskBadge = (riskLevel?: 'low' | 'medium' | 'high') => {
    if (!riskLevel) return null;
    
    switch (riskLevel) {
      case 'high':
        return (
          <Badge variant="destructive" className="ml-2">
            <ShieldAlert className="h-3 w-3 mr-1" />
            High Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Medium Risk
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Secure
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSessionDuration = (sessionDuration?: number) => {
    if (!sessionDuration) return null;
    
    const days = Math.floor(sessionDuration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((sessionDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return 'Less than 1h';
    }
  };

  const otherSessions = sessions.filter(session => !session.isCurrent);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Device Management
          </CardTitle>
          <CardDescription>
            Manage devices that have access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Device Management
        </CardTitle>
        <CardDescription>
          Manage devices that have access to your account. You can revoke access for any device you don&apos;t recognize.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Summary */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.deviceInfo?.riskLevel === 'low').length}
              </div>
              <div className="text-sm text-muted-foreground">Secure Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {sessions.filter(s => s.deviceInfo?.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Risk</div>
            </div>
          </div>
        )}

        {/* Current Session */}
        {sessions.find(session => session.isCurrent) && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Current Session</h4>
            {(() => {
              const currentSession = sessions.find(session => session.isCurrent)!;
              return (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="text-green-600">
                      {getDeviceIcon(currentSession.deviceInfo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium text-green-800">
                          {getDeviceDescription(currentSession.deviceInfo)}
                        </p>
                        {getRiskBadge(currentSession.deviceInfo.riskLevel)}
                        {!currentSession.deviceInfo.isRecognized && (
                          <Badge variant="outline" className="ml-2 border-orange-200 text-orange-700">
                            <Eye className="h-3 w-3 mr-1" />
                            New Device
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-green-600 mt-1">
                        {currentSession.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {currentSession.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Active now
                        </div>
                        {currentSession.sessionDuration && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Session: {getSessionDuration(currentSession.sessionDuration)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Current Device
                  </Badge>
                </div>
              );
            })()}
          </div>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-muted-foreground">Other Sessions</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllOtherSessions}
                disabled={isRevokingAll}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isRevokingAll ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Revoke All Other Sessions
              </Button>
            </div>
            
            <div className="space-y-3">
              {otherSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    session.deviceInfo?.riskLevel === 'high' 
                      ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' 
                      : session.deviceInfo?.riskLevel === 'medium'
                      ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${
                      session.deviceInfo?.riskLevel === 'high' 
                        ? 'text-red-600' 
                        : session.deviceInfo?.riskLevel === 'medium'
                        ? 'text-yellow-600'
                        : 'text-muted-foreground'
                    }`}>
                      {getDeviceIcon(session.deviceInfo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium">
                          {getDeviceDescription(session.deviceInfo)}
                        </p>
                        {getRiskBadge(session.deviceInfo.riskLevel)}
                        {!session.deviceInfo.isRecognized && (
                          <Badge variant="outline" className="ml-2 border-orange-200 text-orange-700">
                            <Eye className="h-3 w-3 mr-1" />
                            New Device
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {session.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last active {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                        </div>
                        {session.sessionDuration && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Session: {getSessionDuration(session.sessionDuration)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={isRevoking === session.id}
                    className={`${
                      session.deviceInfo?.riskLevel === 'high'
                        ? 'text-red-600 border-red-300 hover:bg-red-100'
                        : 'text-red-600 border-red-200 hover:bg-red-50'
                    }`}
                  >
                    {isRevoking === session.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Revoke'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 1 && sessions[0].isCurrent && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This is your only active session.</p>
            <p className="text-sm mt-1">Other devices will appear here when you sign in from them.</p>
          </div>
        )}

        <Separator />

        {/* Security Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-amber-800 mb-2">Security Tips</h5>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Revoke access for any devices you don&apos;t recognize</li>
                <li>• Sign out of shared or public computers when finished</li>
                <li>• Regularly review your active sessions</li>
                <li>• Use strong, unique passwords for your account</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}