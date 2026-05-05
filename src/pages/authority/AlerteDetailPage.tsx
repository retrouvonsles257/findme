/**
 * =====================================================
 * RETROUVONSLES - Alerte Detail Page
 * Vue détaillée d'une alerte
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts';
import { 
  getAlerteById, 
  updateAlerteStatut, 
  diffuserAlerte 
} from '../../features/alertes/services/alerteAPI';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import {
  BarChart2,
  FolderOpen,
  FileEdit,
  Megaphone,
  Radio,
  Loader2,
  CheckCircle,
  XCircle,
  Clipboard,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './AlerteDetailPage.module.css';

export interface AlerteDetailPageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /authority */
  basePath?: string;
}

export const AlerteDetailPage: React.FC<AlerteDetailPageProps> = ({ noLayout = false, basePath = '/authority' }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const alertesListPath = `${basePath}/alertes`;
  const { addNotification } = useNotification();
  const { t, language } = useI18n();
  
  const [alerte, setAlerte] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Charger l'alerte
  useEffect(() => {
    const loadAlerte = async () => {
      if (!id) return;

      try {
        setLoadError(null);
        const data = await getAlerteById(id);
        setAlerte(data);
      } catch (err: any) {
        setLoadError(err?.message || t('authority.alertes.alerteDetail.messages.loadError'));
        addNotification({
          title: t('authority.alertes.alerteDetail.messages.error'),
          message: t('authority.alertes.alerteDetail.messages.loadError'),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerte();
  }, [id, addNotification, navigate]);

  // Changer le statut
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!id) return;

    setActionLoading(true);
    try {
      const updated = await updateAlerteStatut(id, newStatus as any);
      setAlerte(updated);
      const statusLabel = t(`authority.alertes.status.${newStatus}`);
      addNotification({
        title: t('authority.alertes.alerteDetail.messages.statusUpdated'),
        message: t('authority.alertes.alerteDetail.messages.statusChanged').replace('{{status}}', statusLabel),
        type: 'success',
      });
    } catch (err: any) {
      addNotification({
        title: t('authority.alertes.alerteDetail.messages.error'),
        message: err.message || t('authority.alertes.alerteDetail.messages.updateError'),
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }, [id, addNotification]);

  // Diffuser l'alerte
  const handleDiffuse = useCallback(async () => {
    if (!id) return;

    setActionLoading(true);
    try {
      const result = await diffuserAlerte(id);
      addNotification({
        title: t('authority.alertes.alerteDetail.messages.alerteDiffused'),
        message: t('authority.alertes.alerteDetail.messages.alerteSentToUsers').replace('{{count}}', String(result.nombre_destinataires)),
        type: result.nombre_destinataires === 0 ? 'warning' : 'success',
      });
      // Refresh
      const updated = await getAlerteById(id);
      setAlerte(updated);
    } catch (err: any) {
      addNotification({
        title: t('authority.alertes.alerteDetail.messages.error'),
        message: err.message || t('authority.alertes.alerteDetail.messages.diffusionError'),
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }, [id, addNotification]);

  // Obtenir l'info du statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'en_cours':
        return { label: t('authority.alertes.status.active'), color: '#28a745', icon: <Megaphone size={14} /> };
      case 'terminee':
        return { label: t('authority.alertes.status.completed'), color: '#6c757d', icon: <CheckCircle size={14} /> };
      case 'annulee':
        return { label: t('authority.alertes.status.cancelled'), color: '#dc3545', icon: <XCircle size={14} /> };
      default:
        return { label: t('authority.alertes.status.draft'), color: '#ffc107', icon: <FileEdit size={14} /> };
    }
  };

  if (isLoading) {
    const skeleton = (
      <div className={styles.detailSkeletonWrap}>
        <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
      </div>
    );
    if (noLayout) return skeleton;
    return <AuthorityLayout>{skeleton}</AuthorityLayout>;
  }

  if (loadError) {
    const errorBlock = (
      <div className={styles.errorBanner} role="alert">
        <p>{loadError}</p>
        <button type="button" className={styles.backBtn} onClick={() => navigate(alertesListPath)}>
          {t('authority.commonActions.back')}
        </button>
      </div>
    );
    if (noLayout) return errorBlock;
    return <AuthorityLayout>{errorBlock}</AuthorityLayout>;
  }

  if (!alerte) {
    const notFound = (
      <div className={styles.notFound}>{t('authority.alertes.alerteDetail.notFound')}</div>
    );
    if (noLayout) return notFound;
    return <AuthorityLayout>{notFound}</AuthorityLayout>;
  }

  const statusInfo = getStatusInfo(alerte.statut_alerte);
  const isDraft = alerte.statut_alerte === 'brouillon' || !alerte.statut_alerte;
  const isActive = alerte.statut_alerte === 'en_cours';

  const content = (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(alertesListPath)} className={styles.backBtn}>
              <ArrowLeft size={16} /> {t('authority.commonActions.back')}
            </button>
            <div>
              <h1>{alerte.titre || t('authority.alertes.noTitle')}</h1>
              <p className={styles.alerteId}>
                {alerte.numero_alerte || `ALE-${alerte.id.substring(0, 8)}`}
              </p>
            </div>
          </div>
          <span 
            className={styles.statusBadge}
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Info Card */}
          <div className={styles.card}>
            <h2><Clipboard size={20} /> {t('authority.alertes.alerteDetail.sections.information')}</h2>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>{t('authority.alertes.alerteDetail.fields.alertType')}</label>
                <span>{alerte.type_alerte || t('authority.alertes.typeStandard')}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>{t('authority.alertes.alerteDetail.fields.creationDate')}</label>
                <span>{new Date(alerte.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>{t('authority.alertes.alerteDetail.fields.diffusionDate')}</label>
                <span>
                  {alerte.date_diffusion 
                    ? new Date(alerte.date_diffusion).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
                    : t('authority.alertes.alerteDetail.fields.notDiffused')}
                </span>
              </div>
              
              <div className={styles.infoItem}>
                <label>{t('authority.alertes.alerteDetail.fields.diffusionRadius')}</label>
                <span>{alerte.rayon_km || 50} {t('authority.alertes.unitKm')}</span>
              </div>
            </div>
          </div>

          {/* Message Card */}
          <div className={styles.card}>
            <h2><MessageSquare size={20} /> {t('authority.alertes.alerteDetail.sections.message')}</h2>
            <div className={styles.messageContent}>
              <p>{alerte.message || t('authority.alertes.noMessage')}</p>
            </div>
            {alerte.message_court && (
              <div className={styles.shortMessage}>
                <label>{t('authority.alertes.alerteDetail.fields.shortMessage')}:</label>
                <p>{alerte.message_court}</p>
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className={styles.card}>
            <h2><BarChart2 size={20} /> {t('authority.alertes.alerteDetail.sections.statistics')}</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_destinataires || 0}</span>
                <span className={styles.statLabel}>{t('authority.alertes.alerteDetail.stats.recipients')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_vues || 0}</span>
                <span className={styles.statLabel}>{t('authority.alertes.alerteDetail.stats.views')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_partages || 0}</span>
                <span className={styles.statLabel}>{t('authority.alertes.alerteDetail.stats.shares')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_signalements_generes || 0}</span>
                <span className={styles.statLabel}>{t('authority.alertes.alerteDetail.stats.reports')}</span>
              </div>
            </div>
          </div>

          {/* Dossier Link */}
          {alerte.dossier_disparition && (
            <div className={styles.card}>
              <h2><FolderOpen size={20} /> {t('authority.alertes.alerteDetail.sections.linkedDossier')}</h2>
              <div 
                className={styles.dossierLink}
                onClick={() => navigate(`${basePath}/dossiers/${alerte.id_dossier}`)}
              >
                <span>{alerte.dossier_disparition.numero_dossier || t('authority.alertes.alerteDetail.actions.viewDossier')}</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isDraft && (
            <>
              <button 
                onClick={() => navigate(`${basePath}/alertes/${id}/edit`)}
                className={styles.editBtn}
                disabled={actionLoading}
              >
                <FileEdit size={16} /> {t('authority.alertes.actions.edit')}
              </button>
              <button 
                onClick={() => handleStatusChange('en_cours')}
                className={styles.publishBtn}
                disabled={actionLoading}
              >
                {actionLoading ? <><Loader2 size={16} className={styles.spinner} /> {t('authority.alertes.alerteDetail.actions.processing')}</> : <><Megaphone size={16} /> {t('authority.alertes.actions.publish')}</>}
              </button>
            </>
          )}
          
          {isActive && (
            <>
              <button 
                onClick={handleDiffuse}
                className={styles.diffuseBtn}
                disabled={actionLoading}
              >
                {actionLoading ? <><Loader2 size={16} className={styles.spinner} /> {t('authority.alertes.alerteDetail.actions.diffusing')}</> : <><Radio size={16} /> {t('authority.alertes.alerteDetail.actions.rediffuse')}</>}
              </button>
              <button 
                onClick={() => handleStatusChange('terminee')}
                className={styles.completeBtn}
                disabled={actionLoading}
              >
                <CheckCircle size={16} /> {t('authority.alertes.actions.complete')}
              </button>
              <button 
                onClick={() => handleStatusChange('annulee')}
                className={styles.cancelBtn}
                disabled={actionLoading}
              >
                <XCircle size={16} /> {t('authority.alertes.actions.cancel')}
              </button>
            </>
          )}
        </div>
      </div>
  );

  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default AlerteDetailPage;
