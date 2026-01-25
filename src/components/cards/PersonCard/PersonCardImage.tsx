import { Sexe } from '../../../@types/enums.types';
import styles from './PersonCard.module.css';

interface PersonCardImageProps {
  photoUrl: string | null;
  nomComplet: string | null;
  sexe: Sexe;
}

export const PersonCardImage: React.FC<PersonCardImageProps> = ({
  photoUrl,
  nomComplet,
  sexe
}) => {
  const getDefaultAvatar = (sexe: Sexe): string => {
    switch (sexe) {
      case Sexe.MASCULIN:
        return '👨';
      case Sexe.FEMININ:
        return '👩';
      default:
        return '👤';
    }
  };

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.imageContainer}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Photo de ${nomComplet || 'personne inconnue'}`}
          className={styles.photo}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}

      <div
        className={`${styles.fallbackAvatar} ${photoUrl ? styles.hidden : ''}`}
      >
        <span className={styles.avatarEmoji}>
          {getDefaultAvatar(sexe)}
        </span>
        <span className={styles.avatarInitials}>
          {getInitials(nomComplet)}
        </span>
      </div>
    </div>
  );
};
