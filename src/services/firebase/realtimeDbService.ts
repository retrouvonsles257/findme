/**
 * =====================================================
 * RETROUVONSLES - Firebase Realtime Database Service
 * =====================================================
 * Real-time data synchronization
 */

import {
  Database,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  Unsubscribe,
  query,
  limitToFirst,
  limitToLast,
  orderByChild,
  orderByValue,
  startAt,
  endAt,
  equalTo,
} from 'firebase/database';
import { getFirebaseServices, REALTIME_DB_PATHS } from './firebaseConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DatabaseQuery {
  limitFirst?: number;
  limitLast?: number;
  orderBy?: 'key' | 'value' | string;
  startValue?: any;
  endValue?: any;
  equalValue?: any;
}

export interface DataChangeCallback<T = any> {
  (data: T | null): void;
}

export interface ChildChangeCallback<T = any> {
  (key: string, data: T): void;
}

// ============================================
// REALTIME DATABASE SERVICE CLASS
// ============================================

class RealtimeDatabaseService {
  private database: Database | null = null;
  private isInitialized: boolean = false;
  private listeners: Map<string, Unsubscribe> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize realtime database service
   */
  private initialize(): void {
    try {
      const services = getFirebaseServices();
      this.database = services.realtimeDb;
      this.isInitialized = !!this.database;
    } catch (error) {
      console.error('Error initializing Realtime Database service:', error);
    }
  }

  /**
   * Check if database is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.database;
  }

  /**
   * Set data
   */
  async setData<T = any>(path: string, data: T): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const dbRef = ref(this.database, path);
      await set(dbRef, data);
      return true;
    } catch (error) {
      console.error(`Error setting data at ${path}:`, error);
      return false;
    }
  }

  /**
   * Get data
   */
  async getData<T = any>(path: string): Promise<T | null> {
    if (!this.database) {
      console.warn('Database not available');
      return null;
    }

    try {
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as T;
    } catch (error) {
      console.error(`Error getting data from ${path}:`, error);
      return null;
    }
  }

  /**
   * Update data
   */
  async updateData(path: string, updates: Record<string, any>): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const dbRef = ref(this.database, path);
      await update(dbRef, updates);
      return true;
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      return false;
    }
  }

  /**
   * Delete data
   */
  async deleteData(path: string): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const dbRef = ref(this.database, path);
      await remove(dbRef);
      return true;
    } catch (error) {
      console.error(`Error deleting data at ${path}:`, error);
      return false;
    }
  }

  /**
   * Listen to value changes
   */
  onValueChange<T = any>(
    path: string,
    callback: DataChangeCallback<T>,
    listenerId?: string
  ): Unsubscribe {
    if (!this.database) {
      console.warn('Database not available');
      return () => {};
    }

    try {
      const dbRef = ref(this.database, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.exists() ? (snapshot.val() as T) : null;
        callback(data);
      });

      if (listenerId) {
        this.listeners.set(listenerId, unsubscribe);
      }

      return unsubscribe;
    } catch (error) {
      console.error(`Error listening to value at ${path}:`, error);
      return () => {};
    }
  }

  /**
   * Listen to child added events
   */
  onChildAdded<T = any>(
    path: string,
    callback: ChildChangeCallback<T>,
    listenerId?: string
  ): Unsubscribe {
    if (!this.database) {
      console.warn('Database not available');
      return () => {};
    }

    try {
      const dbRef = ref(this.database, path);
      const unsubscribe = onChildAdded(dbRef, (snapshot) => {
        const data = snapshot.val() as T;
        callback(snapshot.key || '', data);
      });

      if (listenerId) {
        this.listeners.set(listenerId, unsubscribe);
      }

      return unsubscribe;
    } catch (error) {
      console.error(`Error listening to child added at ${path}:`, error);
      return () => {};
    }
  }

  /**
   * Listen to child changed events
   */
  onChildChanged<T = any>(
    path: string,
    callback: ChildChangeCallback<T>,
    listenerId?: string
  ): Unsubscribe {
    if (!this.database) {
      console.warn('Database not available');
      return () => {};
    }

    try {
      const dbRef = ref(this.database, path);
      const unsubscribe = onChildChanged(dbRef, (snapshot) => {
        const data = snapshot.val() as T;
        callback(snapshot.key || '', data);
      });

      if (listenerId) {
        this.listeners.set(listenerId, unsubscribe);
      }

      return unsubscribe;
    } catch (error) {
      console.error(`Error listening to child changed at ${path}:`, error);
      return () => {};
    }
  }

  /**
   * Listen to child removed events
   */
  onChildRemoved(
    path: string,
    callback: (key: string) => void,
    listenerId?: string
  ): Unsubscribe {
    if (!this.database) {
      console.warn('Database not available');
      return () => {};
    }

    try {
      const dbRef = ref(this.database, path);
      const unsubscribe = onChildRemoved(dbRef, (snapshot) => {
        callback(snapshot.key || '');
      });

      if (listenerId) {
        this.listeners.set(listenerId, unsubscribe);
      }

      return unsubscribe;
    } catch (error) {
      console.error(`Error listening to child removed at ${path}:`, error);
      return () => {};
    }
  }

  /**
   * Query with constraints
   */
  async queryData<T = any>(
    path: string,
    queryOptions: DatabaseQuery
  ): Promise<T[]> {
    if (!this.database) {
      console.warn('Database not available');
      return [];
    }

    try {
      const dbRef = ref(this.database, path);
      const constraints: any[] = [];

      if (queryOptions.orderBy === 'key') {
        // Order by key
      } else if (queryOptions.orderBy === 'value') {
        constraints.push(orderByValue());
      } else if (queryOptions.orderBy) {
        constraints.push(orderByChild(queryOptions.orderBy));
      }

      if (queryOptions.limitFirst) {
        constraints.push(limitToFirst(queryOptions.limitFirst));
      }

      if (queryOptions.limitLast) {
        constraints.push(limitToLast(queryOptions.limitLast));
      }

      if (queryOptions.startValue !== undefined) {
        constraints.push(startAt(queryOptions.startValue));
      }

      if (queryOptions.endValue !== undefined) {
        constraints.push(endAt(queryOptions.endValue));
      }

      if (queryOptions.equalValue !== undefined) {
        constraints.push(equalTo(queryOptions.equalValue));
      }

      const q = query(dbRef, ...constraints);
      const snapshot = await get(q);

      if (!snapshot.exists()) {
        return [];
      }

      const results: T[] = [];
      snapshot.forEach((childSnapshot) => {
        results.push(childSnapshot.val() as T);
      });

      return results;
    } catch (error) {
      console.error(`Error querying data at ${path}:`, error);
      return [];
    }
  }

  /**
   * Unsubscribe from listener by ID
   */
  unsubscribeListener(listenerId: string): void {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Set user presence (online/offline)
   */
  async setPresence(userId: string, isOnline: boolean): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const presencePath = `${REALTIME_DB_PATHS.PRESENCE}/${userId}`;
      const data = {
        online: isOnline,
        timestamp: Math.floor(Date.now() / 1000),
      };

      return await this.setData(presencePath, data);
    } catch (error) {
      console.error('Error setting presence:', error);
      return false;
    }
  }

  /**
   * Get user presence
   */
  async getPresence(userId: string): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const presencePath = `${REALTIME_DB_PATHS.PRESENCE}/${userId}`;
      const data = await this.getData<{ online: boolean }>(presencePath);
      return data?.online || false;
    } catch (error) {
      console.error('Error getting presence:', error);
      return false;
    }
  }

  /**
   * Add typing indicator
   */
  async setTyping(userId: string, isTyping: boolean): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const typingPath = `${REALTIME_DB_PATHS.TYPING_INDICATORS}/${userId}`;
      if (isTyping) {
        return await this.setData(typingPath, true);
      } else {
        return await this.deleteData(typingPath);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      return false;
    }
  }

  /**
   * Get active users
   */
  async getActiveUsers(): Promise<string[]> {
    if (!this.database) {
      console.warn('Database not available');
      return [];
    }

    try {
      const presenceData = await this.getData<Record<string, any>>(REALTIME_DB_PATHS.PRESENCE);
      if (!presenceData) return [];

      return Object.keys(presenceData).filter((userId) => presenceData[userId]?.online);
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  /**
   * Increment counter
   */
  async incrementCounter(path: string, incrementValue: number = 1): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);
      const currentValue = snapshot.val() || 0;

      return await this.setData(path, currentValue + incrementValue);
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return false;
    }
  }

  /**
   * Add to list (append)
   */
  async addToList<T = any>(basePath: string, item: T): Promise<boolean> {
    if (!this.database) {
      console.warn('Database not available');
      return false;
    }

    try {
      const dbRef = ref(this.database, basePath);
      const newRef = await get(dbRef);
      const listSize = newRef.size || 0;

      return await this.setData(`${basePath}/${listSize + 1}`, item);
    } catch (error) {
      console.error('Error adding to list:', error);
      return false;
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const realtimeDatabaseService = new RealtimeDatabaseService();

// ============================================
// EXPORTS
// ============================================

export default realtimeDatabaseService;
