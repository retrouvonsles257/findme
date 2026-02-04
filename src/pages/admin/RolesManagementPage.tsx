/**
 * =====================================================
 * RETROUVONSLES - Admin Roles Management Page
 * Gestion des rôles et permissions
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { getAdminRoles } from '../../features/admin-organisation/services';
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  X,
  Loader2,
} from 'lucide-react';
import styles from './RolesManagement.module.css';

interface Role {
  id: string;
  nom: string;
  description: string;
  utilisateurs: number;
  permissions: string[];
  createdAt: string;
}

export const AdminOrganisationRolesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState({
    nom: '',
    description: '',
    permissions: [] as string[],
  });

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getAdminRoles();
      const mapped: Role[] = rows.map((r) => ({
        id: r.id,
        nom: t(`admin.role.${r.nom_role}`, t('common.unknown')),
        description: r.description || '',
        utilisateurs: 0,
        permissions: r.permissions ? Object.keys(r.permissions as Record<string, unknown>) : [],
        createdAt: '',
      }));
      setRoles(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadRoles();
  }, [currentUser, navigate, loadRoles]);

  /** Rôles système (table role globale) : lecture seule, pas de création/édition/suppression */
  const isReadOnly = true;

  const allPermissions = [
    { key: 'view_dossiers', label: t('admin.permission_view_dossiers') },
    { key: 'create_dossiers', label: t('admin.permission_create_dossiers') },
    { key: 'edit_dossiers', label: t('admin.permission_edit_dossiers') },
    { key: 'delete_dossiers', label: t('admin.permission_delete_dossiers') },
    { key: 'view_rapports', label: t('admin.permission_view_rapports') },
    { key: 'create_rapports', label: t('admin.permission_create_rapports') },
    { key: 'approve_rapports', label: t('admin.permission_approve_rapports') },
    { key: 'reject_rapports', label: t('admin.permission_reject_rapports') },
    { key: 'assign_dossiers', label: t('admin.permission_assign_dossiers') },
    { key: 'manage_users', label: t('admin.permission_manage_users') },
    { key: 'view_statistics', label: t('admin.permission_view_statistics') },
    { key: 'manage_roles', label: t('admin.permission_manage_roles') },
  ];

  const handleCreateRole = async () => {
    if (!newRole.nom) {
      alert(t('admin.roleName'));
      return;
    }
    try {
      setLoading(true);
      alert(t('admin.successSaved'));
      setShowModal(false);
      setNewRole({ nom: '', description: '', permissions: [] });
      loadRoles();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminOrganisationLayout title={t('admin.rolesManagement')} activeNav="roles">
      <div className={styles.rolesManagement__container}>
        {/* Header */}
        <div className={styles.rolesManagement__header}>
          <div className={styles.rolesManagement__headerContent}>
            <div className={styles.rolesManagement__headerIcon}>
              <Shield />
            </div>
            <div>
              <h1 className={styles.rolesManagement__title}>{t('admin.rolesManagement')}</h1>
              <p className={styles.rolesManagement__subtitle}>{t('admin.defineRolesAndPermissions')}</p>
            </div>
          </div>
          {!isReadOnly && (
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} />
              {t('admin.newRole')}
            </Button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.rolesManagement__loading}>
            <Loader2 size={32} className={styles.rolesManagement__spinner} />
            <p>{t('common.loading')}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && roles.length === 0 && (
          <Card>
            <CardBody>
              <div className={styles.rolesManagement__empty}>
                <Shield size={48} className={styles.rolesManagement__emptyIcon} />
                <h3>{t('admin.noRolesLoaded')}</h3>
                <p>{t('admin.rolesReadOnly')}</p>
                <Button variant="secondary" onClick={() => loadRoles()}>
                  {t('common.retry')}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Roles Grid */}
        {!loading && roles.length > 0 && (
        <div className={styles.rolesManagement__rolesGrid}>
          {roles.map(role => (
            <Card
              key={role.id}
              className={selectedRole?.id === role.id ? styles.rolesManagement__selectedCard : ''}
              onClick={() => setSelectedRole(role)}
            >
              <CardHeader>
                <div className={styles.rolesManagement__roleHeader}>
                  <div className={styles.rolesManagement__roleHeaderLeft}>
                    <Shield className={styles.rolesManagement__roleIcon} />
                    <h3 className={styles.rolesManagement__roleName}>{role.nom}</h3>
                  </div>
                  <Badge variant="secondary" size="sm">
                    <Users size={12} />
                    {role.utilisateurs} {t('admin.users')}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <p className={styles.rolesManagement__roleDescription}>{role.description}</p>
                <div className={styles.rolesManagement__permissionsList}>
                  <h4 className={styles.rolesManagement__permissionsTitle}>
                    <Lock size={14} />
                    {t('admin.permissions')}{t('common.colon')}
                  </h4>
                  <div className={styles.rolesManagement__permissions}>
                    {role.permissions.map((perm, idx) => (
                      <div key={idx} className={styles.rolesManagement__permissionBadge}>
                        <CheckCircle2 size={12} />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {!isReadOnly && (
                  <div className={styles.rolesManagement__roleActions}>
                    <button
                      className={styles.rolesManagement__actionBtn}
                      onClick={e => {
                        e.stopPropagation();
                        alert(t('admin.editUser'));
                      }}
                    >
                      <Edit3 size={16} />
                      {t('admin.edit')}
                    </button>
                    <button
                      className={`${styles.rolesManagement__actionBtn} ${styles['rolesManagement__actionBtn--danger']}`}
                      onClick={e => {
                        e.stopPropagation();
                        alert(t('admin.confirmDeleteRole'));
                      }}
                    >
                      <Trash2 size={16} />
                      {t('admin.delete')}
                    </button>
                  </div>
                )}
                {isReadOnly && (
                  <p className={styles.rolesManagement__readOnlyHint}>
                    <Lock size={14} />
                    {t('admin.rolesReadOnly')}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
        )}

        {/* Permissions Matrix */}
        {selectedRole && (
          <Card>
            <CardHeader>
              <div className={styles.rolesManagement__matrixHeader}>
                <Lock className={styles.rolesManagement__matrixIcon} />
                <h3 className={styles.rolesManagement__matrixTitle}>
                  {t('admin.permissionsMatrix')}{t('common.titleSeparator')}{selectedRole.nom}
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.rolesManagement__permissionMatrix}>
                <table className={styles.rolesManagement__table}>
                  <thead>
                    <tr>
                      <th>{t('admin.permission')}</th>
                      <th>{t('admin.granted')}</th>
                      <th>{t('admin.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPermissions.map(perm => (
                      <tr key={perm.key}>
                        <td>{perm.label}</td>
                        <td>
                          {selectedRole.permissions.includes(perm.key) ? (
                            <div className={styles.rolesManagement__grantedBadge}>
                              <CheckCircle2 size={14} />
                            </div>
                          ) : (
                            <div className={styles.rolesManagement__deniedBadge}>
                              <XCircle size={14} />
                            </div>
                          )}
                        </td>
                        <td>
                          {!isReadOnly ? (
                            <button
                              className={styles.rolesManagement__toggleBtn}
                              onClick={() => alert(t('admin.permissions'))}
                            >
                              {selectedRole.permissions.includes(perm.key)
                                ? t('admin.revoke')
                                : t('admin.grant')}
                            </button>
                          ) : (
                            <span className={styles.rolesManagement__readOnlyCell}>{t('common.notAvailable')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.rolesManagement__modal}>
            <div className={styles.rolesManagement__modalContent}>
              <div className={styles.rolesManagement__modalHeader}>
                <h2>{t('admin.createNewRole')}</h2>
                <button
                  type="button"
                  className={styles.rolesManagement__closeBtn}
                  onClick={() => setShowModal(false)}
                  title={t('common.close')}
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.rolesManagement__modalBody}>
                <div className={styles.rolesManagement__formGroup}>
                  <label className={styles.rolesManagement__label}>{t('admin.roleName')}</label>
                  <input
                    type="text"
                    className={styles.rolesManagement__input}
                    value={newRole.nom}
                    onChange={e => setNewRole({ ...newRole, nom: e.target.value })}
                    placeholder={t('admin.roleNamePlaceholder')}
                  />
                </div>

                <div className={styles.rolesManagement__formGroup}>
                  <label className={styles.rolesManagement__label}>{t('admin.description')}</label>
                  <textarea
                    className={styles.rolesManagement__textarea}
                    value={newRole.description}
                    onChange={e =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    placeholder={t('admin.roleDescriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className={styles.rolesManagement__formGroup}>
                  <label className={styles.rolesManagement__label}>{t('admin.permissions')}</label>
                  <div className={styles.rolesManagement__checkboxList}>
                    {allPermissions.map(perm => (
                      <label key={perm.key} className={styles.rolesManagement__checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={newRole.permissions.includes(perm.key)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewRole({
                                ...newRole,
                                permissions: [...newRole.permissions, perm.key],
                              });
                            } else {
                              setNewRole({
                                ...newRole,
                                permissions: newRole.permissions.filter(p => p !== perm.key),
                              });
                            }
                          }}
                          className={styles.rolesManagement__checkbox}
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.rolesManagement__modalActions}>
                <Button
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  {t('admin.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateRole}
                  disabled={loading}
                >
                  {loading ? t('admin.creating') : t('admin.create')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationRolesPage;