import { DossierDisparition } from '../../../@types/database.types';
import { DossierCardHeader } from './DossierCardHeader';
import { DossierCardDetails } from './DossierCardDetails';
import { DossierCardStatus } from './DossierCardStatus';
import { DossierCardActions } from './DossierCardActions';
import styles from './DossierCard.module.css';

interface DossierCardProps {
  dossier: DossierDisparition;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const DossierCard: React.FC<DossierCardProps> = ({
  dossier,
  onViewDetails,
  onEdit,
  onDelete,
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      <DossierCardHeader dossier={dossier} />

      <DossierCardDetails dossier={dossier} />

      <div className={styles.cardFooter}>
        <DossierCardStatus
          status={dossier.statut_dossier}
          niveauUrgence={dossier.niveau_urgence}
        />

        <DossierCardActions
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
