// Simplified notification actions for PostgreSQL migration
// This replaces the Firebase-based notification system

export async function sendNotification(params: {
  userId: string;
  type: string;
  message: string;
  urgency: string;
  importance?: string;
}) {
  // For now, just log the notification
  // In a real implementation, this would call the API to create a notification

  // TODO: Implement actual notification creation via API
  // await apiClient.createNotification(params);
}