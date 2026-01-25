/**
 * =====================================================
 * RETROUVONSLES - usePrevious Hook
 * Stores previous value of a prop or state
 * =====================================================
 */

import { useEffect, useRef } from 'react';

export const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
