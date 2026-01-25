import { StatCardIcon } from './StatCardIcon';
import { StatCardValue } from './StatCardValue';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: string | React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = '#007bff',
  trend,
  className = ''
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={{ borderLeftColor: color }}
    >
      <div className={styles.header}>
        <StatCardIcon icon={icon} color={color} />
        <div className={styles.title}>{title}</div>
      </div>

      <StatCardValue value={value} trend={trend} />
    </div>
  );
};
