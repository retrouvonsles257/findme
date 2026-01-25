/**
 * =====================================================
 * RETROUVONSLES - WebSocket Provider
 * Fournisseur de WebSocket avec reconnexion automatique
 * =====================================================
 */

import React, { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import {
  WebSocketContext,
  WebSocketContextType,
  WebSocketMessage,
  ConnectionStatus,
} from './WebSocketContext';

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

type EventListener = (message: WebSocketMessage) => void;

/**
 * Provider de WebSocket
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  autoConnect = false,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<EventListener>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<(WebSocketMessage | string)[]>([]);

  // Connecter au WebSocket
  const connect = useCallback(async (wsUrl: string, protocols?: string | string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        setStatus('connecting');
        setUrl(wsUrl);
        setError(null);

        const ws = new WebSocket(wsUrl, protocols);

        ws.addEventListener('open', () => {
          console.log('[WebSocket] Connected to', wsUrl);
          setStatus('connected');
          setReconnectAttempts(0);
          wsRef.current = ws;

          // Envoyer les messages en attente
          while (messageQueueRef.current.length > 0) {
            const msg = messageQueueRef.current.shift();
            if (msg) {
              ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
            }
          }

          resolve();
        });

        ws.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            setMessageCount(prev => prev + 1);

            // Émettre le message à tous les listeners
            const listeners = listenersRef.current.get(message.type);
            if (listeners) {
              listeners.forEach(listener => {
                try {
                  listener(message);
                } catch (err) {
                  console.error('[WebSocket] Listener error:', err);
                }
              });
            }
          } catch (err) {
            console.error('[WebSocket] Failed to parse message:', err);
          }
        });

        ws.addEventListener('error', (event) => {
          console.error('[WebSocket] Error:', event);
          const error = new Error('WebSocket error');
          setError(error);
          setStatus('error');
          reject(error);
        });

        ws.addEventListener('close', () => {
          console.log('[WebSocket] Disconnected');
          setStatus('closed');
          wsRef.current = null;

          // Reconnecter automatiquement
          if (reconnectAttempts < maxReconnectAttempts) {
            setReconnectAttempts(prev => prev + 1);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect(wsUrl, protocols).catch(err => {
                console.error('[WebSocket] Reconnection failed:', err);
              });
            }, reconnectInterval);
          }
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to connect to WebSocket');
        setError(error);
        reject(error);
      }
    });
  }, [reconnectInterval, maxReconnectAttempts]);

  // Déconnecter du WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setStatus('disconnected');
    setUrl(null);
    setReconnectAttempts(0);
  }, []);

  // Envoyer un message
  const send = useCallback((message: WebSocketMessage | string) => {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      // Ajouter à la queue si pas connecté
      messageQueueRef.current.push(message);
    }
  }, []);

  // Reconnecter
  const reconnect = useCallback(async () => {
    disconnect();
    if (url) {
      setReconnectAttempts(0);
      return connect(url);
    }
  }, [url, disconnect, connect]);

  // Ajouter un listener
  const on = useCallback((eventType: string, listener: EventListener): (() => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }

    const listeners = listenersRef.current.get(eventType)!;
    listeners.add(listener);

    // Retourner une fonction de nettoyage
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        listenersRef.current.delete(eventType);
      }
    };
  }, []);

  // Retirer un listener
  const off = useCallback((eventType: string, listener: EventListener) => {
    const listeners = listenersRef.current.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        listenersRef.current.delete(eventType);
      }
    }
  }, []);

  // Émettre un message
  const emit = useCallback((eventType: string, message: WebSocketMessage) => {
    const listeners = listenersRef.current.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message);
        } catch (err) {
          console.error('[WebSocket] Listener error:', err);
        }
      });
    }
  }, []);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const contextValue: WebSocketContextType = {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    error,
    url,
    connect,
    disconnect,
    send,
    reconnect,
    on,
    off,
    emit,
    messageCount,
    reconnectAttempts,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
