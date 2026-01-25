import { useEffect, useCallback, useRef } from 'react';

export interface UseNotificationSubscriptionResult {
  subscribe: (callback: (data: any) => void) => () => void;
  isConnected: boolean;
}

/**
 * useNotificationSubscription hook - subscribes to real-time notifications
 */
export const useNotificationSubscription = (): UseNotificationSubscriptionResult => {
  const callbacksRef = useRef<Set<(data: any) => void>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // TODO: Implement WebSocket connection for real-time notifications
    const connectWebSocket = () => {
      try {
        // const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');
        // wsRef.current = ws;

        // ws.onopen = () => {
        //   isConnectedRef.current = true;
        // };

        // ws.onmessage = (event) => {
        //   const data = JSON.parse(event.data);
        //   callbacksRef.current.forEach(callback => callback(data));
        // };

        // ws.onclose = () => {
        //   isConnectedRef.current = false;
        // };
      } catch (error) {
        console.error('Failed to connect to notification WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const subscribe = useCallback((callback: (data: any) => void) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  return {
    subscribe,
    isConnected: isConnectedRef.current,
  };
};
