import { DossierDisparition } from '../../../@types/database.types';
import { NiveauUrgence } from '../../../@types/enums.types';
import styles from './DossierCard.module.css';

interface DossierCardHeaderProps {
  dossier: DossierDisparition;
}

export const DossierCardHeader: React.FC<DossierCardHeaderProps> = ({ dossier }) => {
  const getUrgencyColor = (niveau: NiveauUrgence): string => {
    const colors: Record<NiveauUrgence, string> = {
      [NiveauUrgence.CRITIQUE]: '#dc3545',
      [NiveauUrgence.URGENT]: '#fd7e14',
      [NiveauUrgence.NORMAL]: '#ffc107',
      [NiveauUrgence.FAIBLE]: '#28a745'
    };
    return colors[niveau] || colors[NiveauUrgence.NORMAL];
  };

  const getUrgencyLabel = (niveau: NiveauUrgence): string => {
    const labels: Record<NiveauUrgence, string> = {
      [NiveauUrgence.CRITIQUE]: 'Critique',
      [NiveauUrgence.URGENT]: 'Urgent',
      [NiveauUrgence.NORMAL]: 'Normal',
      [NiveauUrgence.FAIBLE]: 'Faible'
    };
    return labels[niveau] || 'Normal';
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.caseNumber}>
          <span className={styles.numberLabel}>Dossier</span>
          <span className={styles.number}>{dossier.numero_dossier}</span>
        </div>

        <div
          className={styles.urgencyBadge}
          style={{ backgroundColor: getUrgencyColor(dossier.niveau_urgence) }}
        >
          {getUrgencyLabel(dossier.niveau_urgence)}
        </div>
      </div>

      <div className={styles.disappearanceInfo}>
        <div className={styles.dateInfo}>
          <span className={styles.dateLabel}>Disparition:</span>
          <span className={styles.date}>{formatDate(dossier.date_disparition)}</span>
        </div>

        {dossier.lieu_disparition && (
          <div className={styles.locationInfo}>
            <span className={styles.locationIcon}>📍</span>
            <span className={styles.location}>
              {dossier.lieu_disparition}
              {dossier.ville_disparition && `, ${dossier.ville_disparition}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
