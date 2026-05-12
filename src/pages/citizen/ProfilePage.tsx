/**
 * =====================================================
 * RETROUVONSLES - Citizen Profile Page
 * Gestion du profil utilisateur
 * Intégré avec Supabase API
 * =====================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import { CitizenLayout } from './CitizenLayout';
import { 
  User, Mail, Phone, MapPin, CheckCircle, Camera, 
  Loader2, AlertCircle, Save, Shield, Settings, BadgeCheck
} from 'lucide-react';
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './ProfilePage.module.css';
import { StatutCompte } from '../../@types/enums.types';

interface ProfileData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  region: string;
  photo_profil: string;
  rayon_notification_km: number;
  accepte_notifications: boolean;
  accepte_geolocalisation: boolean;
}

export const CitizenProfilePage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verificationDocInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVerificationDoc, setUploadingVerificationDoc] = useState(false);
  const [verificationDocUrl, setVerificationDocUrl] = useState<string>('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [profileIdentityVerified, setProfileIdentityVerified] = useState(Boolean((currentUser as any)?.identite_verifiee));
  const [profileStatus, setProfileStatus] = useState<string>((currentUser as any)?.statut_compte || '');

  const [formData, setFormData] = useState<ProfileData>({
    nom: '',
    prenom: '',
    email: (currentUser as any)?.email || '',
    telephone: '',
    adresse: '',
    ville: '',
    region: '',
    photo_profil: '',
    rayon_notification_km: 50,
    accepte_notifications: true,
    accepte_geolocalisation: false,
  });

  const isVerified = profileIdentityVerified || Boolean((currentUser as any)?.identite_verifiee);
  const isVerificationPending =
    profileStatus === StatutCompte.EN_ATTENTE_VERIFICATION ||
    (currentUser as any)?.statut_compte === StatutCompte.EN_ATTENTE_VERIFICATION;

  // Charger le profil depuis Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const { data, error } = await (supabase as any)
          .from('utilisateur')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setFormData({
            nom: data.nom || '',
            prenom: data.prenom || '',
            email: data.email || (currentUser as any)?.email || '',
            telephone: data.telephone || '',
            adresse: data.adresse || '',
            ville: data.ville || '',
            region: data.region || '',
            photo_profil: data.photo_profil || '',
            rayon_notification_km: data.rayon_notification_km || 50,
            accepte_notifications: data.accepte_notifications ?? true,
            accepte_geolocalisation: data.accepte_geolocalisation ?? false,
          });
          setVerificationDocUrl(data.document_accreditation || '');
          setProfileIdentityVerified(Boolean(data.identite_verifiee));
          setProfileStatus(data.statut_compte || '');
        }
      } catch (err: any) {
        console.error('Erreur chargement profil:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser]);

  // Gérer les changements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Uploader une photo de profil
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError(null);

      const result = await uploadFileToCloudinary(file, {
        type: 'profilePhoto',
      });

      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, photo_profil: result.url! }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      setError(t('citizen.photoUploadError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Uploader un document de vérification d'identité (CNI, passeport, etc.)
  const handleVerificationDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVerificationDoc(true);
      setError(null);

      const result = await uploadFileToCloudinary(file, {
        type: 'document',
        tags: ['identity-verification'],
        context: userId ? { userId: String(userId) } : undefined,
      });

      if (result.success && (result.secureUrl || result.url)) {
        setVerificationDocUrl((result.secureUrl || result.url) as string);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError('Erreur lors de l’upload du document');
    } finally {
      setUploadingVerificationDoc(false);
    }
  };

  // Soumettre la demande de vérification (visible dans l’interface modérateur)
  const submitIdentityVerification = async () => {
    if (!userId) return;
    if (!verificationDocUrl) {
      setError('Veuillez d’abord uploader un document (CNI, passeport, etc.)');
      return;
    }

    try {
      setSubmittingVerification(true);
      setError(null);
      setSuccess(null);

      const { error: submitError } = await (supabase as any).rpc('submit_identity_verification', {
        p_type_document: 'autre',
        p_url_document: verificationDocUrl,
        p_url_selfie: null,
      });

      if (submitError) throw submitError;

      setProfileIdentityVerified(false);
      setProfileStatus(StatutCompte.EN_ATTENTE_VERIFICATION);
      setSuccess('Demande de vérification envoyée. Un modérateur va examiner votre document.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Erreur soumission vérification:', err);
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Sauvegarder le profil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Mettre à jour la table utilisateur
      const { error: dbError } = await (supabase as any)
        .from('utilisateur')
        .upsert({
          id: userId,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse,
          ville: formData.ville,
          region: formData.region,
          photo_profil: formData.photo_profil,
          rayon_notification_km: formData.rayon_notification_km,
          accepte_notifications: formData.accepte_notifications,
          accepte_geolocalisation: formData.accepte_geolocalisation,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (dbError) throw dbError;

      // Mettre à jour les métadonnées Auth
      await (supabase as any).auth.updateUser({
        data: {
          first_name: formData.prenom,
          last_name: formData.nom,
          phone: formData.telephone,
        }
      });

      setSuccess(t('citizen.profileUpdated'));
      setIsEditing(false);

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Erreur sauvegarde profil:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const userEmail = formData.email || (currentUser as any)?.email || '';
  const userName = formData.prenom 
    ? `${formData.prenom} ${formData.nom}` 
    : userEmail;

  if (isLoading) {
    return (
      <CitizenLayout activeNav="profile">
        <div className={styles.profile}>
          <div className={styles['profile__skeletonWrap']}>
            <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="profile">
      <div className={styles.profile}>
        {/* Messages */}
        {error && (
          <div className={styles['profile__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles['profile__success']}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className={styles['profile__header']}>
          <div className={styles['profile__info-wrapper']}>
            <div className={styles['profile__avatar']}>
              {formData.photo_profil ? (
                <img 
                  src={formData.photo_profil} 
                  alt={userName}
                  className={styles['profile__avatar-image']}
                />
              ) : (
                <User size={48} />
              )}
              {isEditing && (
                <button
                  type="button"
                  className={styles['profile__avatar-upload']}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <Loader2 size={16} className={styles['profile__loading-spin']} />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className={styles['profile__avatar-input']}
              />
            </div>
            <div className={styles['profile__info']}>
              <h2 className={styles['profile__name']}>{userName}</h2>
              <p className={styles['profile__email']}>{userEmail}</p>
              {isVerified && (
                <div className={styles['profile__verified-badge']} title={t('citizen.verified')}>
                  <BadgeCheck size={22} className={styles['profile__verified-icon']} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className={styles['profile__form-container']}>
          <div className={styles['profile__form-header']}>
            <h3 className={styles['profile__form-title']}>{t('citizen.personalInformation')}</h3>
            <button
              className={styles['profile__edit-button']}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? t('citizen.cancel') : t('citizen.modify')}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className={styles['profile__form']}>
              <div className={styles['profile__form-row']}>
                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>{t('citizen.firstName')}</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className={styles['profile__input']}
                    placeholder={t('citizen.firstNamePlaceholder')}
                  />
                </div>
                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>{t('citizen.lastName')}</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={styles['profile__input']}
                    placeholder={t('citizen.lastNamePlaceholder')}
                  />
                </div>
              </div>

              <div className={styles['profile__form-row']}>
                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>{t('citizen.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    className={styles['profile__input']}
                    disabled
                  />
                </div>
                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>{t('citizen.phone')}</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder={t('citizen.phonePlaceholder')}
                    className={styles['profile__input']}
                  />
                </div>
              </div>

              <div className={styles['profile__form-group']}>
                <label className={styles['profile__label']}>{t('citizen.address')}</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder={t('citizen.addressPlaceholder')}
                  className={styles['profile__input']}
                />
              </div>

              <div className={styles['profile__form-row']}>
                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>{t('citizen.city')}</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    placeholder={t('citizen.cityPlaceholder')}
                    className={styles['profile__input']}
                  />
                </div>
                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>{t('citizen.region')}</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder={t('citizen.regionPlaceholder')}
                    className={styles['profile__input']}
                  />
                </div>
              </div>

              {/* Notification Preferences */}
              <div className={styles['profile__section']}>
                <h4 className={styles['profile__section-title']}>
                  <Settings size={18} />
                  {t('citizen.notificationPreferences')}
                </h4>

                <div className={styles['profile__form-group']}>
                  <label className={styles['profile__label']}>
                    {t('citizen.notificationRadius')} (km)
                  </label>
                  <input
                    type="number"
                    name="rayon_notification_km"
                    value={formData.rayon_notification_km}
                    onChange={handleChange}
                    min="1"
                    max="500"
                    className={styles['profile__input']}
                  />
                </div>

                <div className={styles['profile__checkbox-group']}>
                  <label className={styles['profile__checkbox-label']}>
                    <input
                      type="checkbox"
                      name="accepte_notifications"
                      checked={formData.accepte_notifications}
                      onChange={handleChange}
                      className={styles['profile__checkbox']}
                    />
                    <span>{t('citizen.acceptNotifications')}</span>
                  </label>
                </div>

                <div className={styles['profile__checkbox-group']}>
                  <label className={styles['profile__checkbox-label']}>
                    <input
                      type="checkbox"
                      name="accepte_geolocalisation"
                      checked={formData.accepte_geolocalisation}
                      onChange={handleChange}
                      className={styles['profile__checkbox']}
                    />
                    <span>{t('citizen.acceptGeolocation')}</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className={styles['profile__submit-button']}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className={styles['profile__loading-spin']} />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t('citizen.saveChanges')}
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className={styles['profile__info-grid']}>
              <div className={styles['profile__info-item']}>
                <Mail size={20} className={styles['profile__info-item-icon']} />
                <div className={styles['profile__info-item-content']}>
                  <p className={styles['profile__info-label']}>{t('citizen.email')}</p>
                  <p className={styles['profile__info-value']}>{userEmail}</p>
                </div>
              </div>
              <div className={styles['profile__info-item']}>
                <Phone size={20} className={styles['profile__info-item-icon']} />
                <div className={styles['profile__info-item-content']}>
                  <p className={styles['profile__info-label']}>{t('citizen.phone')}</p>
                  <p className={styles['profile__info-value']}>{formData.telephone || '—'}</p>
                </div>
              </div>
              <div className={styles['profile__info-item']}>
                <MapPin size={20} className={styles['profile__info-item-icon']} />
                <div className={styles['profile__info-item-content']}>
                  <p className={styles['profile__info-label']}>{t('citizen.address')}</p>
                  <p className={styles['profile__info-value']}>
                    {formData.adresse || formData.ville || formData.region || '—'}
                  </p>
                </div>
              </div>
              <div className={styles['profile__info-item']}>
                <Shield size={20} className={styles['profile__info-item-icon']} />
                <div className={styles['profile__info-item-content']}>
                  <p className={styles['profile__info-label']}>{t('citizen.notificationRadius')}</p>
                  <p className={styles['profile__info-value']}>{formData.rayon_notification_km} km</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Identity verification */}
        {!isVerified && (
          <div className={styles['profile__form-container']}>
            <div className={styles['profile__form-header']}>
              <h3 className={styles['profile__form-title']}>
                <Shield size={18} style={{ marginRight: 8 }} />
                Vérification d’identité
              </h3>
            </div>

            <div className={styles['profile__info-item']}>
              <Shield size={20} className={styles['profile__info-item-icon']} />
              <div className={styles['profile__info-item-content']}>
                <p className={styles['profile__info-item-label']}>Statut</p>
                <p className={styles['profile__info-item-value']}>
                  {isVerificationPending ? 'En attente de vérification' : 'Non vérifié'}
                </p>
              </div>
            </div>

            <div className={styles['profile__form']} style={{ marginTop: 12 }}>
              <div className={styles['profile__form-group']}>
                <label className={styles['profile__label']}>Document (CNI / Passeport / Acte…)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button
                    type="button"
                    className={styles['profile__edit-button']}
                    onClick={() => verificationDocInputRef.current?.click()}
                    disabled={uploadingVerificationDoc || submittingVerification}
                  >
                    {uploadingVerificationDoc ? 'Upload…' : (verificationDocUrl ? 'Changer le document' : 'Uploader un document')}
                  </button>
                  {verificationDocUrl && (
                    <a href={verificationDocUrl} target="_blank" rel="noopener noreferrer">
                      Voir le document
                    </a>
                  )}
                  <input
                    ref={verificationDocInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleVerificationDocUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <button
                type="button"
                className={styles['profile__save-button']}
                onClick={submitIdentityVerification}
                disabled={submittingVerification || uploadingVerificationDoc || !verificationDocUrl}
              >
                {submittingVerification ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        )}
      </div>
    </CitizenLayout>
  );
};