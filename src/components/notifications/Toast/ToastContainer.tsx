import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast, ToastProps } from './Toast';
import styles from './ToastContainer.module.css';

export interface ToastOptions
  extends Omit<ToastProps, 'id'> {}

export interface ToastContextType {
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook to use Toast notifications
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};

interface ToastItem extends ToastProps {
  id: string;
}

interface ToastContainerProps {
  /**
   * Position of the toast container
   * @default 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

  /**
   * Maximum number of toasts to show at once
   * @default 5
   */
  maxToasts?: number;
}

/**
 * Toast Provider and Container Component
 */
const ToastContainerComponent: React.FC<ToastContainerProps & { children: React.ReactNode }> = ({
  position = 'bottom-right',
  maxToasts = 5,
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounterRef = useRef(0);

  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${++idCounterRef.current}`;

      const newToast: ToastItem = {
        id,
        ...options,
        onClose: () => {
          options.onClose?.();
          removeToast(id);
        },
      };

      setToasts((prevToasts) => {
        const updatedToasts = [...prevToasts, newToast];
        // Keep only the last maxToasts items
        return updatedToasts.slice(-maxToasts);
      });

      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`${styles.container} ${styles[`position-${position}`]}`}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const ToastContainer = ToastContainerComponent;
