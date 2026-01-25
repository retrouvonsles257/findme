/**
 * =====================================================
 * RETROUVONSLES - WebSocket Services Barrel Export
 * =====================================================
 * 
 * Consolidation de tous les services WebSocket
 * Point d'entrée principal pour l'utilisation
 */

// ============================================
// IMPORTS
// ============================================

import { WebSocketClientManager } from './websocketClient';
import { WebSocketService } from './websocketService';

// ============================================
// CLIENT & CONFIGURATION
// ============================================

export {
  WebSocketClientManager,
  WebSocketError,
  WebSocketConnectionError,
  WebSocketTimeoutError,
  type WebSocketConfig,
  type WebSocketMessage,
  type WebSocketEvent,
} from './websocketClient';

// ============================================
// WEBSOCKET SERVICE
// ============================================

export {
  WebSocketService,
  type Notification,
  type UserActivity,
  type ChatMessage,
  type TypingIndicator,
  type LocationUpdate,
  type DossierUpdate,
  type PersonneMatch,
} from './websocketService';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Initialize WebSocket service
 */
export async function initializeWebSocketService(
  userId: string,
  wsUrl: string,
  reconnectInterval?: number
) {
  const service = WebSocketService.getInstance();
  await service.initialize(userId as any, {
    url: wsUrl,
    reconnectInterval,
  });
  return service;
}

/**
 * Get WebSocket service instance
 */
export function getWebSocketService() {
  return WebSocketService.getInstance();
}

// ============================================
// DEFAULT EXPORTS
// ============================================

const webSocketServicesExport = {
  WebSocketClientManager,
  WebSocketService,
  initializeWebSocketService,
  getWebSocketService,
};

export default webSocketServicesExport;
