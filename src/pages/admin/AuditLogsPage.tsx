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
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { getAdminAuditLogs, formatAuditLogsAsCsv } from '../../features/admin-organisation/services';
import type { AdminAuditLogRow } from '../../features/admin-organisation/services';

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
  const { t, language } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [rawLogs, setRawLogs] = useState<AdminAuditLogRow[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const loadAuditLogs = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      const actionToTypeMap: Record<string, string> = {
        CREATE: 'creation_dossier',
        UPDATE: 'modification_dossier',
        DELETE: 'modification_dossier',
        APPROVE: 'validation_signalement',
        REJECT: 'validation_signalement',
        READ: 'connexion',
      };
      const rows = await getAdminAuditLogs(orgId, {
        user: filterUser !== 'all' ? filterUser : undefined,
        action: filterAction !== 'all' ? actionToTypeMap[filterAction] || undefined : undefined,
        dateFilter: filterDate !== 'all' ? filterDate : undefined,
      });
      const actionTypeMap: Record<string, AuditLog['actionType']> = {
        creation_dossier: 'CREATE',
        modification_dossier: 'UPDATE',
        creation_signalement: 'CREATE',
        validation_signalement: 'APPROVE',
        diffusion_alerte: 'CREATE',
        connexion: 'READ',
        deconnexion: 'READ',
        modification_profil: 'UPDATE',
        upload_photo: 'CREATE',
        analyse_ia: 'READ',
        validation_ia: 'APPROVE',
        changement_statut: 'UPDATE',
        attribution_role: 'UPDATE',
        autre: 'UPDATE',
      };
      const entityTypeMap: Record<string, AuditLog['entityType']> = {
        creation_dossier: 'DOSSIER',
        modification_dossier: 'DOSSIER',
        creation_signalement: 'RAPPORT',
        validation_signalement: 'RAPPORT',
        diffusion_alerte: 'DOSSIER',
        attribution_role: 'USER',
        modification_profil: 'USER',
        autre: 'RAPPORT',
      };
      const mapped: AuditLog[] = rows.map((r: any) => {
        const u = r.utilisateur;
        const userName = u ? `${u.nom || ''} ${u.prenom || ''}`.trim() || t('common.notAvailable') : t('common.notAvailable');
        return {
          id: String(r.id),
          userId: r.id_utilisateur || '',
          userName,
          action: r.action_detaillee || r.description || r.type_action,
          actionType: actionTypeMap[r.type_action] || 'UPDATE',
          entityType: entityTypeMap[r.type_action] || 'RAPPORT',
          entityId: r.id_dossier || r.id_signalement || r.id_alerte || '',
          entityName: r.action_detaillee || r.type_action,
          details: r.description || '',
          ipAddress: r.ip_utilisateur || t('common.notAvailable'),
          timestamp: r.date_action,
        };
      });
      setLogs(mapped);
      setRawLogs(rows);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      setLogs([]);
      setRawLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id, filterUser, filterAction, filterDate, t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadAuditLogs();
  }, [currentUser, navigate, loadAuditLogs]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredLogs(logs.filter(
      log =>
        log.userName.toLowerCase().includes(term) ||
        (log.entityName && log.entityName.toLowerCase().includes(term)) ||
        log.action.toLowerCase().includes(term)
    ));
  }, [searchTerm, logs]);

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

  const getActionTypeLabel = (actionType: string) => {
    const keyMap: Record<string, string> = {
      CREATE: 'create',
      READ: 'read',
      UPDATE: 'update',
      DELETE: 'delete',
      APPROVE: 'approve',
      REJECT: 'reject',
    };
    return t(`admin.${keyMap[actionType] || 'update'}`);
  };

  const getEntityTypeLabel = (entityType: string) => {
    const keyMap: Record<string, string> = {
      DOSSIER: 'entityDossier',
      USER: 'entityUser',
      RAPPORT: 'entityRapport',
      SETTING: 'entitySetting',
    };
    return t(`admin.${keyMap[entityType] || 'entityRapport'}`);
  };

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userId))).map(userId => ({
    id: userId,
    name: logs.find(log => log.userId === userId)?.userName || t('common.unknown'),
  }));

  const handleExportCsv = () => {
    const ids = new Set(filteredLogs.map(l => l.id));
    const toExport = ids.size ? rawLogs.filter(r => ids.has(String(r.id))) : rawLogs;
    const csv = formatAuditLogsAsCsv(toExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('admin.exportFilenameAuditLogs')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminOrganisationLayout title={t('admin.auditLogs')} activeNav="audit-logs">
      <div className={styles.auditLogs}>
        <div className={styles.auditLogs__header}>
          <div>
            <h2 className={styles.auditLogs__title}>
              <ScrollText className={styles.auditLogs__titleIcon} />
              {t('admin.auditLogs')}
            </h2>
            <p className={styles.auditLogs__subtitle}>{t('admin.viewActivityLog')}</p>
          </div>
          <button
            type="button"
            className={styles.auditLogs__btnExport}
            onClick={handleExportCsv}
            disabled={rawLogs.length === 0}
            title={t('admin.export')}
            aria-label={t('admin.export')}
          >
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
                          {new Date(log.timestamp).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </span>
                      </div>
                      <div className={styles.auditLogs__badges}>
                        <span
                          className={`${styles.auditLogs__badge} ${styles[`auditLogs__badge--${log.actionType.toLowerCase()}`]}`}
                        >
                          {getActionTypeLabel(log.actionType)}
                        </span>
                        <span
                          className={`${styles.auditLogs__badge} ${styles[`auditLogs__badge--${log.entityType.toLowerCase()}`]}`}
                        >
                          {getEntityTypeLabel(log.entityType)}
                        </span>
                        <span className={styles.auditLogs__user}>
                          <User className={styles.auditLogs__userIcon} />
                          {log.userName}
                        </span>
                        <span className={styles.auditLogs__entity}>{log.entityName}</span>
                      </div>
                      <p className={styles.auditLogs__description}>{log.details}</p>
                      <p className={styles.auditLogs__meta}>{t('admin.ipAddress')}: {log.ipAddress}</p>
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
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationAuditLogsPage;