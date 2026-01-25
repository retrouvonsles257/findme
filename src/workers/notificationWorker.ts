/**
 * =====================================================
 * RETROUVONSLES - Notification Web Worker
 * Handles notification processing, scheduling, and queuing
 * Integrates with Redux notification state for missing persons alerts
 * =====================================================
 */

// Declare self as DedicatedWorkerGlobalScope
declare const self: DedicatedWorkerGlobalScope;

// RETROUVONSLES Notification Categories
type NotificationCategory =
  | 'alerte'
  | 'personne_trouvee'
  | 'filiation'
  | 'ia_analysis'
  | 'organisation'
  | 'signalement'
  | 'campagne'
  | 'donation'
  | 'system';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface NotificationTask {
  id: string;
  type: 'SEND' | 'SCHEDULE' | 'CANCEL' | 'UPDATE' | 'GET_ALL' | 'BATCH_SEND' | 'QUEUE_STATUS' | 'CLEAR_QUEUE' | 'PROCESS_BATCH';
  notification?: NotificationData;
  notifications?: NotificationData[];
  delay?: number;
  interval?: number;
  notificationId?: string;
  batchId?: string;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  timestamp: number;
  duration?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
  // Geolocation for proximity alerts
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  // Entity references
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationMetadata {
  dossierId?: string;
  personneId?: string;
  signalementId?: string;
  organisationId?: string;
  userId?: string;
  [key: string]: any;
}

interface NotificationAction {
  label: string;
  action: string;
  icon?: string;
}

// Store notifications in memory
const notifications = new Map<string, NotificationData>();
const scheduledNotifications = new Map<string, NodeJS.Timeout>();
const notificationBatches = new Map<string, NotificationData[]>();
const notificationQueue: NotificationData[] = [];

// Notification queue settings
const QUEUE_CONFIG = {
  maxQueueSize: 1000,
  batchSize: 10,
  processingInterval: 1000, // ms
};

let queueProcessingActive = false;

/**
 * Send notification immediately
 */
function sendNotification(notification: NotificationData): void {
  const id = notification.id || `notif_${Date.now()}_${Math.random()}`;
  const notifData = {
    ...notification,
    id,
    timestamp: notification.timestamp || Date.now(),
  };

  notifications.set(id, notifData);

  // Auto-remove after duration if specified
  if (notifData.duration && notifData.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, notifData.duration);
  }

  self.postMessage({
    type: 'NOTIFICATION_SENT',
    data: notifData,
    notificationId: id,
  });
}

/**
 * Schedule notification for later
 */
function scheduleNotification(
  notification: NotificationData,
  delay: number
): void {
  const id = notification.id || `notif_${Date.now()}_${Math.random()}`;

  const timeoutId = setTimeout(() => {
    sendNotification({ ...notification, id });
    scheduledNotifications.delete(id);
  }, delay);

  scheduledNotifications.set(id, timeoutId);

  self.postMessage({
    type: 'NOTIFICATION_SCHEDULED',
    notificationId: id,
    delay,
    message: `Notification scheduled for ${delay}ms`,
  });
}

/**
 * Cancel scheduled notification
 */
function cancelNotification(notificationId: string): void {
  const timeoutId = scheduledNotifications.get(notificationId);

  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledNotifications.delete(notificationId);

    self.postMessage({
      type: 'NOTIFICATION_CANCELLED',
      notificationId,
      message: 'Notification cancelled',
    });
  } else {
    self.postMessage({
      type: 'ERROR',
      message: `Notification ${notificationId} not found`,
    });
  }
}

/**
 * Remove notification from active list
 */
function removeNotification(notificationId: string): void {
  if (notifications.has(notificationId)) {
    notifications.delete(notificationId);

    self.postMessage({
      type: 'NOTIFICATION_REMOVED',
      notificationId,
    });
  }
}

/**
 * Update existing notification
 */
function updateNotification(notificationData: NotificationData): void {
  const id = notificationData.id;

  if (!id) {
    self.postMessage({
      type: 'ERROR',
      message: 'Notification ID is required for update',
    });
    return;
  }

  const existingNotif = notifications.get(id);
  if (!existingNotif) {
    self.postMessage({
      type: 'ERROR',
      message: `Notification ${id} not found`,
    });
    return;
  }

  const updatedNotif = { ...existingNotif, ...notificationData };
  notifications.set(id, updatedNotif);

  self.postMessage({
    type: 'NOTIFICATION_UPDATED',
    data: updatedNotif,
    notificationId: id,
  });
}

/**
 * Get all active notifications
 */
function getAllNotifications(): void {
  const allNotifications = Array.from(notifications.values());

  self.postMessage({
    type: 'NOTIFICATIONS_LIST',
    data: allNotifications,
    count: allNotifications.length,
  });
}

/**
 * Batch add multiple notifications
 */
function batchNotifications(
  batchId: string,
  notifications_: NotificationData[]
): void {
  const batch = notifications_.map((notif) => ({
    ...notif,
    id: notif.id || `notif_${Date.now()}_${Math.random()}`,
  }));

  notificationBatches.set(batchId, batch);

  self.postMessage({
    type: 'NOTIFICATIONS_BATCHED',
    batchId,
    count: batch.length,
    message: `${batch.length} notifications added to batch`,
  });
}

/**
 * Process batch and send all
 */
function processBatch(batchId: string): void {
  const batch = notificationBatches.get(batchId);

  if (!batch) {
    self.postMessage({
      type: 'ERROR',
      message: `Batch ${batchId} not found`,
    });
    return;
  }

  batch.forEach((notif) => {
    const notifWithTimestamp = {
      ...notif,
      timestamp: notif.timestamp || Date.now(),
    };
    notifications.set(notif.id, notifWithTimestamp);
  });

  notificationBatches.delete(batchId);

  self.postMessage({
    type: 'BATCH_PROCESSED',
    batchId,
    count: batch.length,
    data: batch,
  });
}

/**
 * Clear all notifications
 */
function clearAllNotifications(): void {
  const count = notifications.size;
  notifications.clear();

  // Clear all scheduled timeouts
  scheduledNotifications.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  scheduledNotifications.clear();

  self.postMessage({
    type: 'NOTIFICATIONS_CLEARED',
    message: `Cleared ${count} notifications`,
  });
}

/**
 * Add notification to queue for batch processing
 */
function enqueueNotification(notification: NotificationData): void {
  if (notificationQueue.length >= QUEUE_CONFIG.maxQueueSize) {
    self.postMessage({
      type: 'WARNING',
      message: 'Notification queue is full, oldest notifications will be discarded',
    });
    notificationQueue.shift(); // Remove oldest
  }

  notificationQueue.push(notification);

  if (!queueProcessingActive) {
    processQueue();
  }
}

/**
 * Process notification queue in batches
 */
function processQueue(): void {
  if (queueProcessingActive || notificationQueue.length === 0) return;

  queueProcessingActive = true;

  const processBatch = () => {
    if (notificationQueue.length === 0) {
      queueProcessingActive = false;
      return;
    }

    const batch = notificationQueue.splice(0, QUEUE_CONFIG.batchSize);
    batch.forEach((notif) => sendNotification(notif));

    self.postMessage({
      type: 'BATCH_PROCESSED',
      batchSize: batch.length,
      remainingInQueue: notificationQueue.length,
    });

    // Process next batch
    setTimeout(processBatch, QUEUE_CONFIG.processingInterval);
  };

  processBatch();
}

/**
 * Get queue status
 */
function getQueueStatus(): void {
  const stats = {
    totalInQueue: notificationQueue.length,
    totalNotifications: notifications.size,
    totalScheduled: scheduledNotifications.size,
    isProcessing: queueProcessingActive,
    categories: {} as Record<string, number>,
  };

  // Count by category
  notifications.forEach((notif) => {
    stats.categories[notif.category] = (stats.categories[notif.category] || 0) + 1;
  });

  self.postMessage({
    type: 'QUEUE_STATUS',
    stats,
  });
}

/**
 * Message handler
 */
self.onmessage = (event: MessageEvent<NotificationTask>) => {
  const { type, notification, notifications: notificationsArray, delay, notificationId, batchId } = event.data;

  switch (type) {
    case 'SEND':
      if (notification) {
        sendNotification(notification);
      }
      break;

    case 'SCHEDULE':
      if (notification && delay !== undefined) {
        scheduleNotification(notification, delay);
      }
      break;

    case 'CANCEL':
      if (notificationId) {
        cancelNotification(notificationId);
      }
      break;

    case 'UPDATE':
      if (notification) {
        updateNotification(notification);
      }
      break;

    case 'GET_ALL':
      getAllNotifications();
      break;

    case 'BATCH_SEND':
      if (notificationsArray && batchId) {
        // First batch the notifications, then enqueue them
        batchNotifications(batchId, notificationsArray);
        notificationsArray.forEach((notif) => enqueueNotification(notif));
        self.postMessage({
          type: 'BATCH_QUEUED',
          batchId,
          count: notificationsArray.length,
        });
      }
      break;

    case 'QUEUE_STATUS':
      getQueueStatus();
      break;

    case 'PROCESS_BATCH':
      if (batchId) {
        processBatch(batchId);
      }
      break;

    case 'CLEAR_QUEUE':
      clearAllNotifications(); // Use the function instead of direct manipulation
      notificationQueue.length = 0;
      self.postMessage({
        type: 'QUEUE_CLEARED',
        message: 'Notification queue cleared',
      });
      break;

    default:
      self.postMessage({
        type: 'ERROR',
        message: `Unknown message type: ${type}`,
      });
  }
};

export {};
