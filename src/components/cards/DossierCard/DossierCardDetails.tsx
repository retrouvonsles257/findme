import { DossierDisparition } from '../../../@types/database.types';
import { TypeDisparition } from '../../../@types/enums.types';
import styles from './DossierCard.module.css';

interface DossierCardDetailsProps {
  dossier: DossierDisparition;
}

export const DossierCardDetails: React.FC<DossierCardDetailsProps> = ({ dossier }) => {
  const getDisappearanceTypeLabel = (type: TypeDisparition): string => {
    const labels: Record<TypeDisparition, string> = {
      [TypeDisparition.FUGUE]: 'Fugue',
      [TypeDisparition.ENLEVEMENT_PRESUME]: 'Enlèvement présumé',
      [TypeDisparition.ACCIDENT]: 'Accident',
      [TypeDisparition.CONFLIT_ARME]: 'Conflit armé',
      [TypeDisparition.MIGRATION]: 'Migration',
      [TypeDisparition.CATASTROPHE_NATURELLE]: 'Catastrophe naturelle',
      [TypeDisparition.DISPARITION_VOLONTAIRE]: 'Disparition volontaire',
      [TypeDisparition.INCONNUE]: 'Cause inconnue',
      [TypeDisparition.AUTRE]: 'Autre'
    };
    return labels[type] || type;
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.details}>
      <div className={styles.typeSection}>
        <span className={styles.typeLabel}>Type:</span>
        <span className={styles.typeValue}>
          {getDisappearanceTypeLabel(dossier.type_disparition)}
        </span>
      </div>

      <div className={styles.circumstances}>
        <p className={styles.circumstancesText}>
          {truncateText(dossier.circonstances)}
        </p>
      </div>

      {dossier.derniere_activite_connue && (
        <div className={styles.lastActivity}>
          <span className={styles.activityIcon}>🕐</span>
          <span className={styles.activityText}>
            Dernière activité: {truncateText(dossier.derniere_activite_connue, 80)}
          </span>
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statIcon}>👁️</span>
          <span className={styles.statValue}>{dossier.nombre_vues_fiche}</span>
          <span className={styles.statLabel}>vues</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statIcon}>📢</span>
          <span className={styles.statValue}>{dossier.nombre_alertes_diffusees}</span>
          <span className={styles.statLabel}>alertes</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statIcon}>🚨</span>
          <span className={styles.statValue}>{dossier.nombre_signalements}</span>
          <span className={styles.statLabel}>signalements</span>
        </div>
      </div>
    </div>
  );
};
