'use client';

import { ActivityLog } from '@/components/settings/activity-log';
import { DeviceManagement } from '@/components/settings/device-management';
import { ActivityDashboard } from '@/components/settings/activity-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield, BarChart3 } from 'lucide-react';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity & Sessions</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your account activity and manage active sessions across all devices
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Active Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ActivityDashboard />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityLog />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <DeviceManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
