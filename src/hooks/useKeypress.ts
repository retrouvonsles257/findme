/**
 * =====================================================
 * RETROUVONSLES - useKeypress Hook
 * Detects key presses and fires callback
 * =====================================================
 */

import { useEffect, useCallback } from 'react';

export const useKeypress = (targetKey: string, callback: () => void) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === targetKey || event.code === targetKey) {
        callback();
      }
    },
    [targetKey, callback]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};

export const useKeyboardShortcut = (
  keys: string[],
  callback: () => void,
  ctrl = false,
  shift = false,
  alt = false
) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const allKeysPressed = keys.every((key) =>
        event.key.toLowerCase() === key.toLowerCase() ||
        event.code.toLowerCase() === key.toLowerCase()
      );

      const modifiersMatch =
        event.ctrlKey === ctrl && event.shiftKey === shift && event.altKey === alt;

      if (allKeysPressed && modifiersMatch) {
        event.preventDefault();
        callback();
      }
    },
    [keys, callback, ctrl, shift, alt]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};
