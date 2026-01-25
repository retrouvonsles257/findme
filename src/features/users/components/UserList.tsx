/**
 * =====================================================
 * UserList Component
 * =====================================================
 */

import React, { useEffect } from 'react';
import type { UserListProps } from '../types';
import { useUsers } from '../hooks';
import { UserAvatar } from './UserAvatar';
import { formatUserStatus, getUserStatusColor, formatLastActivityTime } from '../services';
import styles from './UserList.module.css';

export const UserList: React.FC<UserListProps> = ({ onUserSelect, filter }) => {
  const { users, fetch, isLoading, selectedUser } = useUsers();

  useEffect(() => {
    fetch(filter);
  }, [filter, fetch]);

  if (isLoading) {
    return <div className={styles.container}>Chargement des utilisateurs...</div>;
  }

  if (users.length === 0) {
    return <div className={styles.empty}>Aucun utilisateur trouvé</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.listHeader}>
        <span className={styles.columnName}>Utilisateur</span>
        <span className={styles.columnEmail}>Email</span>
        <span className={styles.columnRole}>Rôle</span>
        <span className={styles.columnStatus}>Statut</span>
        <span className={styles.columnActivity}>Activité</span>
      </div>

      <div className={styles.list}>
        {users.map((user) => (
          <div
            key={user.id}
            className={`${styles.listItem} ${selectedUser?.id === user.id ? styles.selected : ''}`}
            onClick={() => onUserSelect?.(user)}
          >
            <div className={styles.userCell}>
              <UserAvatar user={user} size="small" />
              <span className={styles.userName}>{user.nom_complet}</span>
            </div>

            <div className={styles.emailCell}>
              <span>{user.email}</span>
              {!user.email_confirme && <span className={styles.unverified}>Non vérifié</span>}
            </div>

            <div className={styles.roleCell}>
              <span className={styles.role}>{user.role}</span>
            </div>

            <div className={styles.statusCell}>
              <span
                className={styles.status}
                style={{ backgroundColor: getUserStatusColor(user.statut_compte) }}
              >
                {formatUserStatus(user.statut_compte)}
              </span>
            </div>

            <div className={styles.activityCell}>
              <span>{formatLastActivityTime(user.derniere_connexion)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
