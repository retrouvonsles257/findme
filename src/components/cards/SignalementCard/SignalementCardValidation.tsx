import { Signalement } from '../../../@types/database.types';
import { StatutValidation } from '../../../@types/enums.types';
import styles from './SignalementCard.module.css';

interface SignalementCardValidationProps {
  signalement: Signalement;
  onValidate: (signalementId: string, status: StatutValidation) => void;
}

export const SignalementCardValidation: React.FC<SignalementCardValidationProps> = ({
  signalement,
  onValidate
}) => {
  const validationOptions: { value: StatutValidation; label: string; color: string }[] = [
    { value: StatutValidation.VALIDE, label: 'Valider', color: '#28a745' },
    { value: StatutValidation.INVALIDE, label: 'Invalider', color: '#dc3545' },
    { value: StatutValidation.DOUBLONNE, label: 'Doublon', color: '#ffc107' },
    { value: StatutValidation.SPAM, label: 'Spam', color: '#6c757d' }
  ];

  const canValidate = signalement.statut_validation === StatutValidation.EN_ATTENTE ||
                     signalement.statut_validation === StatutValidation.EN_VERIFICATION;

  if (!canValidate) {
    return (
      <div className={styles.validation}>
        <div className={styles.validationStatus}>
          <span className={styles.statusIcon}>
            {signalement.statut_validation === StatutValidation.VALIDE ? '✅' :
             signalement.statut_validation === StatutValidation.INVALIDE ? '❌' :
             signalement.statut_validation === StatutValidation.DOUBLONNE ? '🔄' :
             signalement.statut_validation === StatutValidation.SPAM ? '🚫' : '⏳'}
          </span>
          <span className={styles.statusText}>
            {signalement.statut_validation === StatutValidation.VALIDE ? 'Validé' :
             signalement.statut_validation === StatutValidation.INVALIDE ? 'Invalidé' :
             signalement.statut_validation === StatutValidation.DOUBLONNE ? 'Doublon' :
             signalement.statut_validation === StatutValidation.SPAM ? 'Spam' :
             'En attente'}
          </span>
        </div>

        {signalement.commentaire_verification && (
          <div className={styles.verificationComment}>
            <span className={styles.commentIcon}>💬</span>
            <span>{signalement.commentaire_verification}</span>
          </div>
        )}

        {signalement.transmis_autorites && (
          <div className={styles.transmissionInfo}>
            <span className={styles.transmissionIcon}>📤</span>
            <span>Transmis aux autorités</span>
            {signalement.autorite_destinataire && (
              <span className={styles.authority}>({signalement.autorite_destinataire})</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.validation}>
      <div className={styles.validationActions}>
        <span className={styles.actionsLabel}>Actions de validation:</span>
        <div className={styles.actionButtons}>
          {validationOptions.map(option => (
            <button
              key={option.value}
              className={styles.validationButton}
              style={{ backgroundColor: option.color }}
              onClick={(e) => {
                e.stopPropagation();
                onValidate(signalement.id, option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
