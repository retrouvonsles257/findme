import { StatutDossier, NiveauUrgence } from '../../../@types/enums.types';
import styles from './DossierCard.module.css';

interface DossierCardStatusProps {
  status: StatutDossier;
  niveauUrgence: NiveauUrgence;
}

export const DossierCardStatus: React.FC<DossierCardStatusProps> = ({
  status
}) => {
  const getStatusConfig = (status: StatutDossier) => {
    const configs: Record<StatutDossier, { label: string; color: string; icon: string }> = {
      [StatutDossier.EN_COURS]: {
        label: 'En cours',
        color: '#007bff',
        icon: '🔄'
      },
      [StatutDossier.RETROUVE_VIVANT]: {
        label: 'Retrouvé vivant',
        color: '#28a745',
        icon: '✅'
      },
      [StatutDossier.RETROUVE_DECEDE]: {
        label: 'Retrouvé décédé',
        color: '#6c757d',
        icon: '⚫'
      },
      [StatutDossier.SUSPENDU]: {
        label: 'Suspendu',
        color: '#ffc107',
        icon: '⏸️'
      },
      [StatutDossier.CLASSE_SANS_SUITE]: {
        label: 'Classé sans suite',
        color: '#6c757d',
        icon: '📁'
      },
      [StatutDossier.TRANSFERE]: {
        label: 'Transféré',
        color: '#17a2b8',
        icon: '↗️'
      }
    };
    return configs[status] || configs[StatutDossier.EN_COURS];
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className={styles.statusContainer}>
      <div
        className={styles.statusBadge}
        style={{ backgroundColor: statusConfig.color }}
      >
        <span className={styles.statusIcon}>{statusConfig.icon}</span>
        <span className={styles.statusLabel}>{statusConfig.label}</span>
      </div>
    </div>
  );
};
