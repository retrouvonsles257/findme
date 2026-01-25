import styles from './Modal.module.css';

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.modalHeader} ${className}`}>
      {children}
    </div>
  );
};
