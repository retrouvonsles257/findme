/**
 * =====================================================
 * RETROUVONSLES - Alertes Management Page
 * Gestion des alertes avec vraies données Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Tag,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAlertes } from '../../features/alertes/hooks/useAlertes';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import { 
  validateAlerte, 
  cancelAlerte, 
  deleteAlerte,
  diffuserAlerte,
  updateAlerteStatut,
  type AlerteFilters,
} from '../../features/alertes/services/alerteAPI';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import styles from './AlertesPage.module.css';

type FilterType = 'all' | 'brouillon' | 'en_cours' | 'terminee' | 'annulee';

export interface AlertesPageProps {
  /** When true, render only content (no AuthorityLayout). Used by admin org pages. */
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /authority */
  basePath?: string;
  /** Filtres initiaux (ex. id_organisation_responsable pour NGO). Prioritaire sur le filtre déduit du rôle. */
  initialFilters?: AlerteFilters;
}

export const AlertesPage: React.FC<AlertesPageProps> = ({ noLayout = false, basePath = '/authority', initialFilters }) => {
  const navigate = useNavigate();
  const { user: _ } = useAuth(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const currentUser = useAppSelector(selectCurrentUser);
  const { addNotification } = useNotification();
  const { alertes, loading, error: loadError, fetchAlertes } = useAlertes();
  const { t, language } = useI18n();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlerte, setSelectedAlerte] = useState<any | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'publish' | 'cancel' | 'delete' | 'complete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionComment, setActionComment] = useState('');

  useEffect(() => {
    const filters = initialFilters ?? (
      currentUser?.role === NomRole.AUTORITE && currentUser?.organisation_id
        ? { id_organisation_responsable: currentUser.organisation_id }
        : undefined
    );
    fetchAlertes(filters);
  }, [fetchAlertes, initialFilters, currentUser?.role, currentUser?.organisation_id]);

  const filteredAlertes = alertes.filter((a: any) => {
    const status = a.statut_alerte || 'brouillon';
    const matchFilter = filter === 'all' || status === filter;
    const matchSearch =
      (a.titre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openActionModal = useCallback((alerte: any, action: 'publish' | 'cancel' | 'delete' | 'complete') => {
    setSelectedAlerte(alerte);
    setActionType(action);
    setActionComment('');
    setShowActionModal(true);
  }, []);

  const closeActionModal = useCallback(() => {
    setShowActionModal(false);
    setSelectedAlerte(null);
    setActionType(null);
    setActionComment('');
  }, []);

  const handleAction = useCallback(async () => {
    if (!selectedAlerte || !actionType) return;

    setActionLoading(true);
    try {
      switch (actionType) {
        case 'publish':
          await validateAlerte(selectedAlerte.id, actionComment || t('authority.alertes.messages.publicationApproved'));
          const result = await diffuserAlerte(selectedAlerte.id);
          addNotification({
            title: t('authority.alertes.messages.published'),
            message: t('authority.alertes.messages.diffusedToUsers').replace('{{count}}', String(result.nombre_destinataires)),
            type: result.nombre_destinataires === 0 ? 'warning' : 'success',
          });
          break;

        case 'cancel':
          await cancelAlerte(selectedAlerte.id, actionComment || t('authority.alertes.messages.cancelled'));
          addNotification({
            title: t('authority.alertes.messages.cancelledTitle'),
            message: t('authority.alertes.messages.cancelledSuccess'),
            type: 'warning',
          });
          break;

        case 'complete':
          await updateAlerteStatut(selectedAlerte.id, 'terminee' as any, actionComment || t('authority.alertes.messages.completed'));
          addNotification({
            title: t('authority.alertes.messages.completedTitle'),
            message: t('authority.alertes.messages.completedSuccess'),
            type: 'success',
          });
          break;

        case 'delete':
          await deleteAlerte(selectedAlerte.id);
          addNotification({
            title: t('authority.alertes.messages.deletedTitle'),
            message: t('authority.alertes.messages.deletedSuccess'),
            type: 'info',
          });
          break;
      }

      fetchAlertes();
      closeActionModal();
    } catch (err: any) {
      addNotification({
        title: t('authority.alertes.messages.error'),
        message: err.message || t('authority.alertes.messages.errorOccurred'),
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }, [selectedAlerte, actionType, actionComment, addNotification, fetchAlertes, closeActionModal, t]);

  const countByStatus = {
    all: alertes.length,
    brouillon: alertes.filter((a: any) => a.statut_alerte === 'brouillon' || !a.statut_alerte).length,
    en_cours: alertes.filter((a: any) => a.statut_alerte === 'en_cours').length,
    terminee: alertes.filter((a: any) => a.statut_alerte === 'terminee').length,
    annulee: alertes.filter((a: any) => a.statut_alerte === 'annulee').length,
  };

  const content = (
    <div className={styles.authorityAlertes}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <Bell size={24} />
                {t('authority.alertes.title')}
              </h1>
              <p className={styles.pageSubtitle}>
                {filteredAlertes.length > 1 
                  ? t('authority.alertes.subtitlePlural').replace('{{count}}', String(filteredAlertes.length))
                  : t('authority.alertes.subtitle').replace('{{count}}', String(filteredAlertes.length))}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.refreshButton}
                onClick={() => fetchAlertes()}
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? styles.spinning : ''} />
                <span>{t('authority.alertes.refresh')}</span>
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => navigate(`${basePath}/alertes/new`)}
              >
                <Plus size={18} />
                <span>{t('authority.alertes.newAlerte')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{countByStatus.en_cours}</span>
            <span className={styles.statLabel}>{t('authority.alertes.stats.active')}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{countByStatus.brouillon}</span>
            <span className={styles.statLabel}>{t('authority.alertes.stats.draft')}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{countByStatus.terminee}</span>
            <span className={styles.statLabel}>{t('authority.alertes.stats.completed')}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {alertes.reduce((sum: number, a: any) => sum + (a.nombre_vues || 0), 0)}
            </span>
            <span className={styles.statLabel}>{t('authority.alertes.stats.totalViews')}</span>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('authority.alertes.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterTabs}>
            {([
              { key: 'all', label: t('authority.alertes.filters.all') },
              { key: 'brouillon', label: t('authority.alertes.filters.draft') },
              { key: 'en_cours', label: t('authority.alertes.filters.active') },
              { key: 'terminee', label: t('authority.alertes.filters.completed') },
              { key: 'annulee', label: t('authority.alertes.filters.cancelled') },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${filter === tab.key ? styles.active : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label} ({countByStatus[tab.key]})
              </button>
            ))}
          </div>
        </div>

        {loadError && (
          <div className={styles.errorBanner} role="alert">
            <AlertTriangle size={20} />
            <span>{loadError}</span>
          </div>
        )}
        {/* Alertes Grid */}
        <div className={styles.alertesGrid}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              <AdminCardsGridSkeleton cardCount={6} />
            </div>
          ) : filteredAlertes.length > 0 ? (
            filteredAlertes.map((alerte: any) => {
              const isDraft = alerte.statut_alerte === 'brouillon' || !alerte.statut_alerte;
              const isActive = alerte.statut_alerte === 'en_cours';
              const isTerminated = alerte.statut_alerte === 'terminee';
              const isCancelled = alerte.statut_alerte === 'annulee';

              return (
                <div 
                  key={alerte.id} 
                  className={`${styles.alerteCard} ${isDraft ? styles.draft : ''} ${isActive ? styles.active : ''} ${isTerminated ? styles.terminated : ''} ${isCancelled ? styles.cancelled : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <Bell size={18} className={styles.titleIcon} />
                      <h3>{alerte.titre || t('authority.alertes.noTitle')}</h3>
                    </div>
                    <span className={styles.statusBadge} data-status={alerte.statut_alerte || 'brouillon'}>
                      {isDraft && t('authority.alertes.status.draft')}
                      {isActive && t('authority.alertes.status.active')}
                      {isTerminated && t('authority.alertes.status.completed')}
                      {isCancelled && t('authority.alertes.status.cancelled')}
                    </span>
                  </div>

                  <p className={styles.cardMessage}>
                    {(alerte.message_court || alerte.message || t('authority.alertes.noMessage')).substring(0, 120)}
                    {(alerte.message_court || alerte.message || '').length > 120 && '...'}
                  </p>

                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <Calendar size={14} />
                      {new Date(alerte.date_diffusion || alerte.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                    <span className={styles.metaItem}>
                      <Tag size={14} />
                      {alerte.type_alerte || t('authority.alertes.typeStandard')}
                    </span>
                    <span className={styles.metaItem}>
                      <MapPin size={14} />
                      {alerte.rayon_km || 50} {t('authority.alertes.unitKm')}
                    </span>
                    {alerte.nombre_vues > 0 && (
                      <span className={styles.metaItem}>
                        <Eye size={14} />
                        {alerte.nombre_vues}
                      </span>
                    )}
                    {alerte.nombre_signalements_generes > 0 && (
                      <span className={styles.metaItem}>
                        <FileText size={14} />
                        {alerte.nombre_signalements_generes}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    {isDraft && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.publish}`}
                          onClick={() => openActionModal(alerte, 'publish')}
                          title={t('authority.alertes.actions.publish')}
                        >
                          <Send size={16} />
                          {t('authority.alertes.actions.publish')}
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.delete}`}
                          onClick={() => openActionModal(alerte, 'delete')}
                          title={t('authority.alertes.actions.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}

                    {isActive && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.complete}`}
                          onClick={() => openActionModal(alerte, 'complete')}
                          title={t('authority.alertes.actions.complete')}
                        >
                          <CheckCircle size={16} />
                          {t('authority.alertes.actions.complete')}
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.cancel}`}
                          onClick={() => openActionModal(alerte, 'cancel')}
                          title={t('authority.alertes.actions.cancel')}
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}

                    <button
                      className={styles.actionBtn}
                      onClick={() => navigate(`${basePath}/alertes/${alerte.id}`)}
                      title={t('authority.alertes.actions.viewDetails')}
                    >
                      <Eye size={16} />
                    </button>

                    {isDraft && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate(`${basePath}/alertes/${alerte.id}/edit`)}
                        title={t('authority.alertes.actions.edit')}
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <Bell size={48} />
              <h3>{t('authority.alertes.empty.title')}</h3>
              <p>
                {searchQuery
                  ? t('authority.alertes.empty.noSearchResults')
                  : filter !== 'all'
                    ? (() => {
                        const emptyKeys: Record<string, string> = {
                          'brouillon': 'authority.alertes.empty.nobrouillon',
                          'en_cours': 'authority.alertes.empty.noen_cours',
                          'terminee': 'authority.alertes.empty.noterminee',
                          'annulee': 'authority.alertes.empty.noannulee',
                        };
                        return t(emptyKeys[filter] || 'authority.alertes.empty.noAlerts');
                      })()
                    : t('authority.alertes.empty.noAlerts')}
              </p>
              <button 
                className={styles.primaryButton}
                onClick={() => navigate(`${basePath}/alertes/new`)}
              >
                <Plus size={18} />
                {t('authority.alertes.createAlerte')}
              </button>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && selectedAlerte && (
          <div className={styles.modalOverlay} onClick={closeActionModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeActionModal}>
                <X size={20} />
              </button>

              <div className={styles.modalHeader}>
                {actionType === 'publish' && <Send size={24} className={styles.modalIconPublish} />}
                {actionType === 'cancel' && <XCircle size={24} className={styles.modalIconCancel} />}
                {actionType === 'complete' && <CheckCircle size={24} className={styles.modalIconComplete} />}
                {actionType === 'delete' && <Trash2 size={24} className={styles.modalIconDelete} />}
                <h2>
                  {actionType === 'publish' && t('authority.alertes.modal.publishTitle')}
                  {actionType === 'cancel' && t('authority.alertes.modal.cancelTitle')}
                  {actionType === 'complete' && t('authority.alertes.modal.completeTitle')}
                  {actionType === 'delete' && t('authority.alertes.modal.deleteTitle')}
                </h2>
              </div>

              <p className={styles.modalAlertTitle}>
                <strong>{t('authority.alertes.modal.alerte')}:</strong> {selectedAlerte.titre}
              </p>

              {actionType === 'publish' && (
                <div className={styles.modalInfo}>
                  <Send size={16} />
                  {t('authority.alertes.modal.publishInfo')}
                </div>
              )}

              {actionType === 'delete' && (
                <div className={styles.modalWarning}>
                  <AlertTriangle size={16} />
                  {t('authority.alertes.modal.deleteWarning')}
                </div>
              )}

              {actionType !== 'delete' && (
                <div className={styles.modalField}>
                  <label>{t('authority.alertes.modal.commentLabel')}</label>
                  <textarea
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder={t('authority.alertes.modal.commentPlaceholder')}
                    rows={3}
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.cancelButton} onClick={closeActionModal}>
                  {t('authority.alertes.modal.cancel')}
                </button>
                <button
                  className={`${styles.confirmButton} ${styles[actionType || '']}`}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={16} className={styles.spinning} />
                      {t('authority.alertes.modal.processing')}
                    </>
                  ) : (
                    t('authority.alertes.modal.confirm')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default AlertesPage;
