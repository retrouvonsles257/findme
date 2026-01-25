/**
 * =====================================================
 * RETROUVONSLES - Firebase Cloud Messaging Service
 * =====================================================
 * Push notifications and messaging
 */

import {
  getToken,
  onMessage,
  Messaging,
  MessagePayload,
} from 'firebase/messaging';
import { getFirebaseServices, isServiceAvailable } from './firebaseConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  color?: string;
  clickAction?: string;
  sound?: string;
  requireInteraction?: boolean;
}

export interface NotificationToken {
  token: string;
  createdAt: Date;
  expiresAt?: Date;
  isValid: boolean;
}

export interface PushNotificationOptions {
  title: string;
  options?: NotificationOptions;
  data?: Record<string, string>;
}

export interface MessageHandler {
  (message: MessagePayload): void;
}

export interface TokenRefreshHandler {
  (token: string): void;
}

// ============================================
// FCM SERVICE CLASS
// ============================================

class FirebaseFCMService {
  private messaging: Messaging | null = null;
  private isInitialized: boolean = false;
  private currentToken: string | null = null;
  private tokenRefreshListeners: TokenRefreshHandler[] = [];
  private messageHandlers: MessageHandler[] = [];
  private vapidKey: string = '';

  constructor() {
    this.initialize();
    this.vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY || '';
  }

  /**
   * Initialize FCM service
   */
  private initialize(): void {
    if (!isServiceAvailable('messaging')) {
      console.warn('Firebase Messaging is not available in this environment');
      return;
    }

    const services = getFirebaseServices();
    this.messaging = services.messaging;
    this.isInitialized = !!this.messaging;

    if (this.isInitialized) {
      this.setupMessageListener();
    }
  }

  /**
   * Check if FCM is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.messaging;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.messaging) {
      console.warn('Messaging not available');
      return false;
    }

    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notification permission is granted
   */
  isNotificationPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    return Notification.permission === 'granted';
  }

  /**
   * Get current notification permission status
   */
  getNotificationPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    return Notification.permission;
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    if (!this.messaging) {
      console.warn('Messaging not available');
      return null;
    }

    try {
      // Check if we already have a valid token
      if (this.currentToken) {
        return this.currentToken;
      }

      // Check permission first
      if (this.getNotificationPermissionStatus() !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey || undefined,
      });

      if (token) {
        this.currentToken = token;
      }

      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register token refresh listener
   */
  onTokenRefresh(callback: TokenRefreshHandler): () => void {
    this.tokenRefreshListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.tokenRefreshListeners = this.tokenRefreshListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Setup message listener for foreground messages
   */
  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (message) => {
      // Handle foreground message
      this.handleForegroundMessage(message);

      // Call registered message handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    });
  }

  /**
   * Register foreground message listener
   */
  onMessage(callback: MessageHandler): () => void {
    this.messageHandlers.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Handle foreground message
   */
  private handleForegroundMessage(message: MessagePayload): void {
    if (!message.notification) return;

    const notification = message.notification as any;

    // Show browser notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: notification.title || 'RETROUVONSLES',
          options: {
            body: notification.body,
            icon: notification.icon,
            image: notification.image,
            badge: notification.badge,
            tag: notification.tag || 'retrouvonsles',
            requireInteraction: notification.requireInteraction || false,
            data: message.data || {},
          },
        },
      });
    } else {
      // Fallback: show notification directly if service worker not available
      if (this.isNotificationPermissionGranted()) {
        const notificationOptions: NotificationOptions = {
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          tag: notification.tag || 'retrouvonsles',
          data: message.data || {},
        };

        // Add image if available (some browsers support it)
        if (notification.image && 'image' in notificationOptions) {
          (notificationOptions as any).image = notification.image;
        }

        new Notification(notification.title || 'RETROUVONSLES', notificationOptions);
      }
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      // This would typically be done via backend API
      // Firebase Admin SDK is required for topic subscription
      const response = await fetch('/api/firebase/subscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, topic }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/firebase/unsubscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, topic }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  /**
   * Send message to backend to send notification
   */
  async sendNotification(
    token: string,
    payload: NotificationPayload,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/firebase/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          notification: payload,
          data: data || {},
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to topic
   */
  async sendNotificationToTopic(
    topic: string,
    payload: NotificationPayload,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/firebase/send-notification-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          notification: payload,
          data: data || {},
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending topic notification:', error);
      return false;
    }
  }

  /**
   * Enable notifications
   */
  async enableNotifications(): Promise<boolean> {
    try {
      const permission = await this.requestNotificationPermission();
      if (!permission) {
        return false;
      }

      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  /**
   * Disable notifications
   */
  async disableNotifications(): Promise<boolean> {
    try {
      // This would involve unsubscribing from all topics and removing token from backend
      const response = await fetch('/api/firebase/disable-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.currentToken }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  areNotificationsEnabled(): boolean {
    return this.isNotificationPermissionGranted() && !!this.currentToken;
  }

  /**
   * Clear all message handlers
   */
  clearMessageHandlers(): void {
    this.messageHandlers = [];
  }

  /**
   * Clear all token refresh listeners
   */
  clearTokenRefreshListeners(): void {
    this.tokenRefreshListeners = [];
  }

  /**
   * Handle background message (called from service worker)
   */
  static handleBackgroundMessage(message: MessagePayload): void {
    if (!message.notification) return;

    const notification = message.notification as any;

    // This method should be called from service worker context
    // where 'self' refers to ServiceWorkerGlobalScope
    if (typeof globalThis !== 'undefined' && 'registration' in globalThis) {
      const swGlobal = globalThis as any;
      swGlobal.registration?.showNotification(notification.title || 'RETROUVONSLES', {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag || 'retrouvonsles',
        data: message.data || {},
      } as NotificationOptions);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const firebaseFCMService = new FirebaseFCMService();

// ============================================
// EXPORTS
// ============================================

export default firebaseFCMService;
