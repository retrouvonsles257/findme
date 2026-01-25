import { Alerte } from '../../../@types/database.types';
import { TypeAlerte } from '../../../@types/enums.types';
import styles from './AlerteCard.module.css';

interface AlerteCardContentProps {
  alerte: Alerte;
}

export const AlerteCardContent: React.FC<AlerteCardContentProps> = ({ alerte }) => {
  const getAlertTypeLabel = (type: TypeAlerte): string => {
    const labels: Record<TypeAlerte, string> = {
      [TypeAlerte.AMBER_ALERT]: '🚨 Alerte Amber',
      [TypeAlerte.DISPARITION_ENFANT]: '👶 Disparition Enfant',
      [TypeAlerte.DISPARITION_ADULTE_VULNERABLE]: '🧓 Disparition Adulte Vulnérable',
      [TypeAlerte.DISPARITION_STANDARD]: '👤 Disparition Standard',
      [TypeAlerte.MISE_A_JOUR]: '📝 Mise à jour',
      [TypeAlerte.PERSONNE_RETROUVEE]: '✅ Personne Retrouvée'
    };
    return labels[type] || type;
  };

  const getUrgencyColor = (niveau: number): string => {
    if (niveau >= 8) return '#dc3545'; // Rouge
    if (niveau >= 6) return '#fd7e14'; // Orange
    if (niveau >= 4) return '#ffc107'; // Jaune
    return '#28a745'; // Vert
  };

  return (
    <div className={styles.content}>
      <div className={styles.alertType}>
        <span
          className={styles.typeBadge}
          style={{ backgroundColor: getUrgencyColor(alerte.niveau_urgence_min) }}
        >
          {getAlertTypeLabel(alerte.type_alerte)}
        </span>
      </div>

      <h3 className={styles.title}>{alerte.titre}</h3>

      <p className={styles.message}>
        {alerte.message_court || alerte.message}
      </p>

      {alerte.rayon_km > 0 && (
        <div className={styles.location}>
          <span className={styles.locationIcon}>📍</span>
          <span>Rayon: {alerte.rayon_km} km</span>
          {alerte.latitude_centre && alerte.longitude_centre && (
            <span className={styles.coordinates}>
              ({alerte.latitude_centre.toFixed(4)}, {alerte.longitude_centre.toFixed(4)})
            </span>
          )}
        </div>
      )}

      {alerte.date_expiration && (
        <div className={styles.expiration}>
          <span className={styles.expirationIcon}>⏰</span>
          <span>Expire le {new Date(alerte.date_expiration).toLocaleDateString('fr-FR')}</span>
        </div>
      )}
    </div>
  );
};
