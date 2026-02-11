/**
 * =====================================================
 * RETROUVONSLES - Authority Create Dossier Page
 * Création complète d'un dossier de disparition
 * Connecté à Supabase avec upload Cloudinary
 * =====================================================
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { supabase } from '../../config';
import { cloudinaryConfig, cloudinaryUploadConfig } from '../../config/cloudinary.config';
import { mapConfig } from '../../config/map.config';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { MapSearch } from '../../components/maps';
import type { MapSearchLocation } from '../../components/maps';
import { MapTilerView } from '../../components/maps/MapTilerView';
import {
  User,
  MapPin,
  Camera,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import styles from './CreateDossierPage.module.css';
import { triggerDossierAnalysis } from '../../features/ia-analysis';

interface PersonneFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'masculin' | 'feminin' | 'inconnu' | 'non_precise';
  nationalite: string;
  taille_cm: string;
  poids_kg: string;
  couleur_yeux: string;
  couleur_cheveux: string;
  signes_particuliers: string;
}

interface DossierFormData {
  niveau_urgence: 'critique' | 'urgent' | 'normal' | 'faible';
  date_disparition: string;
  lieu_disparition: string;
  ville_disparition: string;
  pays_disparition: string;
  latitude_disparition: number | null;
  longitude_disparition: number | null;
  circonstances: string;
  vetements_portes: string;
  objets_personnels: string;
  derniere_activite_connue: string;
  visible_public: boolean;
  diffusion_autorisee: boolean;
  contact_nom: string;
  contact_telephone: string;
  contact_email: string;
}

export interface CreateDossierAuthorityPageProps {
  /** Rendre uniquement le contenu du formulaire (sans AuthorityLayout). Utilisé par l’admin org. */
  noLayout?: boolean;
  /** URL de retour pour le bouton Annuler (ex: /admin/dossiers). */
  cancelTo?: string;
}

export const CreateDossierAuthorityPage: React.FC<CreateDossierAuthorityPageProps> = ({
  noLayout = false,
  cancelTo = '/authority/dossiers',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = useAppSelector(selectCurrentUser);
  const { addNotification } = useNotification();
  const { t, language } = useI18n();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Carte (sélection + recherche)
  const [showMap, setShowMap] = useState(false);
  const [geoResults, setGeoResults] = useState<MapSearchLocation[]>([]);
  const [isGeoSearching, setIsGeoSearching] = useState(false);
  const geoTimerRef = useRef<number | null>(null);

  // Formulaire personne
  const [personneData, setPersonneData] = useState<PersonneFormData>({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'masculin',
    nationalite: 'Camerounaise',
    taille_cm: '',
    poids_kg: '',
    couleur_yeux: '',
    couleur_cheveux: '',
    signes_particuliers: '',
  });

  // Formulaire dossier
  const [dossierData, setDossierData] = useState<DossierFormData>({
    niveau_urgence: 'normal',
    date_disparition: new Date().toISOString().split('T')[0],
    lieu_disparition: '',
    ville_disparition: '',
    pays_disparition: 'Cameroun',
    latitude_disparition: null,
    longitude_disparition: null,
    circonstances: '',
    vetements_portes: '',
    objets_personnels: '',
    derniere_activite_connue: '',
    visible_public: true,
    diffusion_autorisee: true,
    contact_nom: '',
    contact_telephone: '',
    contact_email: '',
  });

  const geocodeMapTiler = async (query: string): Promise<MapSearchLocation[]> => {
    if (!mapConfig.maptiler.apiKey) return [];
    const url =
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
      `?key=${encodeURIComponent(mapConfig.maptiler.apiKey)}` +
      `&limit=6&language=${encodeURIComponent(language || 'fr')}&country=cm`;

    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const features = json?.features || [];
    return features
      .map((f: any) => {
        const [lng, lat] = f?.center || [];
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return {
          id: String(f.id || `${lat},${lng}`),
          name: String(f.place_name || f.text || 'Lieu'),
          lat,
          lng,
          type: 'organization' as const,
          region: f?.context?.map?.((c: any) => c?.text).filter(Boolean).join(', '),
        } as MapSearchLocation;
      })
      .filter(Boolean);
  };

  const handleGeoSearch = useCallback(
    (query: string) => {
      if (!query || query.trim().length < 2) {
        setGeoResults([]);
        setIsGeoSearching(false);
        if (geoTimerRef.current) {
          window.clearTimeout(geoTimerRef.current);
          geoTimerRef.current = null;
        }
        return;
      }

      const q = query.trim();
      setIsGeoSearching(true);
      if (geoTimerRef.current) {
        window.clearTimeout(geoTimerRef.current);
        geoTimerRef.current = null;
      }
      geoTimerRef.current = window.setTimeout(async () => {
        try {
          const results = await geocodeMapTiler(q);
          setGeoResults(results);
        } catch {
          setGeoResults([]);
        } finally {
          setIsGeoSearching(false);
          geoTimerRef.current = null;
        }
      }, 250);
    },
    [language]
  );

  const handleGeoSelect = (loc: MapSearchLocation) => {
    setDossierData((prev) => ({
      ...prev,
      latitude_disparition: loc.lat,
      longitude_disparition: loc.lng,
      // UX: si lieu_disparition est vide, remplir avec le résultat
      lieu_disparition: prev.lieu_disparition?.trim() ? prev.lieu_disparition : loc.name,
    }));
  };

  const handleMapClick = (lat: number, lng: number) => {
    setDossierData((prev) => ({
      ...prev,
      latitude_disparition: lat,
      longitude_disparition: lng,
    }));
  };

  useEffect(() => {
    return () => {
      if (geoTimerRef.current) window.clearTimeout(geoTimerRef.current);
    };
  }, []);

  // Upload photo vers Cloudinary
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', cloudinaryUploadConfig.personnePhoto.folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        return data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...urls]);
      
      addNotification({
        title: t('authority.createDossier.messages.photosUploaded'),
        message: `${urls.length} ${urls.length === 1 ? t('authority.createDossier.messages.photoAdded') : t('authority.createDossier.messages.photosAdded')}`,
        type: 'success',
      });
    } catch (err: any) {
      addNotification({
        title: t('authority.createDossier.messages.uploadError'),
        message: err.message || t('authority.createDossier.messages.uploadErrorMsg'),
        type: 'error',
      });
    } finally {
      setPhotoUploading(false);
    }
  }, [addNotification, t]);

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Validation étape 1
  const validateStep1 = (): boolean => {
    if (!personneData.nom.trim() || !personneData.prenom.trim()) {
      addNotification({
        title: t('authority.createDossier.messages.requiredFields'),
        message: t('authority.createDossier.messages.nameRequired'),
        type: 'error',
      });
      return false;
    }
    return true;
  };

  // Validation étape 2
  const validateStep2 = (): boolean => {
    if (!dossierData.date_disparition || !dossierData.lieu_disparition.trim()) {
      addNotification({
        title: t('authority.createDossier.messages.requiredFields'),
        message: t('authority.createDossier.messages.dateLocationRequired'),
        type: 'error',
      });
      return false;
    }
    return true;
  };

  // Soumission finale
  const handleSubmit = useCallback(async () => {
    setSubmitError('');
    if (!user?.id) {
      addNotification({
        title: t('authority.createDossier.messages.error'),
        message: t('authority.createDossier.messages.mustBeLoggedIn'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // S'assurer qu'un profil "utilisateur" existe (sinon FK peuvent échouer)
      try {
        const { data: existing, error: existErr } = await (supabase as any)
          .from('utilisateur')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (existErr) {
          // silencieux: on tente quand même la création du dossier
        } else if (!existing) {
          const m = (user as any)?.user_metadata as Record<string, any> | undefined;
          const email = (user as any)?.email as string | undefined;
          const nom = (m?.nom as string | undefined) || 'À compléter';
          const prenom = (m?.prenom as string | undefined) || 'À compléter';

          if (!email) {
            throw new Error(t('authority.createDossier.messages.profileEmailMissing'));
          }

          const { error: upsertErr } = await (supabase as any).from('utilisateur').upsert({
            id: user.id,
            email,
            nom,
            prenom,
            telephone: (m?.telephone as string | undefined) || null,
            statut_compte: (m?.statut_compte as string | undefined) || 'actif',
            type_compte: 'autorite',
            pays: (m?.pays as string | undefined) || 'Cameroun',
            langue_preferee: language || 'fr',
            updated_at: new Date().toISOString(),
          });
          if (upsertErr) throw upsertErr;
        }
      } catch (ensureErr: any) {
        // si on ne peut pas garantir le profil, on remonte une erreur claire
        throw new Error(ensureErr?.message || t('authority.createDossier.messages.profileMissing'));
      }

      // 1. Créer la personne (sans photos_supplementaires - elles vont dans la table photo)
      const { data: personneCreated, error: personneError } = await (supabase as any)
        .from('personne')
        .insert({
          nom: personneData.nom,
          prenom: personneData.prenom,
          nom_complet: `${personneData.prenom} ${personneData.nom}`,
          date_naissance: personneData.date_naissance || null,
          sexe: personneData.sexe,
          nationalite: personneData.nationalite,
          taille_cm: personneData.taille_cm ? parseInt(personneData.taille_cm) : null,
          poids_kg: personneData.poids_kg ? parseInt(personneData.poids_kg) : null,
          couleur_yeux: personneData.couleur_yeux || null,
          couleur_cheveux: personneData.couleur_cheveux || null,
          signes_distinctifs: personneData.signes_particuliers || null,
          // Champs saisis à l'étape dossier (schéma SQL: personne.derniers_vetements_portes / accessoires)
          derniers_vetements_portes: dossierData.vetements_portes || null,
          accessoires: dossierData.objets_personnels || null,
          photo_principale: uploadedPhotos[0] || null,
          cree_par: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (personneError) throw personneError;

      // 2. Insérer les photos dans la table photo
      if (uploadedPhotos.length > 0) {
        const photosToInsert = uploadedPhotos.map((url, index) => ({
          url_cloudinary: url,
          type_photo: 'portrait',
          est_principale: index === 0,
          visible_public: true,
          id_personne: personneCreated.id,
          uploadee_par: user.id,
          created_at: new Date().toISOString(),
        }));

        const { error: photosError } = await (supabase as any)
          .from('photo')
          .insert(photosToInsert);

        if (photosError) {
          // Erreur silencieuse - les photos sont optionnelles
          // On continue même si les photos échouent
        }
      }

      // 3. Créer le dossier de disparition
      const numeroDossier = `DOS-${Date.now().toString(36).toUpperCase()}`;
      
      const { data: dossierCreated, error: dossierError } = await (supabase as any)
        .from('dossier_disparition')
        .insert({
          numero_dossier: numeroDossier,
          id_personne: personneCreated.id,
          id_utilisateur_createur: user.id,
          id_organisation_responsable: currentUser?.organisation_id || null,
          niveau_urgence: dossierData.niveau_urgence,
          statut_dossier: 'en_cours',
          type_disparition: 'inconnue', // Valeur valide de l'enum type_disparition
          date_disparition: new Date(dossierData.date_disparition).toISOString(),
          lieu_disparition: dossierData.lieu_disparition,
          ville_disparition: dossierData.ville_disparition || null,
          pays_disparition: dossierData.pays_disparition || 'Cameroun',
          latitude_disparition: dossierData.latitude_disparition,
          longitude_disparition: dossierData.longitude_disparition,
          circonstances: dossierData.circonstances || 'Non précisées', // Champ obligatoire
          derniere_activite_connue: dossierData.derniere_activite_connue || null,
          visible_public: dossierData.visible_public,
          diffusion_autorisee: dossierData.diffusion_autorisee,
          contact_famille_principale: dossierData.contact_nom || null,
          telephone_contact: dossierData.contact_telephone || null,
          email_contact: dossierData.contact_email || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dossierError) throw dossierError;

      // 4. Déclencher l'analyse IA automatique si une photo a été uploadée
      if (uploadedPhotos.length > 0) {
        console.log('[CreateDossier] Déclenchement analyse IA automatique...');
        try {
          const iaResult = await triggerDossierAnalysis(
            dossierCreated.id,
            uploadedPhotos[0], // Photo principale
            user.id
          );
          console.log('[CreateDossier] Résultat IA:', iaResult);
          
          if (iaResult.success && iaResult.faceDetected) {
            addNotification({
              title: 'Analyse IA effectuée',
              message: `Visage détecté avec un score de ${iaResult.score.toFixed(0)}%`,
              type: 'info',
            });
          }
        } catch (iaError) {
          console.warn('[CreateDossier] Erreur analyse IA (non bloquante):', iaError);
          // L'erreur IA ne bloque pas la création du dossier
        }
      }

      addNotification({
        title: t('authority.createDossier.messages.dossierCreated'),
        message: t('authority.createDossier.messages.dossierCreatedSuccess').replace('{{numero}}', numeroDossier),
        type: 'success',
      });

      // Rediriger vers le dossier (admin org reste dans l'espace admin)
      const isAdminOrg = currentUser?.role === NomRole.ADMIN_ORGANISATION;
      setTimeout(() => {
        navigate(isAdminOrg ? `/admin/dossiers/${dossierCreated.id}` : `/authority/dossiers/${dossierCreated.id}`);
      }, 1500);

    } catch (err: any) {
      console.error('[CreateDossierAuthority] error:', err);
      setSubmitError(err?.message || t('authority.createDossier.messages.creationError'));
      // Erreur gérée par la notification
      addNotification({
        title: t('authority.createDossier.messages.error'),
        message: err.message || t('authority.createDossier.messages.creationError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentUser, personneData, dossierData, uploadedPhotos, addNotification, navigate, t, language]);

  const formContent = (
    <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>{t('authority.createDossier.title')}</h1>
          <p className={styles.subtitle}>
            {t('authority.createDossier.stepInfo').replace('{{step}}', String(step)).replace('{{total}}', '3')} - {step === 1 
              ? t('authority.createDossier.steps.personInfo')
              : step === 2 
                ? t('authority.createDossier.steps.disappearanceDetails')
                : t('authority.createDossier.steps.verification')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}
            onClick={() => setStep(1)}
          >
            <span>1</span> {t('authority.createDossier.progress.person')}
          </div>
          <div 
            className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}
            onClick={() => step >= 2 && setStep(2)}
          >
            <span>2</span> {t('authority.createDossier.progress.disappearance')}
          </div>
          <div 
            className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}
          >
            <span>3</span> {t('authority.createDossier.progress.verification')}
          </div>
        </div>

        {/* Form Content */}
        <div className={styles.formContainer}>
          {/* Étape 1: Informations Personne */}
          {step === 1 && (
            <div className={styles.formSection}>
              <h2><User size={20} /> {t('authority.createDossier.step1.title')}</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.lastName')}</label>
                  <input
                    type="text"
                    value={personneData.nom}
                    onChange={(e) => setPersonneData({ ...personneData, nom: e.target.value })}
                    placeholder={t('authority.createDossier.step1.lastNamePlaceholder')}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.firstName')}</label>
                  <input
                    type="text"
                    value={personneData.prenom}
                    onChange={(e) => setPersonneData({ ...personneData, prenom: e.target.value })}
                    placeholder={t('authority.createDossier.step1.firstNamePlaceholder')}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.birthDate')}</label>
                  <input
                    type="date"
                    value={personneData.date_naissance}
                    onChange={(e) => setPersonneData({ ...personneData, date_naissance: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.gender')}</label>
                  <select
                    value={personneData.sexe}
                    onChange={(e) => setPersonneData({ ...personneData, sexe: e.target.value as any })}
                  >
                    <option value="masculin">{t('authority.createDossier.step1.genderMale')}</option>
                    <option value="feminin">{t('authority.createDossier.step1.genderFemale')}</option>
                    <option value="non_precise">{t('authority.createDossier.step1.genderNotSpecified')}</option>
                    <option value="inconnu">{t('authority.createDossier.step1.genderUnknown')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.nationality')}</label>
                  <input
                    type="text"
                    value={personneData.nationalite}
                    onChange={(e) => setPersonneData({ ...personneData, nationalite: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.height')}</label>
                  <input
                    type="number"
                    value={personneData.taille_cm}
                    onChange={(e) => setPersonneData({ ...personneData, taille_cm: e.target.value })}
                    placeholder={t('authority.createDossier.step1.heightPlaceholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.weight')}</label>
                  <input
                    type="number"
                    value={personneData.poids_kg}
                    onChange={(e) => setPersonneData({ ...personneData, poids_kg: e.target.value })}
                    placeholder={t('authority.createDossier.step1.weightPlaceholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.eyeColor')}</label>
                  <input
                    type="text"
                    value={personneData.couleur_yeux}
                    onChange={(e) => setPersonneData({ ...personneData, couleur_yeux: e.target.value })}
                    placeholder={t('authority.createDossier.step1.eyeColorPlaceholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step1.hairColor')}</label>
                  <input
                    type="text"
                    value={personneData.couleur_cheveux}
                    onChange={(e) => setPersonneData({ ...personneData, couleur_cheveux: e.target.value })}
                    placeholder={t('authority.createDossier.step1.hairColorPlaceholder')}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label>{t('authority.createDossier.step1.distinctiveMarks')}</label>
                  <textarea
                    value={personneData.signes_particuliers}
                    onChange={(e) => setPersonneData({ ...personneData, signes_particuliers: e.target.value })}
                    placeholder={t('authority.createDossier.step1.distinctiveMarksPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>

              {/* Upload Photos */}
              <div className={styles.photoSection}>
                <h3><Camera size={18} /> {t('authority.createDossier.step1.photos')}</h3>
                <div className={styles.photoUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={photoUploading}
                    id="photo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="photo-upload" className={styles.uploadButton}>
                    {photoUploading ? <><Loader2 size={16} className={styles.spinner} /> {t('authority.createDossier.step1.uploading')}</> : <><FolderPlus size={16} /> {t('authority.createDossier.step1.addPhotos')}</>}
                  </label>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div className={styles.photoGrid}>
                    {uploadedPhotos.map((url, index) => (
                      <div key={index} className={styles.photoPreview}>
                        <img src={url} alt={`${t('authority.createDossier.step1.mainPhoto')} ${index + 1}`} />
                        <button onClick={() => removePhoto(index)} className={styles.removePhoto}>✕</button>
                        {index === 0 && <span className={styles.mainPhotoBadge}>{t('authority.createDossier.step1.mainPhoto')}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => navigate(cancelTo)} className={styles.cancelBtn}>
                  {t('authority.createDossier.actions.cancel')}
                </button>
                <button 
                  onClick={() => validateStep1() && setStep(2)} 
                  className={styles.nextBtn}
                >
                  {t('authority.createDossier.actions.next')} →
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Détails Disparition */}
          {step === 2 && (
            <div className={styles.formSection}>
              <h2><MapPin size={20} /> {t('authority.createDossier.step2.title')}</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.urgency')}</label>
                  <select
                    value={dossierData.niveau_urgence}
                    onChange={(e) => setDossierData({ ...dossierData, niveau_urgence: e.target.value as any })}
                  >
                    <option value="critique">{t('authority.dossiers.urgency.critique')}</option>
                    <option value="urgent">{t('authority.dossiers.urgency.urgent')}</option>
                    <option value="normal">{t('authority.dossiers.urgency.normal')}</option>
                    <option value="faible">{t('authority.dossiers.urgency.faible')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.disappearanceDate')}</label>
                  <input
                    type="date"
                    value={dossierData.date_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, date_disparition: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.disappearanceLocation')}</label>
                  <input
                    type="text"
                    value={dossierData.lieu_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, lieu_disparition: e.target.value })}
                    placeholder={t('authority.createDossier.step2.locationPlaceholder')}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.city')}</label>
                  <input
                    type="text"
                    value={dossierData.ville_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, ville_disparition: e.target.value })}
                    placeholder={t('authority.createDossier.step2.cityPlaceholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.country')}</label>
                  <input
                    type="text"
                    value={dossierData.pays_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, pays_disparition: e.target.value })}
                  />
                </div>

                {/* Carte pour localisation précise */}
                <div className={styles.formGroupFull}>
                  <div className={styles.mapHeader}>
                    <label>{t('authority.createDossier.step2.map.title')}</label>
                    <button
                      type="button"
                      className={styles.mapToggle}
                      onClick={() => setShowMap((v) => !v)}
                    >
                      {showMap ? t('authority.createDossier.step2.map.hide') : t('authority.createDossier.step2.map.show')}
                    </button>
                  </div>

                  {dossierData.latitude_disparition && dossierData.longitude_disparition && (
                    <p className={styles.coordsInfo}>
                      {t('authority.createDossier.step2.map.coords')}: {dossierData.latitude_disparition.toFixed(6)},{' '}
                      {dossierData.longitude_disparition.toFixed(6)}
                    </p>
                  )}

                  {showMap && (
                    <div className={styles.mapContainer}>
                      <div className={styles.mapSearch}>
                        <MapSearch
                          placeholder={t('authority.createDossier.step2.map.searchPlaceholder')}
                          onSearch={handleGeoSearch}
                          onLocationSelect={handleGeoSelect}
                          results={geoResults}
                          isLoading={isGeoSearching}
                        />
                      </div>

                      <MapTilerView
                        height="320px"
                        center={
                          dossierData.latitude_disparition && dossierData.longitude_disparition
                            ? [dossierData.latitude_disparition, dossierData.longitude_disparition]
                            : [3.848, 11.5021]
                        }
                        zoom={dossierData.latitude_disparition ? 12 : 7}
                        onMapClick={handleMapClick}
                        markers={
                          dossierData.latitude_disparition && dossierData.longitude_disparition
                            ? [
                                {
                                  id: 'selected-location',
                                  lat: dossierData.latitude_disparition,
                                  lng: dossierData.longitude_disparition,
                                  label: t('authority.createDossier.step2.map.markerLabel'),
                                  type: 'missing',
                                },
                              ]
                            : []
                        }
                        showControls={true}
                        interactive={true}
                      />

                      {!mapConfig.maptiler.apiKey && (
                        <p className={styles.mapHint}>{t('authority.createDossier.step2.map.apiKeyMissing')}</p>
                      )}
                      <p className={styles.mapHint}>{t('authority.createDossier.step2.map.hint')}</p>
                    </div>
                  )}
                </div>

                <div className={styles.formGroupFull}>
                  <label>{t('authority.createDossier.step2.circumstances')}</label>
                  <textarea
                    value={dossierData.circonstances}
                    onChange={(e) => setDossierData({ ...dossierData, circonstances: e.target.value })}
                    placeholder={t('authority.createDossier.step2.circumstancesPlaceholder')}
                    rows={4}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.clothing')}</label>
                  <textarea
                    value={dossierData.vetements_portes}
                    onChange={(e) => setDossierData({ ...dossierData, vetements_portes: e.target.value })}
                    placeholder={t('authority.createDossier.step2.clothingPlaceholder')}
                    rows={2}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.personalItems')}</label>
                  <textarea
                    value={dossierData.objets_personnels}
                    onChange={(e) => setDossierData({ ...dossierData, objets_personnels: e.target.value })}
                    placeholder={t('authority.createDossier.step2.personalItemsPlaceholder')}
                    rows={2}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label>{t('authority.createDossier.step2.lastKnownActivity')}</label>
                  <textarea
                    value={dossierData.derniere_activite_connue}
                    onChange={(e) => setDossierData({ ...dossierData, derniere_activite_connue: e.target.value })}
                    placeholder={t('authority.createDossier.step2.lastActivityPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>

              {/* Contact */}
              <h3 style={{ marginTop: '24px' }}>{t('authority.createDossier.step2.familyContact')}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.contactName')}</label>
                  <input
                    type="text"
                    value={dossierData.contact_nom}
                    onChange={(e) => setDossierData({ ...dossierData, contact_nom: e.target.value })}
                    placeholder={t('authority.createDossier.step2.contactNamePlaceholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.phone')}</label>
                  <input
                    type="tel"
                    value={dossierData.contact_telephone}
                    onChange={(e) => setDossierData({ ...dossierData, contact_telephone: e.target.value })}
                    placeholder={t('authority.createDossier.step2.phonePlaceholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('authority.createDossier.step2.email')}</label>
                  <input
                    type="email"
                    value={dossierData.contact_email}
                    onChange={(e) => setDossierData({ ...dossierData, contact_email: e.target.value })}
                    placeholder={t('authority.createDossier.step2.emailPlaceholder')}
                  />
                </div>
              </div>

              {/* Options de diffusion */}
              <h3 style={{ marginTop: '24px' }}>{t('authority.createDossier.step2.diffusionOptions')}</h3>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={dossierData.visible_public}
                    onChange={(e) => setDossierData({ ...dossierData, visible_public: e.target.checked })}
                  />
                  {t('authority.createDossier.step2.visiblePublic')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={dossierData.diffusion_autorisee}
                    onChange={(e) => setDossierData({ ...dossierData, diffusion_autorisee: e.target.checked })}
                  />
                  {t('authority.createDossier.step2.diffusionAuthorized')}
                </label>
              </div>

              <div className={styles.formActions}>
                <button onClick={() => setStep(1)} className={styles.backBtn}>
                  ← {t('authority.createDossier.actions.back')}
                </button>
                <button 
                  onClick={() => validateStep2() && setStep(3)} 
                  className={styles.nextBtn}
                >
                  {t('authority.createDossier.actions.next')} →
                </button>
              </div>
            </div>
          )}

          {/* Étape 3: Vérification */}
          {step === 3 && (
            <div className={styles.formSection}>
              <h2>✓ {t('authority.createDossier.step3.title')}</h2>

              {submitError && (
                <div className={styles.submitErrorBanner} role="alert">
                  {submitError}
                </div>
              )}
              
              <div className={styles.summary}>
                <div className={styles.summarySection}>
                  <h3><User size={16} /> {t('authority.createDossier.step3.person')}</h3>
                  <p><strong>{t('authority.createDossier.step3.name')}:</strong> {personneData.prenom} {personneData.nom}</p>
                  <p><strong>{t('authority.createDossier.step3.birthDate')}:</strong> {personneData.date_naissance || t('authority.createDossier.step3.notProvided')}</p>
                  <p><strong>{t('authority.createDossier.step3.gender')}:</strong> {personneData.sexe}</p>
                  <p><strong>{t('authority.createDossier.step3.height')}:</strong> {personneData.taille_cm ? `${personneData.taille_cm} cm` : t('authority.createDossier.step3.notProvided')}</p>
                  <p><strong>{t('authority.createDossier.step3.photos')}:</strong> {uploadedPhotos.length} {uploadedPhotos.length === 1 ? t('authority.createDossier.step3.photoCount') : t('authority.createDossier.step3.photoCount_plural')}</p>
                </div>

                <div className={styles.summarySection}>
                  <h3><MapPin size={16} /> {t('authority.createDossier.step3.disappearance')}</h3>
                  <p><strong>{t('authority.createDossier.step3.urgency')}:</strong> {t(`authority.dossiers.urgency.${dossierData.niveau_urgence}`)}</p>
                  <p><strong>{t('authority.createDossier.step3.date')}:</strong> {new Date(dossierData.date_disparition).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                  <p><strong>{t('authority.createDossier.step3.location')}:</strong> {dossierData.lieu_disparition}</p>
                  <p><strong>{t('authority.createDossier.step3.city')}:</strong> {dossierData.ville_disparition || t('authority.createDossier.step3.notProvided')}</p>
                  {dossierData.latitude_disparition && dossierData.longitude_disparition && (
                    <p><strong>{t('authority.createDossier.step2.map.coords')}:</strong> {dossierData.latitude_disparition.toFixed(6)}, {dossierData.longitude_disparition.toFixed(6)}</p>
                  )}
                  {dossierData.circonstances && (
                    <p><strong>{t('authority.createDossier.step3.circumstances')}:</strong> {dossierData.circonstances.substring(0, 100)}...</p>
                  )}
                </div>

                <div className={styles.summarySection}>
                  <h3>{t('authority.createDossier.step3.contact')}</h3>
                  <p><strong>{t('authority.createDossier.step3.name')}:</strong> {dossierData.contact_nom || t('authority.createDossier.step3.notProvided')}</p>
                  <p><strong>{t('authority.createDossier.step3.phone')}:</strong> {dossierData.contact_telephone || t('authority.createDossier.step3.notProvided')}</p>
                </div>

                <div className={styles.summarySection}>
                  <h3>{t('authority.createDossier.step3.options')}</h3>
                  <p><strong>{t('authority.createDossier.step3.visiblePublic')}:</strong> {dossierData.visible_public ? t('authority.createDossier.step3.yes') : t('authority.createDossier.step3.no')}</p>
                  <p><strong>{t('authority.createDossier.step3.diffusionAuthorized')}:</strong> {dossierData.diffusion_autorisee ? t('authority.createDossier.step3.yes') : t('authority.createDossier.step3.no')}</p>
                </div>
              </div>

              {uploadedPhotos.length > 0 && (
                <div className={styles.previewPhotos}>
                  <h3><Camera size={18} /> {t('authority.createDossier.step3.photos')}</h3>
                  <div className={styles.photoGrid}>
                    {uploadedPhotos.slice(0, 4).map((url, index) => (
                      <img key={index} src={url} alt={`Preview ${index}`} />
                    ))}
                    {uploadedPhotos.length > 4 && (
                      <div className={styles.morePhotos}>+{uploadedPhotos.length - 4}</div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button onClick={() => setStep(2)} className={styles.backBtn}>
                  ← {t('authority.createDossier.actions.edit')}
                </button>
                <button 
                  onClick={handleSubmit} 
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 size={16} className={styles.spinner} /> {t('authority.createDossier.actions.creating')}</> : t('authority.createDossier.actions.createDossier')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (noLayout) {
    return <>{formContent}</>;
  }
  return <AuthorityLayout>{formContent}</AuthorityLayout>;
};

export default CreateDossierAuthorityPage;
