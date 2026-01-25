import styles from './Alert.module.css';

export type AlertVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'primary',
  title,
  children,
  onClose,
  dismissible = false,
  className = ''
}) => {
  const alertClasses = [
    styles.alert,
    styles[variant],
    dismissible && styles.dismissible,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={alertClasses} role="alert">
      {title && <div className={styles.alertTitle}>{title}</div>}
      <div className={styles.alertContent}>{children}</div>
      {dismissible && onClose && (
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer l'alerte"
        >
          ×
        </button>
      )}
    </div>
  );
};
