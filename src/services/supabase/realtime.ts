/**
 * =====================================================
 * RETROUVONSLES - Supabase Realtime Service
 * =====================================================
 * 
 * Service pour gérer les connexions Realtime
 * Updates, délétions, insertions en temps réel
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseClientManager, SupabaseRealtimeError } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any>;
  oldRecord?: Record<string, any>;
  errors?: any[];
}

export interface ChannelOptions {
  schema?: string;
  table?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export type EventCallback = (event: RealtimeEvent) => void;
export type PresenceCallback = (message: any) => void;
export type StatusCallback = (status: string) => void;

// ============================================
// REALTIME SERVICE
// ============================================

export class RealtimeService {
  private client: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();
  private static instance: RealtimeService | null = null;

  private constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealtimeService {
    if (!this.instance) {
      const client = SupabaseClientManager.getInstance();
      this.instance = new RealtimeService(client);
    }
    return this.instance;
  }

  // ============================================
  // CHANNEL MANAGEMENT
  // ============================================

  /**
   * Subscribe to database changes
   */
  subscribeToTable(
    table: string,
    options?: ChannelOptions
  ): {
    channelName: string;
    on: (callback: EventCallback) => RealtimeService;
    off: () => RealtimeService;
    unsubscribe: () => Promise<void>;
  } {
    const channelName = `${table}:${Date.now()}:${Math.random()}`;
    const schema = options?.schema || 'public';
    const event = options?.event || '*';

    // Store channel for later use
    this.channels.set(
      channelName,
      this.client
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: table },
          },
        })
        .on(
          'postgres_changes',
          {
            event: event as any,
            schema,
            table,
            filter: options?.filter,
          },
          (payload: any) => {
            this.handleDatabaseEvent({
              type: payload.eventType || 'UPDATE',
              table,
              schema,
              record: payload.new || payload.old,
              oldRecord: payload.old,
            });
          }
        )
    );

    const callbacks: EventCallback[] = [];

    return {
      channelName,
      on: (callback: EventCallback) => {
        callbacks.push(callback);
        // Register callback
        const existingChannel = this.channels.get(channelName);
        if (existingChannel) {
          // Update handler
        }
        return this;
      },
      off: () => {
        callbacks.length = 0;
        return this;
      },
      unsubscribe: async () => {
        const c = this.channels.get(channelName);
        if (c) {
          await this.client.removeChannel(c);
          this.channels.delete(channelName);
        }
      },
    };
  }

  /**
   * Subscribe to specific record changes
   */
  subscribeToRecord(
    table: string,
    recordId: string,
    callback: EventCallback
  ): { unsubscribe: () => Promise<void> } {
    const channelName = `${table}:${recordId}`;

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `id=eq.${recordId}`,
        },
        (payload: any) => {
          callback({
            type: payload.eventType,
            table,
            schema: 'public',
            record: payload.new || payload.old,
            oldRecord: payload.old,
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return {
      unsubscribe: async () => {
        await this.client.removeChannel(channel);
        this.channels.delete(channelName);
      },
    };
  }

  /**
   * Subscribe to presence updates
   */
  subscribeToPresence(
    channelName: string,
    callback: PresenceCallback
  ): { unsubscribe: () => Promise<void> } {
    const channel = this.client
      .channel(channelName, {
        config: {
          presence: {
            key: 'user',
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        callback(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        callback({ event: 'join', key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        callback({ event: 'leave', key, leftPresences });
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: 'online',
            timestamp: new Date(),
          });
        }
      });

    this.channels.set(channelName, channel);

    return {
      unsubscribe: async () => {
        await this.client.removeChannel(channel);
        this.channels.delete(channelName);
      },
    };
  }

  /**
   * Subscribe to broadcast messages
   */
  subscribeToBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): { unsubscribe: () => Promise<void> } {
    const channel = this.client
      .channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      })
      .on('broadcast', { event }, payload => {
        callback(payload.payload);
      })
      .subscribe();

    this.channels.set(`${channelName}:${event}`, channel);

    return {
      unsubscribe: async () => {
        await this.client.removeChannel(channel);
        this.channels.delete(`${channelName}:${event}`);
      },
    };
  }

  // ============================================
  // BROADCAST MESSAGING
  // ============================================

  /**
   * Broadcast message to channel
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: Record<string, any>
  ): Promise<void> {
    const channel = this.client.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Send presence state
   */
  async sendPresenceState(
    channelName: string,
    state: Record<string, any>
  ): Promise<void> {
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = this.client.channel(channelName, {
        config: {
          presence: { key: 'user' },
        },
      });
      await channel.subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.track(state);
  }

  /**
   * Update presence state
   */
  async updatePresenceState(
    channelName: string,
    updates: Record<string, any>
  ): Promise<void> {
    const channel = this.channels.get(channelName);

    if (!channel) {
      throw new SupabaseRealtimeError('Channel not subscribed');
    }

    await channel.track(updates);
  }

  /**
   * Leave presence
   */
  async leavePresence(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);

    if (channel) {
      await this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    for (const [, channel] of this.channels) {
      await this.client.removeChannel(channel);
    }
    this.channels.clear();
  }

  /**
   * Unsubscribe from channel by name
   */
  async unsubscribeChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Get active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get channel count
   */
  getChannelCount(): number {
    return this.channels.size;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Handle database event
   */
  private handleDatabaseEvent(event: RealtimeEvent): void {
    // Dispatch to listeners
    console.log('[Realtime Event]', event.type, event.table, event.record);
  }
}

export default RealtimeService;
