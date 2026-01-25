/**
 * =====================================================
 * UserProfile Component
 * =====================================================
 */

import React, { useEffect } from 'react';
import type { UserProfileProps } from '../types';
import { useUserProfile } from '../hooks';
import { formatRegistrationDate, calculateVerificationCompletion } from '../services';
import styles from './UserProfile.module.css';

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onEdit }) => {
  const { user, fetchUser, isLoading } = useUserProfile();

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  if (isLoading) {
    return <div className={styles.container}>Chargement...</div>;
  }

  if (!user) {
    return <div className={styles.container}>Utilisateur non trouvé</div>;
  }

  const completionPercent = calculateVerificationCompletion(user);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatarSection}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.nom_complet} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>{user.nom_complet.charAt(0)}</div>
          )}
        </div>

        <div className={styles.userInfo}>
          <h2 className={styles.name}>{user.nom_complet}</h2>
          <p className={styles.email}>{user.email}</p>
          <p className={styles.role}>{user.role}</p>
        </div>

        {onEdit && (
          <button className={styles.editButton} onClick={onEdit}>
            Modifier
          </button>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.detailSection}>
          <h3>Informations générales</h3>
          <div className={styles.detailRow}>
            <span className={styles.label}>Téléphone:</span>
            <span>{user.telephone || 'Non fourni'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Adresse:</span>
            <span>{user.adresse || 'Non fourni'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Ville:</span>
            <span>{user.ville || 'Non fourni'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Code postal:</span>
            <span>{user.code_postal || 'Non fourni'}</span>
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Statut du compte</h3>
          <div className={styles.detailRow}>
            <span className={styles.label}>Statut:</span>
            <span className={styles.status}>{user.statut_compte}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Email confirmé:</span>
            <span>{user.email_confirme ? '✓ Oui' : '✗ Non'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Téléphone confirmé:</span>
            <span>{user.telephone_confirme ? '✓ Oui' : '✗ Non'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Inscription:</span>
            <span>{formatRegistrationDate(user.date_creation)}</span>
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Complétude du profil</h3>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
          <p className={styles.percentage}>{completionPercent}% complété</p>
        </div>
      </div>
    </div>
  );
};
