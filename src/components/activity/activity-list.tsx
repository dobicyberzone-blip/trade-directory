'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  LogIn,
  FileEdit,
  Eye,
  MessageSquare,
  ShoppingCart,
  Star,
  Clock,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserActivity {
  id: string;
  action: string;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  metadata: string | null;
  createdAt: string;
}

interface ActivityListProps {
  userId?: string; // Optional - if provided, fetches for specific user (admin), otherwise current user
  limit?: number;
}

export function ActivityList({ userId, limit = 50 }: ActivityListProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [userId, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const url = userId 
        ? `/api/admin/users/${userId}/activities?limit=${limit}`
        : `/api/user/activities?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return <LogIn className="h-4 w-4" />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <FileEdit className="h-4 w-4" />;
    if (actionLower.includes('view')) return <Eye className="h-4 w-4" />;
    if (actionLower.includes('message') || actionLower.includes('chat')) return <MessageSquare className="h-4 w-4" />;
    if (actionLower.includes('inquiry') || actionLower.includes('order')) return <ShoppingCart className="h-4 w-4" />;
    if (actionLower.includes('favorite') || actionLower.includes('rating')) return <Star className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return 'text-green-600 bg-green-50';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'text-blue-600 bg-blue-50';
    if (actionLower.includes('view')) return 'text-purple-600 bg-purple-50';
    if (actionLower.includes('delete')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchActivities} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activity</span>
          <div className="flex items-center gap-2">
            {activities.length > 0 && (
              <Badge variant="outline">{activities.length} activities</Badge>
            )}
            <Button onClick={fetchActivities} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.createdAt)}
                    </div>
                  </div>
                  {(activity.ipAddress || activity.location) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {activity.ipAddress && (
                        <Badge variant="outline" className="text-xs">
                          IP: {activity.ipAddress}
                        </Badge>
                      )}
                      {activity.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {activity.location}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
            <p className="text-gray-600">You haven&apos;t performed any tracked activities yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
