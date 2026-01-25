/**
 * =====================================================
 * RETROUVONSLES - useSessionStorage Hook
 * Manages state with sessionStorage persistence
 * =====================================================
 */

import { useState, useCallback } from 'react';

export interface UseSessionStorageResult<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export const useSessionStorage = <T,>(
  key: string,
  initialValue: T
): UseSessionStorageResult<T> => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return initialValue;
    }
  });

  const setValueWithStorage = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error writing to sessionStorage:', error);
      }
    },
    [key, value]
  );

  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }, [key, initialValue]);

  return {
    value,
    setValue: setValueWithStorage,
    removeValue,
  };
};
