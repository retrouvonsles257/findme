import styles from './Card.module.css';

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.cardBody} ${className}`}>
      {children}
    </div>
  );
};
