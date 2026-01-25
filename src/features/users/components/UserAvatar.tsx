/**
 * =====================================================
 * UserAvatar Component
 * =====================================================
 */

import React from 'react';
import type { UserAvatarProps } from '../types';
import { getUserInitials } from '../services';

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  clickable = false,
}) => {
  const sizeMap = {
    small: '32px',
    medium: '48px',
    large: '64px',
  };

  const initials = getUserInitials(user);

  const avatarStyle: React.CSSProperties = {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0056b3',
    color: 'white',
    fontSize: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
    fontWeight: 'bold',
    cursor: clickable ? 'pointer' : 'default',
  };

  if (user.avatar_url || user.photo_profil) {
    return (
      <img
        src={user.avatar_url || user.photo_profil}
        alt={user.nom_complet}
        style={{
          ...avatarStyle,
          objectFit: 'cover',
        }}
      />
    );
  }

  return <div style={avatarStyle}>{initials}</div>;
};
