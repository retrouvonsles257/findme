/**
 * =====================================================
 * RETROUVONSLES - WebSocket Context
 * Gestion centralisée des WebSockets
 * =====================================================
 */

import React, { createContext } from 'react';

/**
 * Type des messages WebSocket
 */
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * État de la connexion
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'closed';

/**
 * Interface pour l'état des WebSockets
 */
export interface WebSocketContextType {
  // État
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  url: string | null;

  // Actions
  connect: (url: string, protocols?: string | string[]) => Promise<void>;
  disconnect: () => void;
  send: (message: WebSocketMessage | string) => void;
  reconnect: () => Promise<void>;

  // Événements
  on: (eventType: string, listener: (message: WebSocketMessage) => void) => () => void;
  off: (eventType: string, listener: (message: WebSocketMessage) => void) => void;
  emit: (eventType: string, message: WebSocketMessage) => void;

  // Statistiques
  messageCount: number;
  reconnectAttempts: number;
}

/**
 * Crée le contexte des WebSockets
 */
export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte des WebSockets
 */
export const useWebSocket = (): WebSocketContextType => {
  const context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
