/**
 * =====================================================
 * RETROUVONSLES - Create Alerte Page
 * Création d'une nouvelle alerte
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import {
  createAlerte,
  diffuserAlerte,
  estimateDiffusionForInput,
  updateAlerteStatut,
} from '../../features/alertes/services/alerteAPI';
import { TypeAlerte as TypeAlerteEnum, StatutAlerte as StatutAlerteEnum } from '../../@types/enums.types';
import type { TypeAlerte } from '../../@types';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import {
  MapPin,
  Save,
  Megaphone,
  Loader2,
  Eye,
  Bell,
  FileText,
  Radio,
  Smartphone,
  Mail,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import styles from './CreateAlertePage.module.css';

export interface CreateAlertePageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /authority */
  basePath?: string;
  /** Restreindre les types d'alerte (ex. pour NGO : prévention / sensibilisation uniquement). */
  allowedTypes?: TypeAlerte[];
}

const TYPE_OPTIONS: { value: TypeAlerte; labelKey: string }[] = [
  { value: TypeAlerteEnum.DISPARITION_STANDARD, labelKey: 'authority.alertes.createAlerte.form.types.standard' },
  { value: TypeAlerteEnum.DISPARITION_ENFANT, labelKey: 'authority.alertes.createAlerte.form.types.child' },
  { value: TypeAlerteEnum.DISPARITION_ADULTE_VULNERABLE, labelKey: 'authority.alertes.createAlerte.form.types.vulnerable' },
  { value: TypeAlerteEnum.AMBER_ALERT, labelKey: 'authority.alertes.createAlerte.form.types.amber' },
  { value: TypeAlerteEnum.MISE_A_JOUR, labelKey: 'authority.alertes.createAlerte.form.types.update' },
  { value: TypeAlerteEnum.PERSONNE_RETROUVEE, labelKey: 'authority.alertes.createAlerte.form.types.found' },
];

export const CreateAlertePage: React.FC<CreateAlertePageProps> = ({ noLayout = false, basePath = '/authority', allowedTypes }) => {
  const navigate = useNavigate();
  const alertesListPath = `${basePath}/alertes`;
  const [searchParams] = useSearchParams();
  const preselectedDossierId = searchParams.get('dossier');

  useAuth(); // Hook call for auth context
  const { addNotification } = useNotification();
  const { dossiers } = useDossiers();
  const { t } = useI18n();

  const typeOptions = allowedTypes?.length
    ? TYPE_OPTIONS.filter((o) => allowedTypes.includes(o.value))
    : TYPE_OPTIONS;
  const defaultType = typeOptions[0]?.value ?? TypeAlerteEnum.DISPARITION_STANDARD;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [diffusionEstimate, setDiffusionEstimate] = useState<{
    destinataires: number;
    excludedSansPosition: number;
    excludedHorsRayon: number;
  } | null>(null);
  const [confirmZeroRecipientsOpen, setConfirmZeroRecipientsOpen] = useState(false);
  const [zeroRecipientsSummary, setZeroRecipientsSummary] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    message: '',
    message_court: '',
    type_alerte: defaultType,
    id_dossier: preselectedDossierId || '',
    rayon_km: 50,
    canaux_diffusion: ['push', 'in_app'] as string[],
    niveau_urgence_min: 1,
  });

  // Toggle canal de diffusion
  const toggleCanal = (canal: string) => {
    setFormData(prev => ({
      ...prev,
      canaux_diffusion: prev.canaux_diffusion.includes(canal)
        ? prev.canaux_diffusion.filter(c => c !== canal)
        : [...prev.canaux_diffusion, canal],
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    if (!formData.titre.trim()) {
      addNotification({
        title: t('authority.alertes.createAlerte.messages.requiredField'),
        message: t('authority.alertes.createAlerte.messages.titleRequired'),
        type: 'error',
      });
      return false;
    }
    if (!formData.message.trim()) {
      addNotification({
        title: t('authority.alertes.createAlerte.messages.requiredField'),
        message: t('authority.alertes.createAlerte.messages.messageRequired'),
        type: 'error',
      });
      return false;
    }
    if (!formData.id_dossier) {
      addNotification({
        title: t('authority.alertes.createAlerte.messages.requiredField'),
        message: t('authority.alertes.createAlerte.messages.dossierRequired'),
        type: 'error',
      });
      return false;
    }
    return true;
  };

  // Soumission
  const handleSubmit = useCallback(async (publishNow: boolean, forcePublishWhenZero = false) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dossierLie = dossiers.find((d: any) => d.id === formData.id_dossier);
      const latD =
        dossierLie?.latitude_disparition != null ? Number(dossierLie.latitude_disparition) : undefined;
      const lngD =
        dossierLie?.longitude_disparition != null ? Number(dossierLie.longitude_disparition) : undefined;

      const hasGeoCenter =
        latD != null &&
        lngD != null &&
        !Number.isNaN(latD) &&
        !Number.isNaN(lngD);

      if (publishNow && !hasGeoCenter) {
        addNotification({
          title: t('authority.alertes.createAlerte.messages.error'),
          message:
            'Publication bloquée: le dossier lié n’a pas de localisation (latitude/longitude). Ajoutez une position sur le dossier ou gardez cette alerte en brouillon.',
          type: 'error',
        });
        return;
      }

      let estimationSummary = '';
      if (publishNow) {
        setIsEstimating(true);
        const estimate = await estimateDiffusionForInput({
          id_dossier: formData.id_dossier,
          latitude_centre: latD,
          longitude_centre: lngD,
          rayon_km: formData.rayon_km,
        });
        setDiffusionEstimate({
          destinataires: estimate.destinataires.length,
          excludedSansPosition: estimate.excludedSansPosition,
          excludedHorsRayon: estimate.excludedHorsRayon,
        });
        estimationSummary = `Estimation: ${estimate.destinataires.length} destinataire(s) potentiels, ${estimate.excludedSansPosition} sans position partagée, ${estimate.excludedHorsRayon} hors rayon.`;

        if (estimate.destinataires.length === 0 && !forcePublishWhenZero) {
          setZeroRecipientsSummary(estimationSummary);
          setConfirmZeroRecipientsOpen(true);
          addNotification({
            title: 'Vérification requise',
            message: 'Aucun destinataire estimé. Confirmez explicitement si vous voulez publier malgré tout.',
            type: 'warning',
          });
          return;
        }
      }

      const alerte = await createAlerte({
        titre: formData.titre,
        message: formData.message,
        message_court: formData.message_court || formData.message.substring(0, 200),
        type_alerte: formData.type_alerte as any,
        id_dossier: formData.id_dossier,
        rayon_km: formData.rayon_km,
        canaux_diffusion: formData.canaux_diffusion,
        niveau_urgence_min: formData.niveau_urgence_min,
        ...(latD != null && lngD != null && !Number.isNaN(latD) && !Number.isNaN(lngD)
          ? { latitude_centre: latD, longitude_centre: lngD }
          : {}),
      });

      if (publishNow) {
        await updateAlerteStatut(alerte.id, StatutAlerteEnum.EN_COURS);
        const diffusion = await diffuserAlerte(alerte.id, formData.canaux_diffusion);
        if (diffusion.nombre_destinataires === 0) {
          addNotification({
            title: t('authority.alertes.createAlerte.messages.alerteCreated'),
            message: t('authority.alertes.createAlerte.messages.publishNoRecipients'),
            type: 'warning',
          });
        } else {
          addNotification({
            title: t('authority.alertes.createAlerte.messages.alerteCreated'),
            message: `${t('authority.alertes.createAlerte.messages.alerteCreatedAndPublishedWithCount').replace(
              '{{count}}',
              String(diffusion.nombre_destinataires),
            )} ${estimationSummary}`.trim(),
            type: 'success',
          });
        }
      } else {
        addNotification({
          title: t('authority.alertes.createAlerte.messages.alerteCreated'),
          message: t('authority.alertes.createAlerte.messages.alerteSavedAsDraft'),
          type: 'success',
        });
      }

      navigate(`${basePath}/alertes/${alerte.id}`);
    } catch (err: any) {
      addNotification({
        title: t('authority.alertes.createAlerte.messages.error'),
        message: err.message || t('authority.alertes.createAlerte.messages.creationError'),
        type: 'error',
      });
    } finally {
      setIsEstimating(false);
      setIsSubmitting(false);
    }
  }, [formData, dossiers, addNotification, navigate, basePath, t]);

  // Dossiers actifs éligibles à la liaison (géoloc. optionnelle : message si absent lors de la publication)
  const activeDossiers = dossiers.filter(
    (d: any) => d.statut_dossier === 'en_cours' && d.diffusion_autorisee !== false,
  );

  const content = (
    <>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1><Megaphone size={24} /> {t('authority.alertes.createAlerte.title')}</h1>
          <p className={styles.subtitle}>
            {t('authority.alertes.createAlerte.subtitle')}
          </p>
        </div>

        {/* Form */}
        <div className={styles.formContainer}>
          <div className={styles.formSection}>
            <h2><FileText size={20} /> {t('authority.alertes.createAlerte.form.alertInfo')}</h2>

            <div className={styles.formGroup}>
              <label>{t('authority.alertes.createAlerte.form.linkedDossier')}</label>
              <select
                value={formData.id_dossier}
                onChange={(e) => setFormData({ ...formData, id_dossier: e.target.value })}
                required
              >
                <option value="">{t('authority.alertes.createAlerte.form.selectDossier')}</option>
                {activeDossiers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.numero_dossier || `DOS-${d.id.substring(0, 6)}`} 
                    {d.personne?.nom && ` - ${d.personne.prenom} ${d.personne.nom}`}
                  </option>
                ))}
              </select>
              {activeDossiers.length === 0 && (
                <small style={{ color: '#999', marginTop: '4px' }}>
                  {t('authority.alertes.createAlerte.form.noActiveDossiers')}
                </small>
              )}
              {diffusionEstimate && (
                <small className={styles.estimateInline}>
                  Estimation actuelle: {diffusionEstimate.destinataires} destinataire(s), {diffusionEstimate.excludedSansPosition} sans position partagée, {diffusionEstimate.excludedHorsRayon} hors rayon.
                </small>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>{t('authority.alertes.createAlerte.form.alertType')}</label>
                <select
                  value={formData.type_alerte}
                  onChange={(e) => setFormData({ ...formData, type_alerte: e.target.value as any })}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t('authority.alertes.createAlerte.form.radius')}</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.rayon_km}
                  onChange={(e) => setFormData({ ...formData, rayon_km: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.alertes.createAlerte.form.title')}</label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder={t('authority.alertes.createAlerte.form.titlePlaceholder')}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.alertes.createAlerte.form.fullMessage')}</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t('authority.alertes.createAlerte.form.fullMessagePlaceholder')}
                rows={6}
                required
              />
              <small>{formData.message.length} {t('authority.alertes.createAlerte.form.characters')}</small>
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.alertes.createAlerte.form.shortMessage')}</label>
              <textarea
                value={formData.message_court}
                onChange={(e) => setFormData({ ...formData, message_court: e.target.value })}
                placeholder={t('authority.alertes.createAlerte.form.shortMessagePlaceholder')}
                rows={2}
                maxLength={200}
              />
              <small>{formData.message_court.length}/200 {t('authority.alertes.createAlerte.form.characters')}</small>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2><Radio size={20} /> {t('authority.alertes.createAlerte.form.diffusionChannels')}</h2>

            <div className={styles.canaux}>
              {[
                { id: 'push', icon: Smartphone, labelKey: 'push', descKey: 'pushDesc' },
                { id: 'in_app', icon: Bell, labelKey: 'inApp', descKey: 'inAppDesc' },
                { id: 'email', icon: Mail, labelKey: 'email', descKey: 'emailDesc' },
                { id: 'sms', icon: MessageSquare, labelKey: 'sms', descKey: 'smsDesc' },
              ].map(canal => {
                const Icon = canal.icon;
                return (
                  <label key={canal.id} className={styles.canalItem}>
                    <input
                      type="checkbox"
                      checked={formData.canaux_diffusion.includes(canal.id)}
                      onChange={() => toggleCanal(canal.id)}
                    />
                    <div className={styles.canalInfo}>
                      <span className={styles.canalLabel}>
                        <Icon size={16} /> {t(`authority.alertes.createAlerte.form.channels.${canal.labelKey}`)}
                      </span>
                      <span className={styles.canalDesc}>{t(`authority.alertes.createAlerte.form.channels.${canal.descKey}`)}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {formData.titre && (
            <div className={styles.preview}>
              <h3><Eye size={18} /> {t('authority.alertes.createAlerte.preview.title')}</h3>
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewType}>
                    {(() => {
                      const opt = typeOptions.find((o) => o.value === formData.type_alerte);
                      return opt ? t(opt.labelKey) : formData.type_alerte;
                    })()}
                  </span>
                  <span className={styles.previewRadius}>
                    <MapPin size={14} /> {formData.rayon_km} {t('authority.alertes.unitKm')}
                  </span>
                </div>
                <h4>{formData.titre}</h4>
                <p>{formData.message_court || formData.message.substring(0, 200)}...</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              onClick={() => navigate(alertesListPath)}
              className={styles.cancelBtn}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} /> {t('authority.alertes.createAlerte.actions.cancel')}
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              className={styles.draftBtn}
              disabled={isSubmitting}
            >
              <Save size={16} /> {t('authority.alertes.createAlerte.actions.saveDraft')}
            </button>
            <button 
              onClick={() => handleSubmit(true)}
              className={styles.publishBtn}
              disabled={isSubmitting || isEstimating}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className={styles.spinner} /> {t('authority.alertes.createAlerte.actions.creating')}</>
              ) : isEstimating ? (
                <><Loader2 size={16} className={styles.spinner} /> Vérification des destinataires...</>
              ) : (
                <><Megaphone size={16} /> {t('authority.alertes.createAlerte.actions.createAndPublish')}</>
              )}
            </button>
          </div>
        </div>
      </div>
      {confirmZeroRecipientsOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>Confirmer une publication a 0 destinataire</h3>
            <p>{zeroRecipientsSummary}</p>
            <p>
              Cette alerte risque de ne toucher aucun citoyen. Corrigez idealement la localisation du dossier ou augmentez le rayon.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setConfirmZeroRecipientsOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={() => {
                  setConfirmZeroRecipientsOpen(false);
                  void handleSubmit(true, true);
                }}
              >
                Publier malgre tout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default CreateAlertePage;
