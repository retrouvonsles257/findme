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
import { createAlerte } from '../../features/alertes/services/alerteAPI';
import { TypeAlerte as TypeAlerteEnum } from '../../@types/enums.types';
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

export const CreateAlertePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDossierId = searchParams.get('dossier');
  
  useAuth(); // Hook call for auth context
  const { addNotification } = useNotification();
  const { dossiers } = useDossiers();
  const { t, language } = useI18n();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    message: '',
    message_court: '',
    type_alerte: TypeAlerteEnum.DISPARITION_STANDARD,
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
  const handleSubmit = useCallback(async (publishNow: boolean) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const alerte = await createAlerte({
        titre: formData.titre,
        message: formData.message,
        message_court: formData.message_court || formData.message.substring(0, 200),
        type_alerte: formData.type_alerte as any,
        id_dossier: formData.id_dossier,
        rayon_km: formData.rayon_km,
        canaux_diffusion: formData.canaux_diffusion,
        niveau_urgence_min: formData.niveau_urgence_min,
      });

      addNotification({
        title: t('authority.alertes.createAlerte.messages.alerteCreated'),
        message: publishNow 
          ? t('authority.alertes.createAlerte.messages.alerteCreatedAndPublished')
          : t('authority.alertes.createAlerte.messages.alerteSavedAsDraft'),
        type: 'success',
      });

      navigate(`/authority/alertes/${alerte.id}`);
    } catch (err: any) {
      addNotification({
        title: t('authority.alertes.createAlerte.messages.error'),
        message: err.message || t('authority.alertes.createAlerte.messages.creationError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addNotification, navigate]);

  // Dossiers actifs uniquement
  const activeDossiers = dossiers.filter((d: any) => 
    d.statut_dossier === 'en_cours' && d.diffusion_autorisee !== false
  );

  return (
    <AuthorityLayout
    >
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
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>{t('authority.alertes.createAlerte.form.alertType')}</label>
                <select
                  value={formData.type_alerte}
                  onChange={(e) => setFormData({ ...formData, type_alerte: e.target.value as any })}
                >
                  <option value={TypeAlerteEnum.DISPARITION_STANDARD}>{t('authority.alertes.createAlerte.form.types.standard')}</option>
                  <option value={TypeAlerteEnum.DISPARITION_ENFANT}>{t('authority.alertes.createAlerte.form.types.child')}</option>
                  <option value={TypeAlerteEnum.DISPARITION_ADULTE_VULNERABLE}>{t('authority.alertes.createAlerte.form.types.vulnerable')}</option>
                  <option value={TypeAlerteEnum.AMBER_ALERT}>{t('authority.alertes.createAlerte.form.types.amber')}</option>
                  <option value={TypeAlerteEnum.MISE_A_JOUR}>{t('authority.alertes.createAlerte.form.types.update')}</option>
                  <option value={TypeAlerteEnum.PERSONNE_RETROUVEE}>{t('authority.alertes.createAlerte.form.types.found')}</option>
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
                    {formData.type_alerte.toUpperCase()}
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
              onClick={() => navigate('/authority/alertes')}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className={styles.spinner} /> {t('authority.alertes.createAlerte.actions.creating')}</>
              ) : (
                <><Megaphone size={16} /> {t('authority.alertes.createAlerte.actions.createAndPublish')}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default CreateAlertePage;
