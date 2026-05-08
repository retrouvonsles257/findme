/**
 * =====================================================
 * RETROUVONSLES - Authority Profile Page
 * Page de profil utilisateur avec édition
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { useNotification } from '../../contexts';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useI18n } from '../../hooks';
import { AdminDetailSkeleton } from 'components/skeletons';
import { supabase } from '../../config';
import { cloudinaryConfig } from '../../config/cloudinary.config';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Camera,
  Save,
  X,
  Edit,
  Loader2,
  Calendar,
  Globe,
  Bell,
  Lock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import styles from './ProfilePage.module.css';

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
  numero_badge: string;
  id_organisation?: string | null;
  accepte_notifications: boolean;
  accepte_geolocalisation: boolean;
  rayon_notification_km: number;
  langue_preferee: string;
  statut_compte: string;
  score_fiabilite: number;
  nombre_signalements_valides: number;
  nombre_signalements_invalides: number;
  derniere_connexion: string;
  created_at: string;
}

interface OrganisationData {
  id: string;
  nom: string;
  type_organisation: string;
  pays: string;
  region: string | null;
  ville: string | null;
  adresse: string | null;
  contact_officiel: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppSelector(selectCurrentUser);
  const { addNotification } = useNotification();
  const { t, language } = useI18n();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [organisation, setOrganisation] = useState<OrganisationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  // Charger le profil
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
        // Erreur gérée par la notification
        addNotification({
          title: t('authority.profilePage.messages.error'),
          message: t('authority.profilePage.messages.loadError'),
          type: 'error',
        });
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
        rayon_notification_km: data.rayon_notification_km || 50,
        langue_preferee: data.langue_preferee || 'fr',
      });

      if (data.id_organisation) {
        const { data: org } = await (supabase as any)
          .from('organisation')
          .select('id, nom, type_organisation, pays, region, ville, adresse, contact_officiel, telephone, email, site_web')
          .eq('id', data.id_organisation)
          .maybeSingle();
        setOrganisation(org || null);
      } else {
        setOrganisation(null);
      }
    } catch (err) {
      // Erreur gérée par la notification
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, addNotification, t]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Ouvrir directement en mode édition si on vient du menu "Modifier le profil"
  useEffect(() => {
    if (profile && (location.state as { edit?: boolean })?.edit) {
      setIsEditing(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [profile, location.state, location.pathname, navigate]);

  // Sauvegarder les modifications
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

      if (error) {
        // Erreur gérée par la notification
        addNotification({
          title: t('authority.profilePage.messages.error'),
          message: error.message || t('authority.profilePage.messages.saveError'),
          type: 'error',
        });
        return;
      }

      addNotification({
        title: t('authority.profilePage.messages.success'),
        message: t('authority.profilePage.messages.profileUpdated'),
        type: 'success',
      });

      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      // Erreur gérée par la notification
      addNotification({
        title: t('authority.profilePage.messages.error'),
        message: err.message || t('authority.profilePage.messages.genericError'),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload photo de profil
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
        {
          method: 'POST',
          body: formDataUpload,
        }
      );

      const data = await response.json();

      if (!data.secure_url) {
        throw new Error(t('authority.profilePage.messages.photoUploadError'));
      }

      // Mettre à jour la base de données
      const { error } = await (supabase as any)
        .from('utilisateur')
        .update({ photo_profil: data.secure_url })
        .eq('id', currentUser.id);

      if (error) throw error;

      addNotification({
        title: t('authority.profilePage.messages.success'),
        message: t('authority.profilePage.messages.photoUpdated'),
        type: 'success',
      });

      loadProfile();
    } catch (err: any) {
      // Erreur gérée par la notification
      addNotification({
        title: t('authority.profilePage.messages.error'),
        message: t('authority.profilePage.messages.photoUploadError'),
        type: 'error',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsChangingPassword(true);
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        addNotification({
          title: t('authority.profilePage.messages.error'),
          message: t('authority.profilePage.security.passwordsMismatch'),
          type: 'error',
        });
        return;
      }
      if (passwordData.newPassword.length < 8) {
        addNotification({
          title: t('authority.profilePage.messages.error'),
          message: t('authority.profilePage.security.passwordMinLength'),
          type: 'error',
        });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      addNotification({
        title: t('authority.profilePage.messages.success'),
        message: t('authority.profilePage.security.passwordChanged'),
        type: 'success',
      });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      addNotification({
        title: t('authority.profilePage.messages.error'),
        message: err.message || t('authority.profilePage.messages.genericError'),
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Annuler les modifications
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
        rayon_notification_km: profile.rayon_notification_km || 50,
        langue_preferee: profile.langue_preferee || 'fr',
      });
    }
    setIsEditing(false);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return { label: t('authority.profilePage.accountStatus.active'), color: '#0ea5e9', icon: <CheckCircle size={14} /> };
      case 'suspendu':
        return { label: t('authority.profilePage.accountStatus.suspended'), color: '#dc3545', icon: <AlertTriangle size={14} /> };
      case 'en_attente_verification':
        return { label: t('authority.profilePage.accountStatus.pendingVerification'), color: '#ffc107', icon: <Loader2 size={14} /> };
      default:
        return { label: statut, color: '#64748b', icon: <User size={14} /> };
    }
  };

  if (isLoading) {
    return (
      <AuthorityLayout>
        <div className={styles.skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </AuthorityLayout>
    );
  }

  if (!profile) {
    return (
      <AuthorityLayout>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} />
          <h2>{t('authority.profilePage.notFound')}</h2>
          <p>{t('authority.profilePage.notFoundDescription')}</p>
          <button onClick={() => navigate('/authority/dashboard')}>
            {t('authority.profilePage.backToDashboard')}
          </button>
        </div>
      </AuthorityLayout>
    );
  }

  const statutInfo = getStatutBadge(profile.statut_compte);

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1><User size={24} /> {t('authority.profilePage.title')}</h1>
          {!isEditing ? (
            <button 
              className={styles.editBtn}
              onClick={() => setIsEditing(true)}
            >
              <Edit size={18} /> {t('authority.commonActions.edit')}
            </button>
          ) : (
            <div className={styles.headerActions}>
              <button 
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X size={18} /> {t('authority.commonActions.cancel')}
              </button>
              <button 
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
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
          {/* Carte Profil Principal */}
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {profile.photo_profil ? (
                  <img src={profile.photo_profil} alt={profile.prenom} />
                ) : (
                  <User size={48} />
                )}
                <label className={styles.avatarUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                  {isUploadingPhoto ? (
                    <Loader2 size={20} className={styles.spinner} />
                  ) : (
                    <Camera size={20} />
                  )}
                </label>
              </div>
              <div className={styles.profileInfo}>
                <h2>{profile.prenom} {profile.nom}</h2>
                <p className={styles.email}><Mail size={14} /> {profile.email}</p>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: statutInfo.color }}
                >
                  {statutInfo.icon} {statutInfo.label}
                </span>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{profile.score_fiabilite?.toFixed(0) || 100}%</span>
                <span className={styles.statLabel}>{t('authority.profilePage.stats.reliabilityScore')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{profile.nombre_signalements_valides || 0}</span>
                <span className={styles.statLabel}>{t('authority.profilePage.stats.validReports')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{profile.nombre_signalements_invalides || 0}</span>
                <span className={styles.statLabel}>{t('authority.profilePage.stats.invalidReports')}</span>
              </div>
            </div>
          </div>

          {/* Formulaire d'informations personnelles */}
          <div className={styles.formSection}>
            <h3><User size={18} /> {t('authority.profilePage.sections.personalInfo')}</h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.lastName')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder={t('authority.profilePage.placeholders.lastName')}
                  />
                ) : (
                  <p>{profile.nom || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.firstName')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder={t('authority.profilePage.placeholders.firstName')}
                  />
                ) : (
                  <p>{profile.prenom || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Phone size={14} /> {t('authority.profilePage.fields.phone')}</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder={t('authority.profilePage.placeholders.phone')}
                  />
                ) : (
                  <p>{profile.telephone || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Calendar size={14} /> {t('authority.profilePage.fields.birthDate')}</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                  />
                ) : (
                  <p>{profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : t('authority.profilePage.values.placeholderDash')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Adresse */}
          <div className={styles.formSection}>
            <h3><MapPin size={18} /> {t('authority.profilePage.sections.address')}</h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label>{t('authority.profilePage.fields.fullAddress')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder={t('authority.profilePage.placeholders.fullAddress')}
                  />
                ) : (
                  <p>{profile.adresse || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.city')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder={t('authority.profilePage.placeholders.city')}
                  />
                ) : (
                  <p>{profile.ville || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>{t('authority.profilePage.fields.region')}</label>
                {isEditing ? (
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  >
                    <option value="">{t('authority.profilePage.placeholders.select')}</option>
                    <option value="Centre">{t('authority.profilePage.regions.centre')}</option>
                    <option value="Littoral">{t('authority.profilePage.regions.littoral')}</option>
                    <option value="Ouest">{t('authority.profilePage.regions.ouest')}</option>
                    <option value="Nord-Ouest">{t('authority.profilePage.regions.nordOuest')}</option>
                    <option value="Sud-Ouest">{t('authority.profilePage.regions.sudOuest')}</option>
                    <option value="Sud">{t('authority.profilePage.regions.sud')}</option>
                    <option value="Est">{t('authority.profilePage.regions.est')}</option>
                    <option value="Adamaoua">{t('authority.profilePage.regions.adamaoua')}</option>
                    <option value="Nord">{t('authority.profilePage.regions.nord')}</option>
                    <option value="Extrême-Nord">{t('authority.profilePage.regions.extremeNord')}</option>
                  </select>
                ) : (
                  <p>{profile.region || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Globe size={14} /> {t('authority.profilePage.fields.country')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    placeholder={t('authority.profilePage.placeholders.country')}
                  />
                ) : (
                  <p>{profile.pays || t('authority.profilePage.defaults.country')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Organisation (lecture seule) */}
          {organisation && (
            <div className={styles.formSection}>
              <h3><Building size={18} /> {t('authority.profilePage.sections.organisation')}</h3>
              <div className={styles.securityInfo}>
                <div className={styles.infoItem}>
                  <Building size={16} />
                  <span>{t('authority.profilePage.organisation.name')}: {organisation.nom}</span>
                </div>
                <div className={styles.infoItem}>
                  <Globe size={16} />
                  <span>{t('authority.profilePage.organisation.type')}: {organisation.type_organisation?.replace(/_/g, ' ') || '—'}</span>
                </div>
                {(organisation.region || organisation.ville) && (
                  <div className={styles.infoItem}>
                    <MapPin size={16} />
                    <span>{[organisation.ville, organisation.region].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                )}
                {organisation.telephone && (
                  <div className={styles.infoItem}>
                    <Phone size={16} />
                    <span>{organisation.telephone}</span>
                  </div>
                )}
                {organisation.email && (
                  <div className={styles.infoItem}>
                    <Mail size={16} />
                    <span>{organisation.email}</span>
                  </div>
                )}
                {organisation.contact_officiel && (
                  <div className={styles.infoItem}>
                    <User size={16} />
                    <span>{organisation.contact_officiel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Préférences — Autorités : notifications métier uniquement (pas de périmètre d'alertes, elles les créent) */}
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
                    <input
                      type="checkbox"
                      checked={formData.accepte_notifications}
                      onChange={(e) => setFormData({ ...formData, accepte_notifications: e.target.checked })}
                    />
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
                  <select
                    value={formData.langue_preferee}
                    onChange={(e) => setFormData({ ...formData, langue_preferee: e.target.value })}
                    className={styles.languageSelect}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                ) : (
                  <span className={styles.statusDot}>{profile.langue_preferee === 'en' ? 'English' : 'Français'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section Sécurité */}
          <div className={styles.formSection}>
            <h3><Lock size={18} /> {t('authority.profilePage.sections.security')}</h3>

            <div className={styles.securityInfo}>
              <div className={styles.infoItem}>
                <Building size={16} />
                <span>{t('authority.profilePage.security.badge')}: {profile.numero_badge || t('authority.profilePage.security.notAssigned')}</span>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={16} />
                <span>{t('authority.profilePage.security.memberSince')}: {new Date(profile.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
              </div>
              <div className={styles.infoItem}>
                <Shield size={16} />
                <span>{t('authority.profilePage.security.lastLogin')}: {profile.derniere_connexion 
                  ? new Date(profile.derniere_connexion).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')
                  : t('authority.profilePage.values.na')}</span>
              </div>
            </div>

            {!showPasswordForm ? (
              <button
                type="button"
                className={styles.changePasswordBtn}
                onClick={() => setShowPasswordForm(true)}
              >
                <Lock size={16} /> {t('authority.profilePage.security.changePassword')}
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className={styles.passwordForm}>
                <div className={styles.passwordFormField}>
                  <label>{t('authority.profilePage.security.newPassword')}</label>
                  <div className={styles.passwordInputWrap}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} aria-label="Toggle visibility">
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className={styles.passwordFormField}>
                  <label>{t('authority.profilePage.security.confirmPassword')}</label>
                  <div className={styles.passwordInputWrap}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} aria-label="Toggle visibility">
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className={styles.passwordFormActions}>
                  <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ newPassword: '', confirmPassword: '' }); }}>
                    {t('authority.profilePage.security.cancel')}
                  </button>
                  <button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 size={16} className={styles.spinner} /> : <CheckCircle size={16} />}
                    {t('authority.profilePage.security.updatePassword')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default ProfilePage;
