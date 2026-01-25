import { Personne } from '../../../@types/database.types';
import { Sexe, StatutIdentite, FiabiliteInformations } from '../../../@types/enums.types';
import styles from './PersonCard.module.css';

interface PersonCardInfoProps {
  personne: Personne;
}

export const PersonCardInfo: React.FC<PersonCardInfoProps> = ({ personne }) => {
  const getSexeLabel = (sexe: Sexe): string => {
    const labels: Record<Sexe, string> = {
      [Sexe.MASCULIN]: 'Homme',
      [Sexe.FEMININ]: 'Femme',
      [Sexe.INCONNU]: 'Inconnu',
      [Sexe.NON_PRECISE]: 'Non précisé'
    };
    return labels[sexe] || sexe;
  };

  const getStatutIdentiteLabel = (statut: StatutIdentite): string => {
    const labels: Record<StatutIdentite, string> = {
      [StatutIdentite.IDENTIFIE]: 'Identifié',
      [StatutIdentite.PARTIELLEMENT_IDENTIFIE]: 'Partiellement identifié',
      [StatutIdentite.NON_IDENTIFIE]: 'Non identifié'
    };
    return labels[statut] || statut;
  };

  const getFiabiliteLabel = (fiabilite: FiabiliteInformations): string => {
    const labels: Record<FiabiliteInformations, string> = {
      [FiabiliteInformations.CONFIRMEE]: 'Confirmée',
      [FiabiliteInformations.PROBABLE]: 'Probable',
      [FiabiliteInformations.INCERTAINE]: 'Incertaine'
    };
    return labels[fiabilite] || fiabilite;
  };

  const calculateAge = (): string => {
    if (personne.date_naissance) {
      const birthDate = new Date(personne.date_naissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return `${age} ans`;
    }

    if (personne.age_estime_min && personne.age_estime_max) {
      if (personne.age_estime_min === personne.age_estime_max) {
        return `${personne.age_estime_min} ans`;
      }
      return `${personne.age_estime_min}-${personne.age_estime_max} ans`;
    }

    if (personne.age_estime_min) {
      return `Min. ${personne.age_estime_min} ans`;
    }

    if (personne.age_estime_max) {
      return `Max. ${personne.age_estime_max} ans`;
    }

    return 'Âge inconnu';
  };

  const getFiabiliteColor = (fiabilite: FiabiliteInformations): string => {
    switch (fiabilite) {
      case FiabiliteInformations.CONFIRMEE:
        return '#28a745';
      case FiabiliteInformations.PROBABLE:
        return '#ffc107';
      case FiabiliteInformations.INCERTAINE:
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className={styles.info}>
      <div className={styles.header}>
        <h3 className={styles.name}>
          {personne.nom_complet || `${personne.prenom || ''} ${personne.nom || ''}`.trim() || 'Personne inconnue'}
        </h3>
        {personne.alias && (
          <p className={styles.alias}>"{personne.alias}"</p>
        )}
      </div>

      <div className={styles.basicInfo}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Sexe:</span>
          <span className={styles.value}>{getSexeLabel(personne.sexe)}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Âge:</span>
          <span className={styles.value}>{calculateAge()}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Nationalité:</span>
          <span className={styles.value}>{personne.nationalite}</span>
        </div>
      </div>

      {personne.description_physique && (
        <div className={styles.physicalDescription}>
          <span className={styles.label}>Description:</span>
          <p className={styles.description}>
            {personne.description_physique.length > 100
              ? `${personne.description_physique.substring(0, 100)}...`
              : personne.description_physique}
          </p>
        </div>
      )}

      <div className={styles.statusBadges}>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: getFiabiliteColor(personne.fiabilite_informations) }}
        >
          {getFiabiliteLabel(personne.fiabilite_informations)}
        </span>

        <span className={styles.statusBadge}>
          {getStatutIdentiteLabel(personne.statut_identite)}
        </span>
      </div>

      <div className={styles.lastUpdated}>
        Mis à jour: {new Date(personne.updated_at).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
};
