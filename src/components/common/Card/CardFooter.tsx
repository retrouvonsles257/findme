import styles from './Card.module.css';

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.cardFooter} ${className}`}>
      {children}
    </div>
  );
};
