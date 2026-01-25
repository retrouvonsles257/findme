import styles from './Card.module.css';

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.cardHeader} ${className}`}>
      {children}
    </div>
  );
};
