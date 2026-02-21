/**
 * =====================================================
 * RETROUVONSLES - Super Admin Profile Page
 * Page de modification du profil super admin
 * Connecté à Supabase table: utilisateur
 * =====================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminDetailSkeleton } from '../admin/skeletons';
import { 
  User, Mail, Phone, MapPin, Shield, Lock, Save,
  Loader2, AlertCircle, Check, Eye, EyeOff, Camera,
  Calendar, Globe, Map, Bell, Settings, Minus, Plus
} from 'lucide-react';
import styles from './ProfilePage.module.css';

interface UserProfile {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  photo_profil?: string;
  date_naissance?: string;
  numero_badge?: string;
  document_accreditation?: string;
  latitude_actuelle?: number;
  longitude_actuelle?: number;
  rayon_notification_km?: number;
  preferences_notification?: Record<string, any> | null;
  langue_preferee?: string;
  accepte_notifications?: boolean;
  accepte_geolocalisation?: boolean;
  score_fiabilite?: number;
  nombre_signalements_valides?: number;
  nombre_signalements_invalides?: number;
  derniere_connexion?: string;
  derniere_maj_localisation?: string;
  ip_derniere_connexion?: string;
  id_organisation?: string;
  statut_compte?: string;
  type_compte?: string;
  created_at?: string;
  updated_at?: string;
}

export const SuperAdminProfilePage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    ville: '',
    region: '',
    pays: '',
    date_naissance: '',
    numero_badge: '',
    document_accreditation: '',
    latitude_actuelle: '',
    longitude_actuelle: '',
    rayon_notification_km: '',
    preferences_notification: '',
    langue_preferee: 'fr',
    accepte_notifications: true,
    accepte_geolocalisation: false,
  });

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    if (!currentUser?.id) {
      setError(t('super_admin.profileNotConnected'));
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile({ ...data, email: (currentUser as any).email || data.email });
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        region: data.region || '',
        pays: data.pays || '',
        date_naissance: data.date_naissance || '',
        numero_badge: data.numero_badge || '',
        document_accreditation: data.document_accreditation || '',
        latitude_actuelle: data.latitude_actuelle?.toString() || '',
        longitude_actuelle: data.longitude_actuelle?.toString() || '',
        rayon_notification_km: data.rayon_notification_km?.toString() || '',
        preferences_notification: data.preferences_notification ? JSON.stringify(data.preferences_notification, null, 2) : '',
        langue_preferee: data.langue_preferee || 'fr',
        accepte_notifications: data.accepte_notifications ?? true,
        accepte_geolocalisation: data.accepte_geolocalisation ?? false,
      });
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    e.target.value = '';
    try {
      setIsUploadingPhoto(true);
      setError(null);
      setSuccess(null);

      const result = await uploadFileToCloudinary(file, {
        type: 'profilePhoto',
      });

      if (!result.success || (!result.secureUrl && !result.url)) {
        setError(result.error || t('super_admin.profileErrorUploadCloudinary'));
        return;
      }

      const photoUrl = result.secureUrl ?? result.url!;
      const { error: updateError } = await (supabase as any)
        .from('utilisateur')
        .update({
          photo_profil: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      setSuccess(t('super_admin.profilePhotoUpdated'));
      loadProfile();
    } catch (err: any) {
      setError(err?.message || t('super_admin.profileErrorUpload'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (!profile) throw new Error('Profil non chargé');

      // Parser les préférences de notification JSON
      let preferencesJson = null;
      if (formData.preferences_notification.trim()) {
        try {
          preferencesJson = JSON.parse(formData.preferences_notification);
        } catch (parseError) {
          setError(t('super_admin.profileInvalidJsonPreferences'));
          return;
        }
      }

      const updateData: any = {
        nom: formData.nom,
        prenom: formData.prenom || null,
        telephone: formData.telephone || null,
        adresse: formData.adresse || null,
        ville: formData.ville || null,
        region: formData.region || null,
        pays: formData.pays || null,
        date_naissance: formData.date_naissance || null,
        numero_badge: formData.numero_badge || null,
        document_accreditation: formData.document_accreditation || null,
        latitude_actuelle: formData.latitude_actuelle ? parseFloat(formData.latitude_actuelle) : null,
        longitude_actuelle: formData.longitude_actuelle ? parseFloat(formData.longitude_actuelle) : null,
        rayon_notification_km: formData.rayon_notification_km ? parseFloat(formData.rayon_notification_km) : null,
        langue_preferee: formData.langue_preferee || 'fr',
        accepte_notifications: formData.accepte_notifications,
        accepte_geolocalisation: formData.accepte_geolocalisation,
        updated_at: new Date().toISOString(),
      };

      if (preferencesJson !== null) {
        updateData.preferences_notification = preferencesJson;
      }

      const { error: updateError } = await (supabase as any)
        .from('utilisateur')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess(t('super_admin.profileUpdatedSuccess'));
      loadProfile();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsChangingPassword(true);
      setError(null);
      setSuccess(null);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error(t('super_admin.profilePasswordsMismatch'));
      }

      if (passwordData.newPassword.length < 8) {
        throw new Error(t('super_admin.profilePasswordMinLength'));
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(t('super_admin.profilePasswordChangedSuccess'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Erreur changement mot de passe:', err);
      setError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roundStep = (v: number, s: number) => {
    if (s >= 1) return Math.round(v);
    if (s >= 0.01) return Math.round(v * 100) / 100;
    return Math.round(v * 10000) / 10000;
  };
  const Stepper = (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
    }: {
      value: number;
      onChange: (v: number) => void;
      min: number;
      max: number;
      step?: number;
    }
  ) => (
    <div className={styles['sa-profile__stepper']}>
      <button
        type="button"
        className={styles['sa-profile__stepper-btn']}
        onClick={() => onChange(roundStep(Math.max(min, value - step), step))}
        disabled={value <= min}
        aria-label={t('super_admin.profileAriaDecrease')}
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(
            roundStep(
              Math.min(max, Math.max(min, parseFloat(e.target.value) || min)),
              step
            )
          )
        }
        min={min}
        max={max}
        step={step}
        className={styles['sa-profile__stepper-input']}
      />
      <button
        type="button"
        className={styles['sa-profile__stepper-btn']}
        onClick={() => onChange(roundStep(Math.min(max, value + step), step))}
        disabled={value >= max}
        aria-label={t('super_admin.profileAriaIncrease')}
      >
        <Plus size={14} />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <SuperAdminLayout title={t('super_admin.profileTitle')} activeNav="profile">
        <div className={styles['sa-profile__skeletonWrap']}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={5} />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title={t('super_admin.profileTitle')} activeNav="profile">
      <div className={styles['sa-profile']}>
        {/* Messages */}
        {error && (
          <div className={styles['sa-profile__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles['sa-profile__success']}>
            <Check size={20} />
            <span>{success}</span>
          </div>
        )}

        <div className={styles['sa-profile__content']}>
          {/* Profile Header */}
          <div className={styles['sa-profile__header']}>
            <div className={styles['sa-profile__avatar']}>
              {profile?.photo_profil ? (
                <img src={profile.photo_profil} alt={t('super_admin.profileAvatarAlt')} />
              ) : (
                <User size={48} />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles['sa-profile__avatar-input']}
                onChange={handlePhotoChange}
                aria-label={t('super_admin.profileChangePhoto')}
              />
              <button
                type="button"
                className={styles['sa-profile__avatar-edit']}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                title={t('super_admin.profileChangePhoto')}
              >
                {isUploadingPhoto ? <Loader2 size={16} className={styles['sa-profile__spinner']} /> : <Camera size={16} />}
              </button>
            </div>
            <div className={styles['sa-profile__header-info']}>
              <h2>{profile?.prenom} {profile?.nom}</h2>
              <p><Mail size={14} /> {profile?.email}</p>
              <span className={styles['sa-profile__badge']}>
                <Shield size={14} /> {t('super_admin.profileSuperAdmin')}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className={styles['sa-profile__form']}>
            <h3>{t('super_admin.profilePersonalInfo')}</h3>
            
            <div className={styles['sa-profile__form-grid']}>
              <div className={styles['sa-profile__form-field']}>
                <label><User size={16} /> {t('super_admin.profileLabelName')}</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder={t('super_admin.profilePlaceholderName')}
                />
              </div>
              
              <div className={styles['sa-profile__form-field']}>
                <label><User size={16} /> {t('super_admin.profileLabelPrenom')}</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderPrenom')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><Phone size={16} /> {t('super_admin.profileLabelPhone')}</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderPhone')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> {t('super_admin.profileLabelCity')}</label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderCity')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> {t('super_admin.profileLabelCountry')}</label>
                <input
                  type="text"
                  value={formData.pays}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderCountry')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> {t('super_admin.profileLabelAddress')}</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderAddress')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> {t('super_admin.profileLabelRegion')}</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderRegion')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><Calendar size={16} /> {t('super_admin.profileLabelBirthDate')}</label>
                <input
                  type="date"
                  value={formData.date_naissance}
                  onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><Shield size={16} /> {t('super_admin.profileLabelBadgeNumber')}</label>
                <input
                  type="text"
                  value={formData.numero_badge}
                  onChange={(e) => setFormData({ ...formData, numero_badge: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderBadge')}
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><Shield size={16} /> {t('super_admin.profileLabelAccreditationDoc')}</label>
                <input
                  type="text"
                  value={formData.document_accreditation}
                  onChange={(e) => setFormData({ ...formData, document_accreditation: e.target.value })}
                  placeholder={t('super_admin.profilePlaceholderAccreditationRef')}
                />
              </div>
            </div>

            <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>{t('super_admin.profileLabelLocation')}</h3>
            <div className={styles['sa-profile__form-grid']}>
              <div className={styles['sa-profile__form-field']}>
                <label><Map size={16} /> {t('super_admin.profileLabelLatitude')}</label>
                <Stepper
                  value={parseFloat(formData.latitude_actuelle) || 0}
                  onChange={(v) => setFormData({ ...formData, latitude_actuelle: String(v) })}
                  min={-90}
                  max={90}
                  step={0.0001}
                />
              </div>
              <div className={styles['sa-profile__form-field']}>
                <label><Map size={16} /> {t('super_admin.profileLabelLongitude')}</label>
                <Stepper
                  value={parseFloat(formData.longitude_actuelle) || 0}
                  onChange={(v) => setFormData({ ...formData, longitude_actuelle: String(v) })}
                  min={-180}
                  max={180}
                  step={0.0001}
                />
              </div>
              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> {t('super_admin.profileLabelNotificationRadius')}</label>
                <Stepper
                  value={parseFloat(formData.rayon_notification_km) || 0}
                  onChange={(v) => setFormData({ ...formData, rayon_notification_km: String(v) })}
                  min={0}
                  max={500}
                  step={0.5}
                />
              </div>
            </div>

            <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>{t('super_admin.profileLabelPreferences')}</h3>
            <div className={styles['sa-profile__form-grid']}>
              <div className={styles['sa-profile__form-field']}>
                <label><Globe size={16} /> {t('super_admin.profileLabelPreferredLanguage')}</label>
                <select
                  value={formData.langue_preferee}
                  onChange={(e) => setFormData({ ...formData, langue_preferee: e.target.value })}
                >
                  <option value="fr">{t('super_admin.profileOptionFrench')}</option>
                  <option value="en">{t('super_admin.profileOptionEnglish')}</option>
                </select>
              </div>

              <div className={styles['sa-profile__form-field']} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="accepte_notifications"
                  checked={formData.accepte_notifications}
                  onChange={(e) => setFormData({ ...formData, accepte_notifications: e.target.checked })}
                />
                <label htmlFor="accepte_notifications" style={{ margin: 0, cursor: 'pointer' }}>
                  <Bell size={16} /> {t('super_admin.profileAcceptNotifications')}
                </label>
              </div>

              <div className={styles['sa-profile__form-field']} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="accepte_geolocalisation"
                  checked={formData.accepte_geolocalisation}
                  onChange={(e) => setFormData({ ...formData, accepte_geolocalisation: e.target.checked })}
                />
                <label htmlFor="accepte_geolocalisation" style={{ margin: 0, cursor: 'pointer' }}>
                  <Map size={16} /> {t('super_admin.profileAcceptGeolocation')}
                </label>
              </div>
            </div>

            <div className={styles['sa-profile__form-field']}>
              <label><Settings size={16} /> {t('super_admin.profileNotificationPreferencesJson')}</label>
              <textarea
                value={formData.preferences_notification}
                onChange={(e) => setFormData({ ...formData, preferences_notification: e.target.value })}
                placeholder='{"email": true, "sms": false, "push": true}'
                rows={4}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                {t('super_admin.profileJsonValidRequired')}
              </small>
            </div>

            <div className={styles['sa-profile__form-actions']}>
              <button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className={styles['sa-profile__spinner']} /> : <Save size={16} />}
                {t('super_admin.profileSaveChanges')}
              </button>
            </div>
          </form>

          {/* Password Change */}
          <div className={styles['sa-profile__security']}>
            <h3><Lock size={18} /> {t('super_admin.profileSectionSecurity')}</h3>
            
            {!showPasswordForm ? (
              <button 
                onClick={() => setShowPasswordForm(true)}
                className={styles['sa-profile__password-btn']}
              >
                <Lock size={16} />
                {t('super_admin.profileChangePassword')}
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className={styles['sa-profile__password-form']}>
                <div className={styles['sa-profile__form-field']}>
                  <label>{t('super_admin.profileNewPassword')}</label>
                  <div className={styles['sa-profile__password-input']}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                      placeholder={t('super_admin.profileMinChars')}
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles['sa-profile__form-field']}>
                  <label>{t('super_admin.profileConfirmPassword')}</label>
                  <div className={styles['sa-profile__password-input']}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder={t('super_admin.profileConfirmPasswordPlaceholder')}
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles['sa-profile__password-actions']}>
                  <button type="button" onClick={() => setShowPasswordForm(false)}>
                    {t('super_admin.profileCancel')}
                  </button>
                  <button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 size={16} className={styles['sa-profile__spinner']} /> : <Check size={16} />}
                    {t('super_admin.profileUpdatePassword')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Info */}
          <div className={styles['sa-profile__account-info']}>
            <h3>{t('super_admin.profileAccountInfo')}</h3>
            {profile?.created_at && (
              <p>{t('super_admin.profileAccountCreated', { date: new Date(profile.created_at).toLocaleDateString('fr-FR') })}</p>
            )}
            {profile?.updated_at && (
              <p>{t('super_admin.profileLastModified', { date: new Date(profile.updated_at).toLocaleDateString('fr-FR') })}</p>
            )}
            {profile?.derniere_connexion && (
              <p>{t('super_admin.profileLastLogin', { date: new Date(profile.derniere_connexion).toLocaleString('fr-FR') })}</p>
            )}
            {profile?.statut_compte && (
              <p>{t('super_admin.profileStatus')} <strong>{profile.statut_compte}</strong></p>
            )}
            {profile?.type_compte && (
              <p>{t('super_admin.profileAccountType')} <strong>{profile.type_compte}</strong></p>
            )}
            {profile?.score_fiabilite !== undefined && (
              <p>{t('super_admin.profileReliabilityScore')} <strong>{profile.score_fiabilite}</strong></p>
            )}
            {(profile?.nombre_signalements_valides !== undefined || profile?.nombre_signalements_invalides !== undefined) && (
              <p>
                {t('super_admin.profileReportsValidInvalid', { valid: profile.nombre_signalements_valides || 0, invalid: profile.nombre_signalements_invalides || 0 })}
              </p>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminProfilePage;
