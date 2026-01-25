import { Signalement } from '../../../@types/database.types';
import { SignalementCardHeader } from './SignalementCardHeader';
import { SignalementCardContent } from './SignalementCardContent';
import { SignalementCardValidation } from './SignalementCardValidation';
import styles from './SignalementCard.module.css';

interface SignalementCardProps {
  signalement: Signalement;
  onClick?: () => void;
  onValidate?: (signalementId: string, status: string) => void;
  className?: string;
}

export const SignalementCard: React.FC<SignalementCardProps> = ({
  signalement,
  onClick,
  onValidate,
  className = ''
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <SignalementCardHeader signalement={signalement} />

      <SignalementCardContent signalement={signalement} />

      {onValidate && (
        <SignalementCardValidation
          signalement={signalement}
          onValidate={onValidate}
        />
      )}

      <div className={styles.cardFooter}>
        <div className={styles.meta}>
          <span className={styles.source}>
            Source: {signalement.source_signalement.replace('_', ' ')}
          </span>
          <span className={styles.date}>
            {new Date(signalement.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {signalement.score_pertinence && (
          <div className={styles.score}>
            Pertinence: {Math.round(signalement.score_pertinence * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};
