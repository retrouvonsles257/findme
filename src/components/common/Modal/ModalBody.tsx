import styles from './Modal.module.css';

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.modalBody} ${className}`}>
      {children}
    </div>
  );
};
