/**
 * =====================================================
 * RETROUVONSLES - WebSocket Service Layer
 * =====================================================
 * 
 * Service applicatif pour WebSocket
 * Gère les notifications, messages, et activités en temps réel
 */

import { WebSocketClientManager } from './websocketClient';
import type { UUID } from '../../@types/database.types';

// ============================================
// TYPES
// ============================================

export interface Notification {
  id: string;
  type: 'alert' | 'message' | 'update' | 'match' | 'activity';
  title: string;
  content: string;
  userId?: UUID;
  personneId?: UUID;
  dossierId?: UUID;
  read: boolean;
  createdAt: number;
  actionUrl?: string;
}

export interface UserActivity {
  userId: UUID;
  userName: string;
  action: 'viewing' | 'editing' | 'commenting' | 'online' | 'offline';
  resourceType?: 'personne' | 'dossier' | 'organisation';
  resourceId?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: UUID;
  senderName: string;
  roomId: string;
  content: string;
  timestamp: number;
  edited?: boolean;
  attachments?: string[];
}

export interface TypingIndicator {
  userId: UUID;
  userName: string;
  roomId: string;
  isTyping: boolean;
}

export interface LocationUpdate {
  userId: UUID;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DossierUpdate {
  dossierId: UUID;
  type: 'created' | 'updated' | 'comment' | 'status_change';
  initiator: UUID;
  data: any;
  timestamp: number;
}

export interface PersonneMatch {
  matchId: string;
  personneId1: UUID;
  personneId2: UUID;
  score: number;
  reason: string;
  timestamp: number;
}

// ============================================
// WEBSOCKET SERVICE
// ============================================

export class WebSocketService {
  private client: WebSocketClientManager;
  private static instance: WebSocketService | null = null;
  private currentUserId: UUID | null = null;
  private currentRoomId: string | null = null;
  private notificationCallbacks: ((notification: Notification) => void)[] = [];
  private activityCallbacks: ((activity: UserActivity) => void)[] = [];
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private typingCallbacks: ((typing: TypingIndicator) => void)[] = [];
  private locationCallbacks: ((location: LocationUpdate) => void)[] = [];
  private matchCallbacks: ((match: PersonneMatch) => void)[] = [];
  private dossierCallbacks: ((update: DossierUpdate) => void)[] = [];

  private constructor() {
    this.client = WebSocketClientManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketService {
    if (!this.instance) {
      this.instance = new WebSocketService();
    }
    return this.instance;
  }

  /**
   * Initialize service
   */
  async initialize(userId: UUID, config: { url: string; reconnectInterval?: number }): Promise<void> {
    this.currentUserId = userId;
    
    await this.client.initialize({
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageTimeout: 30000,
    });

    this.setupListeners();
  }

  /**
   * Setup message listeners
   */
  private setupListeners(): void {
    // Notifications
    this.client.onMessage('notification', (msg) => {
      const notification = msg.payload as Notification;
      this.notificationCallbacks.forEach(cb => cb(notification));
    });

    // User activity
    this.client.onMessage('activity', (msg) => {
      const activity = msg.payload as UserActivity;
      this.activityCallbacks.forEach(cb => cb(activity));
    });

    // Chat messages
    this.client.onMessage('chat', (msg) => {
      const message = msg.payload as ChatMessage;
      this.messageCallbacks.forEach(cb => cb(message));
    });

    // Typing indicators
    this.client.onMessage('typing', (msg) => {
      const typing = msg.payload as TypingIndicator;
      this.typingCallbacks.forEach(cb => cb(typing));
    });

    // Location updates
    this.client.onMessage('location', (msg) => {
      const location = msg.payload as LocationUpdate;
      this.locationCallbacks.forEach(cb => cb(location));
    });

    // Personne matches
    this.client.onMessage('match', (msg) => {
      const match = msg.payload as PersonneMatch;
      this.matchCallbacks.forEach(cb => cb(match));
    });

    // Dossier updates
    this.client.onMessage('dossier_update', (msg) => {
      const update = msg.payload as DossierUpdate;
      this.dossierCallbacks.forEach(cb => cb(update));
    });

    // Connection events
    this.client.onEvent('open', () => {
      console.log('[WebSocket Service] Connected');
    });

    this.client.onEvent('close', () => {
      console.log('[WebSocket Service] Disconnected');
    });

    this.client.onEvent('error', (event) => {
      console.error('[WebSocket Service] Error:', event.error);
    });

    this.client.onEvent('reconnect', () => {
      console.log('[WebSocket Service] Attempting reconnection');
    });
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Subscribe to notifications
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Send notification
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    await this.client.sendMessage('send_notification', {
      ...notification,
      senderId: this.currentUserId,
    });
  }

  /**
   * Get notifications (load history)
   */
  async getNotifications(limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const response = await this.client.sendMessage('get_notifications', {
      limit,
      offset,
    });
    return response.notifications || [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.sendMessage('mark_notification_read', {
      notificationId,
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.client.sendMessage('delete_notification', {
      notificationId,
    });
  }

  // ============================================
  // USER ACTIVITY
  // ============================================

  /**
   * Subscribe to user activity
   */
  onUserActivity(callback: (activity: UserActivity) => void): () => void {
    this.activityCallbacks.push(callback);
    return () => {
      this.activityCallbacks = this.activityCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Broadcast user activity
   */
  async broadcastActivity(action: UserActivity['action'], resourceType?: string, resourceId?: string): Promise<void> {
    this.client.send({
      type: 'user_activity',
      payload: {
        userId: this.currentUserId,
        action,
        resourceType,
        resourceId,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get active users
   */
  async getActiveUsers(): Promise<UserActivity[]> {
    const response = await this.client.sendMessage('get_active_users', {});
    return response.users || [];
  }

  // ============================================
  // CHAT MESSAGES
  // ============================================

  /**
   * Subscribe to chat messages
   */
  onChatMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Join chat room
   */
  async joinRoom(roomId: string): Promise<void> {
    this.currentRoomId = roomId;
    await this.client.sendMessage('join_room', { roomId });
  }

  /**
   * Leave chat room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoomId) return;
    
    await this.client.sendMessage('leave_room', {
      roomId: this.currentRoomId,
    });
    this.currentRoomId = null;
  }

  /**
   * Send chat message
   */
  async sendMessage(content: string, attachments?: string[]): Promise<ChatMessage> {
    if (!this.currentRoomId) {
      throw new Error('Not in a room');
    }

    const response = await this.client.sendMessage('send_message', {
      roomId: this.currentRoomId,
      content,
      attachments,
    });
    return response as ChatMessage;
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, content: string): Promise<void> {
    await this.client.sendMessage('edit_message', {
      messageId,
      content,
      roomId: this.currentRoomId,
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.client.sendMessage('delete_message', {
      messageId,
      roomId: this.currentRoomId,
    });
  }

  /**
   * Get chat history
   */
  async getChatHistory(roomId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const response = await this.client.sendMessage('get_chat_history', {
      roomId,
      limit,
      offset,
    });
    return response.messages || [];
  }

  // ============================================
  // TYPING INDICATORS
  // ============================================

  /**
   * Subscribe to typing indicators
   */
  onTyping(callback: (typing: TypingIndicator) => void): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Broadcast typing indicator
   */
  broadcastTyping(isTyping: boolean): void {
    if (!this.currentRoomId) return;

    this.client.send({
      type: 'typing',
      payload: {
        userId: this.currentUserId,
        roomId: this.currentRoomId,
        isTyping,
        timestamp: Date.now(),
      },
    });
  }

  // ============================================
  // LOCATION TRACKING
  // ============================================

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: LocationUpdate) => void): () => void {
    this.locationCallbacks.push(callback);
    return () => {
      this.locationCallbacks = this.locationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Send location update
   */
  async sendLocation(latitude: number, longitude: number, accuracy: number = 0): Promise<void> {
    this.client.send({
      type: 'location_update',
      payload: {
        userId: this.currentUserId,
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get user locations
   */
  async getUserLocations(userIds: UUID[]): Promise<LocationUpdate[]> {
    const response = await this.client.sendMessage('get_locations', {
      userIds,
    });
    return response.locations || [];
  }

  // ============================================
  // PERSONNE MATCHING
  // ============================================

  /**
   * Subscribe to personne matches
   */
  onPersonneMatch(callback: (match: PersonneMatch) => void): () => void {
    this.matchCallbacks.push(callback);
    return () => {
      this.matchCallbacks = this.matchCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Trigger personne matching
   */
  async triggerMatching(personneId: UUID): Promise<PersonneMatch[]> {
    const response = await this.client.sendMessage('trigger_matching', {
      personneId,
    });
    return response.matches || [];
  }

  // ============================================
  // DOSSIER UPDATES
  // ============================================

  /**
   * Subscribe to dossier updates
   */
  onDossierUpdate(callback: (update: DossierUpdate) => void): () => void {
    this.dossierCallbacks.push(callback);
    return () => {
      this.dossierCallbacks = this.dossierCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify dossier change
   */
  async notifyDossierChange(dossierId: UUID, type: DossierUpdate['type'], data: any): Promise<void> {
    this.client.send({
      type: 'dossier_update',
      payload: {
        dossierId,
        type,
        initiator: this.currentUserId,
        data,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Subscribe to dossier (get updates)
   */
  async subscribeToDossier(dossierId: UUID): Promise<void> {
    await this.client.sendMessage('subscribe_dossier', {
      dossierId,
    });
  }

  /**
   * Unsubscribe from dossier
   */
  async unsubscribeFromDossier(dossierId: UUID): Promise<void> {
    await this.client.sendMessage('unsubscribe_dossier', {
      dossierId,
    });
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.client.isConnectedCheck();
  }

  /**
   * Get connection stats
   */
  getStats() {
    return this.client.getStats();
  }

  /**
   * Close connection
   */
  close(): void {
    this.client.close();
    this.notificationCallbacks = [];
    this.activityCallbacks = [];
    this.messageCallbacks = [];
    this.typingCallbacks = [];
    this.locationCallbacks = [];
    this.matchCallbacks = [];
    this.dossierCallbacks = [];
  }

  /**
   * Reset service
   */
  reset(): void {
    this.client.reset();
    this.currentUserId = null;
    this.currentRoomId = null;
    this.close();
  }
}

export default WebSocketService;
