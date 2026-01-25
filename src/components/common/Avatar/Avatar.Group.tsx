import React from 'react';
import styles from './Avatar.module.css';
import { Avatar, AvatarSize } from './Avatar';
import type { FC } from 'react';

interface AvatarGroupProps {
  children: React.ReactNode;
  size?: AvatarSize;
  max?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  size = 'md',
  max,
  className = ''
}: AvatarGroupProps): React.ReactElement => {
  const avatarArray = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Avatar
  );

  const visibleAvatars = max ? avatarArray.slice(0, max) : avatarArray;
  const hiddenCount = max && avatarArray.length > max ? avatarArray.length - max : 0;

  return (
    <div className={`${styles.avatarGroup} ${className}`}>
      {visibleAvatars.map((avatar, index) => {
        if (!React.isValidElement(avatar)) return null;
        return (
          <div key={index} className={styles.avatarGroupItem}>
            {React.cloneElement(avatar, { size } as any)}
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <div className={`${styles.avatar} ${styles[size]} ${styles.avatarPlus}`}>
          <span className={styles.initials}>+{hiddenCount}</span>
        </div>
      )}
    </div>
  );
};

(Avatar as any).Group = AvatarGroup;
