/**
 * =====================================================
 * RETROUVONSLES - Admin Reports Management Page
 * Gestion des rapports de signalement
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  getAdminOrganisationSignalements,
  updateSignalementValidation,
} from '../../features/admin-organisation/services';
import { AdminTableSkeleton } from './skeletons';
import styles from './RapportsPage.module.css';

interface Rapport {
  id: string;
  numero: string;
  dossier: string;
  auteur: string;
  type: string;
  date: string;
  statut: 'approuve' | 'en_attente' | 'rejete';
  priorite: 'haute' | 'normale' | 'basse';
}

export const AdminOrganisationRapportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [filteredRapports, setFilteredRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadRapports = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      setLoadError(false);
      const rows = await getAdminOrganisationSignalements(orgId, {
        search: searchTerm || undefined,
        statut: filterStatus !== 'all' ? filterStatus : undefined,
      });
      const mapped: Rapport[] = rows.map((r) => {
        const statutMap: Record<string, 'approuve' | 'en_attente' | 'rejete'> = {
          valide: 'approuve',
          en_attente: 'en_attente',
          invalide: 'rejete',
          spam: 'rejete',
          doublonne: 'rejete',
        };
        const u = (r as any).utilisateur;
        return {
          id: r.id,
          numero: (r as any).numero_signalement || `${t('admin.reportNumberPrefix')}${r.id.slice(0, 8)}`,
          dossier: (r as any).dossier?.numero_dossier || (r as any).id_dossier || t('common.notAvailable'),
          auteur: u ? `${u.nom || ''} ${u.prenom || ''}`.trim() || t('common.notAvailable') : t('common.notAvailable'),
          type: (r.description || '').slice(0, 40) + (r.description && r.description.length > 40 ? t('common.ellipsis') : ''),
          date: r.date_observation ? r.date_observation.split('T')[0] : '',
          statut: statutMap[(r as any).statut_validation] || 'en_attente',
          priorite: ((r as any).priorite_traitement as 'haute' | 'normale' | 'basse') || 'normale',
        };
      });
      setFilteredRapports(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      setLoadError(true);
      setFilteredRapports([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id, searchTerm, filterStatus, t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_SYSTEME) {
      navigate('/auth/login');
      return;
    }
    loadRapports();
  }, [currentUser, navigate, loadRapports]);

  const handleApprove = async (rapportId: string) => {
    if (!currentUser?.id) return;
    try {
      await updateSignalementValidation(rapportId, 'valide', currentUser.id);
      loadRapports();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (rapportId: string) => {
    if (!currentUser?.id) return;
    try {
      await updateSignalementValidation(rapportId, 'invalide', currentUser.id);
      loadRapports();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      approuve: {
        icon: CheckCircle,
        label: t('admin.approved'),
      },
      en_attente: {
        icon: Clock,
        label: t('admin.pending'),
      },
      rejete: {
        icon: XCircle,
        label: t('admin.rejected'),
      },
    };
    return configs[status as keyof typeof configs] || configs.approuve;
  };

  return (
    <AdminOrganisationLayout title={t('admin.rapports')} activeNav="rapports">
      <div className={styles.rapports}>
        {/* Header */}
        <div className={styles.rapports__header}>
          <div>
            <h1 className={styles.rapports__title}>
              <FileText className={styles.rapports__titleIcon} />
              {t('admin.rapports')}
            </h1>
            <p className={styles.rapports__subtitle}>{t('admin.manageReports')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.rapports__filterCard}>
          <div className={styles.rapports__filters}>
            <div className={styles.rapports__searchWrapper}>
              <Search className={styles.rapports__searchIcon} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.rapports__searchInput}
              />
            </div>
            <div className={styles.rapports__filterWrapper}>
              <Filter className={styles.rapports__filterIcon} />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={styles.rapports__filterSelect}
              >
                <option value="all">{t('admin.allStatus')}</option>
                <option value="approuve">{t('admin.approved')}</option>
                <option value="en_attente">{t('admin.pending')}</option>
                <option value="rejete">{t('admin.rejected')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className={styles.rapports__contentCard}>
          <div className={styles.rapports__contentHeader}>
            <h2 className={styles.rapports__contentTitle}>
              {t('admin.totalReports')}{t('common.colon')} <strong>{filteredRapports.length}</strong>
            </h2>
          </div>

          {loading ? (
            <div className={styles.rapports__skeletonWrap}>
              <AdminTableSkeleton columns={7} rows={8} />
            </div>
          ) : (
            <>
              {loadError && (
                <div className={`${styles.rapports__error} ${styles.rapports__errorBanner}`} role="alert">
                  <AlertCircle size={18} aria-hidden />
                  <span>{t('admin.noReportsFound')}</span>
                </div>
              )}
              {filteredRapports.length === 0 ? (
            <div className={styles.rapports__empty}>
              <AlertCircle className={styles.rapports__emptyIcon} />
              {t('admin.noReportsFound')}
            </div>
          ) : (
            <div className={styles.rapports__tableContainer}>
              <table className={styles.rapports__table}>
                <thead className={styles.rapports__tableHeader}>
                  <tr>
                    <th>{t('admin.number')}</th>
                    <th>{t('admin.dossier')}</th>
                    <th>{t('admin.author')}</th>
                    <th>{t('admin.type')}</th>
                    <th>{t('common.date')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={styles.rapports__tableBody}>
                  {filteredRapports.map(rapport => {
                    const StatusIcon = getStatusConfig(rapport.statut).icon;
                    return (
                      <tr key={rapport.id}>
                        <td className={styles.rapports__numero} data-label={t('admin.number')}>{rapport.numero}</td>
                        <td data-label={t('admin.dossier')}>{rapport.dossier}</td>
                        <td data-label={t('admin.author')}>{rapport.auteur}</td>
                        <td data-label={t('admin.type')}>{rapport.type}</td>
                        <td data-label={t('common.date')}>{rapport.date}</td>
                        <td data-label={t('common.status')}>
                          <span className={`${styles.rapports__statusBadge} ${styles[`rapports__statusBadge--${rapport.statut}`]}`}>
                            <StatusIcon className={styles.rapports__statusIcon} />
                            {getStatusConfig(rapport.statut).label}
                          </span>
                        </td>
                        <td className={styles.rapports__tdActions} data-label={t('common.actions')}>
                          <div className={styles.rapports__actions}>
                            <button
                              type="button"
                              className={`${styles.rapports__btn} ${styles['rapports__btn--view']}`}
                              onClick={() => navigate(`/admin/rapports/${rapport.id}`)}
                              title={t('common.view')}
                              aria-label={t('common.view')}
                            >
                              <Eye className={styles.rapports__btnIcon} />
                              {t('common.view')}
                            </button>
                            {rapport.statut === 'en_attente' && (
                              <>
                                <button
                                  type="button"
                                  className={`${styles.rapports__btn} ${styles['rapports__btn--approve']}`}
                                  onClick={() => handleApprove(rapport.id)}
                                  title={t('admin.approveReport')}
                                  aria-label={t('admin.approveReport')}
                                >
                                  <CheckCircle className={styles.rapports__btnIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.rapports__btn} ${styles['rapports__btn--reject']}`}
                                  onClick={() => handleReject(rapport.id)}
                                  title={t('admin.rejectReport')}
                                  aria-label={t('admin.rejectReport')}
                                >
                                  <XCircle className={styles.rapports__btnIcon} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationRapportsPage;