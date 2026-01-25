import styles from './PersonCardActions.module.css';

interface PersonCardActionsProps {
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReportFound?: () => void;
}

export const PersonCardActions: React.FC<PersonCardActionsProps> = ({
  onViewDetails,
  onEdit,
  onDelete,
  onReportFound
}) => {
  return (
    <div className={styles.actions}>
      {onViewDetails && (
        <button
          className={`${styles.actionButton} ${styles.viewButton}`}
          onClick={onViewDetails}
          title="Voir les détails complets"
        >
          👁️ Détails
        </button>
      )}

      {onEdit && (
        <button
          className={`${styles.actionButton} ${styles.editButton}`}
          onClick={onEdit}
          title="Modifier les informations"
        >
          ✏️ Modifier
        </button>
      )}

      {onReportFound && (
        <button
          className={`${styles.actionButton} ${styles.foundButton}`}
          onClick={onReportFound}
          title="Signaler comme retrouvé"
        >
          ✅ Retrouvé
        </button>
      )}

      {onDelete && (
        <button
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={onDelete}
          title="Supprimer cette personne"
        >
          🗑️ Supprimer
        </button>
      )}
    </div>
  );
};
