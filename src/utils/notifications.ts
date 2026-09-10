// Native Web Notification API Engine for SANJIVNI Device Reminders

export class DeviceNotificationService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this environment.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  sendNotification(title: string, body: string, iconUrl?: string): boolean {
    if (!this.isSupported) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted. Current state:', Notification.permission);
      return false;
    }

    try {
      const options: NotificationOptions = {
        body,
        icon: iconUrl || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `smriti-reminder-${Date.now()}`,
        requireInteraction: true, // Keep notification visible until acknowledged by elder/caregiver
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (e) {
      console.error('Failed to trigger native device notification:', e);
      return false;
    }
  }

  triggerTaskReminder(taskTitle: string, timeStr: string): boolean {
    const title = `⏰ SANJIVNI Reminder: ${taskTitle}`;
    const body = `Scheduled for ${timeStr}. Tap to open Koka's routine checklist.`;
    return this.sendNotification(title, body);
  }
}

export const deviceNotifications = new DeviceNotificationService();
