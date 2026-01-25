/**
 * =====================================================
 * RETROUVONSLES - useWebsocket Hook
 * Manages WebSocket connections with auto-reconnect
 * =====================================================
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseWebsocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseWebsocketResult {
  isConnected: boolean;
  send: (data: any) => void;
  close: () => void;
}

export const useWebsocket = (options: UseWebsocketOptions): UseWebsocketResult => {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onError,
    onOpen,
    onClose,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          onMessage?.(event.data);
        }
      };

      ws.onerror = (error) => {
        setIsConnected(false);
        onError?.(error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onClose?.();

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onError, onOpen, onClose]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      close();
    };
  }, [connect, close]);

  return {
    isConnected,
    send,
    close,
  };
};
