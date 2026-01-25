import { Alerte } from '../../../@types/database.types';
import { AlerteCardContent } from './AlerteCardContent';
import { AlerteCardStatus } from './AlerteCardStatus';
import styles from './AlerteCard.module.css';

interface AlerteCardProps {
  alerte: Alerte;
  onClick?: () => void;
  className?: string;
}

export const AlerteCard: React.FC<AlerteCardProps> = ({
  alerte,
  onClick,
  className = ''
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.cardHeader}>
        <AlerteCardStatus status={alerte.statut_alerte} />
        <span className={styles.alertNumber}>
          {alerte.numero_alerte || `AL-${alerte.id.slice(0, 8)}`}
        </span>
      </div>

      <AlerteCardContent alerte={alerte} />

      <div className={styles.cardFooter}>
        <div className={styles.stats}>
          <span className={styles.stat}>
            👁️ {alerte.nombre_vues}
          </span>
          <span className={styles.stat}>
            📤 {alerte.nombre_partages}
          </span>
          <span className={styles.stat}>
            🚨 {alerte.nombre_signalements_generes}
          </span>
        </div>
        <div className={styles.date}>
          {new Date(alerte.date_diffusion).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
};
