'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Shield, 
  TrendingUp, 
  Clock, 
  MapPin,
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { apiClient, UserActivity, UserSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, subDays, startOfDay } from 'date-fns';

interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  activeSessions: number;
  secureDevices: number;
  highRiskDevices: number;
  mostActiveDay: string;
  mostCommonAction: string;
}

export function ActivityDashboard() {
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    todayActivities: 0,
    weekActivities: 0,
    activeSessions: 0,
    secureDevices: 0,
    highRiskDevices: 0,
    mostActiveDay: 'N/A',
    mostCommonAction: 'N/A'
  });
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load activities and sessions in parallel
        const [activitiesResponse, sessionsResponse] = await Promise.all([
          apiClient.getUserActivities(1, 100), // Get more for stats
          apiClient.getUserSessions()
        ]);

        const activities = activitiesResponse.activities;
        const sessions = sessionsResponse.sessions;

        // Calculate statistics
        const now = new Date();
        const todayStart = startOfDay(now);
        const weekStart = subDays(now, 7);

        const todayActivities = activities.filter(a => 
          new Date(a.createdAt) >= todayStart
        ).length;

        const weekActivities = activities.filter(a => 
          new Date(a.createdAt) >= weekStart
        ).length;

        const secureDevices = sessions.filter(s => 
          s.deviceInfo?.riskLevel === 'low'
        ).length;

        const highRiskDevices = sessions.filter(s => 
          s.deviceInfo?.riskLevel === 'high'
        ).length;

        // Find most common action
        const actionCounts: Record<string, number> = {};
        activities.forEach(a => {
          actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
        });
        const mostCommonAction = Object.keys(actionCounts).length > 0
          ? Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A';

        // Find most active day
        const dayCounts: Record<string, number> = {};
        activities.forEach(a => {
          const day = format(new Date(a.createdAt), 'EEEE');
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const mostActiveDay = Object.keys(dayCounts).length > 0
          ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A';

        // Update state
        setStats({
          totalActivities: activities.length,
          todayActivities,
          weekActivities,
          activeSessions: sessions.length,
          secureDevices,
          highRiskDevices,
          mostActiveDay,
          mostCommonAction
        });
        setRecentActivities(activities.slice(0, 10));
        setSessions(sessions);
      } catch (error) {

        toast({
          title: 'Error',
          description: 'Failed to load activity data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('login')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.toLowerCase().includes('security')) return <Shield className="h-4 w-4 text-blue-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-3xl font-bold mt-2">{stats.totalActivities}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today&apos;s Activity</p>
                <p className="text-3xl font-bold mt-2">{stats.todayActivities}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-3xl font-bold mt-2">{stats.activeSessions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.secureDevices} secure
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Status</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.highRiskDevices === 0 ? (
                    <span className="text-green-600">Secure</span>
                  ) : (
                    <span className="text-red-600">{stats.highRiskDevices}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.highRiskDevices === 0 ? 'No threats' : 'High risk devices'}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                stats.highRiskDevices === 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {stats.highRiskDevices === 0 ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Insights</CardTitle>
            <CardDescription>Your usage patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Most Active Day</p>
                  <p className="text-xs text-muted-foreground">When your&apos;e most active</p>
                </div>
              </div>
              <Badge variant="secondary">{stats.mostActiveDay}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Most Common Action</p>
                  <p className="text-xs text-muted-foreground">Your frequent activity</p>
                </div>
              </div>
              <Badge variant="secondary">{stats.mostCommonAction}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Weekly Activity</p>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </div>
              </div>
              <Badge variant="secondary">{stats.weekActivities} actions</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="mt-1">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatActionName(activity.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Devices Summary */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Devices</CardTitle>
            <CardDescription>Devices currently signed in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map((session) => (
                <div 
                  key={session.id}
                  className={`p-4 border rounded-lg ${
                    session.isCurrent ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {session.deviceInfo.device?.type === 'mobile' ? (
                        <Smartphone className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Monitor className="h-4 w-4 text-gray-600" />
                      )}
                      <p className="text-sm font-medium truncate">
                        {session.deviceInfo.displayName || 'Unknown Device'}
                      </p>
                    </div>
                    {session.isCurrent && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {session.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{session.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {session.isCurrent 
                          ? 'Active now' 
                          : formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })
                        }
                      </span>
                    </div>
                    {!session.deviceInfo.isRecognized && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Eye className="h-3 w-3" />
                        <span>New device</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
