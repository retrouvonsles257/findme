/**
 * Création d'une fiche personne — silo Autorité (`/authority/create-person`).
 * Avec `noLayout` + `basePath`, peut être embarqué dans le layout opérateur legacy.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import { AuthorityLayout } from '../../components/layout';
import { cloudinaryService } from '../../services/cloudinary/cloudinaryService';
import * as personneAPI from '../../features/personnes/services/personneAPI';
import { logActivity } from '../../services/audit/auditService';
import { NomRole, TypeAction } from '../../@types/enums.types';
import { 
  User,
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Camera,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  Upload,
  Info
} from 'lucide-react';
import styles from './CreatePersonPage.module.css';

interface PersonFormData {
  // Base
  nom: string;
  prenom: string;
  nom_complet: string;
  alias: string;
  sexe: string;
  date_naissance: string;
  age_estime_min: string;
  age_estime_max: string;
  nationalite: string;
  langue_parlee: string;

  // Physique
  description_physique: string;
  taille_cm: string;
  poids_kg: string;
  corpulence: string;
  couleur_peau: string;
  couleur_cheveux: string;
  type_cheveux: string;
  couleur_yeux: string;
  signes_distinctifs: string;
  handicaps_maladies: string;
  groupe_sanguin: string;

  // Complémentaire
  numero_identification: string;
  type_identification: string;
  situation_familiale: string;
  nombre_enfants: string;
  derniers_vetements_portes: string;
  accessoires: string;
}

const initialFormData: PersonFormData = {
  nom: '',
  prenom: '',
  nom_complet: '',
  alias: '',
  sexe: 'non_precise',
  date_naissance: '',
  age_estime_min: '',
  age_estime_max: '',
  nationalite: 'Camerounaise',
  langue_parlee: 'Français',
  description_physique: '',
  taille_cm: '',
  poids_kg: '',
  corpulence: 'moyenne',           // 'mince' | 'moyenne' | 'forte' | 'athletique' | 'inconnue'
  couleur_peau: 'foncee',          // 'claire' | 'mate' | 'foncee' | 'tres_foncee' | 'inconnue'
  couleur_cheveux: '',
  type_cheveux: 'autre',           // 'courts' | 'longs' | 'frises' | 'raides' | 'tresses' | 'rases' | 'autre'
  couleur_yeux: '',
  signes_distinctifs: '',
  handicaps_maladies: '',
  groupe_sanguin: '',
  numero_identification: '',
  type_identification: 'cni',      // 'cni' | 'passeport' | 'acte_naissance' | 'aucun' | 'autre'
  situation_familiale: 'famille_inconnue',  // 'avec_famille' | 'orphelin' | 'separe_famille' | 'famille_inconnue' | 'autre'
  nombre_enfants: '',
  derniers_vetements_portes: '',
  accessoires: '',
};

export interface CreatePersonPageProps {
  /** Préfixe des routes (ex. `/authority`, `/admin`). */
  basePath?: string;
  /** Si true, pas de `AuthorityLayout` (ex. wrapper opérateur legacy). */
  noLayout?: boolean;
}

export const CreatePersonPage: React.FC<CreatePersonPageProps> = ({ basePath = '/authority', noLayout = false }) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  const [formData, setFormData] = useState<PersonFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (currentUser && currentUser.role !== NomRole.AUTORITE && currentUser.role !== NomRole.ADMIN_SYSTEME) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  const handleInputChange = (field: keyof PersonFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-génération du nom complet
    if (field === 'nom' || field === 'prenom') {
      const nom = field === 'nom' ? value : formData.nom;
      const prenom = field === 'prenom' ? value : formData.prenom;
      setFormData(prev => ({
        ...prev,
        [field]: value,
        nom_complet: `${prenom} ${nom}`.trim()
      }));
    }
  };

  // Gestion des photos
  const handlePhotosSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.slice(0, 10 - photos.length);
    const validFiles = newFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) return false;
      if (!file.type.startsWith('image/')) return false;
      return true;
    });

    if (validFiles.length > 0) {
      setPhotos(prev => [...prev, ...validFiles]);
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  }, [photos.length]);

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
      if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    }

    if (step === 2) {
      if (!formData.description_physique.trim() || formData.description_physique.length < 20) {
        newErrors.description_physique = 'La description physique est requise (min. 20 caractères)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation - SANS useCallback pour éviter les problèmes de closure
  const goToNextStep = () => {
    if (currentStep >= 3) return;
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => prev + 1);
  };

  const goToPrevStep = () => {
    if (currentStep <= 1) return;
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (currentStep !== 3) return;
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let photoUrl = '';

      if (photos.length > 0) {
        const uploadResult = await cloudinaryService.uploadFile(
          photos[0],
          'personPhoto',
          {},
          (progress) => setUploadProgress(Math.round(progress.percentage))
        );
        if (uploadResult.success && uploadResult.secureUrl) {
          photoUrl = uploadResult.secureUrl;
        }
      }

      const personneData = {
        nom: formData.nom,
        prenom: formData.prenom,
        nom_complet: formData.nom_complet || `${formData.prenom} ${formData.nom}`.trim(),
        alias: formData.alias || undefined,
        sexe: formData.sexe as 'masculin' | 'feminin' | 'inconnu' | 'non_precise',
        date_naissance: formData.date_naissance || undefined,
        age_estime_min: formData.age_estime_min ? parseInt(formData.age_estime_min) : undefined,
        age_estime_max: formData.age_estime_max ? parseInt(formData.age_estime_max) : undefined,
        nationalite: formData.nationalite,
        langue_parlee: formData.langue_parlee,
        description_physique: formData.description_physique,
        taille_cm: formData.taille_cm ? parseInt(formData.taille_cm) : undefined,
        poids_kg: formData.poids_kg ? parseInt(formData.poids_kg) : undefined,
        corpulence: formData.corpulence,
        couleur_peau: formData.couleur_peau,
        couleur_cheveux: formData.couleur_cheveux || undefined,
        type_cheveux: formData.type_cheveux,
        couleur_yeux: formData.couleur_yeux || undefined,
        signes_distinctifs: formData.signes_distinctifs || undefined,
        handicaps_maladies: formData.handicaps_maladies || undefined,
        groupe_sanguin: formData.groupe_sanguin || undefined,
        numero_identification: formData.numero_identification || undefined,
        type_identification: formData.type_identification,
        situation_familiale: formData.situation_familiale,
        nombre_enfants: formData.nombre_enfants ? parseInt(formData.nombre_enfants) : undefined,
        derniers_vetements_portes: formData.derniers_vetements_portes || undefined,
        accessoires: formData.accessoires || undefined,
        photo_principale: photoUrl || undefined,
        statut_identite: 'identifie' as const,
        fiabilite_informations: 'probable' as const,
      };

      const createdPersonne = await personneAPI.createPersonne(
        personneData as any,
        currentUser?.id || 'anonymous'
      );

      await logActivity({
        type_action: TypeAction.AUTRE,
        description: 'Création personne (autorité)',
        action_detaillee: 'creation_personne',
        id_utilisateur: currentUser?.id || null,
        donnees_apres: { id: createdPersonne.id, nom: createdPersonne.nom, prenom: createdPersonne.prenom },
      });

      // Insérer les photos dans la table photo
      if (photoUrl && createdPersonne?.id) {
        try {
          const { supabase } = await import('../../config');
          await (supabase as any).from('photo').insert({
            url_cloudinary: photoUrl,
            type_photo: 'portrait',
            id_personne: createdPersonne.id,
            est_principale: true,
            visible_public: false,
            approuvee: false,
            uploadee_par: currentUser?.id || null,
            qualite_image: 'moyenne',
          });

          await logActivity({
            type_action: TypeAction.UPLOAD_PHOTO,
            description: 'Upload photo personne (opérateur)',
            action_detaillee: 'upload_photo_personne',
            id_utilisateur: currentUser?.id || null,
            donnees_apres: { est_principale: true, id_personne: createdPersonne.id },
          });

          // Uploader les photos supplémentaires
          for (let i = 1; i < photos.length; i++) {
            const additionalUpload = await cloudinaryService.uploadFile(
              photos[i],
              'personPhoto',
              {},
              () => {}
            );
            if (additionalUpload.success && additionalUpload.secureUrl) {
              await (supabase as any).from('photo').insert({
                url_cloudinary: additionalUpload.secureUrl,
                type_photo: 'portrait',
                id_personne: createdPersonne.id,
                est_principale: false,
                visible_public: false,
                approuvee: false,
                uploadee_par: currentUser?.id || null,
                qualite_image: 'moyenne',
              });
            }
          }
        } catch (photoError) {
          console.error('Error inserting photos:', photoError);
        }
      }

      setSuccessMessage('Fiche de personne créée avec succès!');
      setTimeout(() => navigate(`${basePath}/personnes/${createdPersonne.id}`), 2000);

    } catch (err: any) {
      console.error('Error creating person:', err);
      setErrorMessage(err.message || 'Erreur lors de la création de la fiche');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const steps = [
    { number: 1, title: 'Identité', icon: User },
    { number: 2, title: 'Physique', icon: User },
    { number: 3, title: 'Compléments', icon: Info },
  ];

  const pageInner = (
      <div className={styles.createPerson}>
        {/* Header avec stepper */}
        <div className={styles.createPerson__header}>
          <div className={styles.createPerson__headerInfo}>
            <User className={styles.createPerson__headerIcon} />
            <div>
              <h2 className={styles.createPerson__title}>Nouvelle fiche personne</h2>
              <p className={styles.createPerson__subtitle}>Étape {currentStep} sur 3</p>
            </div>
          </div>

          <div className={styles.createPerson__stepper}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className={`${styles.createPerson__stepItem} ${isActive ? styles['createPerson__stepItem--active'] : ''} ${isCompleted ? styles['createPerson__stepItem--completed'] : ''}`}>
                    <div className={styles.createPerson__stepCircle}>
                      {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={18} />}
                    </div>
                    <span className={styles.createPerson__stepLabel}>{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`${styles.createPerson__stepConnector} ${isCompleted ? styles['createPerson__stepConnector--completed'] : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className={styles.createPerson__alert + ' ' + styles['createPerson__alert--error']}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className={styles.createPerson__alert + ' ' + styles['createPerson__alert--success']}>
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Contenu */}
        <div className={styles.createPerson__content}>
          {/* ÉTAPE 1: Identité */}
          {currentStep === 1 && (
            <div className={styles.createPerson__section}>
              <div className={styles.createPerson__sectionHeader}>
                <User className={styles.createPerson__sectionIcon} />
                <div>
                  <h3 className={styles.createPerson__sectionTitle}>Informations d'identité</h3>
                  <p className={styles.createPerson__sectionSubtitle}>Nom, prénom et informations de base</p>
                </div>
              </div>

              {/* Photo upload */}
              <div className={styles.createPerson__photoUpload}>
                <label className={styles.createPerson__label}>
                  <Camera size={16} />
                  Photos (optionnel)
                </label>

                <div className={styles.createPerson__photoGrid}>
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className={styles.createPerson__photoItem}>
                      <img src={preview} alt={`Aperçu ${index + 1}`} />
                      <button type="button" className={styles.createPerson__photoRemove} onClick={() => removePhoto(index)}>
                        <X size={14} />
                      </button>
                      {index === 0 && <span className={styles.createPerson__photoBadge}>Principale</span>}
                    </div>
                  ))}

                  {photos.length < 10 && (
                    <label className={styles.createPerson__photoAdd}>
                      <input type="file" accept="image/*" multiple onChange={handlePhotosSelected} style={{ display: 'none' }} />
                      <Upload size={24} />
                      <span>Ajouter</span>
                    </label>
                  )}
                </div>
              </div>

              <div className={styles.createPerson__fields}>
                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Prénom <span className={styles.createPerson__required}>*</span></label>
                    <input
                      type="text"
                      className={`${styles.createPerson__input} ${errors.prenom ? styles['createPerson__input--error'] : ''}`}
                      placeholder="Prénom"
                      value={formData.prenom}
                      onChange={(e) => handleInputChange('prenom', e.target.value)}
                    />
                    {errors.prenom && <span className={styles.createPerson__error}>{errors.prenom}</span>}
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Nom <span className={styles.createPerson__required}>*</span></label>
                    <input
                      type="text"
                      className={`${styles.createPerson__input} ${errors.nom ? styles['createPerson__input--error'] : ''}`}
                      placeholder="Nom de famille"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                    />
                    {errors.nom && <span className={styles.createPerson__error}>{errors.nom}</span>}
                  </div>
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Alias / Surnom</label>
                    <input type="text" className={styles.createPerson__input} placeholder="Surnom éventuel" value={formData.alias} onChange={(e) => handleInputChange('alias', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Sexe</label>
                    <select className={styles.createPerson__select} value={formData.sexe} onChange={(e) => handleInputChange('sexe', e.target.value)}>
                      <option value="non_precise">Non précisé</option>
                      <option value="masculin">Masculin</option>
                      <option value="feminin">Féminin</option>
                      <option value="inconnu">Inconnu</option>
                    </select>
                  </div>
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Date de naissance</label>
                    <input type="date" className={styles.createPerson__input} value={formData.date_naissance} onChange={(e) => handleInputChange('date_naissance', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Âge estimé</label>
                    <div className={styles.createPerson__ageRange}>
                      <input type="number" className={styles.createPerson__input} placeholder="Min" value={formData.age_estime_min} onChange={(e) => handleInputChange('age_estime_min', e.target.value)} min="0" max="150" />
                      <span>à</span>
                      <input type="number" className={styles.createPerson__input} placeholder="Max" value={formData.age_estime_max} onChange={(e) => handleInputChange('age_estime_max', e.target.value)} min="0" max="150" />
                      <span>ans</span>
                    </div>
                  </div>
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Nationalité</label>
                    <input type="text" className={styles.createPerson__input} value={formData.nationalite} onChange={(e) => handleInputChange('nationalite', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Langue parlée</label>
                    <input type="text" className={styles.createPerson__input} value={formData.langue_parlee} onChange={(e) => handleInputChange('langue_parlee', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Physique */}
          {currentStep === 2 && (
            <div className={styles.createPerson__section}>
              <div className={styles.createPerson__sectionHeader}>
                <User className={styles.createPerson__sectionIcon} />
                <div>
                  <h3 className={styles.createPerson__sectionTitle}>Caractéristiques physiques</h3>
                  <p className={styles.createPerson__sectionSubtitle}>Description détaillée de l'apparence</p>
                </div>
              </div>

              <div className={styles.createPerson__fields}>
                <div className={styles.createPerson__fieldGroup}>
                  <label className={styles.createPerson__label}>Description physique <span className={styles.createPerson__required}>*</span></label>
                  <textarea
                    className={`${styles.createPerson__textarea} ${errors.description_physique ? styles['createPerson__textarea--error'] : ''}`}
                    placeholder="Décrivez l'apparence physique en détail..."
                    value={formData.description_physique}
                    onChange={(e) => handleInputChange('description_physique', e.target.value)}
                    rows={4}
                  />
                  {errors.description_physique && <span className={styles.createPerson__error}>{errors.description_physique}</span>}
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Taille (cm)</label>
                    <input type="number" className={styles.createPerson__input} placeholder="Ex: 170" value={formData.taille_cm} onChange={(e) => handleInputChange('taille_cm', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Poids (kg)</label>
                    <input type="number" className={styles.createPerson__input} placeholder="Ex: 65" value={formData.poids_kg} onChange={(e) => handleInputChange('poids_kg', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Corpulence</label>
                    <select className={styles.createPerson__select} value={formData.corpulence} onChange={(e) => handleInputChange('corpulence', e.target.value)}>
                      <option value="mince">Mince</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="forte">Forte</option>
                      <option value="athletique">Athlétique</option>
                      <option value="inconnue">Inconnue</option>
                    </select>
                  </div>
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Couleur de peau</label>
                    <select className={styles.createPerson__select} value={formData.couleur_peau} onChange={(e) => handleInputChange('couleur_peau', e.target.value)}>
                      <option value="claire">Claire</option>
                      <option value="mate">Mate</option>
                      <option value="foncee">Foncée</option>
                      <option value="tres_foncee">Très foncée</option>
                      <option value="inconnue">Inconnue</option>
                    </select>
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Couleur cheveux</label>
                    <input type="text" className={styles.createPerson__input} placeholder="Ex: Noir" value={formData.couleur_cheveux} onChange={(e) => handleInputChange('couleur_cheveux', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Type cheveux</label>
                    <select className={styles.createPerson__select} value={formData.type_cheveux} onChange={(e) => handleInputChange('type_cheveux', e.target.value)}>
                      <option value="courts">Courts</option>
                      <option value="longs">Longs</option>
                      <option value="frises">Frisés</option>
                      <option value="raides">Raides</option>
                      <option value="tresses">Tressés</option>
                      <option value="rases">Rasés</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Couleur yeux</label>
                    <input type="text" className={styles.createPerson__input} placeholder="Ex: Marron" value={formData.couleur_yeux} onChange={(e) => handleInputChange('couleur_yeux', e.target.value)} />
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Groupe sanguin</label>
                    <select className={styles.createPerson__select} value={formData.groupe_sanguin} onChange={(e) => handleInputChange('groupe_sanguin', e.target.value)}>
                      <option value="">Non connu</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className={styles.createPerson__fieldGroup}>
                  <label className={styles.createPerson__label}>Signes distinctifs</label>
                  <textarea className={styles.createPerson__textarea} placeholder="Cicatrices, tatouages, marques de naissance..." value={formData.signes_distinctifs} onChange={(e) => handleInputChange('signes_distinctifs', e.target.value)} rows={3} />
                </div>

                <div className={styles.createPerson__fieldGroup}>
                  <label className={styles.createPerson__label}>Handicaps / Maladies connues</label>
                  <textarea className={styles.createPerson__textarea} placeholder="Handicaps physiques, maladies chroniques..." value={formData.handicaps_maladies} onChange={(e) => handleInputChange('handicaps_maladies', e.target.value)} rows={2} />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Compléments */}
          {currentStep === 3 && (
            <div className={styles.createPerson__section}>
              <div className={styles.createPerson__sectionHeader}>
                <Info className={styles.createPerson__sectionIcon} />
                <div>
                  <h3 className={styles.createPerson__sectionTitle}>Informations complémentaires</h3>
                  <p className={styles.createPerson__sectionSubtitle}>Documents, situation familiale et derniers effets</p>
                </div>
              </div>

              <div className={styles.createPerson__fields}>
                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Type de pièce d'identité</label>
                    <select className={styles.createPerson__select} value={formData.type_identification} onChange={(e) => handleInputChange('type_identification', e.target.value)}>
                      <option value="cni">CNI</option>
                      <option value="passeport">Passeport</option>
                      <option value="acte_naissance">Acte de naissance</option>
                      <option value="autre">Autre</option>
                      <option value="aucun">Aucun</option>
                    </select>
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Numéro d'identification</label>
                    <input type="text" className={styles.createPerson__input} placeholder="N° de la pièce" value={formData.numero_identification} onChange={(e) => handleInputChange('numero_identification', e.target.value)} />
                  </div>
                </div>

                <div className={styles.createPerson__fieldRow}>
                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Situation familiale</label>
                    <select className={styles.createPerson__select} value={formData.situation_familiale} onChange={(e) => handleInputChange('situation_familiale', e.target.value)}>
                      <option value="avec_famille">Avec famille</option>
                      <option value="orphelin">Orphelin</option>
                      <option value="separe_famille">Séparé de sa famille</option>
                      <option value="famille_inconnue">Famille inconnue</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div className={styles.createPerson__fieldGroup}>
                    <label className={styles.createPerson__label}>Nombre d'enfants</label>
                    <input type="number" className={styles.createPerson__input} placeholder="0" value={formData.nombre_enfants} onChange={(e) => handleInputChange('nombre_enfants', e.target.value)} min="0" />
                  </div>
                </div>

                <div className={styles.createPerson__fieldGroup}>
                  <label className={styles.createPerson__label}>Derniers vêtements portés</label>
                  <textarea className={styles.createPerson__textarea} placeholder="Description des vêtements lors de la dernière apparition..." value={formData.derniers_vetements_portes} onChange={(e) => handleInputChange('derniers_vetements_portes', e.target.value)} rows={3} />
                </div>

                <div className={styles.createPerson__fieldGroup}>
                  <label className={styles.createPerson__label}>Accessoires</label>
                  <textarea className={styles.createPerson__textarea} placeholder="Sac, bijoux, téléphone, etc..." value={formData.accessoires} onChange={(e) => handleInputChange('accessoires', e.target.value)} rows={2} />
                </div>

                {/* Résumé */}
                <div className={styles.createPerson__summary}>
                  <h4 className={styles.createPerson__summaryTitle}>Résumé de la fiche</h4>
                  <div className={styles.createPerson__summaryGrid}>
                    <div className={styles.createPerson__summaryItem}>
                      <span className={styles.createPerson__summaryLabel}>Nom complet</span>
                      <span className={styles.createPerson__summaryValue}>{formData.prenom} {formData.nom}</span>
                    </div>
                    <div className={styles.createPerson__summaryItem}>
                      <span className={styles.createPerson__summaryLabel}>Sexe</span>
                      <span className={styles.createPerson__summaryValue}>{formData.sexe}</span>
                    </div>
                    <div className={styles.createPerson__summaryItem}>
                      <span className={styles.createPerson__summaryLabel}>Nationalité</span>
                      <span className={styles.createPerson__summaryValue}>{formData.nationalite}</span>
                    </div>
                    <div className={styles.createPerson__summaryItem}>
                      <span className={styles.createPerson__summaryLabel}>Photos</span>
                      <span className={styles.createPerson__summaryValue}>{photos.length} photo(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className={styles.createPerson__uploadProgress}>
              <div className={styles.createPerson__uploadProgressBar} style={{ width: `${uploadProgress}%` }} />
              <span>Upload: {uploadProgress}%</span>
            </div>
          )}

          {/* Actions */}
          <div className={styles.createPerson__actions}>
            <button
              type="button"
              className={styles.createPerson__cancelBtn}
              onClick={() => navigate(`${basePath}/dashboard`)}
              disabled={isSubmitting}
            >
              Annuler
            </button>

            <div className={styles.createPerson__navBtns}>
              {currentStep > 1 && (
                <button type="button" onClick={goToPrevStep} className={styles.createPerson__prevBtn} disabled={isSubmitting}>
                  <ArrowLeft size={18} />
                  Précédent
                </button>
              )}

              {currentStep < 3 ? (
                <button type="button" onClick={goToNextStep} className={styles.createPerson__nextBtn}>
                  Suivant
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} className={styles.createPerson__submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className={styles.createPerson__spinner} />
                      Création...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Créer la fiche
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );

  if (noLayout) {
    return pageInner;
  }
  return <AuthorityLayout>{pageInner}</AuthorityLayout>;
};

export default CreatePersonPage;
