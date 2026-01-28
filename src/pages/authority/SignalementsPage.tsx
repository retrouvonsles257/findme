/**
 * =====================================================
 * RETROUVONSLES - Signalements Validation Page
 * Validation et traitement des signalements
 * Connecté à Supabase avec vraies données
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { useSignalementValidation } from '../../features/signalements/hooks/useSignalementValidation';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import styles from './SignalementsPage.module.css';

type FilterType = 'all' | 'en_attente' | 'en_verification' | 'valide' | 'invalide';

export const SignalementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { signalements, isLoading, fetchSignalements } = useSignalements();
  const { t, language } = useI18n();
  const { 
    validateSignalement, 
    isLoading: validationLoading, 
    reset: resetValidation 
  } = useSignalementValidation();
  
  const [filter, setFilter] = useState<FilterType>('en_attente');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignalement, setSelectedSignalement] = useState<string | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approuve' | 'rejete' | null>(null);

  const filteredSignalements = signalements.filter((s) => {
    const status = s.statut_validation || s.etat || 'en_attente';
    const matchFilter = filter === 'all' || status === filter;
    const matchSearch =
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.lieu_observation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const countByStatus = {
    all: signalements.length,
    en_attente: signalements.filter(s => s.statut_validation === 'en_attente' || s.etat === 'nouveau').length,
    en_verification: signalements.filter(s => s.statut_validation === 'en_verification' || s.etat === 'en_cours').length,
    valide: signalements.filter(s => s.statut_validation === 'valide').length,
    invalide: signalements.filter(s => s.statut_validation === 'invalide' || s.etat === 'rejete').length,
  };

  const openValidationModal = useCallback((signalementId: string, decision: 'approuve' | 'rejete') => {
    setSelectedSignalement(signalementId);
    setPendingDecision(decision);
    setValidationComment('');
    setShowValidationModal(true);
    resetValidation();
  }, [resetValidation]);

  const closeValidationModal = useCallback(() => {
    setShowValidationModal(false);
    setSelectedSignalement(null);
    setPendingDecision(null);
    setValidationComment('');
  }, []);

  const handleValidate = useCallback(async () => {
    if (!selectedSignalement || !pendingDecision || !user?.id) {
      addNotification({
        title: t('authority.signalements.messages.error'),
        message: t('authority.signalements.messages.missingData'),
        type: 'error',
      });
      return;
    }

    try {
      await validateSignalement(selectedSignalement, user.id, {
        decision: pendingDecision,
        raison: validationComment || t('authority.signalements.messages.defaultValidationReason'),
        score_confiance: pendingDecision === 'approuve' ? 80 : 30,
      });

      addNotification({
        title: t('authority.signalements.messages.success'),
        message: pendingDecision === 'approuve' 
          ? t('authority.signalements.messages.validatedSuccess')
          : t('authority.signalements.messages.rejectedSuccess'),
        type: 'success',
      });

      fetchSignalements();
      closeValidationModal();
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la validation',
        type: 'error',
      });
    }
  }, [selectedSignalement, pendingDecision, user?.id, validationComment, validateSignalement, addNotification, fetchSignalements, closeValidationModal]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleQuickValidate = useCallback(async (signalementId: string, approved: boolean) => {
    if (!user?.id) {
      addNotification({
        title: t('authority.signalements.messages.error'),
        message: t('authority.signalements.messages.notAuthenticated'),
        type: 'error',
      });
      return;
    }

    try {
      await validateSignalement(signalementId, user.id, {
        decision: approved ? 'approuve' : 'rejete',
        raison: approved 
          ? t('authority.signalements.messages.quickValidationApproved')
          : t('authority.signalements.messages.quickValidationRejected'),
        score_confiance: approved ? 80 : 30,
      });

      addNotification({
        title: t('authority.signalements.messages.success'),
        message: approved 
          ? t('authority.signalements.messages.validatedSuccess')
          : t('authority.signalements.messages.rejectedSuccess'),
        type: 'success',
      });

      fetchSignalements();
    } catch (err: any) {
      addNotification({
        title: t('authority.signalements.messages.error'),
        message: err.message || t('authority.signalements.messages.validationError'),
        type: 'error',
      });
    }
  }, [user?.id, validateSignalement, addNotification, fetchSignalements, t]);

  const getCertitudeColor = (certitude?: string) => {
    switch (certitude) {
      case 'certain': return '#22c55e';
      case 'tres_probable': return '#3b82f6';
      case 'probable': return '#eab308';
      case 'incertain': return '#f97316';
      default: return '#94a3b8';
    }
  };

  return (
    <AuthorityLayout>
      <div className={styles.authoritySignalements}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <FileSearch size={24} />
                {t('authority.signalements.title')}
              </h1>
              <p className={styles.pageSubtitle}>
                {countByStatus.en_attente === 1
                  ? t('authority.signalements.subtitle').replace('{{count}}', String(countByStatus.en_attente))
                  : t('authority.signalements.subtitlePlural').replace('{{count}}', String(countByStatus.en_attente))}
              </p>
            </div>
            <button 
              className={styles.refreshButton}
              onClick={() => fetchSignalements()}
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
              <span>{t('authority.signalements.refresh')}</span>
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <button 
            className={`${styles.statCard} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            <FileSearch size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.all}</span>
              <span className={styles.statLabel}>{t('authority.signalements.stats.total')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.pending} ${filter === 'en_attente' ? styles.active : ''}`}
            onClick={() => setFilter('en_attente')}
          >
            <Clock size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.en_attente}</span>
              <span className={styles.statLabel}>{t('authority.signalements.stats.pending')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.inProgress} ${filter === 'en_verification' ? styles.active : ''}`}
            onClick={() => setFilter('en_verification')}
          >
            <Search size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.en_verification}</span>
              <span className={styles.statLabel}>{t('authority.signalements.stats.inVerification')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.success} ${filter === 'valide' ? styles.active : ''}`}
            onClick={() => setFilter('valide')}
          >
            <CheckCircle size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.valide}</span>
              <span className={styles.statLabel}>{t('authority.signalements.stats.validated')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.danger} ${filter === 'invalide' ? styles.active : ''}`}
            onClick={() => setFilter('invalide')}
          >
            <XCircle size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.invalide}</span>
              <span className={styles.statLabel}>{t('authority.signalements.stats.rejected')}</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('authority.signalements.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Signalements Grid */}
        <div className={styles.signalementsGrid}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <RefreshCw size={24} className={styles.spinning} />
              <span>{t('authority.signalements.loading')}</span>
            </div>
          ) : filteredSignalements.length > 0 ? (
            filteredSignalements.map((signalement: any) => {
              const status = signalement.statut_validation || signalement.etat || 'en_attente';
              const isPending = status === 'en_attente' || status === 'nouveau';
              
              return (
                <div 
                  key={signalement.id} 
                  className={`${styles.signalementCard} ${isPending ? styles.pending : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <span 
                      className={styles.certitudeBadge}
                      style={{ backgroundColor: getCertitudeColor(signalement.niveau_certitude) }}
                    >
                      {signalement.niveau_certitude 
                        ? t(`authority.signalements.certitude.${signalement.niveau_certitude}`)
                        : t('authority.signalements.certitude.notSpecified')}
                    </span>
                    <span className={styles.statusBadge} data-status={status}>
                      {status === 'en_attente' || status === 'nouveau' 
                        ? t('authority.signalements.status.pending')
                        : status === 'en_verification' 
                          ? t('authority.signalements.status.inVerification')
                          : status === 'valide' 
                            ? t('authority.signalements.status.validated')
                            : t('authority.signalements.status.rejected')}
                    </span>
                  </div>

                  <p className={styles.cardDescription}>
                    {(signalement.description || t('authority.signalements.noDescription')).substring(0, 150)}
                    {(signalement.description || '').length > 150 && '...'}
                  </p>

                  <div className={styles.cardMeta}>
                    {signalement.lieu_observation && (
                      <span className={styles.metaItem}>
                        <MapPin size={14} />
                        {signalement.lieu_observation}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <Calendar size={14} />
                      {signalement.date_observation 
                        ? new Date(signalement.date_observation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
                        : t('authority.signalements.unknownDate')}
                    </span>
                    {signalement.temoin_anonyme === false && signalement.nom_temoin && (
                      <span className={styles.metaItem}>
                        <User size={14} />
                        {signalement.nom_temoin}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    {isPending && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.approve}`}
                          onClick={() => openValidationModal(signalement.id, 'approuve')}
                          title={t('authority.signalements.actions.validate')}
                        >
                          <ThumbsUp size={16} />
                          {t('authority.signalements.actions.validate')}
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.reject}`}
                          onClick={() => openValidationModal(signalement.id, 'rejete')}
                          title={t('authority.signalements.actions.reject')}
                        >
                          <ThumbsDown size={16} />
                          {t('authority.signalements.actions.reject')}
                        </button>
                      </>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={() => navigate(`/authority/signalements/${signalement.id}`)}
                      title={t('authority.signalements.actions.viewDetails')}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <FileSearch size={48} />
              <h3>{t('authority.signalements.empty.title')}</h3>
              <p>
                {searchQuery 
                  ? t('authority.signalements.empty.noSearchResults')
                  : filter !== 'all'
                    ? (() => {
                        const emptyKeys: Record<string, string> = {
                          'en_attente': 'authority.signalements.empty.noPending',
                          'en_verification': 'authority.signalements.empty.noInVerification',
                          'valide': 'authority.signalements.empty.noValidated',
                          'invalide': 'authority.signalements.empty.noRejected',
                        };
                        return t(emptyKeys[filter] || 'authority.signalements.empty.noSignalements');
                      })()
                    : t('authority.signalements.empty.noSignalements')}
              </p>
            </div>
          )}
        </div>

        {/* Validation Modal */}
        {showValidationModal && (
          <div className={styles.modalOverlay} onClick={closeValidationModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeValidationModal}>
                <X size={20} />
              </button>

              <div className={styles.modalHeader}>
                {pendingDecision === 'approuve' ? (
                  <CheckCircle size={24} className={styles.modalIconApprove} />
                ) : (
                  <XCircle size={24} className={styles.modalIconReject} />
                )}
                <h2>
                  {pendingDecision === 'approuve' 
                    ? t('authority.signalements.modal.validateTitle')
                    : t('authority.signalements.modal.rejectTitle')}
                </h2>
              </div>

              <div className={styles.modalInfo}>
                <AlertTriangle size={16} />
                {pendingDecision === 'approuve' 
                  ? t('authority.signalements.modal.validateInfo')
                  : t('authority.signalements.modal.rejectInfo')}
              </div>

              <div className={styles.modalField}>
                <label>{t('authority.signalements.modal.commentLabel')}</label>
                <textarea
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  placeholder={t('authority.signalements.modal.commentPlaceholder')}
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelButton} onClick={closeValidationModal}>
                  {t('authority.signalements.modal.cancel')}
                </button>
                <button
                  className={`${styles.confirmButton} ${pendingDecision === 'approuve' ? styles.approve : styles.reject}`}
                  onClick={handleValidate}
                  disabled={validationLoading}
                >
                  {validationLoading ? (
                    <>
                      <RefreshCw size={16} className={styles.spinning} />
                      {t('authority.signalements.modal.processing')}
                    </>
                  ) : (
                    <>
                      {pendingDecision === 'approuve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      {t('authority.signalements.modal.confirm')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default SignalementsPage;
