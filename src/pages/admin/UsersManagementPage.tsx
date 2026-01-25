/**
 * =====================================================
 * RETROUVONSLES - Admin Users Management Page
 * Gestion des utilisateurs de l'organisation
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole, StatutCompte } from '../../@types/enums.types';
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
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        u =>
          u.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.statut === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, filterStatus, users]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadUsers();
  }, [currentUser, navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterStatus, users, filterUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const mockUsers: User[] = [
        {
          id: '1',
          nom_complet: 'Ahmed Diallo',
          email: 'ahmed.diallo@org.com',
          role: NomRole.OFFICIER_POLICE,
          statut: StatutCompte.ACTIF,
          date_creation: '2024-01-15',
          dernier_acces: '2024-01-17',
          actif: true,
        },
        {
          id: '2',
          nom_complet: 'Mariam Sow',
          email: 'mariam.sow@org.com',
          role: NomRole.OPERATEUR_SAISIE,
          statut: StatutCompte.ACTIF,
          date_creation: '2024-01-10',
          dernier_acces: '2024-01-16',
          actif: true,
        },
        {
          id: '3',
          nom_complet: 'Youssef Ahmed',
          email: 'youssef.ahmed@org.com',
          role: NomRole.MODERATEUR,
          statut: StatutCompte.SUSPENDU,
          date_creation: '2024-01-05',
          dernier_acces: '2024-01-14',
          actif: false,
        },
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: 'FolderOpen' },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: 'FileText' },
    {
      label: t('admin.utilisateurs'),
      href: '/admin/utilisateurs',
      icon: 'Users',
      isActive: true,
    },
    { label: t('admin.statistiques'), href: '/admin/statistiques', icon: 'BarChart3' },
    { label: t('admin.parametres'), href: '/admin/parametres', icon: 'Settings' },
  ];

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
              {t('admin.totalUsers')}: <strong>{filteredUsers.length}</strong>
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
                          {t(`admin.role.${user.role}`)}
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
                          <span>{t(`admin.status.${user.statut}`)}</span>
                        </div>
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        {user.date_creation}
                      </div>
                      <div className={styles.usersManagement__tableCell}>
                        <div className={styles.usersManagement__actions}>
                          <button
                            className={styles.usersManagement__actionBtn}
                            onClick={() => navigate(`/admin/utilisateurs/${user.id}`)}
                            title="Éditer"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className={`${styles.usersManagement__actionBtn} ${styles['usersManagement__actionBtn--danger']}`}
                            onClick={() => console.log('Supprimer utilisateur:', user.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
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
    </DashboardLayout>
  );
};

export default AdminOrganisationUsersPage;