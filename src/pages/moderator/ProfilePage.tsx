/**
 * =====================================================
 * RETROUVONSLES - Moderator Profile Page
 * Page de profil modérateur (alignée Citizen / Authority / Admin)
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModerationLayout } from './ModerationLayout';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { cloudinaryConfig } from '../../config/cloudinary.config';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  X,
  Edit,
  Loader2,
  Calendar,
  Globe,
  Bell,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import styles from '../authority/ProfilePage.module.css';
import modStyles from './ProfilePage.module.css';

interface ProfileData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  adresse: string;
  ville: string;
  region: string;
  pays: string;
  photo_profil: string;
  accepte_notifications: boolean;
  accepte_geolocalisation: boolean;
  rayon_notification_km: number;
  langue_preferee: string;
  statut_compte: string;
  score_fiabilite: number;
  created_at: string;
  derniere_connexion?: string;
}

export const ModeratorProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);
  const { t, language } = useI18n();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    date_naissance: '',
    adresse: '',
    ville: '',
    region: '',
    pays: 'Cameroun',
    accepte_notifications: true,
    accepte_geolocalisation: false,
    rayon_notification_km: 50,
    langue_preferee: 'fr',
  });

  const loadProfile = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        setProfile(null);
        return;
      }

      setProfile(data);
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        telephone: data.telephone || '',
        date_naissance: data.date_naissance || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        region: data.region || '',
        pays: data.pays || t('authority.profilePage.defaults.country'),
        accepte_notifications: data.accepte_notifications ?? true,
        accepte_geolocalisation: data.accepte_geolocalisation ?? false,
        rayon_notification_km: data.rayon_notification_km ?? 50,
        langue_preferee: data.langue_preferee || 'fr',
      });
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, t]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('utilisateur')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          date_naissance: formData.date_naissance || null,
          adresse: formData.adresse,
          ville: formData.ville,
          region: formData.region,
          pays: formData.pays,
          accepte_notifications: formData.accepte_notifications,
          accepte_geolocalisation: formData.accepte_geolocalisation,
          rayon_notification_km: formData.rayon_notification_km,
          langue_preferee: formData.langue_preferee,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    setIsUploadingPhoto(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', cloudinaryConfig.uploadPreset);
      formDataUpload.append('folder', 'retrouvonsles/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        { method: 'POST', body: formDataUpload }
      );
      const data = await response.json();
      if (!data.secure_url) throw new Error('Upload failed');

      await (supabase as any)
        .from('utilisateur')
        .update({ photo_profil: data.secure_url })
        .eq('id', currentUser.id);
      loadProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        nom: profile.nom || '',
        prenom: profile.prenom || '',
        telephone: profile.telephone || '',
        date_naissance: profile.date_naissance || '',
        adresse: profile.adresse || '',
        ville: profile.ville || '',
        region: profile.region || '',
        pays: profile.pays || t('authority.profilePage.defaults.country'),
        accepte_notifications: profile.accepte_notifications ?? true,
        accepte_geolocalisation: profile.accepte_geolocalisation ?? false,
        rayon_notification_km: profile.rayon_notification_km ?? 50,
        langue_preferee: profile.langue_preferee || 'fr',
      });
    }
    setIsEditing(false);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return { label: t('authority.profilePage.accountStatus.active'), color: '#28a745', icon: <CheckCircle size={14} /> };
      case 'suspendu':
        return { label: t('authority.profilePage.accountStatus.suspended'), color: '#dc3545', icon: <AlertTriangle size={14} /> };
      default:
        return { label: statut || '—', color: '#6c757d', icon: <User size={14} /> };
    }
  };

  if (isLoading) {
    return (
      <ModerationLayout title={t('common.profile')} activeNav="profile">
        <div className={styles.loadingContainer}>
          <Loader2 size={32} className={styles.spinner} />
          <p>{t('authority.profilePage.loading')}</p>
        </div>
      </ModerationLayout>
    );
  }

  if (!profile) {
    return (
      <ModerationLayout title={t('common.profile')} activeNav="profile">
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} />
          <h2>{t('authority.profilePage.notFound')}</h2>
          <p>{t('authority.profilePage.notFoundDescription')}</p>
          <button type="button" onClick={() => navigate('/moderator/dashboard')}>
            {t('authority.profilePage.backToDashboard')}
          </button>
        </div>
      </ModerationLayout>
    );
  }

  const statutInfo = getStatutBadge(profile.statut_compte);

  return (
    <ModerationLayout title={t('common.profile')} activeNav="profile">
      <div className={`${styles.container} ${modStyles.container}`}>
        <div className={styles.header}>
          <h1><User size={24} /> {t('authority.profilePage.title')}</h1>
          {!isEditing ? (
            <button type="button" className={styles.editBtn} onClick={() => setIsEditing(true)}>
              <Edit size={18} /> {t('authority.commonActions.edit')}
            </button>
          ) : (
            <div className={styles.headerActions}>
              <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={isSaving}>
                <X size={18} /> {t('authority.commonActions.cancel')}
              </button>
              <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 size={18} className={styles.spinner} /> {t('authority.profilePage.saving')}</>
                ) : (
                  <><Save size={18} /> {t('authority.commonActions.save')}</>
                )}
              </button>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {profile.photo_profil ? (
                  <img src={profile.photo_profil} alt="" />
                ) : (
                  <User size={48} />
                )}
                <label className={styles.avatarUpload}>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                  {isUploadingPhoto ? <Loader2 size={20} className={styles.spinner} /> : <Camera size={20} />}
                </label>
              </div>
              <div className={styles.profileInfo}>
                <h2>{profile.prenom} {profile.nom}</h2>
                <p className={styles.email}><Mail size={14} /> {profile.email}</p>
                <span className={styles.statusBadge} style={{ backgroundColor: statutInfo.color }}>
                  {statutInfo.icon} {statutInfo.label}
                </span>
              </div>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{profile.score_fiabilite?.toFixed(0) ?? 100}%</span>
                <span className={styles.statLabel}>{t('authority.profilePage.stats.reliabilityScore')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{new Date(profile.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                <span className={styles.statLabel}>{t('authority.profilePage.security.memberSince')}</span>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3><User size={18} /> {t('authority.profilePage.sections.personalInfo')}</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.lastName')}</label>
                {isEditing ? (
                  <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} placeholder={t('authority.profilePage.placeholders.lastName')} />
                ) : (
                  <p>{profile.nom || '-'}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.firstName')}</label>
                {isEditing ? (
                  <input type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} placeholder={t('authority.profilePage.placeholders.firstName')} />
                ) : (
                  <p>{profile.prenom || '-'}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label><Phone size={14} /> {t('authority.profilePage.fields.phone')}</label>
                {isEditing ? (
                  <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} placeholder={t('authority.profilePage.placeholders.phone')} />
                ) : (
                  <p>{profile.telephone || '-'}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label><Calendar size={14} /> {t('authority.profilePage.fields.birthDate')}</label>
                {isEditing ? (
                  <input type="date" value={formData.date_naissance} onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })} />
                ) : (
                  <p>{profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3><MapPin size={18} /> {t('authority.profilePage.sections.address')}</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label>{t('authority.profilePage.fields.fullAddress')}</label>
                {isEditing ? (
                  <input type="text" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} placeholder={t('authority.profilePage.placeholders.fullAddress')} />
                ) : (
                  <p>{profile.adresse || '-'}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.city')}</label>
                {isEditing ? (
                  <input type="text" value={formData.ville} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} placeholder={t('authority.profilePage.placeholders.city')} />
                ) : (
                  <p>{profile.ville || '-'}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.region')}</label>
                {isEditing ? (
                  <input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder={t('authority.profilePage.placeholders.select')} />
                ) : (
                  <p>{profile.region || '-'}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label><Globe size={14} /> {t('authority.profilePage.fields.country')}</label>
                {isEditing ? (
                  <input type="text" value={formData.pays} onChange={(e) => setFormData({ ...formData, pays: e.target.value })} placeholder={t('authority.profilePage.placeholders.country')} />
                ) : (
                  <p>{profile.pays || t('authority.profilePage.defaults.country')}</p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3><Bell size={18} /> {t('authority.profilePage.sections.preferences')}</h3>
            <div className={styles.preferencesGrid}>
              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <Bell size={20} />
                  <div>
                    <h4>{t('authority.profilePage.preferences.notifications.title')}</h4>
                    <p>{t('authority.profilePage.preferences.notifications.descriptionForAuthority')}</p>
                  </div>
                </div>
                {isEditing ? (
                  <label className={styles.switch}>
                    <input type="checkbox" checked={formData.accepte_notifications} onChange={(e) => setFormData({ ...formData, accepte_notifications: e.target.checked })} />
                    <span className={styles.slider} />
                  </label>
                ) : (
                  <span className={`${styles.statusDot} ${profile.accepte_notifications ? styles.active : ''}`}>
                    {profile.accepte_notifications ? t('authority.profilePage.toggle.enabled') : t('authority.profilePage.toggle.disabled')}
                  </span>
                )}
              </div>
              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <Globe size={20} />
                  <div>
                    <h4>{t('authority.profilePage.preferences.language.title')}</h4>
                    <p>{t('authority.profilePage.preferences.language.description')}</p>
                  </div>
                </div>
                {isEditing ? (
                  <select value={formData.langue_preferee} onChange={(e) => setFormData({ ...formData, langue_preferee: e.target.value })} className={styles.languageSelect}>
                    <option value="fr">{t('common.french')}</option>
                    <option value="en">{t('common.english')}</option>
                  </select>
                ) : (
                  <span className={styles.statusDot}>{profile.langue_preferee === 'en' ? t('common.english') : t('common.french')}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>{t('authority.profilePage.security.memberSince')}</h3>
            <div className={styles.securityInfo}>
              <div className={styles.infoItem}>
                <Calendar size={16} />
                <span>{new Date(profile.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
              </div>
              {profile.derniere_connexion && (
                <div className={styles.infoItem}>
                  <User size={16} />
                  <span>{t('authority.profilePage.security.lastLogin')}: {new Date(profile.derniere_connexion).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModerationLayout>
  );
};

export default ModeratorProfilePage;
