'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  LogIn, 
  LogOut, 
  Shield, 
  User, 
  Settings, 
  MapPin, 
  Clock, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient, UserActivity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

export function ActivityLog() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUserActivities(pagination.page, pagination.limit);
      setActivities(response.activities);
      setPagination(response.pagination);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load activity log';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, toast]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-600" />;
      case 'password_change':
      case 'totp_enabled':
      case 'totp_disabled':
      case 'session_revoked':
      case 'all_sessions_revoked':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'profile_update':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'settings_update':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'logout':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'password_change':
      case 'totp_enabled':
      case 'totp_disabled':
      case 'session_revoked':
      case 'all_sessions_revoked':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'profile_update':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getDeviceDescription = (deviceInfo: UserActivity['deviceInfo']) => {
    if (!deviceInfo) return 'Unknown Device';
    
    const browser = deviceInfo.browser?.name || 'Unknown Browser';
    const os = deviceInfo.os?.name || 'Unknown OS';
    
    return `${browser} on ${os}`;
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading && activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            View your recent account activity and security events
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
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          View your recent account activity and security events. This helps you monitor for any unauthorized access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet.</p>
            <p className="text-sm mt-1">Your account activities will appear here.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={getActivityBadgeColor(activity.action)}
                      >
                        {formatActionName(activity.action)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {activity.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {activity.deviceInfo && (
                        <span>{getDeviceDescription(activity.deviceInfo)}</span>
                      )}
                      
                      {activity.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </div>
                      )}
                      
                      {activity.ipAddress && (
                        <span>IP: {activity.ipAddress}</span>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} activities
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}