/**
 * =====================================================
 * RETROUVONSLES - useCopyToClipboard Hook
 * Copies text to clipboard with success/error handling
 * =====================================================
 */

import { useState, useCallback } from 'react';

export interface UseCopyToClipboardResult {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

export const useCopyToClipboard = (): UseCopyToClipboardResult => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopied(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, reset };
};
