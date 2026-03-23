'use client';

import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  urgency: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getNotifications();
      setNotifications(response.notifications);
    } catch (error) {

      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !notifications) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) {
        toast({ title: "No unread notifications." });
        return;
    }

    try {
      await apiClient.markAllNotificationsAsRead();
      await fetchNotifications(); // Refresh notifications
      toast({
        title: 'Notifications Updated',
        description: 'All notifications have been marked as read.',
      });
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update notifications.',
      });
    }
  };

  return (
    <div className="pt-2 sm:pt-4 px-2 sm:px-0 max-w-full">
      <div className="flex items-center justify-end mb-4 sm:mb-6">
        <Button 
          onClick={handleMarkAllAsRead} 
          disabled={isLoading || notifications?.every(n => n.read)}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <CheckCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
          <span className="hidden sm:inline">Mark all as read</span>
          <span className="sm:hidden">Mark all</span>
        </Button>
      </div>
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-6">
          <CardTitle className="text-lg sm:text-xl">Your Recent Activity</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Stay up-to-date with everything happening on your account.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[400px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                    notification.read ? "bg-muted/50 text-muted-foreground" : "bg-background"
                )}>
                  <span className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full mt-1",
                      notification.read ? "bg-muted-foreground/20" : "bg-primary/10 text-primary"
                    )}>
                    <Bell className="h-5 w-5" />
                  </span>
                  <div className="flex-grow">
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(notification.createdAt), "PPP p")} ({formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })})
                    </p>
                  </div>
                   {!notification.read && (
                       <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0 mt-2" title="Unread"></div>
                   )}
                </div>
              ))
            ) : (
              <div className="text-center p-12 text-muted-foreground">
                <Inbox className="mx-auto h-16 w-16" />
                <p className="mt-4 text-lg">Your inbox is empty</p>
                <p>You have no new notifications.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
