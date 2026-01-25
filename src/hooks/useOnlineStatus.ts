/**
 * =====================================================
 * RETROUVONSLES - useOnlineStatus Hook
 * Detects online/offline status
 * =====================================================
 */

import { useState, useEffect } from 'react';

export interface UseOnlineStatusResult {
  isOnline: boolean;
}

export const useOnlineStatus = (): UseOnlineStatusResult => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};
