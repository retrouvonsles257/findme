/**
 * =====================================================
 * RETROUVONSLES - Admin Users Management Page
 * Gestion des utilisateurs de l'organisation
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole, StatutCompte } from '../../@types/enums.types';
import {
  getAdminOrganisationUsers,
  suspendAdminUser,
  activateAdminUser,
  desactivateAdminUser,
} from '../../features/admin-organisation/services';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Loader2,
  UserCircle,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import styles from './UsersManagement.module.css';

interface User {
  id: string;
  nom_complet: string;
  email: string;
  role: NomRole;
  statut: StatutCompte;
  date_creation: string;
  dernier_acces?: string;
  actif: boolean;
}

export const AdminOrganisationUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      const rows = await getAdminOrganisationUsers(orgId, {
        search: searchTerm || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        statut: filterStatus !== 'all' ? filterStatus : undefined,
      });
      const mapped: User[] = rows.map((r) => ({
        id: r.id,
        nom_complet: [r.nom, r.prenom].filter(Boolean).join(' ').trim() || r.email,
        email: r.email,
        role: (r.role?.nom_role as NomRole) || NomRole.CITOYEN_STANDARD,
        statut: (r.statut_compte as StatutCompte) || StatutCompte.ACTIF,
        date_creation: r.created_at ? r.created_at.split('T')[0] : '',
        dernier_acces: r.derniere_connexion ? r.derniere_connexion.split('T')[0] : undefined,
        actif: r.statut_compte === 'actif',
      }));
      setFilteredUsers(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadUsers();
  }, [currentUser, navigate, loadUsers]);

  const getRoleBadgeColor = (role: NomRole) => {
    const colors: Record<NomRole, string> = {
      [NomRole.ADMIN_ORGANISATION]: 'primary',
      [NomRole.OFFICIER_POLICE]: 'info',
      [NomRole.OPERATEUR_SAISIE]: 'warning',
      [NomRole.MODERATEUR]: 'success',
      [NomRole.RESPONSABLE_ONG]: 'info',
      [NomRole.AGENT_GENDARMERIE]: 'info',
      [NomRole.CITOYEN_VERIFIE]: 'success',
      [NomRole.CITOYEN_STANDARD]: 'default',
      [NomRole.SUPER_ADMIN]: 'danger',
    };
    return colors[role] || 'default';
  };

  const getStatusIcon = (status: StatutCompte) => {
    if (status === 'actif') return <CheckCircle2 size={14} />;
    if (status === 'suspendu') return <Clock size={14} />;
    return <XCircle size={14} />;
  };

  const handleSuspend = async (userId: string) => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    setActionUserId(userId);
    try {
      await suspendAdminUser(orgId, userId);
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionUserId(null);
    }
  };

  const handleActivate = async (userId: string) => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    setActionUserId(userId);
    try {
      await activateAdminUser(orgId, userId);
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionUserId(null);
    }
  };

  const handleDesactivate = async (userId: string) => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    if (!window.confirm(t('admin.confirmDisableUser'))) return;
    setActionUserId(userId);
    try {
      await desactivateAdminUser(orgId, userId);
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <AdminOrganisationLayout title={t('admin.utilisateurs')} activeNav="utilisateurs">
      <div className={styles.usersManagement__container}>
        {/* Header */}
        <div className={styles.usersManagement__header}>
          <div className={styles.usersManagement__headerContent}>
            <div className={styles.usersManagement__headerIcon}>
              <Users />
            </div>
            <div>
              <h1 className={styles.usersManagement__title}>{t('admin.utilisateurs')}</h1>
              <p className={styles.usersManagement__subtitle}>{t('admin.manageTeamMembers')}</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/utilisateurs/new')}
            title={t('admin.addUser')}
            aria-label={t('admin.addUser')}
          >
            <UserPlus size={18} />
            {t('admin.addUser')}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className={styles.usersManagement__filters}>
              <div className={styles.usersManagement__searchGroup}>
                <Search className={styles.usersManagement__searchIcon} size={18} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles.usersManagement__searchInput}
                />
              </div>
              <div className={styles.usersManagement__filterGroup}>
                <Filter size={16} />
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className={styles.usersManagement__select}
                >
                  <option value="all">{t('admin.allRoles')}</option>
                  <option value={NomRole.OFFICIER_POLICE}>{t('admin.policeOfficer')}</option>
                  <option value={NomRole.OPERATEUR_SAISIE}>{t('admin.dataOperator')}</option>
                  <option value={NomRole.MODERATEUR}>{t('admin.moderator')}</option>
                </select>
              </div>
              <div className={styles.usersManagement__filterGroup}>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className={styles.usersManagement__select}
                >
                  <option value="all">{t('admin.allStatus')}</option>
                  <option value="actif">{t('admin.active')}</option>
                  <option value="suspendu">{t('admin.suspended')}</option>
                  <option value="desactive">{t('admin.disabled')}</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <h2 className={styles.usersManagement__cardTitle}>
              {t('admin.totalUsers')}{t('common.colon')} <strong>{filteredUsers.length}</strong>
            </h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className={styles.usersManagement__loadingState}>
                <Loader2 className={styles.usersManagement__spinner} />
                <p className={styles.usersManagement__loadingText}>{t('common.loading')}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.usersManagement__emptyState}>
                <UserCircle className={styles.usersManagement__emptyIcon} />
                <p className={styles.usersManagement__emptyText}>{t('admin.noUsersFound')}</p>
              </div>
            ) : (
              <div className={styles.usersManagement__table}>
                <div className={styles.usersManagement__tableHeader}>
                  <div className={styles.usersManagement__headerCell}>
                    <UserCircle size={16} />
                    {t('common.name')}
                  </div>
                  <div className={styles.usersManagement__headerCell}>
                    <Mail size={16} />
                    {t('common.email')}
                  </div>
                  <div className={styles.usersManagement__headerCell}>{t('common.role')}</div>
                  <div className={styles.usersManagement__headerCell}>{t('common.status')}</div>
                  <div className={styles.usersManagement__headerCell}>
                    <Calendar size={16} />
                    {t('admin.joinDate')}
                  </div>
                  <div className={styles.usersManagement__headerCell}>{t('common.actions')}</div>
                </div>

                <div className={styles.usersManagement__tableBody}>
                  {filteredUsers.map(user => (
                    <div key={user.id} className={styles.usersManagement__tableRow}>
                      <div className={styles.usersManagement__tableCell}>
                        <div className={styles.usersManagement__userInfo}>
                          <Avatar
                            initials={user.nom_complet
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                            size="sm"
                          />
                          <span className={styles.usersManagement__userName}>{user.nom_complet}</span>
                        </div>
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        <span className={styles.usersManagement__email}>{user.email}</span>
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        <Badge variant={getRoleBadgeColor(user.role) as any}>
                          {t(`admin.role.${user.role}`, t('common.unknown'))}
                        </Badge>
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        <div className={`${styles.usersManagement__statusBadge} ${
                          user.statut === 'actif' 
                            ? styles['usersManagement__statusBadge--active']
                            : user.statut === 'suspendu'
                              ? styles['usersManagement__statusBadge--suspended']
                              : styles['usersManagement__statusBadge--disabled']
                        }`}>
                          {getStatusIcon(user.statut)}
                          <span>{t(`admin.status.${user.statut}`, t('common.unknown'))}</span>
                        </div>
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        {user.date_creation}
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        <div className={styles.usersManagement__actions}>
                          <button
                            type="button"
                            className={styles.usersManagement__actionBtn}
                            onClick={() => navigate(`/admin/utilisateurs/${user.id}`)}
                            title={t('admin.editUser')}
                            aria-label={t('admin.editUser')}
                          >
                            <Edit3 size={16} />
                          </button>
                          {user.statut === 'actif' ? (
                            <button
                              type="button"
                              className={styles.usersManagement__actionBtn}
                              onClick={() => handleSuspend(user.id)}
                              disabled={actionUserId === user.id}
                              title={t('admin.suspendUser')}
                              aria-label={t('admin.suspendUser')}
                            >
                              {actionUserId === user.id ? <Loader2 size={16} /> : <Clock size={16} />}
                            </button>
                          ) : user.statut === 'suspendu' ? (
                            <button
                              type="button"
                              className={styles.usersManagement__actionBtn}
                              onClick={() => handleActivate(user.id)}
                              disabled={actionUserId === user.id}
                              title={t('admin.activateUser')}
                              aria-label={t('admin.activateUser')}
                            >
                              {actionUserId === user.id ? <Loader2 size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={`${styles.usersManagement__actionBtn} ${styles['usersManagement__actionBtn--danger']}`}
                            onClick={() => handleDesactivate(user.id)}
                            disabled={actionUserId === user.id}
                            title={t('admin.disableUser')}
                            aria-label={t('admin.disableUser')}
                          >
                            {actionUserId === user.id ? <Loader2 size={16} /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationUsersPage;