/**
 * =====================================================
 * RETROUVONSLES - Operator Create Dossier Page
 * Création d'un nouveau dossier de disparition
 * Design moderne avec stepper et upload photos simplifié
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../hooks';
import { OperatorLayout } from './OperatorLayout';
import { cloudinaryService } from '../../services/cloudinary/cloudinaryService';
import * as dossierAPI from '../../features/dossiers/services/dossierAPI';
import * as personneAPI from '../../features/personnes/services/personneAPI';
import { 
  FolderPlus,
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  User,
  MapPin,
  Phone,
  Camera,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  Upload,
  Calendar
} from 'lucide-react';
import styles from './CreateDossierPage.module.css';
import { MapTilerView } from '../../components/maps/MapTilerView';

interface DossierFormData {
  // Personne disparue
  nom: string;
  prenom: string;
  sexe: string;
  age_estime_min: string;
  age_estime_max: string;
  description_physique: string;
  
  // Disparition
  date_disparition: string;
  lieu_disparition: string;
  ville_disparition: string;
  region_disparition: string;
  pays_disparition: string;
  latitude: number | null;
  longitude: number | null;
  type_disparition: string;
  niveau_urgence: string;
  circonstances: string;
  
  // Contacts
  contact_famille_principale: string;
  telephone_contact: string;
  email_contact: string;
}

const initialFormData: DossierFormData = {
  nom: '',
  prenom: '',
  sexe: 'non_precise',
  age_estime_min: '',
  age_estime_max: '',
  description_physique: '',
  date_disparition: new Date().toISOString().split('T')[0],
  lieu_disparition: '',
  ville_disparition: '',
  region_disparition: '',
  pays_disparition: 'Cameroun',
  latitude: null,
  longitude: null,
  type_disparition: 'inconnue',
  niveau_urgence: 'normal',
  circonstances: '',
  contact_famille_principale: '',
  telephone_contact: '',
  email_contact: '',
};

export const CreateDossierPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [formData, setFormData] = useState<DossierFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Photos - Support pour multiple photos simplifié
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (currentUser && !['operateur_saisie', 'admin_organisation'].includes(currentUser.role)) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  const handleInputChange = (field: keyof DossierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Gérer le clic sur la carte pour sélectionner une localisation
  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  // Gestion des photos - sélection multiple directe
  const handlePhotosSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limiter à 10 photos max
    const newFiles = files.slice(0, 10 - photos.length);
    
    // Valider les fichiers
    const validFiles = newFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) return false;
      if (!file.type.startsWith('image/')) return false;
      return true;
    });
    
    if (validFiles.length > 0) {
      setPhotos(prev => [...prev, ...validFiles]);
      
      // Créer les previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Reset input
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
      if (!formData.date_disparition) newErrors.date_disparition = 'La date de disparition est requise';
      if (!formData.lieu_disparition.trim()) newErrors.lieu_disparition = 'Le lieu de disparition est requis';
      if (!formData.circonstances.trim() || formData.circonstances.length < 10) {
        newErrors.circonstances = 'Les circonstances sont requises (min. 10 caractères)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre étapes - SANS useCallback pour éviter les problèmes de closure
  const goToNextStep = () => {
    if (currentStep >= 3) return;
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => prev + 1);
  };

  const goToPrevStep = () => {
    if (currentStep <= 1) return;
    setCurrentStep(prev => prev - 1);
  };

  // Soumission du formulaire - UNIQUEMENT à l'étape 3
  const handleSubmit = async () => {
    // Double vérification de l'étape
    if (currentStep !== 3) {
      console.warn('Tentative de soumission hors étape 3');
      return;
    }
    
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      let photoUrl = '';
      
      // Upload de la première photo si présente
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
      
      // Créer d'abord la personne
      const personneData = {
        nom: formData.nom,
        prenom: formData.prenom,
        nom_complet: `${formData.prenom} ${formData.nom}`.trim(),
        sexe: formData.sexe as 'masculin' | 'feminin' | 'inconnu' | 'non_precise',
        age_estime_min: formData.age_estime_min ? parseInt(formData.age_estime_min) : undefined,
        age_estime_max: formData.age_estime_max ? parseInt(formData.age_estime_max) : undefined,
        description_physique: formData.description_physique || undefined,
        photo_principale: photoUrl || undefined,
        statut_identite: 'identifie' as const,
        fiabilite_informations: 'probable' as const,
        nationalite: 'Camerounaise',
      };
      
      const createdPersonne = await personneAPI.createPersonne(
        personneData,
        currentUser?.id || 'anonymous'
      );
      
      // Créer le dossier avec la personne
      const dossierData = {
        date_disparition: formData.date_disparition,
        type_disparition: formData.type_disparition as any,
        niveau_urgence: formData.niveau_urgence as any,
        circonstances: formData.circonstances,
        lieu_disparition: formData.lieu_disparition,
        ville_disparition: formData.ville_disparition || formData.lieu_disparition,
        region_disparition: formData.region_disparition || '',
        pays_disparition: formData.pays_disparition,
        latitude_disparition: formData.latitude || undefined,
        longitude_disparition: formData.longitude || undefined,
        precision_lieu: formData.latitude ? 'exacte' as const : 'approximative' as const,
        contact_famille_principale: formData.contact_famille_principale || undefined,
        telephone_contact: formData.telephone_contact || undefined,
        email_contact: formData.email_contact || undefined,
        visible_public: false,
        diffusion_autorisee: false,
        diffusion_medias: false,
        diffusion_reseaux_sociaux: false,
        rayon_diffusion_km: 10,
        id_personne: createdPersonne.id,
        id_utilisateur_createur: currentUser?.id,
        id_organisation_responsable: currentUser?.organisation_id || undefined,
      };
      
      const createdDossier = await dossierAPI.createDossier(dossierData as any);
      
      // Insérer les photos dans la table photo (pour qu'elles soient visibles dans les détails)
      if (photoUrl) {
        try {
          const { supabase } = await import('../../config');
          await (supabase as any).from('photo').insert({
            url_cloudinary: photoUrl,
            type_photo: 'portrait',
            id_personne: createdPersonne.id,
            est_principale: true,
            visible_public: false,
            qualite_image: 'moyenne',
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
                qualite_image: 'moyenne',
              });
            }
          }
        } catch (photoError) {
          console.error('Error inserting photos:', photoError);
          // On continue même si l'insertion des photos échoue
        }
      }
      
      setSuccessMessage(t('operator.successMessage') || 'Dossier créé avec succès!');
      
      setTimeout(() => {
        navigate(`/operator/dossiers/${createdDossier.id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating dossier:', err);
      setErrorMessage(err.message || t('common.error') || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  const steps = [
    { number: 1, title: 'Personne', icon: User },
    { number: 2, title: 'Disparition', icon: MapPin },
    { number: 3, title: 'Contacts', icon: Phone },
  ];

  return (
    <OperatorLayout title={t('operator.createDossierTitle') || 'Créer un dossier'}>
      <div className={styles.createDossier}>
        {/* Header avec stepper */}
        <div className={styles.createDossier__header}>
          <div className={styles.createDossier__headerInfo}>
            <FolderPlus className={styles.createDossier__headerIcon} />
            <div>
              <h2 className={styles.createDossier__title}>Nouveau dossier de disparition</h2>
              <p className={styles.createDossier__subtitle}>Étape {currentStep} sur 3</p>
            </div>
          </div>
          
          {/* Stepper */}
          <div className={styles.createDossier__stepper}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <React.Fragment key={step.number}>
                  <div className={`${styles.createDossier__stepItem} ${isActive ? styles['createDossier__stepItem--active'] : ''} ${isCompleted ? styles['createDossier__stepItem--completed'] : ''}`}>
                    <div className={styles.createDossier__stepCircle}>
                      {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={18} />}
                    </div>
                    <span className={styles.createDossier__stepLabel}>{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`${styles.createDossier__stepConnector} ${isCompleted ? styles['createDossier__stepConnector--completed'] : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className={styles.createDossier__alert + ' ' + styles['createDossier__alert--error']}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className={styles.createDossier__alert + ' ' + styles['createDossier__alert--success']}>
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Contenu du formulaire */}
        <div className={styles.createDossier__content}>
          {/* ÉTAPE 1: Personne disparue */}
          {currentStep === 1 && (
            <div className={styles.createDossier__section}>
              <div className={styles.createDossier__sectionHeader}>
                <User className={styles.createDossier__sectionIcon} />
                <div>
                  <h3 className={styles.createDossier__sectionTitle}>Informations sur la personne disparue</h3>
                  <p className={styles.createDossier__sectionSubtitle}>Identité et caractéristiques physiques</p>
                </div>
              </div>
              
              {/* Upload photos simplifié */}
              <div className={styles.createDossier__photoUpload}>
                <label className={styles.createDossier__label}>
                  <Camera size={16} />
                  Photos de la personne (optionnel)
                </label>
                
                <div className={styles.createDossier__photoGrid}>
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className={styles.createDossier__photoItem}>
                      <img src={preview} alt={`Photo ${index + 1}`} />
                      <button
                        type="button"
                        className={styles.createDossier__photoRemove}
                        onClick={() => removePhoto(index)}
                      >
                        <X size={14} />
                      </button>
                      {index === 0 && <span className={styles.createDossier__photoBadge}>Principale</span>}
                    </div>
                  ))}
                  
                  {photos.length < 10 && (
                    <label className={styles.createDossier__photoAdd}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotosSelected}
                        style={{ display: 'none' }}
                      />
                      <Upload size={24} />
                      <span>Ajouter</span>
                    </label>
                  )}
                </div>
                <p className={styles.createDossier__photoHint}>
                  Sélectionnez une ou plusieurs photos (max 10, 5MB chacune)
                </p>
              </div>
              
              <div className={styles.createDossier__fields}>
                <div className={styles.createDossier__fieldRow}>
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>
                      Prénom <span className={styles.createDossier__required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.createDossier__input} ${errors.prenom ? styles['createDossier__input--error'] : ''}`}
                      placeholder="Prénom de la personne"
                      value={formData.prenom}
                      onChange={(e) => handleInputChange('prenom', e.target.value)}
                    />
                    {errors.prenom && <span className={styles.createDossier__error}>{errors.prenom}</span>}
                  </div>
                  
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>
                      Nom <span className={styles.createDossier__required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.createDossier__input} ${errors.nom ? styles['createDossier__input--error'] : ''}`}
                      placeholder="Nom de famille"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                    />
                    {errors.nom && <span className={styles.createDossier__error}>{errors.nom}</span>}
                  </div>
                </div>
                
                <div className={styles.createDossier__fieldRow}>
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Sexe</label>
                    <select
                      className={styles.createDossier__select}
                      value={formData.sexe}
                      onChange={(e) => handleInputChange('sexe', e.target.value)}
                    >
                      <option value="non_precise">Non précisé</option>
                      <option value="masculin">Masculin</option>
                      <option value="feminin">Féminin</option>
                      <option value="inconnu">Inconnu</option>
                    </select>
                  </div>
                  
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Âge estimé</label>
                    <div className={styles.createDossier__ageRange}>
                      <input
                        type="number"
                        className={styles.createDossier__input}
                        placeholder="Min"
                        value={formData.age_estime_min}
                        onChange={(e) => handleInputChange('age_estime_min', e.target.value)}
                        min="0"
                        max="150"
                      />
                      <span className={styles.createDossier__ageSeparator}>à</span>
                      <input
                        type="number"
                        className={styles.createDossier__input}
                        placeholder="Max"
                        value={formData.age_estime_max}
                        onChange={(e) => handleInputChange('age_estime_max', e.target.value)}
                        min="0"
                        max="150"
                      />
                      <span className={styles.createDossier__ageUnit}>ans</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.createDossier__fieldGroup}>
                  <label className={styles.createDossier__label}>Description physique</label>
                  <textarea
                    className={styles.createDossier__textarea}
                    placeholder="Décrivez l'apparence physique (taille, poids, cheveux, vêtements portés...)"
                    value={formData.description_physique}
                    onChange={(e) => handleInputChange('description_physique', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Disparition */}
          {currentStep === 2 && (
            <div className={styles.createDossier__section}>
              <div className={styles.createDossier__sectionHeader}>
                <MapPin className={styles.createDossier__sectionIcon} />
                <div>
                  <h3 className={styles.createDossier__sectionTitle}>Informations sur la disparition</h3>
                  <p className={styles.createDossier__sectionSubtitle}>Lieu, date et circonstances</p>
                </div>
              </div>
              
              <div className={styles.createDossier__fields}>
                <div className={styles.createDossier__fieldRow}>
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>
                      <Calendar size={16} />
                      Date de disparition <span className={styles.createDossier__required}>*</span>
                    </label>
                    <input
                      type="date"
                      className={`${styles.createDossier__input} ${errors.date_disparition ? styles['createDossier__input--error'] : ''}`}
                      value={formData.date_disparition}
                      onChange={(e) => handleInputChange('date_disparition', e.target.value)}
                    />
                    {errors.date_disparition && <span className={styles.createDossier__error}>{errors.date_disparition}</span>}
                  </div>
                  
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Niveau d'urgence</label>
                    <select
                      className={styles.createDossier__select}
                      value={formData.niveau_urgence}
                      onChange={(e) => handleInputChange('niveau_urgence', e.target.value)}
                    >
                      <option value="faible">Faible</option>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critique">Critique</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.createDossier__fieldGroup}>
                  <label className={styles.createDossier__label}>
                    <MapPin size={16} />
                    Lieu de disparition <span className={styles.createDossier__required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`${styles.createDossier__input} ${errors.lieu_disparition ? styles['createDossier__input--error'] : ''}`}
                    placeholder="Adresse ou lieu précis"
                    value={formData.lieu_disparition}
                    onChange={(e) => handleInputChange('lieu_disparition', e.target.value)}
                  />
                  {errors.lieu_disparition && <span className={styles.createDossier__error}>{errors.lieu_disparition}</span>}
                </div>
                
                <div className={styles.createDossier__fieldRow}>
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Ville</label>
                    <input
                      type="text"
                      className={styles.createDossier__input}
                      placeholder="Ex: Yaoundé"
                      value={formData.ville_disparition}
                      onChange={(e) => handleInputChange('ville_disparition', e.target.value)}
                    />
                  </div>
                  
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Région</label>
                    <input
                      type="text"
                      className={styles.createDossier__input}
                      placeholder="Ex: Centre"
                      value={formData.region_disparition}
                      onChange={(e) => handleInputChange('region_disparition', e.target.value)}
                    />
                  </div>
                  
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Pays</label>
                    <input
                      type="text"
                      className={styles.createDossier__input}
                      value={formData.pays_disparition}
                      onChange={(e) => handleInputChange('pays_disparition', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Carte pour localisation précise */}
                <div className={styles.createDossier__fieldGroup}>
                  <div className={styles.createDossier__mapHeader}>
                    <label className={styles.createDossier__label}>
                      <MapPin size={16} />
                      Localisation sur la carte
                    </label>
                    <button
                      type="button"
                      className={styles.createDossier__mapToggle}
                      onClick={() => setShowMap(!showMap)}
                    >
                      {showMap ? 'Masquer la carte' : 'Afficher la carte'}
                    </button>
                  </div>
                  
                  {formData.latitude && formData.longitude && (
                    <p className={styles.createDossier__coordsInfo}>
                      📍 Coordonnées: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  )}
                  
                  {showMap && (
                    <div className={styles.createDossier__mapContainer}>
                      <MapTilerView
                        height="300px"
                        center={formData.latitude && formData.longitude 
                          ? [formData.latitude, formData.longitude] 
                          : [3.848, 11.5021]
                        }
                        zoom={formData.latitude ? 12 : 6}
                        onMapClick={handleMapClick}
                        markers={formData.latitude && formData.longitude ? [{
                          id: 'selected-location',
                          lat: formData.latitude,
                          lng: formData.longitude,
                          label: 'Lieu de disparition',
                          type: 'missing'
                        }] : []}
                        showControls={true}
                        interactive={true}
                      />
                      <p className={styles.createDossier__mapHint}>
                        Cliquez sur la carte pour marquer le lieu de disparition
                      </p>
                    </div>
                  )}
                </div>
                
                <div className={styles.createDossier__fieldGroup}>
                  <label className={styles.createDossier__label}>Type de disparition</label>
                  <select
                    className={styles.createDossier__select}
                    value={formData.type_disparition}
                    onChange={(e) => handleInputChange('type_disparition', e.target.value)}
                  >
                    <option value="inconnue">Inconnue</option>
                    <option value="fugue">Fugue</option>
                    <option value="enlevement_presume">Enlèvement présumé</option>
                    <option value="accident">Accident</option>
                    <option value="disparition_volontaire">Disparition volontaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                
                <div className={styles.createDossier__fieldGroup}>
                  <label className={styles.createDossier__label}>
                    Circonstances <span className={styles.createDossier__required}>*</span>
                  </label>
                  <textarea
                    className={`${styles.createDossier__textarea} ${errors.circonstances ? styles['createDossier__textarea--error'] : ''}`}
                    placeholder="Décrivez les circonstances de la disparition en détail..."
                    value={formData.circonstances}
                    onChange={(e) => handleInputChange('circonstances', e.target.value)}
                    rows={5}
                  />
                  {errors.circonstances && <span className={styles.createDossier__error}>{errors.circonstances}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Contacts */}
          {currentStep === 3 && (
            <div className={styles.createDossier__section}>
              <div className={styles.createDossier__sectionHeader}>
                <Phone className={styles.createDossier__sectionIcon} />
                <div>
                  <h3 className={styles.createDossier__sectionTitle}>Informations de contact</h3>
                  <p className={styles.createDossier__sectionSubtitle}>Contacts de la famille ou proches</p>
                </div>
              </div>
              
              <div className={styles.createDossier__fields}>
                <div className={styles.createDossier__fieldGroup}>
                  <label className={styles.createDossier__label}>
                    <User size={16} />
                    Nom du contact principal
                  </label>
                  <input
                    type="text"
                    className={styles.createDossier__input}
                    placeholder="Nom complet du contact"
                    value={formData.contact_famille_principale}
                    onChange={(e) => handleInputChange('contact_famille_principale', e.target.value)}
                  />
                </div>
                
                <div className={styles.createDossier__fieldRow}>
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>
                      <Phone size={16} />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      className={styles.createDossier__input}
                      placeholder="+237 6XX XXX XXX"
                      value={formData.telephone_contact}
                      onChange={(e) => handleInputChange('telephone_contact', e.target.value)}
                    />
                  </div>
                  
                  <div className={styles.createDossier__fieldGroup}>
                    <label className={styles.createDossier__label}>Email</label>
                    <input
                      type="email"
                      className={styles.createDossier__input}
                      placeholder="email@exemple.com"
                      value={formData.email_contact}
                      onChange={(e) => handleInputChange('email_contact', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Résumé avant soumission */}
                <div className={styles.createDossier__summary}>
                  <h4 className={styles.createDossier__summaryTitle}>Résumé du dossier</h4>
                  <div className={styles.createDossier__summaryGrid}>
                    <div className={styles.createDossier__summaryItem}>
                      <span className={styles.createDossier__summaryLabel}>Personne</span>
                      <span className={styles.createDossier__summaryValue}>{formData.prenom} {formData.nom}</span>
                    </div>
                    <div className={styles.createDossier__summaryItem}>
                      <span className={styles.createDossier__summaryLabel}>Date disparition</span>
                      <span className={styles.createDossier__summaryValue}>
                        {new Date(formData.date_disparition).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className={styles.createDossier__summaryItem}>
                      <span className={styles.createDossier__summaryLabel}>Lieu</span>
                      <span className={styles.createDossier__summaryValue}>
                        {formData.lieu_disparition}, {formData.ville_disparition || formData.pays_disparition}
                      </span>
                    </div>
                    <div className={styles.createDossier__summaryItem}>
                      <span className={styles.createDossier__summaryLabel}>Photos</span>
                      <span className={styles.createDossier__summaryValue}>{photos.length} photo(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress bar si upload en cours */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className={styles.createDossier__uploadProgress}>
              <div className={styles.createDossier__uploadProgressBar} style={{ width: `${uploadProgress}%` }} />
              <span>Upload: {uploadProgress}%</span>
            </div>
          )}

          {/* Actions - PAS de formulaire, boutons avec onClick */}
          <div className={styles.createDossier__actions}>
            <button 
              type="button" 
              className={styles.createDossier__cancelBtn}
              onClick={() => navigate('/operator/dashboard')}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            
            <div className={styles.createDossier__navBtns}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className={styles.createDossier__prevBtn}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={18} />
                  Précédent
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className={styles.createDossier__nextBtn}
                >
                  Suivant
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className={styles.createDossier__submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className={styles.createDossier__spinner} />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Créer le dossier
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </OperatorLayout>
  );
};

export default CreateDossierPage;
