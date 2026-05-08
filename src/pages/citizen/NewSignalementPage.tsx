/**
 * =====================================================
 * RETROUVONSLES - Citizen New Signalement Page
 * Créer un nouveau signalement
 * Intégré avec Supabase, Cloudinary et MapTiler
 * =====================================================
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalementCreate } from '../../features/signalements/hooks';
import { useGeolocation } from '../../features/geolocalisation/hooks';
import { uploadMultipleFiles } from '../../services/cloudinary';
import { geocodingService } from '../../services/maptiler';
import { supabase } from '../../config';
import { mapConfig } from '../../config/map.config';
import { CitizenLayout } from './CitizenLayout';
import { MapTilerView } from '../../components/maps/MapTilerView/MapTilerView';
import { MapSearch } from '../../components/maps';
import type { MapSearchLocation } from '../../components/maps';
import { 
  Upload, Check, MapPin, Camera, X, Loader2, AlertCircle, 
  Navigation, FileText
} from 'lucide-react';
import styles from './NewSignalementPage.module.css';
import type { Signalement, SignalementCreatePayload } from '../../features/signalements/types';

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  url?: string;
  error?: string;
}

export const CitizenNewSignalementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;
  const isGuestSession = Boolean((currentUser as any)?.is_anonymous);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);

  const dossierId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('dossierId') || undefined;
  }, [location.search]);

  const isVerified = Boolean((currentUser as any)?.identite_verifiee);
  const maxPhotos = isVerified ? 5 : 1;

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
  const [localError, setLocalError] = useState<string | null>(null);
  const [geoResults, setGeoResults] = useState<MapSearchLocation[]>([]);
  const [isGeoSearching, setIsGeoSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.848, 11.5021]);
  const [lastCreatedSignalement, setLastCreatedSignalement] = useState<Signalement | null>(null);
  const geoTimerRef = useRef<number | null>(null);

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
        lieu_observation: prev.lieu_observation || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
      }));
      setMapCenter([location.latitude, location.longitude]);
    }
  }, [getCurrentLocation]);

  const geocodeMapTiler = async (query: string): Promise<MapSearchLocation[]> => {
    const key = mapConfig.maptiler.apiKey || '';
    if (!key || !query.trim()) return [];
    const endpoint = `https://api.maptiler.com/geocoding/${encodeURIComponent(query.trim())}.json?key=${key}&language=fr&limit=5`;
    const resp = await fetch(endpoint);
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    return features
      .map((f: any) => {
        const [lng, lat] = Array.isArray(f?.center) ? f.center : [null, null];
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return {
          id: String(f.id || `${lat}-${lng}`),
          name: String(f.place_name || f.text || query),
          lat,
          lng,
          type: 'sighting' as const,
          region: String(f?.context?.[0]?.text || f?.place_name || ''),
        } as MapSearchLocation;
      })
      .filter(Boolean) as MapSearchLocation[];
  };

  const handleGeoSearch = useCallback((query: string) => {
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
  }, []);

  const handleGeoSelect = (loc: MapSearchLocation) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.lat,
      longitude: loc.lng,
      lieu_observation: loc.name,
      region_observation: prev.region_observation || (loc.region || ''),
    }));
    setMapCenter([loc.lat, loc.lng]);
    setLocalError(null);
  };

  // Clic sur la carte : définir la position
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setMapCenter([lat, lng]);
    try {
      const results = await geocodingService.reverseGeocode([lng, lat], { limit: 1 });
      if (results.length > 0 && results[0].name) {
        setFormData((prev) => ({ ...prev, lieu_observation: results[0].name }));
      }
    } catch {
      // ignore reverse geocode failure
    }
  }, []);

  useEffect(() => {
    return () => {
      if (geoTimerRef.current) {
        window.clearTimeout(geoTimerRef.current);
      }
    };
  }, []);

  // Centre carte pour affichage (position choisie ou défaut)
  const displayCenter: [number, number] =
    formData.latitude && formData.longitude
      ? [formData.latitude, formData.longitude]
      : currentLocation
        ? [currentLocation.latitude, currentLocation.longitude]
        : mapCenter;

  const locationMarker =
    formData.latitude && formData.longitude
      ? [{
          id: 'selected',
          lat: formData.latitude,
          lng: formData.longitude,
          label: t('citizen.selectedLocation') || 'Position choisie',
          type: 'sighting' as const,
        }]
      : [];

  // Gérer la sélection de fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      // Appliquer la limite (niveau 0: 1 photo, niveau 1: jusqu'à 5 photos)
      const limited = combined.slice(0, maxPhotos);
      // Révoquer les previews des fichiers ignorés pour éviter les fuites mémoire
      const ignored = combined.slice(maxPhotos);
      ignored.forEach((f) => {
        try {
          URL.revokeObjectURL(f.preview);
        } catch {
          // ignore
        }
      });
      return limited;
    });
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

    // Conformément aux docs + modèle: un signalement citoyen est lié à un dossier
    if (!dossierId) {
      setLocalError(t('citizen.selectDossier') || 'Veuillez sélectionner un dossier avant de soumettre un signalement.');
      return;
    }

    const now = Date.now();
    if (now - lastSubmitAtRef.current < 12_000) {
      setLocalError(t('citizen.submitThrottled'));
      return;
    }
    lastSubmitAtRef.current = now;

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

      const prioriteTraitement: SignalementCreatePayload['priorite_traitement'] =
        isVerified ? 'moyenne' : 'basse';

      const payload: SignalementCreatePayload = {
        id_dossier: dossierId,
        description: formData.description,
        lieu_observation: formData.lieu_observation,
        ville_observation: formData.ville_observation,
        region_observation: formData.region_observation,
        date_observation: dateObservation.toISOString(),
        latitude_observation: formData.latitude || currentLocation?.latitude || 0,
        longitude_observation: formData.longitude || currentLocation?.longitude || 0,
        niveau_certitude: formData.niveau_certitude,
        priorite_traitement: prioriteTraitement,
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
      if (newSignalement) {
        setLastCreatedSignalement(newSignalement);
      }
      setStep('success');

      const redirectMs = isGuestSession ? 6500 : 2000;
      setTimeout(() => navigate('/citizen/my-signalements'), redirectMs);

    } catch (err) {
      console.error('Erreur soumission:', err);
      lastSubmitAtRef.current = 0;
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
            <h2 className={styles['new-signalement__success-title']}>{t('citizen.submitSuccessTitle')}</h2>
            <p className={styles['new-signalement__success-message']}>
              {t('citizen.submitSuccessBody')}
            </p>
            {lastCreatedSignalement && (
              <p className={styles['new-signalement__success-reference']}>
                {t('citizen.submitSuccessReference', {
                  ref:
                    (lastCreatedSignalement as any).numero_signalement ||
                    String(lastCreatedSignalement.id).slice(0, 8),
                })}
              </p>
            )}
            <p className={styles['new-signalement__success-disclaimer']}>
              {t('citizen.submitSuccessDisclaimer')}
            </p>
            {isGuestSession && (
              <p className={styles['new-signalement__success-guest']}>
                {t('citizen.guestPostSubmitHint')}{' '}
                <Link to="/auth/register" className={styles['new-signalement__success-guest-link']}>
                  {t('citizen.guestRegisterCta')}
                </Link>
              </p>
            )}
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
            <h3>{t('citizen.transmittingReport')}</h3>
            <p className={styles['new-signalement__uploading-hint']}>{t('citizen.submitting')}</p>
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
          {(localError || submitError || geoError) && (
            <div className={styles['new-signalement__error']}>
              <AlertCircle size={20} />
              <span>{localError || submitError || geoError}</span>
            </div>
          )}

          {!dossierId && (
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', marginBottom: 12 }}>
              <strong>{t('citizen.selectDossier') || 'Sélectionner un dossier'}</strong>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={styles['new-signalement__cancel-button']}
                  onClick={() => navigate('/citizen/dossiers?mode=report')}
                >
                  {t('citizen.dossiers') || 'Dossiers'}
                </button>
                <button
                  type="button"
                  className={styles['new-signalement__submit-button']}
                  onClick={() => navigate('/citizen/map')}
                >
                  {t('citizen.map') || 'Carte'}
                </button>
              </div>
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

            {/* Localisation : recherche, position actuelle, carte */}
            <div className={styles['new-signalement__form-group']}>
              <label className={styles['new-signalement__label']}>
                <MapPin size={18} />
                {t('citizen.reportLocation')} *
              </label>
              <p className={styles['new-signalement__hint']}>
                {t('citizen.locationMapHint') || 'Recherchez un lieu, utilisez votre position ou cliquez sur la carte.'}
              </p>
              <div className={styles['new-signalement__location-row']}>
                <MapSearch
                  placeholder={t('citizen.searchOnMap') || 'Rechercher un lieu...'}
                  onSearch={handleGeoSearch}
                  onLocationSelect={handleGeoSelect}
                  results={geoResults}
                  isLoading={isGeoSearching}
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
              {localError && (
                <p className={styles['new-signalement__coords']} style={{ color: '#dc2626' }}>{localError}</p>
              )}
              <div className={styles['new-signalement__map-wrap']}>
                <MapTilerView
                  center={displayCenter}
                  zoom={formData.latitude && formData.longitude ? 14 : 10}
                  height="280px"
                  showControls={true}
                  interactive={true}
                  markers={locationMarker}
                  onMapClick={handleMapClick}
                />
              </div>
              {(formData.latitude && formData.longitude) && (
                <p className={styles['new-signalement__coords']}>
                  📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  {formData.lieu_observation && ` — ${formData.lieu_observation}`}
                </p>
              )}
              <input
                type="text"
                name="lieu_observation"
                value={formData.lieu_observation}
                onChange={handleInputChange}
                placeholder={t('citizen.locationPlaceholder')}
                className={styles['new-signalement__input']}
                aria-label={t('citizen.reportLocation')}
              />
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
                  placeholder={t('citizen.cityPlaceholder')}
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
                  placeholder={t('citizen.regionPlaceholder')}
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
                disabled={isLoading || !formData.description || (!formData.lieu_observation && !(formData.latitude && formData.longitude))}
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