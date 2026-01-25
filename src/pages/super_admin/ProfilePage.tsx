/**
 * =====================================================
 * RETROUVONSLES - Super Admin Profile Page
 * Page de modification du profil super admin
 * Connecté à Supabase table: utilisateur
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  User, Mail, Phone, MapPin, Shield, Lock, Save,
  Loader2, AlertCircle, Check, Eye, EyeOff, Camera
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
  pays?: string;
  photo_profil?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export const SuperAdminProfilePage: React.FC = () => {
  useI18n(); // For future i18n support

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
    pays: '',
    bio: '',
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

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer l'utilisateur courant
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Non connecté');

      // Récupérer le profil utilisateur - l'id de utilisateur EST l'id de auth.users
      const { data, error: fetchError } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile({ ...data, email: user.email || data.email });
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        pays: data.pays || '',
        bio: data.bio || '',
      });
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (!profile) throw new Error('Profil non chargé');

      const { error: updateError } = await (supabase as any)
        .from('utilisateur')
        .update({
          nom: formData.nom,
          prenom: formData.prenom || null,
          telephone: formData.telephone || null,
          adresse: formData.adresse || null,
          ville: formData.ville || null,
          pays: formData.pays || null,
          bio: formData.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess('Profil mis à jour avec succès');
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
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (passwordData.newPassword.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Erreur changement mot de passe:', err);
      setError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <SuperAdminLayout title="Mon Profil" activeNav="profile">
        <div className={styles['sa-profile__loading']}>
          <Loader2 size={32} className={styles['sa-profile__spinner']} />
          <p>Chargement du profil...</p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Mon Profil" activeNav="profile">
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
                <img src={profile.photo_profil} alt="Avatar" />
              ) : (
                <User size={48} />
              )}
              <button className={styles['sa-profile__avatar-edit']}>
                <Camera size={16} />
              </button>
            </div>
            <div className={styles['sa-profile__header-info']}>
              <h2>{profile?.prenom} {profile?.nom}</h2>
              <p><Mail size={14} /> {profile?.email}</p>
              <span className={styles['sa-profile__badge']}>
                <Shield size={14} /> Super Administrateur
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className={styles['sa-profile__form']}>
            <h3>Informations personnelles</h3>
            
            <div className={styles['sa-profile__form-grid']}>
              <div className={styles['sa-profile__form-field']}>
                <label><User size={16} /> Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Votre nom"
                />
              </div>
              
              <div className={styles['sa-profile__form-field']}>
                <label><User size={16} /> Prénom</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Votre prénom"
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><Phone size={16} /> Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> Ville</label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Votre ville"
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> Pays</label>
                <input
                  type="text"
                  value={formData.pays}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                  placeholder="Votre pays"
                />
              </div>

              <div className={styles['sa-profile__form-field']}>
                <label><MapPin size={16} /> Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Votre adresse"
                />
              </div>
            </div>

            <div className={styles['sa-profile__form-field']}>
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Quelques mots sur vous..."
                rows={3}
              />
            </div>

            <div className={styles['sa-profile__form-actions']}>
              <button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className={styles['sa-profile__spinner']} /> : <Save size={16} />}
                Enregistrer les modifications
              </button>
            </div>
          </form>

          {/* Password Change */}
          <div className={styles['sa-profile__security']}>
            <h3><Lock size={18} /> Sécurité</h3>
            
            {!showPasswordForm ? (
              <button 
                onClick={() => setShowPasswordForm(true)}
                className={styles['sa-profile__password-btn']}
              >
                <Lock size={16} />
                Modifier mon mot de passe
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className={styles['sa-profile__password-form']}>
                <div className={styles['sa-profile__form-field']}>
                  <label>Nouveau mot de passe *</label>
                  <div className={styles['sa-profile__password-input']}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                      placeholder="Minimum 8 caractères"
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles['sa-profile__form-field']}>
                  <label>Confirmer le mot de passe *</label>
                  <div className={styles['sa-profile__password-input']}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="Confirmez le mot de passe"
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles['sa-profile__password-actions']}>
                  <button type="button" onClick={() => setShowPasswordForm(false)}>
                    Annuler
                  </button>
                  <button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 size={16} className={styles['sa-profile__spinner']} /> : <Check size={16} />}
                    Modifier le mot de passe
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Info */}
          {profile?.created_at && (
            <div className={styles['sa-profile__account-info']}>
              <p>Compte créé le {new Date(profile.created_at).toLocaleDateString('fr-FR')}</p>
              {profile.updated_at && (
                <p>Dernière modification le {new Date(profile.updated_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminProfilePage;
