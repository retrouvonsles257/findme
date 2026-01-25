/**
 * =====================================================
 * RETROUVONSLES - Citizen New Signalement Page
 * Créer un nouveau signalement
 * Intégré avec Supabase, Cloudinary et MapTiler
 * =====================================================
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalementCreate } from '../../features/signalements/hooks';
import { useGeolocation } from '../../features/geolocalisation/hooks';
import { uploadMultipleFiles } from '../../services/cloudinary';
import { supabase } from '../../config';
import { CitizenLayout } from './CitizenLayout';
import { 
  Upload, Check, MapPin, Camera, X, Loader2, AlertCircle, 
  Navigation, FileText 
} from 'lucide-react';
import styles from './NewSignalementPage.module.css';

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  url?: string;
  error?: string;
}

export const CitizenNewSignalementPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { createSignalement, isLoading, error: submitError, success } = useSignalementCreate();
  const { 
    currentLocation, 
    getCurrentLocation, 
    isTracking,
    error: geoError,
  } = useGeolocation();

  // État du formulaire
  const [formData, setFormData] = useState({
    description: '',
    lieu_observation: '',
    ville_observation: '',
    region_observation: '',
    date_observation: new Date().toISOString().split('T')[0],
    heure_observation: new Date().toTimeString().slice(0, 5),
    latitude: 0,
    longitude: 0,
    niveau_certitude: 'probable' as 'certain' | 'tres_probable' | 'probable' | 'incertain',
    contexte_observation: '',
    direction_deplacement: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'form' | 'uploading' | 'success'>('form');

  // Gérer les changements de formulaire
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Obtenir la position actuelle
  const handleGetLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      setFormData((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    }
  }, [getCurrentLocation]);

  // Gérer la sélection de fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Supprimer un fichier
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Ouvrir le sélecteur de fichiers
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    setStep('uploading');
    let photoUrls: string[] = [];

    try {
      // 1. Uploader les photos si présentes
      if (files.length > 0) {
        setUploadProgress(10);
        const filesToUpload = files.map((f) => f.file);
        
        const uploadResults = await uploadMultipleFiles(filesToUpload, {
          type: 'signalement',
          tags: ['signalement', userId],
        });
        
        setUploadProgress(50);
        photoUrls = uploadResults.filter((r) => r.success).map((r) => r.url || '');
      }

      setUploadProgress(70);

      // 2. Créer le signalement
      const dateObservation = new Date(
        `${formData.date_observation}T${formData.heure_observation}`
      );

      const payload = {
        description: formData.description,
        lieu_observation: formData.lieu_observation,
        ville_observation: formData.ville_observation,
        region_observation: formData.region_observation,
        date_observation: dateObservation.toISOString(),
        latitude_observation: formData.latitude || currentLocation?.latitude || 0,
        longitude_observation: formData.longitude || currentLocation?.longitude || 0,
        niveau_certitude: formData.niveau_certitude,
        contexte_observation: formData.contexte_observation,
        direction_deplacement: formData.direction_deplacement,
        source_signalement: 'application_web' as const,
      };

      setUploadProgress(80);
      const newSignalement = await createSignalement(payload, userId);

      // 3. Insérer les photos dans la table photo avec id_signalement
      if (photoUrls.length > 0 && newSignalement?.id) {
        const photoInserts = photoUrls.map((url) => ({
          url_cloudinary: url,
          id_signalement: newSignalement.id,
          type_photo: 'signalement',
          uploadee_par: userId,
        }));
        await (supabase.from('photo') as any).insert(photoInserts);
      }

      setUploadProgress(90);
      setUploadProgress(100);
      setStep('success');

      // Rediriger après 2 secondes
      setTimeout(() => navigate('/citizen/my-signalements'), 2000);
      
    } catch (err) {
      console.error('Erreur soumission:', err);
      setStep('form');
    }
  };

  // Affichage du succès
  if (step === 'success' || success) {
    return (
      <CitizenLayout activeNav="new-signalement">
        <div className={styles['new-signalement']}>
          <div className={styles['new-signalement__success']}>
            <Check size={64} className={styles['new-signalement__success-icon']} />
            <h2 className={styles['new-signalement__success-title']}>{t('citizen.submitted')}</h2>
            <p className={styles['new-signalement__success-message']}>
              {t('citizen.successfullySubmitted')}
            </p>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  // Affichage du chargement
  if (step === 'uploading') {
    return (
      <CitizenLayout activeNav="new-signalement">
        <div className={styles['new-signalement']}>
          <div className={styles['new-signalement__uploading']}>
            <Loader2 size={48} className={styles['new-signalement__loading-spin']} />
            <h3>{t('citizen.submitting')}</h3>
            <div className={styles['new-signalement__progress-bar']}>
              <div 
                className={styles['new-signalement__progress-fill']}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>{uploadProgress}%</p>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="new-signalement">
      <div className={styles['new-signalement']}>
        <div className={styles['new-signalement__form-container']}>
          {/* Erreurs */}
          {(submitError || geoError) && (
            <div className={styles['new-signalement__error']}>
              <AlertCircle size={20} />
              <span>{submitError || geoError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles['new-signalement__form']}>
            {/* Description */}
            <div className={styles['new-signalement__form-group']}>
              <label htmlFor="description" className={styles['new-signalement__label']}>
                <FileText size={18} />
                {t('citizen.reportDescription')} *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('citizen.descriptionPlaceholder')}
                className={styles['new-signalement__textarea']}
                rows={5}
                required
              />
            </div>

            {/* Date et Heure */}
            <div className={styles['new-signalement__form-row']}>
              <div className={styles['new-signalement__form-group']}>
                <label htmlFor="date_observation" className={styles['new-signalement__label']}>
                  {t('citizen.observationDate')} *
                </label>
                <input
                  type="date"
                  id="date_observation"
                  name="date_observation"
                  value={formData.date_observation}
                  onChange={handleInputChange}
                  className={styles['new-signalement__input']}
                  required
                />
              </div>
              <div className={styles['new-signalement__form-group']}>
                <label htmlFor="heure_observation" className={styles['new-signalement__label']}>
                  {t('citizen.observationTime')}
                </label>
                <input
                  type="time"
                  id="heure_observation"
                  name="heure_observation"
                  value={formData.heure_observation}
                  onChange={handleInputChange}
                  className={styles['new-signalement__input']}
                />
              </div>
            </div>

            {/* Localisation */}
            <div className={styles['new-signalement__form-group']}>
              <label className={styles['new-signalement__label']}>
                <MapPin size={18} />
                {t('citizen.reportLocation')} *
              </label>
              <div className={styles['new-signalement__location-row']}>
                <input
                  type="text"
                  name="lieu_observation"
                  value={formData.lieu_observation}
                  onChange={handleInputChange}
                  placeholder={t('citizen.locationPlaceholder')}
                  className={styles['new-signalement__input']}
                  required
                />
                <button
                  type="button"
                  className={styles['new-signalement__geo-button']}
                  onClick={handleGetLocation}
                  disabled={isTracking}
                  title={t('citizen.useMyLocation')}
                >
                  {isTracking ? (
                    <Loader2 size={18} className={styles['new-signalement__loading-spin']} />
                  ) : (
                    <Navigation size={18} />
                  )}
                </button>
              </div>
              {currentLocation && (
                <p className={styles['new-signalement__coords']}>
                  📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Ville et Région */}
            <div className={styles['new-signalement__form-row']}>
              <div className={styles['new-signalement__form-group']}>
                <label htmlFor="ville_observation" className={styles['new-signalement__label']}>
                  {t('citizen.city')}
                </label>
                <input
                  type="text"
                  id="ville_observation"
                  name="ville_observation"
                  value={formData.ville_observation}
                  onChange={handleInputChange}
                  placeholder="Yaoundé, Douala..."
                  className={styles['new-signalement__input']}
                />
              </div>
              <div className={styles['new-signalement__form-group']}>
                <label htmlFor="region_observation" className={styles['new-signalement__label']}>
                  {t('citizen.region')}
                </label>
                <input
                  type="text"
                  id="region_observation"
                  name="region_observation"
                  value={formData.region_observation}
                  onChange={handleInputChange}
                  placeholder="Centre, Littoral..."
                  className={styles['new-signalement__input']}
                />
              </div>
            </div>

            {/* Niveau de certitude */}
            <div className={styles['new-signalement__form-group']}>
              <label htmlFor="niveau_certitude" className={styles['new-signalement__label']}>
                {t('citizen.certaintyLevel')}
              </label>
              <select
                id="niveau_certitude"
                name="niveau_certitude"
                value={formData.niveau_certitude}
                onChange={handleInputChange}
                className={styles['new-signalement__select']}
              >
                <option value="certain">{t('citizen.certain')}</option>
                <option value="tres_probable">{t('citizen.veryLikely')}</option>
                <option value="probable">{t('citizen.likely')}</option>
                <option value="incertain">{t('citizen.uncertain')}</option>
              </select>
            </div>

            {/* Contexte */}
            <div className={styles['new-signalement__form-group']}>
              <label htmlFor="contexte_observation" className={styles['new-signalement__label']}>
                {t('citizen.context')}
              </label>
              <input
                type="text"
                id="contexte_observation"
                name="contexte_observation"
                value={formData.contexte_observation}
                onChange={handleInputChange}
                placeholder={t('citizen.contextPlaceholder')}
                className={styles['new-signalement__input']}
              />
            </div>

            {/* Direction de déplacement */}
            <div className={styles['new-signalement__form-group']}>
              <label htmlFor="direction_deplacement" className={styles['new-signalement__label']}>
                {t('citizen.movementDirection')}
              </label>
              <input
                type="text"
                id="direction_deplacement"
                name="direction_deplacement"
                value={formData.direction_deplacement}
                onChange={handleInputChange}
                placeholder={t('citizen.directionPlaceholder')}
                className={styles['new-signalement__input']}
              />
            </div>

            {/* Upload de photos */}
            <div className={styles['new-signalement__form-group']}>
              <label className={styles['new-signalement__label']}>
                <Camera size={18} />
                {t('citizen.attachPhotos')}
              </label>
              
              <div 
                className={styles['new-signalement__file-upload']}
                onClick={openFileSelector}
              >
                <Upload size={32} className={styles['new-signalement__upload-icon']} />
                <p className={styles['new-signalement__upload-text']}>
                  {t('citizen.dragOrClick')}
                </p>
                <p className={styles['new-signalement__upload-hint']}>
                  JPG, PNG, WEBP - Max 10MB
                </p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={styles['new-signalement__file-input']} 
                />
              </div>

              {/* Prévisualisation des fichiers */}
              {files.length > 0 && (
                <div className={styles['new-signalement__file-preview']}>
                  {files.map((file, idx) => (
                    <div key={idx} className={styles['new-signalement__preview-item']}>
                      <img 
                        src={file.preview} 
                        alt={`Preview ${idx + 1}`}
                        className={styles['new-signalement__preview-image']}
                      />
                      <button
                        type="button"
                        className={styles['new-signalement__preview-remove']}
                        onClick={() => removeFile(idx)}
                      >
                        <X size={16} />
                      </button>
                      {file.uploading && (
                        <div className={styles['new-signalement__preview-loading']}>
                          <Loader2 size={20} className={styles['new-signalement__loading-spin']} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles['new-signalement__form-actions']}>
              <button
                type="button"
                className={styles['new-signalement__cancel-button']}
                onClick={() => navigate('/citizen/my-signalements')}
              >
                {t('citizen.cancel')}
              </button>
              <button 
                type="submit" 
                className={styles['new-signalement__submit-button']}
                disabled={isLoading || !formData.description || !formData.lieu_observation}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className={styles['new-signalement__loading-spin']} />
                    {t('citizen.submitting')}
                  </>
                ) : (
                  t('citizen.submit')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </CitizenLayout>
  );
};