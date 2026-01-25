import { Signalement } from '../../../@types/database.types';
import { NiveauCertitude, DistanceObservation } from '../../../@types/enums.types';
import styles from './SignalementCard.module.css';

interface SignalementCardContentProps {
  signalement: Signalement;
}

export const SignalementCardContent: React.FC<SignalementCardContentProps> = ({
  signalement
}) => {
  const getCertaintyLabel = (certitude: NiveauCertitude): string => {
    const labels: Record<NiveauCertitude, string> = {
      [NiveauCertitude.CERTAIN]: 'Certain',
      [NiveauCertitude.TRES_PROBABLE]: 'Très probable',
      [NiveauCertitude.PROBABLE]: 'Probable',
      [NiveauCertitude.INCERTAIN]: 'Incertain',
      [NiveauCertitude.DOUTE]: 'Doute'
    };
    return labels[certitude] || certitude;
  };

  const getDistanceLabel = (distance: DistanceObservation | null): string => {
    if (!distance) return 'Non spécifiée';

    const labels: Record<DistanceObservation, string> = {
      [DistanceObservation.TRES_PROCHE]: 'Très proche',
      [DistanceObservation.PROCHE]: 'Proche',
      [DistanceObservation.MOYENNE]: 'Moyenne',
      [DistanceObservation.LOINTAINE]: 'Lointaine'
    };
    return labels[distance] || distance;
  };

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.content}>
      <div className={styles.description}>
        <h4 className={styles.descriptionTitle}>Description de l'observation</h4>
        <p className={styles.descriptionText}>
          {truncateText(signalement.description)}
        </p>
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Niveau de certitude:</span>
          <span className={styles.detailValue}>
            {getCertaintyLabel(signalement.niveau_certitude)}
          </span>
        </div>

        {signalement.distance_observation && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Distance d'observation:</span>
            <span className={styles.detailValue}>
              {getDistanceLabel(signalement.distance_observation)}
            </span>
          </div>
        )}

        {signalement.duree_observation && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Durée d'observation:</span>
            <span className={styles.detailValue}>
              {signalement.duree_observation}
            </span>
          </div>
        )}

        {signalement.etat_personne_observee && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>État de la personne:</span>
            <span className={styles.detailValue}>
              {signalement.etat_personne_observee}
            </span>
          </div>
        )}

        {signalement.contexte_observation && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Contexte:</span>
            <span className={styles.detailValue}>
              {truncateText(signalement.contexte_observation, 80)}
            </span>
          </div>
        )}

        {signalement.moyen_deplacement && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Moyen de déplacement:</span>
            <span className={styles.detailValue}>
              {signalement.moyen_deplacement}
            </span>
          </div>
        )}

        {signalement.direction_deplacement && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Direction:</span>
            <span className={styles.detailValue}>
              {signalement.direction_deplacement}
            </span>
          </div>
        )}
      </div>

      {signalement.accompagnement && (
        <div className={styles.accompaniment}>
          <span className={styles.accompanimentIcon}>👥</span>
          <span>Accompagnement: {signalement.accompagnement}</span>
        </div>
      )}
    </div>
  );
};
