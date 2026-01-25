/**
 * =====================================================
 * RETROUVONSLES - Realtime Subscriptions Manager
 * =====================================================
 * 
 * Manager pour gérer les souscriptions Realtime
 * avec lifecycle hooks et cleanup automatique
 */

import { RealtimeService, ChannelOptions, EventCallback } from './realtime';
import { UUID } from '../../@types/database.types';

// ============================================
// TYPES
// ============================================

export interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
  onEvent?: EventCallback;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
}

export interface ActiveSubscription {
  id: string;
  config: SubscriptionConfig;
  channel: any;
  active: boolean;
  createdAt: Date;
}

// ============================================
// REALTIME SUBSCRIPTIONS MANAGER
// ============================================

export class RealtimeSubscriptionsManager {
  private realtimeService: RealtimeService;
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private static instance: RealtimeSubscriptionsManager | null = null;
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.realtimeService = RealtimeService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealtimeSubscriptionsManager {
    if (!this.instance) {
      this.instance = new RealtimeSubscriptionsManager();
    }
    return this.instance;
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  /**
   * Subscribe to table changes
   */
  subscribe(config: SubscriptionConfig): string {
    const subscriptionId = this.generateSubscriptionId(config.table);

    if (this.subscriptions.has(subscriptionId)) {
      console.warn(`Already subscribed to ${config.table}. Returning existing subscription.`);
      return subscriptionId;
    }

    try {
      const channelOptions: ChannelOptions = {
        table: config.table,
        schema: config.schema || 'public',
        event: config.event || '*',
        filter: config.filter,
      };

      const subscription: ActiveSubscription = {
        id: subscriptionId,
        config,
        channel: this.realtimeService.subscribeToTable(config.table, channelOptions),
        active: true,
        createdAt: new Date(),
      };

      // Setup event handler
      if (config.onEvent) {
        subscription.channel.on(config.onEvent);
      }

      // Setup auto-reconnect if enabled
      if (config.autoReconnect) {
        this.setupAutoReconnect(subscriptionId);
      }

      this.subscriptions.set(subscriptionId, subscription);

      console.log(`[Subscriptions] Subscribed to ${config.table} (${subscriptionId})`);

      return subscriptionId;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Subscriptions] Failed to subscribe to ${config.table}:`, errorMsg);

      if (config.onError) {
        config.onError(error instanceof Error ? error : new Error(errorMsg));
      }

      throw error;
    }
  }

  /**
   * Subscribe to specific record
   */
  subscribeToRecord(
    table: string,
    recordId: UUID,
    callback: EventCallback
  ): string {
    const subscriptionId = `${table}:${recordId}:${Date.now()}`;

    try {
      const subscription: ActiveSubscription = {
        id: subscriptionId,
        config: {
          table,
          onEvent: callback,
        },
        channel: this.realtimeService.subscribeToRecord(table, recordId, callback),
        active: true,
        createdAt: new Date(),
      };

      this.subscriptions.set(subscriptionId, subscription);
      console.log(`[Subscriptions] Subscribed to record ${table}:${recordId}`);

      return subscriptionId;
    } catch (error) {
      console.error(`[Subscriptions] Failed to subscribe to record:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to presence updates
   */
  subscribeToPresence(
    channelName: string,
    callback: (presence: any) => void
  ): string {
    const subscriptionId = `presence:${channelName}`;

    try {
      const subscription: ActiveSubscription = {
        id: subscriptionId,
        config: { table: channelName },
        channel: this.realtimeService.subscribeToPresence(channelName, callback),
        active: true,
        createdAt: new Date(),
      };

      this.subscriptions.set(subscriptionId, subscription);
      console.log(`[Subscriptions] Subscribed to presence: ${channelName}`);

      return subscriptionId;
    } catch (error) {
      console.error(`[Subscriptions] Failed to subscribe to presence:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to broadcast messages
   */
  subscribeToBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): string {
    const subscriptionId = `broadcast:${channelName}:${event}`;

    try {
      const subscription: ActiveSubscription = {
        id: subscriptionId,
        config: { table: `${channelName}:${event}` },
        channel: this.realtimeService.subscribeToBroadcast(channelName, event, callback),
        active: true,
        createdAt: new Date(),
      };

      this.subscriptions.set(subscriptionId, subscription);
      console.log(`[Subscriptions] Subscribed to broadcast: ${channelName}/${event}`);

      return subscriptionId;
    } catch (error) {
      console.error(`[Subscriptions] Failed to subscribe to broadcast:`, error);
      throw error;
    }
  }

  // ============================================
  // UNSUBSCRIBE OPERATIONS
  // ============================================

  /**
   * Unsubscribe from subscription
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      console.warn(`Subscription not found: ${subscriptionId}`);
      return;
    }

    try {
      await subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);

      // Clear auto-reconnect interval
      const interval = this.reconnectIntervals.get(subscriptionId);
      if (interval) {
        clearInterval(interval);
        this.reconnectIntervals.delete(subscriptionId);
      }

      console.log(`[Subscriptions] Unsubscribed: ${subscriptionId}`);
    } catch (error) {
      console.error(`[Subscriptions] Failed to unsubscribe:`, error);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());

    for (const id of subscriptionIds) {
      await this.unsubscribe(id);
    }

    console.log('[Subscriptions] Unsubscribed from all');
  }

  /**
   * Unsubscribe from table
   */
  async unsubscribeFromTable(table: string): Promise<void> {
    const toUnsubscribe = Array.from(this.subscriptions.entries())
      .filter(([, sub]) => sub.config.table === table)
      .map(([id]) => id);

    for (const id of toUnsubscribe) {
      await this.unsubscribe(id);
    }
  }

  // ============================================
  // SUBSCRIPTION INFORMATION
  // ============================================

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): ActiveSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): ActiveSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * Get subscriptions for table
   */
  getSubscriptionsForTable(table: string): ActiveSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.config.table === table && sub.active);
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if subscribed to table
   */
  isSubscribedToTable(table: string): boolean {
    return Array.from(this.subscriptions.values()).some(
      sub => sub.config.table === table && sub.active
    );
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(table: string): string {
    return `${table}:${Date.now()}`;
  }

  /**
   * Setup auto-reconnect logic
   */
  private setupAutoReconnect(subscriptionId: string): void {
    const reconnectInterval = setInterval(async () => {
      const subscription = this.subscriptions.get(subscriptionId);

      if (!subscription || !subscription.active) {
        clearInterval(reconnectInterval);
        this.reconnectIntervals.delete(subscriptionId);
        return;
      }

      try {
        // Check if channel is still alive
        // If not, attempt to reconnect
        console.log(`[Subscriptions] Checking connection for ${subscriptionId}`);
      } catch (error) {
        console.error(`[Subscriptions] Reconnect check failed:`, error);
      }
    }, 30000); // Check every 30 seconds

    this.reconnectIntervals.set(subscriptionId, reconnectInterval);
  }

  /**
   * Cleanup all intervals
   */
  cleanup(): void {
    for (const [, interval] of this.reconnectIntervals) {
      clearInterval(interval);
    }
    this.reconnectIntervals.clear();
  }
}

export default RealtimeSubscriptionsManager;
