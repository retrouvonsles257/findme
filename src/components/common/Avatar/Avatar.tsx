import React from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  initials,
  size = 'md',
  className = '',
  onClick
}) => {
  const avatarClasses = [
    styles.avatar,
    styles[size],
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={avatarClasses}
        onClick={handleClick}
      />
    );
  }

  return (
    <div
      className={avatarClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {initials && <span className={styles.initials}>{initials}</span>}
    </div>
  );
};
