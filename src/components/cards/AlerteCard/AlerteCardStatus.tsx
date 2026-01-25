import { StatutAlerte } from '../../../@types/enums.types';
import styles from './AlerteCard.module.css';

interface AlerteCardStatusProps {
  status: StatutAlerte;
}

export const AlerteCardStatus: React.FC<AlerteCardStatusProps> = ({ status }) => {
  const getStatusConfig = (status: StatutAlerte) => {
    const configs: Record<StatutAlerte, { label: string; color: string; icon: string }> = {
      [StatutAlerte.BROUILLON]: {
        label: 'Brouillon',
        color: '#6c757d',
        icon: '📝'
      },
      [StatutAlerte.PROGRAMMEE]: {
        label: 'Programmée',
        color: '#007bff',
        icon: '⏰'
      },
      [StatutAlerte.EN_COURS]: {
        label: 'En cours',
        color: '#28a745',
        icon: '🔄'
      },
      [StatutAlerte.TERMINEE]: {
        label: 'Terminée',
        color: '#17a2b8',
        icon: '✅'
      },
      [StatutAlerte.ANNULEE]: {
        label: 'Annulée',
        color: '#dc3545',
        icon: '❌'
      }
    };
    return configs[status] || configs[StatutAlerte.BROUILLON];
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={styles.status}
      style={{ backgroundColor: config.color }}
    >
      <span className={styles.statusIcon}>{config.icon}</span>
      <span className={styles.statusLabel}>{config.label}</span>
    </div>
  );
};
