/**
 * =====================================================
 * RETROUVONSLES - Signalement Detail Page
 * Vue détaillée d'un signalement
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { supabase } from '../../config';
import { useSignalementValidation } from '../../features/signalements/hooks/useSignalementValidation';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import {
  MapPin,
  FileText,
  User,
  Camera,
  FolderOpen,
  Search,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './SignalementDetailPage.module.css';

export interface SignalementDetailPageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /authority */
  basePath?: string;
}

export const SignalementDetailPage: React.FC<SignalementDetailPageProps> = ({ noLayout = false, basePath = '/authority' }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const signalementsListPath = `${basePath}/signalements`;
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { t, language } = useI18n();
  const { validateSignalement, isLoading: validationLoading } = useSignalementValidation();

  const [signalement, setSignalement] = useState<any>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approuve' | 'rejete' | null>(null);

  // Charger le signalement
  useEffect(() => {
    const loadSignalement = async () => {
      if (!id) return;

      try {
        const { data: sigData, error: sigError } = await (supabase as any)
          .from('signalement')
          .select('*')
          .eq('id', id)
          .single();

        if (sigError) throw sigError;
        setSignalement(sigData);

        // Charger le dossier lié si existe
        if (sigData.id_dossier) {
          const { data: dosData } = await (supabase as any)
            .from('dossier_disparition')
            .select('*, personne:id_personne(*)')
            .eq('id', sigData.id_dossier)
            .single();

          if (dosData) setDossier(dosData);
        }
      } catch (err: any) {
        setLoadError(err?.message || t('authority.signalementDetail.messages.loadError'));
        addNotification({
          title: t('authority.signalements.messages.error'),
          message: t('authority.signalementDetail.messages.loadError'),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSignalement();
  }, [id, addNotification, navigate]);

  // Ouvrir modal validation
  const openValidationModal = (decision: 'approuve' | 'rejete') => {
    setPendingDecision(decision);
    setValidationComment('');
    setShowValidationModal(true);
  };

  // Valider
  const handleValidate = useCallback(async () => {
    if (!id || !pendingDecision || !user?.id) return;

    try {
      await validateSignalement(id, user.id, {
        decision: pendingDecision,
        raison: validationComment || t('authority.signalements.messages.defaultValidationReason'),
        score_confiance: pendingDecision === 'approuve' ? 80 : 30,
      });

      addNotification({
        title: t('authority.signalements.messages.success'),
        message:
          pendingDecision === 'approuve'
            ? t('authority.signalements.messages.validatedSuccess')
            : t('authority.signalements.messages.rejectedSuccess'),
        type: 'success',
      });

      // Refresh
      const { data } = await (supabase as any)
        .from('signalement')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setSignalement(data);
      setShowValidationModal(false);
    } catch (err: any) {
      addNotification({
        title: t('authority.signalements.messages.error'),
        message: err.message || t('authority.signalements.messages.validationError'),
        type: 'error',
      });
    }
  }, [
    id,
    pendingDecision,
    user?.id,
    validationComment,
    validateSignalement,
    addNotification,
    t,
  ]);

  // Obtenir le statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'valide':
        return { label: t('authority.signalements.status.validated'), color: '#0ea5e9', icon: <CheckCircle size={14} /> };
      case 'invalide':
      case 'rejete':
        return { label: t('authority.signalements.status.rejected'), color: '#dc3545', icon: <XCircle size={14} /> };
      case 'en_verification':
        return { label: t('authority.signalements.status.inVerification'), color: '#38bdf8', icon: <Search size={14} /> };
      default:
        return { label: t('authority.signalements.status.pending'), color: '#ffc107', icon: <Clock size={14} /> };
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
        <button type="button" className={styles.backBtn} onClick={() => navigate(signalementsListPath)}>
          {t('authority.commonActions.back')}
        </button>
      </div>
    );
    if (noLayout) return errorBlock;
    return <AuthorityLayout>{errorBlock}</AuthorityLayout>;
  }

  if (!signalement) {
    const notFoundEl = <div className={styles.notFound}>{t('authority.signalementDetail.notFound')}</div>;
    if (noLayout) return notFoundEl;
    return <AuthorityLayout>{notFoundEl}</AuthorityLayout>;
  }

  const statusInfo = getStatusInfo(signalement.statut_validation || signalement.etat);
  const canValidate = signalement.statut_validation === 'en_attente' || 
                      signalement.statut_validation === 'en_verification' ||
                      !signalement.statut_validation;

  const content = (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(signalementsListPath)} className={styles.backBtn}>
              {t('authority.commonActions.back')}
            </button>
            <div>
              <h1>{t('authority.signalementDetail.title')}</h1>
              <p className={styles.signalementId}>
                SIG-{signalement.id.substring(0, 8).toUpperCase()}
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
          {/* Info principale */}
          <div className={styles.card}>
            <h2><MapPin size={20} /> {t('authority.signalementDetail.sections.observationInfo')}</h2>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.observationLocation')}</label>
                <span>{signalement.lieu_observation || t('authority.signalementDetail.values.notProvided')}</span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.city')}</label>
                <span>{signalement.ville_observation || t('authority.signalementDetail.values.na')}</span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.observationDate')}</label>
                <span>
                  {signalement.date_observation 
                    ? new Date(signalement.date_observation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
                    : t('authority.signalementDetail.values.notProvidedFeminine')}
                </span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.certaintyLevel')}</label>
                <span>
                  {t(
                    `authority.signalements.certitude.${signalement.niveau_certitude || 'probable'}`
                  )}
                </span>
              </div>

              {signalement.latitude_observation && signalement.longitude_observation && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.gpsCoordinates')}</label>
                  <span>
                    {signalement.latitude_observation.toFixed(4)}, {signalement.longitude_observation.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2><FileText size={20} /> {t('authority.signalementDetail.sections.description')}</h2>
            <div className={styles.descriptionContent}>
              <p>{signalement.description || t('authority.signalementDetail.values.noDescription')}</p>
            </div>
          </div>

          {/* Témoin */}
          <div className={styles.card}>
            <h2><User size={20} /> {t('authority.signalementDetail.sections.witnessInfo')}</h2>
            {signalement.temoin_anonyme ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                {t('authority.signalementDetail.witness.anonymous')}
              </p>
            ) : (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.witness.name')}</label>
                  <span>{signalement.nom_temoin || t('authority.signalementDetail.values.notProvided')}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.witness.phone')}</label>
                  <span>{signalement.telephone_temoin || t('authority.signalementDetail.values.notProvided')}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.witness.email')}</label>
                  <span>{signalement.email_temoin || t('authority.signalementDetail.values.notProvided')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          {(signalement.photos && signalement.photos.length > 0) || signalement.photo_url ? (
            <div className={styles.card}>
              <h2><Camera size={20} /> {t('authority.signalementDetail.sections.photos')}</h2>
              <div className={styles.photosGrid}>
                {signalement.photo_url && (
                  <img src={signalement.photo_url} alt={t('authority.signalementDetail.photos.altMain')} />
                )}
                {signalement.photos?.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt={`${t('authority.signalementDetail.photos.photo')} ${idx + 1}`} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Dossier lié */}
          {dossier && (
            <div className={styles.card}>
              <h2><FolderOpen size={20} /> {t('authority.signalementDetail.sections.linkedDossier')}</h2>
              <div 
                className={styles.dossierLink}
                onClick={() => navigate(`${basePath}/dossiers/${dossier.id}`)}
              >
                <div>
                  <strong>{dossier.numero_dossier}</strong>
                  {dossier.personne && (
                    <span> - {dossier.personne.prenom} {dossier.personne.nom}</span>
                  )}
                </div>
                <span>→</span>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className={styles.card}>
            <h2><FileText size={20} /> {t('authority.signalementDetail.sections.metadata')}</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.createdAt')}</label>
                <span>{new Date(signalement.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
              </div>
              {signalement.score_pertinence && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.relevanceScore')}</label>
                  <span>{Math.round(signalement.score_pertinence * 100)}%</span>
                </div>
              )}
              {signalement.score_correspondance && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.matchScore')}</label>
                  <span>{Math.round(signalement.score_correspondance * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {canValidate && (
          <div className={styles.actions}>
            <button 
              onClick={() => openValidationModal('approuve')}
              className={styles.approveBtn}
              disabled={validationLoading}
            >
              <CheckCircle size={16} /> {t('authority.signalements.actions.validate')}
            </button>
            <button 
              onClick={() => openValidationModal('rejete')}
              className={styles.rejectBtn}
              disabled={validationLoading}
            >
              <XCircle size={16} /> {t('authority.signalements.actions.reject')}
            </button>
          </div>
        )}

        {/* Modal de validation */}
        {showValidationModal && (
          <div 
            className={styles.modalOverlay}
            onClick={() => setShowValidationModal(false)}
          >
            <div 
              className={styles.modalContent}
              onClick={e => e.stopPropagation()}
            >
              <h2>
                {pendingDecision === 'approuve'
                  ? t('authority.signalements.modal.validateTitle')
                  : t('authority.signalements.modal.rejectTitle')}
              </h2>

              <div className={styles.formGroup}>
                <label>{t('authority.signalements.modal.commentLabel')}:</label>
                <textarea
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  placeholder={t('authority.signalements.modal.commentPlaceholder')}
                  rows={4}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  onClick={() => setShowValidationModal(false)}
                  className={styles.cancelBtn}
                >
                  {t('authority.signalements.modal.cancel')}
                </button>
                <button 
                  onClick={handleValidate}
                  className={pendingDecision === 'approuve' ? styles.approveBtn : styles.rejectBtn}
                  disabled={validationLoading}
                >
                  {validationLoading ? t('authority.signalements.modal.processing') : t('authority.signalements.modal.confirm')}
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

export default SignalementDetailPage;
