/**
 * =====================================================
 * RETROUVONSLES - Workers Index
 * Factory and utility functions for worker management
 * Provides geolocation, notification, and service worker orchestration
 * =====================================================
 */

// ============================================
// TYPES
// ============================================

export type WorkerType = 'geolocation' | 'notification' | 'service';

export interface WorkerMessage {
  type: string;
  [key: string]: any;
}

export interface GeolocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  sessionId?: string;
  triggeredZones?: any[];
}

// ============================================
// WORKER INSTANCE CACHE
// ============================================

const workerInstances = new Map<string, Worker>();

// ============================================
// GEOLOCATION WORKER
// ============================================

/**
 * Create or get geolocation worker singleton
 */
export function getGeolocationWorker(): Worker {
  const key = 'geolocation';

  if (workerInstances.has(key)) {
    return workerInstances.get(key)!;
  }

  const worker = new Worker(
    new URL('./geolocationWorker.ts', import.meta.url),
    { type: 'module' }
  );

  workerInstances.set(key, worker);
  return worker;
}

/**
 * Start geolocation tracking in worker
 */
export function startGeolocationTracking(
  onUpdate?: (data: GeolocationUpdate) => void,
  onError?: (error: string) => void
): void {
  const worker = getGeolocationWorker();

  if (onUpdate || onError) {
    worker.onmessage = (event: MessageEvent<any>) => {
      if (event.data.type === 'LOCATION_UPDATE' && onUpdate) {
        onUpdate(event.data.data);
      } else if (event.data.type === 'ERROR' && onError) {
        onError(event.data.message);
      }
    };
  }

  worker.postMessage({ type: 'START_TRACKING' });
}

/**
 * Stop geolocation tracking in worker
 */
export function stopGeolocationTracking(): void {
  const worker = getGeolocationWorker();
  worker.postMessage({ type: 'STOP_TRACKING' });
}

/**
 * Get current location from worker
 */
export function getLocationFromWorker(
  callback?: (data: GeolocationUpdate) => void
): void {
  const worker = getGeolocationWorker();

  if (callback) {
    const handler = (event: MessageEvent<any>) => {
      if (event.data.type === 'LOCATION_DATA') {
        callback(event.data.data);
        worker.removeEventListener('message', handler);
      }
    };
    worker.addEventListener('message', handler);
  }

  worker.postMessage({ type: 'GET_LOCATION' });
}

/**
 * Add proximity zone to geolocation worker
 */
export function addProximityZone(zone: any): void {
  const worker = getGeolocationWorker();
  worker.postMessage({ type: 'ADD_PROXIMITY_ZONE', proximityZone: zone });
}

/**
 * Get tracking session data
 */
export function getTrackingSession(
  callback?: (session: any) => void
): void {
  const worker = getGeolocationWorker();

  if (callback) {
    const handler = (event: MessageEvent<any>) => {
      if (event.data.type === 'TRACKING_SESSION_DATA') {
        callback(event.data.session);
        worker.removeEventListener('message', handler);
      }
    };
    worker.addEventListener('message', handler);
  }

  worker.postMessage({ type: 'GET_TRACKING_SESSION' });
}

// ============================================
// NOTIFICATION WORKER
// ============================================

/**
 * Create or get notification worker singleton
 */
export function getNotificationWorker(): Worker {
  const key = 'notification';

  if (workerInstances.has(key)) {
    return workerInstances.get(key)!;
  }

  const worker = new Worker(
    new URL('./notificationWorker.ts', import.meta.url),
    { type: 'module' }
  );

  workerInstances.set(key, worker);
  return worker;
}

/**
 * Send notification through worker
 */
export function sendNotificationViaWorker(notification: any): void {
  const worker = getNotificationWorker();
  worker.postMessage({ type: 'SEND', notification });
}

/**
 * Schedule notification through worker
 */
export function scheduleNotificationViaWorker(
  notification: any,
  delayMs: number
): void {
  const worker = getNotificationWorker();
  worker.postMessage({ type: 'SCHEDULE', notification, delay: delayMs });
}

/**
 * Batch send notifications through worker
 */
export function batchSendNotifications(
  notifications: any[],
  batchId: string
): void {
  const worker = getNotificationWorker();
  worker.postMessage({
    type: 'BATCH_SEND',
    notifications,
    batchId,
  });
}

/**
 * Get notification queue status
 */
export function getNotificationQueueStatus(
  callback?: (stats: any) => void
): void {
  const worker = getNotificationWorker();

  if (callback) {
    const handler = (event: MessageEvent<any>) => {
      if (event.data.type === 'QUEUE_STATUS') {
        callback(event.data.stats);
        worker.removeEventListener('message', handler);
      }
    };
    worker.addEventListener('message', handler);
  }

  worker.postMessage({ type: 'QUEUE_STATUS' });
}

/**
 * Clear notification queue
 */
export function clearNotificationQueue(): void {
  const worker = getNotificationWorker();
  worker.postMessage({ type: 'CLEAR_QUEUE' });
}

/**
 * Listen to notification worker messages
 */
export function onNotificationMessage(
  callback: (event: MessageEvent<any>) => void
): () => void {
  const worker = getNotificationWorker();
  worker.addEventListener('message', callback);

  // Return cleanup function
  return () => worker.removeEventListener('message', callback);
}

// ============================================
// SERVICE WORKER
// ============================================

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<
  ServiceWorkerRegistration | undefined
> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[Workers] Service Worker not supported in this browser');
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      new URL('./serviceWorker.ts', import.meta.url),
      { type: 'module' }
    );

    console.log('[Workers] Service Worker registered successfully', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[Workers] New Service Worker activated');
            // Notify about update
            window.dispatchEvent(
              new CustomEvent('service-worker-update', { detail: registration })
            );
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[Workers] Service Worker registration failed:', error);
    return undefined;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const results = await Promise.all(registrations.map((reg) => reg.unregister()));
    console.log('[Workers] Service Workers unregistered:', results);
    return results.some((r) => r);
  } catch (error) {
    console.error('[Workers] Error unregistering Service Workers:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.length > 0 && registrations[0].active !== null;
  } catch (error) {
    console.error('[Workers] Error checking Service Worker:', error);
    return false;
  }
}

/**
 * Request service worker to skip waiting and activate immediately
 */
export function skipWaitingServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[Workers] Service Worker controller not available');
    return;
  }

  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  console.log('[Workers] Requested Service Worker to skip waiting');
}

/**
 * Send message to service worker
 */
export function sendServiceWorkerMessage(message: WorkerMessage): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[Workers] Service Worker controller not available');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Listen to service worker updates
 */
export function onServiceWorkerUpdate(
  callback: (registration: ServiceWorkerRegistration) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };

  window.addEventListener('service-worker-update', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('service-worker-update', handler);
  };
}

// ============================================
// GENERIC WORKER MANAGEMENT
// ============================================

/**
 * Terminate a worker
 */
export function terminateWorker(type: WorkerType): void {
  const key = type;
  const worker = workerInstances.get(key);

  if (worker) {
    worker.terminate();
    workerInstances.delete(key);
    console.log(`[Workers] Worker terminated: ${type}`);
  }
}

/**
 * Terminate all workers
 */
export function terminateAllWorkers(): void {
  workerInstances.forEach((worker) => {
    worker.terminate();
  });
  workerInstances.clear();
  console.log('[Workers] All workers terminated');
}

/**
 * Send message to worker
 */
export function sendWorkerMessage(
  type: WorkerType,
  message: WorkerMessage
): void {
  let worker: Worker | undefined;

  switch (type) {
    case 'geolocation':
      worker = getGeolocationWorker();
      break;
    case 'notification':
      worker = getNotificationWorker();
      break;
    default:
      console.warn(`[Workers] Unknown worker type: ${type}`);
      return;
  }

  if (worker) {
    worker.postMessage(message);
  }
}

/**
 * Listen to worker messages
 */
export function onWorkerMessage(
  type: WorkerType,
  callback: (event: MessageEvent) => void
): () => void {
  let worker: Worker | undefined;

  switch (type) {
    case 'geolocation':
      worker = getGeolocationWorker();
      break;
    case 'notification':
      worker = getNotificationWorker();
      break;
    default:
      console.warn(`[Workers] Unknown worker type: ${type}`);
      return () => {};
  }

  if (worker) {
    worker.addEventListener('message', callback);
    // Return cleanup function
    return () => worker!.removeEventListener('message', callback);
  }

  return () => {};
}

// ============================================
// INITIALIZATION & SETUP
// ============================================

/**
 * Initialize all workers with automatic setup
 */
export async function initializeAllWorkers(): Promise<{
  serviceWorkerReady: boolean;
  geolocationReady: boolean;
  notificationReady: boolean;
}> {
  const results = {
    serviceWorkerReady: false,
    geolocationReady: false,
    notificationReady: false,
  };

  try {
    // Register Service Worker
    const swRegistration = await registerServiceWorker();
    results.serviceWorkerReady = !!swRegistration;
  } catch (error) {
    console.error('[Workers] Failed to register Service Worker:', error);
  }

  try {
    // Initialize Geolocation Worker
    getGeolocationWorker();
    results.geolocationReady = true;
  } catch (error) {
    console.error('[Workers] Failed to initialize Geolocation Worker:', error);
  }

  try {
    // Initialize Notification Worker
    getNotificationWorker();
    results.notificationReady = true;
  } catch (error) {
    console.error('[Workers] Failed to initialize Notification Worker:', error);
  }

  console.log('[Workers] Initialization complete:', results);
  return results;
}

// ============================================
// DEFAULT EXPORT
// ============================================

const WorkersAPI = {
  // Geolocation
  getGeolocationWorker,
  startGeolocationTracking,
  stopGeolocationTracking,
  getLocationFromWorker,
  addProximityZone,
  getTrackingSession,

  // Notifications
  getNotificationWorker,
  sendNotificationViaWorker,
  scheduleNotificationViaWorker,
  batchSendNotifications,
  getNotificationQueueStatus,
  clearNotificationQueue,
  onNotificationMessage,

  // Service Worker
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerActive,
  skipWaitingServiceWorker,
  sendServiceWorkerMessage,
  onServiceWorkerUpdate,

  // Generic
  terminateWorker,
  terminateAllWorkers,
  sendWorkerMessage,
  onWorkerMessage,

  // Initialization
  initializeAllWorkers,
};

export default WorkersAPI;
