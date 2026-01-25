/**
 * =====================================================
 * RETROUVONSLES - useThrottle Hook
 * Throttles a value with customizable delay
 * =====================================================
 */

import { useState, useRef, useEffect } from 'react';

export const useThrottle = <T,>(value: T, delay = 500): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};
