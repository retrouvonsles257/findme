/**
 * =====================================================
 * RETROUVONSLES - Complete Profile Page
 * Page de complétion de profil après OAuth ou confirmation email
 * =====================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, User, Phone } from 'lucide-react';
import { supabase } from '../../config';
import { supabaseAuthService } from '../../services/supabase/auth';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';

import styles from './CompleteProfilePage.module.css';

interface ProfileData {
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  isFromOAuth: boolean;
  oauthProvider?: string;
}

interface CompleteProfileError {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  general?: string;
}

export const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppSelector(selectCurrentUser);

  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const state = location.state as ProfileData | undefined;
    return {
      email: state?.email || '',
      nom: state?.nom || '',
      prenom: state?.prenom || '',
      telephone: state?.telephone || '',
      isFromOAuth: state?.isFromOAuth || false,
      oauthProvider: state?.oauthProvider || undefined,
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<CompleteProfileError>({});
  const [completedStep, setCompletedStep] = useState(false);

  // Récupérer l'utilisateur courant de Supabase
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        // Pre-fill user data if available from OAuth
        if (session.user.user_metadata?.full_name && !location.state?.nom) {
          const parts = session.user.user_metadata.full_name.trim().split(' ');
          setProfileData(prev => ({
            ...prev,
            email: session.user.email || prev.email,
            prenom: parts[0] || prev.prenom,
            nom: parts.slice(1).join(' ') || prev.nom,
          }));
        } else if (session.user.email) {
          setProfileData(prev => ({
            ...prev,
            email: session.user.email || prev.email,
          }));
        }
      }
    };

    getSession();
  }, [location.state]);

  // Rediriger si pas de session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/register', { replace: true });
      }
    };

    checkSession();
  }, [navigate]);

  // Rediriger si connecté
  useEffect(() => {
    if (currentUser) {
      navigate('/citizen/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Validation du formulaire
  const validateForm = useCallback((): boolean => {
    const newErrors: CompleteProfileError = {};

    if (!profileData.nom.trim()) {
      newErrors.nom = 'Nom requis';
    } else if (profileData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!profileData.prenom.trim()) {
      newErrors.prenom = 'Prénom requis';
    } else if (profileData.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (profileData.telephone && !/^[\d\s\-+()]{10,}$/.test(profileData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profileData]);

  // Changement d'input
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.currentTarget;
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name as keyof CompleteProfileError]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  // Soumettre le formulaire
  const handleComplete = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      if (!userId) {
        setErrors({
          general: 'Session utilisateur non trouvée',
        });
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        // Appeler le service de complétion de profil
        const result = await supabaseAuthService.completeProfile({
          userId,
          nom: profileData.nom.trim(),
          prenom: profileData.prenom.trim(),
          telephone: profileData.telephone || undefined,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        setCompletedStep(true);

        // Déconnecter l'utilisateur et rediriger vers login
        // L'utilisateur devra se reconnecter avec ses identifiants
        await supabaseAuthService.logout();
        
        setTimeout(() => {
          navigate('/auth/login', { 
            replace: true,
            state: { 
              message: 'profile_completed',
              email: profileData.email
            }
          });
        }, 2000);
      } catch (error: any) {
        console.error('Profile completion error:', error);
        setErrors({
          general: error?.message || 'Erreur lors de la complétion du profil',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, profileData, userId, navigate]
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Carte formulaire */}
        <div className={styles.formCard}>
          {!completedStep ? (
            <>
              <h1 className={styles.title}>Compléter votre profil</h1>
              <p className={styles.subtitle}>
                {profileData.isFromOAuth
                  ? `Bienvenue! Complétez votre profil fourni par ${profileData.oauthProvider}`
                  : 'Vérifiez et complétez vos informations'}
              </p>

              <form onSubmit={handleComplete} className={styles.form}>
                {errors.general && (
                  <div className={styles.errorAlert}>
                    <span>{errors.general}</span>
                  </div>
                )}

                {/* Email (lecture seule) */}
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Adresse e-mail</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={18} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className={styles.inputDisabled}
                    />
                  </div>
                  <span className={styles.helperText}>Non modifiable</span>
                </div>

                {/* Prénom */}
                <div className={styles.formGroup}>
                  <label htmlFor="prenom" className={styles.label}>Prénom *</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={profileData.prenom}
                      onChange={handleInputChange}
                      placeholder="Votre prénom"
                      className={`${styles.input} ${errors.prenom ? styles.inputError : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.prenom && <span className={styles.fieldError}>{errors.prenom}</span>}
                </div>

                {/* Nom */}
                <div className={styles.formGroup}>
                  <label htmlFor="nom" className={styles.label}>Nom *</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={profileData.nom}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                      className={`${styles.input} ${errors.nom ? styles.inputError : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.nom && <span className={styles.fieldError}>{errors.nom}</span>}
                </div>

                {/* Téléphone (optionnel) */}
                <div className={styles.formGroup}>
                  <label htmlFor="telephone" className={styles.label}>Numéro de téléphone <span className={styles.optional}>(optionnel)</span></label>
                  <div className={styles.inputWrapper}>
                    <Phone className={styles.inputIcon} size={18} />
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={profileData.telephone || ''}
                      onChange={handleInputChange}
                      placeholder="+237 XXX XXX XXX"
                      className={`${styles.input} ${errors.telephone ? styles.inputError : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.telephone && <span className={styles.fieldError}>{errors.telephone}</span>}
                </div>

                {/* Bouton soumettre */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submitButton}
                >
                  {isLoading ? 'Complétion en cours...' : 'Terminer'}
                </button>
              </form>
            </>
          ) : (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successTitle}>Profil complété avec succès!</h2>
              <p className={styles.successText}>
                Votre compte a été créé avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
          )}
        </div>

        {/* Carte bleue */}
        <div className={styles.blueCard}>
          <div className={styles.badge}>Dernier pas</div>
          <h2 className={styles.blueTitle}>Presque prêt!</h2>
          <p className={styles.blueText}>
            {profileData.isFromOAuth
              ? 'Vos informations du compte tiers ont été pré-remplies. Complétez juste quelques détails supplémentaires pour finaliser votre inscription.'
              : 'Votre email a été confirmé. Remplissez les informations manquantes pour activer complètement votre compte.'}
          </p>
          <div className={styles.checklist}>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>Email confirmé</span>
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>Profil complet</span>
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>Prêt à commencer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
