import styles from './DossierCard.module.css';

interface DossierCardActionsProps {
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const DossierCardActions: React.FC<DossierCardActionsProps> = ({
  onViewDetails,
  onEdit,
  onDelete
}) => {
  return (
    <div className={styles.actions}>
      {onViewDetails && (
        <button
          className={`${styles.actionButton} ${styles.viewButton}`}
          onClick={onViewDetails}
          title="Voir les détails"
        >
          👁️ Voir
        </button>
      )}

      {onEdit && (
        <button
          className={`${styles.actionButton} ${styles.editButton}`}
          onClick={onEdit}
          title="Modifier le dossier"
        >
          ✏️ Modifier
        </button>
      )}

      {onDelete && (
        <button
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={onDelete}
          title="Supprimer le dossier"
        >
          🗑️ Supprimer
        </button>
      )}
    </div>
  );
};
