import { Personne } from '../../../@types/database.types';
import { PersonCardImage } from './PersonCardImage';
import { PersonCardInfo } from './PersonCardInfo';
import { PersonCardActions } from './PersonCardActions';
import styles from './PersonCard.module.css';

interface PersonCardProps {
  personne: Personne;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReportFound?: () => void;
  className?: string;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  personne,
  onViewDetails,
  onEdit,
  onDelete,
  onReportFound,
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardContent}>
        <PersonCardImage
          photoUrl={personne.photo_principale}
          nomComplet={personne.nom_complet || `${personne.prenom} ${personne.nom}`}
          sexe={personne.sexe}
        />

        <PersonCardInfo personne={personne} />
      </div>

      <PersonCardActions
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onReportFound={onReportFound}
      />
    </div>
  );
};
