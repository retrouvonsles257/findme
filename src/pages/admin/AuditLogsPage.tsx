/**
 * =====================================================
 * RETROUVONSLES - Admin Audit Logs Page
 * Historique des activités et audit trail
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  AlertCircle
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';

import styles from './AuditLogs.module.css';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  entityType: 'DOSSIER' | 'USER' | 'RAPPORT' | 'SETTING';
  entityId: string;
  entityName: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export const AdminOrganisationAuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadAuditLogs();
  }, [currentUser, navigate]);

  useEffect(() => {
    filterLogs();
  }, [searchTerm, filterUser, filterAction, filterDate, logs]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'Ahmed Diallo',
          action: 'Création d\'un dossier',
          actionType: 'CREATE',
          entityType: 'DOSSIER',
          entityId: 'dos-001',
          entityName: 'Dossier Jean Dupont',
          details: 'Nouveau dossier créé avec urgence critique',
          ipAddress: '192.168.1.100',
          timestamp: '2024-01-20T14:30:00Z',
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'Mariam Sow',
          action: 'Approuvé un rapport',
          actionType: 'APPROVE',
          entityType: 'RAPPORT',
          entityId: 'rap-001',
          entityName: 'Rapport de sighting',
          details: 'Rapport approuvé après vérification',
          ipAddress: '192.168.1.101',
          timestamp: '2024-01-20T13:15:00Z',
        },
        {
          id: '3',
          userId: 'user-3',
          userName: 'Youssef Ahmed',
          action: 'Modification d\'un dossier',
          actionType: 'UPDATE',
          entityType: 'DOSSIER',
          entityId: 'dos-002',
          entityName: 'Dossier Mariam Traoré',
          details: 'Statut mis à jour en "retrouve_vivant"',
          ipAddress: '192.168.1.102',
          timestamp: '2024-01-20T12:45:00Z',
        },
      ];
      setLogs(mockLogs);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let result = logs;

    if (searchTerm) {
      result = result.filter(
        log =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterUser !== 'all') {
      result = result.filter(log => log.userId === filterUser);
    }

    if (filterAction !== 'all') {
      result = result.filter(log => log.actionType === filterAction);
    }

    if (filterDate !== 'all') {
      const now = new Date();
      const logDate = new Date();
      
      if (filterDate === 'today') {
        logDate.setHours(0, 0, 0, 0);
      } else if (filterDate === 'week') {
        logDate.setDate(now.getDate() - 7);
      } else if (filterDate === 'month') {
        logDate.setDate(now.getDate() - 30);
      }
      
      result = result.filter(log => new Date(log.timestamp) >= logDate);
    }

    setFilteredLogs(result);
  };

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: '📊' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: '📁' },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: '📋' },
    { label: t('admin.utilisateurs'), href: '/admin/utilisateurs', icon: '👥' },
    { label: t('admin.statistiques'), href: '/admin/statistiques', icon: '📈' },
    {
      label: t('admin.parametres'),
      href: '/admin/parametres',
      icon: '⚙️',
    },
  ];

  const getActionIcon = (actionType: string) => {
    const icons = {
      CREATE: Plus,
      READ: Eye,
      UPDATE: Edit,
      DELETE: Trash2,
      APPROVE: CheckCircle,
      REJECT: XCircle,
    };
    return icons[actionType as keyof typeof icons] || Plus;
  };

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userId))).map(userId => ({
    id: userId,
    name: logs.find(log => log.userId === userId)?.userName || 'Unknown',
  }));

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
      <div className={styles.auditLogs}>
        {/* Header */}
        <div className={styles.auditLogs__header}>
          <div>
            <h1 className={styles.auditLogs__title}>
              <ScrollText className={styles.auditLogs__titleIcon} />
              {t('admin.auditLogs')}
            </h1>
            <p className={styles.auditLogs__subtitle}>{t('admin.viewActivityLog')}</p>
          </div>
          <button className={styles.auditLogs__btnExport}>
            <Download className={styles.auditLogs__btnIcon} />
            {t('admin.export')}
          </button>
        </div>

        {/* Filters */}
        <div className={styles.auditLogs__filterCard}>
          <div className={styles.auditLogs__filters}>
            <div className={styles.auditLogs__searchWrapper}>
              <Search className={styles.auditLogs__searchIcon} />
              <input
                type="text"
                className={styles.auditLogs__searchInput}
                placeholder={t('admin.searchByUserAction')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.auditLogs__filterWrapper}>
              <Filter className={styles.auditLogs__filterIcon} />
              <select
                className={styles.auditLogs__filterSelect}
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
              >
                <option value="all">{t('admin.allUsers')}</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.auditLogs__filterWrapper}>
              <Filter className={styles.auditLogs__filterIcon} />
              <select
                className={styles.auditLogs__filterSelect}
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
              >
                <option value="all">{t('admin.allActions')}</option>
                <option value="CREATE">{t('admin.create')}</option>
                <option value="READ">{t('admin.read')}</option>
                <option value="UPDATE">{t('admin.update')}</option>
                <option value="DELETE">{t('admin.delete')}</option>
                <option value="APPROVE">{t('admin.approve')}</option>
                <option value="REJECT">{t('admin.reject')}</option>
              </select>
            </div>

            <div className={styles.auditLogs__filterWrapper}>
              <Filter className={styles.auditLogs__filterIcon} />
              <select
                className={styles.auditLogs__filterSelect}
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              >
                <option value="all">{t('admin.allTime')}</option>
                <option value="today">{t('admin.today')}</option>
                <option value="week">{t('admin.lastWeek')}</option>
                <option value="month">{t('admin.lastMonth')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className={styles.auditLogs__contentCard}>
          <div className={styles.auditLogs__contentHeader}>
            <h3>
              {t('admin.activityLogs')} ({filteredLogs.length} {t('admin.records')})
            </h3>
          </div>

          {loading ? (
            <p className={styles.auditLogs__loading}>{t('admin.loading')}</p>
          ) : filteredLogs.length === 0 ? (
            <div className={styles.auditLogs__empty}>
              <AlertCircle className={styles.auditLogs__emptyIcon} />
              {t('admin.noLogsFound')}
            </div>
          ) : (
            <div className={styles.auditLogs__list}>
              {filteredLogs.map(log => {
                const ActionIcon = getActionIcon(log.actionType);
                return (
                  <div key={log.id} className={styles.auditLogs__item}>
                    <div className={styles.auditLogs__iconWrapper}>
                      <ActionIcon className={styles.auditLogs__icon} />
                    </div>
                    <div className={styles.auditLogs__content}>
                      <div className={styles.auditLogs__itemHeader}>
                        <h4 className={styles.auditLogs__action}>{log.action}</h4>
                        <span className={styles.auditLogs__time}>
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className={styles.auditLogs__badges}>
                        <span
                          className={`${styles.auditLogs__badge} ${styles[`auditLogs__badge--${log.actionType.toLowerCase()}`]}`}
                        >
                          {log.actionType}
                        </span>
                        <span
                          className={`${styles.auditLogs__badge} ${styles[`auditLogs__badge--${log.entityType.toLowerCase()}`]}`}
                        >
                          {log.entityType}
                        </span>
                        <span className={styles.auditLogs__user}>
                          <User className={styles.auditLogs__userIcon} />
                          {log.userName}
                        </span>
                        <span className={styles.auditLogs__entity}>{log.entityName}</span>
                      </div>
                      <p className={styles.auditLogs__description}>{log.details}</p>
                      <p className={styles.auditLogs__meta}>IP: {log.ipAddress}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className={styles.auditLogs__statsRow}>
          <div className={styles.auditLogs__statCard}>
            <p className={styles.auditLogs__statLabel}>{t('admin.totalActivities')}</p>
            <p className={styles.auditLogs__statValue}>{logs.length}</p>
          </div>
          <div className={styles.auditLogs__statCard}>
            <p className={styles.auditLogs__statLabel}>{t('admin.todayActivities')}</p>
            <p className={styles.auditLogs__statValue}>
              {logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
          <div className={styles.auditLogs__statCard}>
            <p className={styles.auditLogs__statLabel}>{t('admin.activeUsers')}</p>
            <p className={styles.auditLogs__statValue}>{uniqueUsers.length}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganisationAuditLogsPage;