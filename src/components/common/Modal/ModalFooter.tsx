import styles from './Modal.module.css';

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.modalFooter} ${className}`}>
      {children}
    </div>
  );
};
