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

function normalizeCertitudeKey(raw: string | null | undefined): string {
  if (raw == null || raw === '') return 'notSpecified';
  return String(raw).trim().toLowerCase().replace(/-/g, '_');
}

function withSignalementPhotoUrls(sigData: any) {
  if (!sigData) return sigData;
  const raw = sigData.photos;
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const urls = arr
    .map((p: { url_cloudinary?: string; url_thumbnail?: string | null }) => p?.url_cloudinary || p?.url_thumbnail)
    .filter(Boolean) as string[];
  const { photos: _nested, ...rest } = sigData;
  return {
    ...rest,
    photos: urls.length ? urls : Array.isArray(rest.photos) ? rest.photos : [],
    photo_url: urls[0] ?? rest.photo_url ?? null,
  };
}

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
  const [reporter, setReporter] = useState<{ nom?: string; prenom?: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approuve' | 'rejete' | null>(null);

  // Charger le signalement (+ photos liées, dossier)
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

        const { data: photoRows } = await (supabase as any)
          .from('photo')
          .select('id, url_cloudinary, url_thumbnail')
          .eq('id_signalement', id);

        setSignalement(withSignalementPhotoUrls({ ...sigData, photos: photoRows || [] }));

        setReporter(null);
        const uid = sigData.id_utilisateur as string | undefined;
        if (uid) {
          const { data: rep } = await (supabase as any)
            .from('utilisateur')
            .select('nom, prenom, email')
            .eq('id', uid)
            .maybeSingle();
          if (rep) setReporter(rep);
        }

        setDossier(null);
        if (sigData.id_dossier) {
          const { data: dosData, error: dosErr } = await (supabase as any)
            .from('dossier_disparition')
            .select(
              'id, numero_dossier, statut_dossier, id_personne, personne:personne(id, prenom, nom, nom_complet)',
            )
            .eq('id', sigData.id_dossier)
            .single();

          if (!dosErr && dosData) setDossier(dosData);
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
  }, [id, addNotification, t]);

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

      const { data: sigData } = await (supabase as any).from('signalement').select('*').eq('id', id).single();
      if (sigData) {
        const { data: photoRows } = await (supabase as any)
          .from('photo')
          .select('id, url_cloudinary, url_thumbnail')
          .eq('id_signalement', id);
        setSignalement(withSignalementPhotoUrls({ ...sigData, photos: photoRows || [] }));
      }
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

  const precisionNorm = signalement.precision_localisation
    ? normalizeCertitudeKey(signalement.precision_localisation)
    : '';
  const precisionKey = signalement.precision_localisation
    ? `authority.signalementDetail.precision.${precisionNorm || 'not_specified'}`
    : null;
  const precisionLabel = precisionKey
    ? (() => {
        const tr = t(precisionKey);
        return tr === precisionKey ? String(signalement.precision_localisation) : tr;
      })()
    : null;

  const certKey = `authority.signalements.certitude.${normalizeCertitudeKey(signalement.niveau_certitude)}`;
  const certitudeLabel = (() => {
    const translated = t(certKey);
    return translated === certKey ? t('authority.signalements.certitude.notSpecified') : translated;
  })();

  const lat = signalement.latitude_observation != null ? Number(signalement.latitude_observation) : NaN;
  const lng = signalement.longitude_observation != null ? Number(signalement.longitude_observation) : NaN;
  const hasGps = Number.isFinite(lat) && Number.isFinite(lng);

  const dossierPerson = dossier
    ? Array.isArray(dossier.personne)
      ? dossier.personne[0]
      : dossier.personne
    : null;

  const photoUrlsUnique = (() => {
    const raw = (signalement.photos || []) as string[];
    const fromList = raw.filter((u) => typeof u === 'string' && u.length > 0);
    const set = new Set<string>(fromList);
    if (signalement.photo_url && typeof signalement.photo_url === 'string') set.add(signalement.photo_url);
    return [...set];
  })();

  const formatJson = (v: unknown) => {
    if (v == null) return null;
    if (typeof v === 'string') return v.trim() || null;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  const boolLabel = (v: boolean | null | undefined) =>
    v === true ? t('authority.signalementDetail.values.yes') : v === false ? t('authority.signalementDetail.values.no') : null;

  const hasContextSection = Boolean(
    signalement.contexte_observation ||
      signalement.duree_observation ||
      signalement.etat_personne_observee ||
      signalement.accompagnement ||
      signalement.direction_deplacement ||
      signalement.moyen_deplacement,
  );

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
              {signalement.numero_signalement && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.reportNumber')}</label>
                  <span>{signalement.numero_signalement}</span>
                </div>
              )}

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.observationLocation')}</label>
                <span>{signalement.lieu_observation || t('authority.signalementDetail.values.notProvided')}</span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.city')}</label>
                <span>{signalement.ville_observation || t('authority.signalementDetail.values.na')}</span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.region')}</label>
                <span>{signalement.region_observation || t('authority.signalementDetail.values.na')}</span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.country')}</label>
                <span>{signalement.pays_observation || t('authority.signalementDetail.values.na')}</span>
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
                <span>{certitudeLabel}</span>
              </div>

              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.locationPrecision')}</label>
                <span>{precisionLabel || signalement.precision_localisation || t('authority.signalementDetail.values.na')}</span>
              </div>

              {signalement.distance_observation && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.observationDistance')}</label>
                  <span>{signalement.distance_observation}</span>
                </div>
              )}

              {hasGps && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.gpsCoordinates')}</label>
                  <span>
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {hasContextSection ? (
            <div className={styles.card}>
              <h2>
                <FileText size={20} /> {t('authority.signalementDetail.sections.context')}
              </h2>
              <div className={styles.infoGrid}>
                {signalement.contexte_observation && (
                  <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                    <label>{t('authority.signalementDetail.fields.observationContext')}</label>
                    <span>{signalement.contexte_observation}</span>
                  </div>
                )}
                {signalement.duree_observation && (
                  <div className={styles.infoItem}>
                    <label>{t('authority.signalementDetail.fields.observationDuration')}</label>
                    <span>{signalement.duree_observation}</span>
                  </div>
                )}
                {signalement.etat_personne_observee && (
                  <div className={styles.infoItem}>
                    <label>{t('authority.signalementDetail.fields.observedPersonState')}</label>
                    <span>{signalement.etat_personne_observee}</span>
                  </div>
                )}
                {signalement.accompagnement && (
                  <div className={styles.infoItem}>
                    <label>{t('authority.signalementDetail.fields.accompaniment')}</label>
                    <span>{signalement.accompagnement}</span>
                  </div>
                )}
                {signalement.direction_deplacement && (
                  <div className={styles.infoItem}>
                    <label>{t('authority.signalementDetail.fields.travelDirection')}</label>
                    <span>{signalement.direction_deplacement}</span>
                  </div>
                )}
                {signalement.moyen_deplacement && (
                  <div className={styles.infoItem}>
                    <label>{t('authority.signalementDetail.fields.travelMeans')}</label>
                    <span>{signalement.moyen_deplacement}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Description */}
          <div className={styles.card}>
            <h2><FileText size={20} /> {t('authority.signalementDetail.sections.description')}</h2>
            <div className={styles.descriptionContent}>
              <p>{signalement.description || t('authority.signalementDetail.values.noDescription')}</p>
            </div>
          </div>

          {reporter && (
            <div className={styles.card}>
              <h2><User size={20} /> {t('authority.signalementDetail.sections.reporter')}</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.reporter.name')}</label>
                  <span>
                    {`${reporter.prenom || ''} ${reporter.nom || ''}`.trim() || t('authority.signalementDetail.values.na')}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.reporter.email')}</label>
                  <span>{reporter.email || t('authority.signalementDetail.values.na')}</span>
                </div>
              </div>
            </div>
          )}

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
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.acceptsFollowUp')}</label>
                  <span>{boolLabel(signalement.accepte_contact_suivi) ?? t('authority.signalementDetail.values.na')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          {photoUrlsUnique.length > 0 ? (
            <div className={styles.card}>
              <h2><Camera size={20} /> {t('authority.signalementDetail.sections.photos')}</h2>
              <div className={styles.photosGrid}>
                {photoUrlsUnique.map((url: string, idx: number) => (
                  <img
                    key={`${url}-${idx}`}
                    src={url}
                    alt={idx === 0 ? t('authority.signalementDetail.photos.altMain') : `${t('authority.signalementDetail.photos.photo')} ${idx + 1}`}
                  />
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
                  {dossierPerson && (
                    <span>
                      {' '}
                      -{' '}
                      {dossierPerson.nom_complet ||
                        `${dossierPerson.prenom || ''} ${dossierPerson.nom || ''}`.trim()}
                    </span>
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
                <label>{t('authority.signalementDetail.fields.source')}</label>
                <span>{signalement.source_signalement || t('authority.signalementDetail.values.na')}</span>
              </div>
              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.priority')}</label>
                <span>{signalement.priorite_traitement || t('authority.signalementDetail.values.na')}</span>
              </div>
              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.publicDetail')}</label>
                <span>{boolLabel(signalement.visible_detail_public) ?? t('authority.signalementDetail.values.na')}</span>
              </div>
              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.transmittedToAuthorities')}</label>
                <span>{boolLabel(signalement.transmis_autorites) ?? t('authority.signalementDetail.values.na')}</span>
              </div>
              {signalement.date_transmission && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.transmissionDate')}</label>
                  <span>{new Date(signalement.date_transmission).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                </div>
              )}
              {signalement.autorite_destinataire && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.recipientAuthority')}</label>
                  <span>{signalement.autorite_destinataire}</span>
                </div>
              )}
              {signalement.actions_entreprises && (
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <label>{t('authority.signalementDetail.fields.actionsTaken')}</label>
                  <span>{signalement.actions_entreprises}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <label>{t('authority.signalementDetail.fields.createdAt')}</label>
                <span>{new Date(signalement.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
              </div>
              {signalement.updated_at && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.updatedAt')}</label>
                  <span>{new Date(signalement.updated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                </div>
              )}
              {signalement.score_pertinence != null && signalement.score_pertinence !== '' && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.relevanceScore')}</label>
                  <span>
                    {Number(signalement.score_pertinence) <= 1
                      ? `${Math.round(Number(signalement.score_pertinence) * 100)}%`
                      : String(signalement.score_pertinence)}
                  </span>
                </div>
              )}
              {signalement.score_correspondance != null && signalement.score_correspondance !== '' && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.matchScore')}</label>
                  <span>
                    {Number(signalement.score_correspondance) <= 1
                      ? `${Math.round(Number(signalement.score_correspondance) * 100)}%`
                      : String(signalement.score_correspondance)}
                  </span>
                </div>
              )}
              {signalement.commentaire_verification && (
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <label>{t('authority.signalementDetail.fields.verificationComment')}</label>
                  <span>{signalement.commentaire_verification}</span>
                </div>
              )}
              {signalement.date_verification && (
                <div className={styles.infoItem}>
                  <label>{t('authority.signalementDetail.fields.verificationDate')}</label>
                  <span>{new Date(signalement.date_verification).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                </div>
              )}
              {formatJson(signalement.raisons_score) && (
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <label>{t('authority.signalementDetail.fields.scoreReasons')}</label>
                  <pre className={styles.jsonBlock}>{formatJson(signalement.raisons_score)}</pre>
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
