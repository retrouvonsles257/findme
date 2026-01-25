import { Signalement } from '../../../@types/database.types';
import { StatutValidation, PrioriteTraitement } from '../../../@types/enums.types';
import styles from './SignalementCard.module.css';

interface SignalementCardHeaderProps {
  signalement: Signalement;
}

export const SignalementCardHeader: React.FC<SignalementCardHeaderProps> = ({
  signalement
}) => {
  const getPriorityConfig = (priorite: PrioriteTraitement) => {
    const configs: Record<PrioriteTraitement, { label: string; color: string; icon: string }> = {
      [PrioriteTraitement.HAUTE]: {
        label: 'Haute',
        color: '#dc3545',
        icon: '🔴'
      },
      [PrioriteTraitement.MOYENNE]: {
        label: 'Moyenne',
        color: '#ffc107',
        icon: '🟡'
      },
      [PrioriteTraitement.BASSE]: {
        label: 'Basse',
        color: '#28a745',
        icon: '🟢'
      }
    };
    return configs[priorite] || configs[PrioriteTraitement.MOYENNE];
  };

  const getValidationStatusColor = (status: StatutValidation): string => {
    const colors: Record<StatutValidation, string> = {
      [StatutValidation.EN_ATTENTE]: '#6c757d',
      [StatutValidation.EN_VERIFICATION]: '#007bff',
      [StatutValidation.VALIDE]: '#28a745',
      [StatutValidation.INVALIDE]: '#dc3545',
      [StatutValidation.DOUBLONNE]: '#ffc107',
      [StatutValidation.SPAM]: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const priorityConfig = getPriorityConfig(signalement.priorite_traitement);

  return (
    <div className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.signalementNumber}>
          <span className={styles.numberLabel}>Signalement</span>
          <span className={styles.number}>
            {signalement.numero_signalement || `SIG-${signalement.id.slice(0, 8)}`}
          </span>
        </div>

        <div className={styles.badges}>
          <span
            className={styles.priorityBadge}
            style={{ backgroundColor: priorityConfig.color }}
          >
            {priorityConfig.icon} {priorityConfig.label}
          </span>

          <span
            className={styles.validationBadge}
            style={{ backgroundColor: getValidationStatusColor(signalement.statut_validation) }}
          >
            {signalement.statut_validation.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className={styles.observationInfo}>
        <div className={styles.observationDate}>
          <span className={styles.dateIcon}>📅</span>
          <span>Observé le {new Date(signalement.date_observation).toLocaleDateString('fr-FR')}</span>
        </div>

        {signalement.lieu_observation && (
          <div className={styles.observationLocation}>
            <span className={styles.locationIcon}>📍</span>
            <span>{signalement.lieu_observation}</span>
            {signalement.ville_observation && (
              <span className={styles.city}>, {signalement.ville_observation}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
