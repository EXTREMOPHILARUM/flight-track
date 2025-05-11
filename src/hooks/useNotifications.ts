import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  async function initializeNotifications() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  function sendNotification(title: string, options?: NotificationOptions) {
    if (!notificationsEnabled) return;

    try {
      new Notification(title, options);
      // Play notification sound
      new Audio('/notification.mp3').play().catch(console.error);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback to toast
      toast(title);
    }
  }

  return {
    notificationsEnabled,
    initializeNotifications,
    sendNotification
  };
}