/**
 * =====================================================
 * RETROUVONSLES - Admin Roles Management Page
 * Gestion des rôles et permissions
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  X
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

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadRoles();
  }, [currentUser, navigate]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const mockRoles: Role[] = [
        {
          id: '1',
          nom: 'Officier de Police',
          description: 'Gère les dossiers et les investigations',
          utilisateurs: 12,
          permissions: [
            'view_dossiers',
            'create_dossiers',
            'edit_dossiers',
            'view_rapports',
            'create_rapports',
            'assign_dossiers',
          ],
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          nom: 'Opérateur de Saisie',
          description: 'Entre et met à jour les données',
          utilisateurs: 8,
          permissions: [
            'view_dossiers',
            'create_dossiers',
            'view_rapports',
            'create_rapports',
          ],
          createdAt: '2024-01-15',
        },
        {
          id: '3',
          nom: 'Modérateur',
          description: 'Modère les rapports et commentaires',
          utilisateurs: 3,
          permissions: [
            'view_dossiers',
            'view_rapports',
            'approve_rapports',
            'reject_rapports',
          ],
          createdAt: '2024-01-15',
        },
      ];
      setRoles(mockRoles);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: 'FolderOpen' },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: 'FileText' },
    { label: t('admin.utilisateurs'), href: '/admin/utilisateurs', icon: 'Users' },
    { label: t('admin.statistiques'), href: '/admin/statistiques', icon: 'BarChart3' },
    {
      label: t('admin.parametres'),
      href: '/admin/parametres',
      icon: 'Settings',
    },
  ];

  const allPermissions = [
    { key: 'view_dossiers', label: 'Consulter les dossiers' },
    { key: 'create_dossiers', label: 'Créer des dossiers' },
    { key: 'edit_dossiers', label: 'Modifier les dossiers' },
    { key: 'delete_dossiers', label: 'Supprimer les dossiers' },
    { key: 'view_rapports', label: 'Consulter les rapports' },
    { key: 'create_rapports', label: 'Créer des rapports' },
    { key: 'approve_rapports', label: 'Approuver les rapports' },
    { key: 'reject_rapports', label: 'Rejeter les rapports' },
    { key: 'assign_dossiers', label: 'Assigner les dossiers' },
    { key: 'manage_users', label: 'Gérer les utilisateurs' },
    { key: 'view_statistics', label: 'Voir les statistiques' },
    { key: 'manage_roles', label: 'Gérer les rôles' },
  ];

  const handleCreateRole = async () => {
    if (!newRole.nom) {
      alert('Veuillez entrer un nom de rôle');
      return;
    }
    try {
      setLoading(true);
      alert('Rôle créé avec succès');
      setShowModal(false);
      loadRoles();
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      sidebar={
        <SidebarAdminOrganisation
          navigationItems={navigationItems}
          currentUser={currentUser}
        />
      }
      header={
        <HeaderAdminOrganisation
          currentUser={currentUser}
          onLogout={() => navigate('/auth/login')}
        />
      }
    >
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
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            {t('admin.newRole')}
          </Button>
        </div>

        {/* Roles Grid */}
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
                    {t('admin.permissions')}:
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
                <div className={styles.rolesManagement__roleActions}>
                  <button
                    className={styles.rolesManagement__actionBtn}
                    onClick={e => {
                      e.stopPropagation();
                      alert('Édition non implémentée');
                    }}
                  >
                    <Edit3 size={16} />
                    {t('admin.edit')}
                  </button>
                  <button
                    className={`${styles.rolesManagement__actionBtn} ${styles['rolesManagement__actionBtn--danger']}`}
                    onClick={e => {
                      e.stopPropagation();
                      alert('Suppression non implémentée');
                    }}
                  >
                    <Trash2 size={16} />
                    {t('admin.delete')}
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        {selectedRole && (
          <Card>
            <CardHeader>
              <div className={styles.rolesManagement__matrixHeader}>
                <Lock className={styles.rolesManagement__matrixIcon} />
                <h3 className={styles.rolesManagement__matrixTitle}>
                  {t('admin.permissionsMatrix')} - {selectedRole.nom}
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
                          <button
                            className={styles.rolesManagement__toggleBtn}
                            onClick={() => alert('Non implémenté')}
                          >
                            {selectedRole.permissions.includes(perm.key)
                              ? t('admin.revoke')
                              : t('admin.grant')}
                          </button>
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
                  className={styles.rolesManagement__closeBtn}
                  onClick={() => setShowModal(false)}
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
                    placeholder="Ex: Enquêteur Senior"
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
                    placeholder="Description du rôle..."
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
    </DashboardLayout>
  );
};

export default AdminOrganisationRolesPage;