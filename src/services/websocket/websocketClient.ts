/**
 * =====================================================
 * RETROUVONSLES - WebSocket Client Configuration
 * =====================================================
 * 
 * Initialise et configure la connexion WebSocket
 * avec reconnexion automatique et gestion d'erreurs
 */

// ============================================
// TYPES
// ============================================

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageTimeout?: number;
}

export interface WebSocketMessage {
  id?: string;
  type: string;
  payload: any;
  timestamp?: number;
}

export interface WebSocketEvent {
  type: 'message' | 'open' | 'close' | 'error' | 'reconnect';
  data?: any;
  error?: Error;
}

// ============================================
// ERROR CLASSES
// ============================================

export class WebSocketError extends Error {
  code?: string;
  details?: string;

  constructor(message: string, code?: string, details?: string) {
    super(message);
    this.name = 'WebSocketError';
    this.code = code;
    this.details = details;
  }
}

export class WebSocketConnectionError extends WebSocketError {
  constructor(message: string = 'Failed to connect to WebSocket') {
    super(message, 'CONNECTION_ERROR');
    this.name = 'WebSocketConnectionError';
  }
}

export class WebSocketTimeoutError extends WebSocketError {
  constructor(message: string = 'WebSocket operation timed out') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'WebSocketTimeoutError';
  }
}

// ============================================
// WEBSOCKET CLIENT MANAGER
// ============================================

export class WebSocketClientManager {
  private static instance: WebSocketClientManager | null = null;
  private socket: WebSocket | null = null;
  private config: WebSocketConfig | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageListeners: Map<string, (msg: WebSocketMessage) => void> = new Map();
  private eventListeners: Map<string, (event: WebSocketEvent) => void> = new Map();
  private pendingMessages: Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timeout: NodeJS.Timeout }> = new Map();
  private messageQueue: WebSocketMessage[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketClientManager {
    if (!this.instance) {
      this.instance = new WebSocketClientManager();
    }
    return this.instance;
  }

  /**
   * Initialize WebSocket connection
   */
  initialize(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.config = {
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        messageTimeout: 30000,
        ...config,
      };

      this.connect(resolve, reject);
    });
  }

  /**
   * Establish WebSocket connection
   */
  private connect(resolve?: () => void, reject?: (e: Error) => void): void {
    if (!this.config) {
      const error = new WebSocketConnectionError('Config not initialized');
      reject?.(error);
      return;
    }

    try {
      this.socket = new WebSocket(this.config.url);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
        this.emit('open', { type: 'open' });
        resolve?.();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', { type: 'error', error: new Error('WebSocket error') });
      };

      this.socket.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('close', { type: 'close' });
        
        // Attempt reconnection
        if (this.reconnectAttempts < (this.config?.maxReconnectAttempts || 10)) {
          this.scheduleReconnect();
        } else {
          reject?.(new WebSocketConnectionError('Max reconnect attempts reached'));
        }
      };
    } catch (error) {
      const wsError = error instanceof Error ? error : new Error(String(error));
      reject?.(new WebSocketConnectionError(wsError.message));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = (this.config?.reconnectInterval || 5000) * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`[WebSocket] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.emit('reconnect', { type: 'reconnect' });
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
        this.sendRaw({ type: 'ping', timestamp: Date.now() });
      }
    }, this.config?.heartbeatInterval || 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WebSocketMessage;
      
      // Handle ping/pong
      if (message.type === 'ping') {
        this.sendRaw({ type: 'pong', timestamp: Date.now() });
        return;
      }
      
      if (message.type === 'pong') {
        return;
      }

      // Handle response to pending request
      if (message.id && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(message.id);
        
        if (message.type === 'error') {
          pending.reject(new WebSocketError(message.payload.message, message.payload.code));
        } else {
          pending.resolve(message.payload);
        }
        return;
      }

      // Emit to type listeners
      const typeListener = this.messageListeners.get(message.type);
      if (typeListener) {
        typeListener(message);
      }

      this.emit('message', { type: 'message', data: message });
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Send message and wait for response
   */
  async sendMessage(type: string, payload: any): Promise<any> {
    const messageId = this.generateId();
    const message: WebSocketMessage = {
      id: messageId,
      type,
      payload,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new WebSocketTimeoutError(`Message ${type} timed out`));
      }, this.config?.messageTimeout || 30000);

      this.pendingMessages.set(messageId, { resolve, reject, timeout });
      this.send(message);
    });
  }

  /**
   * Send raw message (no response expected)
   */
  send(message: WebSocketMessage): void {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
    }
  }

  /**
   * Send raw data
   */
  private sendRaw(data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Subscribe to message type
   */
  onMessage(type: string, callback: (msg: WebSocketMessage) => void): () => void {
    this.messageListeners.set(type, callback);
    
    // Return unsubscribe function
    return () => {
      this.messageListeners.delete(type);
    };
  }

  /**
   * Subscribe to event
   */
  onEvent(eventType: string, callback: (event: WebSocketEvent) => void): () => void {
    this.eventListeners.set(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(eventType);
    };
  }

  /**
   * Emit event
   */
  private emit(eventType: string, event: WebSocketEvent): void {
    const listener = this.eventListeners.get(eventType);
    if (listener) {
      listener(event);
    }
  }

  /**
   * Check if connected
   */
  isConnectedCheck(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Reset manager
   */
  reset(): void {
    this.close();
    this.messageListeners.clear();
    this.eventListeners.clear();
    this.reconnectAttempts = 0;
    WebSocketClientManager.instance = null;
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.pendingMessages.clear();
    this.messageQueue = [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.size,
      queuedMessages: this.messageQueue.length,
    };
  }
}

export default WebSocketClientManager;
