/**
 * =====================================================
 * RETROUVONSLES - Authority Profile Page
 * Page de profil utilisateur avec édition
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
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

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
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

  // Charger le profil
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Erreur gérée par la notification
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger le profil',
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
        pays: data.pays || 'Cameroun',
        accepte_notifications: data.accepte_notifications ?? true,
        accepte_geolocalisation: data.accepte_geolocalisation ?? false,
        rayon_notification_km: data.rayon_notification_km || 50,
        langue_preferee: data.langue_preferee || 'fr',
      });
    } catch (err) {
      // Erreur gérée par la notification
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, addNotification]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!user?.id) return;

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
        .eq('id', user.id);

      if (error) {
        // Erreur gérée par la notification
        addNotification({
          title: 'Erreur',
          message: error.message || 'Impossible de sauvegarder le profil',
          type: 'error',
        });
        return;
      }

      addNotification({
        title: 'Succès',
        message: 'Profil mis à jour avec succès',
        type: 'success',
      });
      
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      // Erreur gérée par la notification
      addNotification({
        title: 'Erreur',
        message: err.message || 'Une erreur est survenue',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload photo de profil
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

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
        throw new Error('Upload failed');
      }

      // Mettre à jour la base de données
      const { error } = await (supabase as any)
        .from('utilisateur')
        .update({ photo_profil: data.secure_url })
        .eq('id', user.id);

      if (error) throw error;

      addNotification({
        title: 'Succès',
        message: 'Photo de profil mise à jour',
        type: 'success',
      });

      loadProfile();
    } catch (err: any) {
      // Erreur gérée par la notification
      addNotification({
        title: 'Erreur',
        message: 'Impossible de télécharger la photo',
        type: 'error',
      });
    } finally {
      setIsUploadingPhoto(false);
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
        pays: profile.pays || 'Cameroun',
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
        return { label: 'Actif', color: '#28a745', icon: <CheckCircle size={14} /> };
      case 'suspendu':
        return { label: 'Suspendu', color: '#dc3545', icon: <AlertTriangle size={14} /> };
      case 'en_attente_verification':
        return { label: 'En attente', color: '#ffc107', icon: <Loader2 size={14} /> };
      default:
        return { label: statut, color: '#6c757d', icon: <User size={14} /> };
    }
  };

  if (isLoading) {
    return (
      <AuthorityLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Chargement du profil...</p>
        </div>
      </AuthorityLayout>
    );
  }

  if (!profile) {
    return (
      <AuthorityLayout>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} />
          <h2>Profil introuvable</h2>
          <p>Impossible de charger vos informations de profil.</p>
          <button onClick={() => navigate('/authority/dashboard')}>
            Retour au tableau de bord
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
          <h1><User size={24} /> Mon Profil</h1>
          {!isEditing ? (
            <button 
              className={styles.editBtn}
              onClick={() => setIsEditing(true)}
            >
              <Edit size={18} /> Modifier
            </button>
          ) : (
            <div className={styles.headerActions}>
              <button 
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X size={18} /> Annuler
              </button>
              <button 
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 size={18} className={styles.spinner} /> Enregistrement...</>
                ) : (
                  <><Save size={18} /> Enregistrer</>
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
                <span className={styles.statLabel}>Score Fiabilité</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{profile.nombre_signalements_valides || 0}</span>
                <span className={styles.statLabel}>Signalements Valides</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{profile.nombre_signalements_invalides || 0}</span>
                <span className={styles.statLabel}>Signalements Invalides</span>
              </div>
            </div>
          </div>

          {/* Formulaire d'informations personnelles */}
          <div className={styles.formSection}>
            <h3><User size={18} /> Informations Personnelles</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Votre nom"
                  />
                ) : (
                  <p>{profile.nom || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Prénom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Votre prénom"
                  />
                ) : (
                  <p>{profile.prenom || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Phone size={14} /> Téléphone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                  />
                ) : (
                  <p>{profile.telephone || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Calendar size={14} /> Date de naissance</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                  />
                ) : (
                  <p>{profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString('fr-FR') : '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Adresse */}
          <div className={styles.formSection}>
            <h3><MapPin size={18} /> Adresse</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label>Adresse complète</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Rue, quartier..."
                  />
                ) : (
                  <p>{profile.adresse || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Ville</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder="Votre ville"
                  />
                ) : (
                  <p>{profile.ville || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Région</label>
                {isEditing ? (
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Centre">Centre</option>
                    <option value="Littoral">Littoral</option>
                    <option value="Ouest">Ouest</option>
                    <option value="Nord-Ouest">Nord-Ouest</option>
                    <option value="Sud-Ouest">Sud-Ouest</option>
                    <option value="Sud">Sud</option>
                    <option value="Est">Est</option>
                    <option value="Adamaoua">Adamaoua</option>
                    <option value="Nord">Nord</option>
                    <option value="Extrême-Nord">Extrême-Nord</option>
                  </select>
                ) : (
                  <p>{profile.region || '-'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Globe size={14} /> Pays</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    placeholder="Pays"
                  />
                ) : (
                  <p>{profile.pays || 'Cameroun'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Préférences */}
          <div className={styles.formSection}>
            <h3><Bell size={18} /> Préférences</h3>
            
            <div className={styles.preferencesGrid}>
              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <Bell size={20} />
                  <div>
                    <h4>Notifications</h4>
                    <p>Recevoir les alertes et mises à jour</p>
                  </div>
                </div>
                {isEditing ? (
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.accepte_notifications}
                      onChange={(e) => setFormData({ ...formData, accepte_notifications: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                ) : (
                  <span className={`${styles.statusDot} ${profile.accepte_notifications ? styles.active : ''}`}>
                    {profile.accepte_notifications ? 'Activé' : 'Désactivé'}
                  </span>
                )}
              </div>

              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <MapPin size={20} />
                  <div>
                    <h4>Géolocalisation</h4>
                    <p>Partager ma position pour les alertes locales</p>
                  </div>
                </div>
                {isEditing ? (
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.accepte_geolocalisation}
                      onChange={(e) => setFormData({ ...formData, accepte_geolocalisation: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                ) : (
                  <span className={`${styles.statusDot} ${profile.accepte_geolocalisation ? styles.active : ''}`}>
                    {profile.accepte_geolocalisation ? 'Activé' : 'Désactivé'}
                  </span>
                )}
              </div>

              {isEditing && (
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <Globe size={20} />
                    <div>
                      <h4>Rayon de notification</h4>
                      <p>Distance pour recevoir les alertes</p>
                    </div>
                  </div>
                  <div className={styles.rangeInput}>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={formData.rayon_notification_km}
                      onChange={(e) => setFormData({ ...formData, rayon_notification_km: Number(e.target.value) })}
                    />
                    <span>{formData.rayon_notification_km} km</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Sécurité */}
          <div className={styles.formSection}>
            <h3><Lock size={18} /> Sécurité</h3>
            
            <div className={styles.securityInfo}>
              <div className={styles.infoItem}>
                <Building size={16} />
                <span>Badge: {profile.numero_badge || 'Non attribué'}</span>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={16} />
                <span>Membre depuis: {new Date(profile.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className={styles.infoItem}>
                <Shield size={16} />
                <span>Dernière connexion: {profile.derniere_connexion 
                  ? new Date(profile.derniere_connexion).toLocaleString('fr-FR')
                  : 'N/A'}</span>
              </div>
            </div>

            <button 
              className={styles.changePasswordBtn}
              onClick={() => navigate('/authority/security')}
            >
              <Lock size={16} /> Changer le mot de passe
            </button>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default ProfilePage;
