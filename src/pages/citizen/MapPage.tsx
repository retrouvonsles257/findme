/**
 * =====================================================
 * RETROUVONSLES - Citizen Map Page
 * Carte interactive affichant les dossiers publics et signalements
 * Intégré avec MapTiler et les hooks dossiers/signalements
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useSignalements } from '../../features/signalements/hooks';
import { useGeolocation } from '../../features/geolocalisation/hooks/useGeolocation';
import { maptilerConfig } from '../../services/maptiler';
import { useI18n } from '../../hooks';
import { CitizenLayout } from './CitizenLayout';
import {
  Navigation,
  Search,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
  Eye,
  ChevronRight,
  Target,
} from 'lucide-react';
import styles from './MapPage.module.css';

// Types pour les marqueurs
interface MapMarker {
  id: string;
  type: 'dossier' | 'signalement' | 'user';
  lat: number;
  lng: number;
  title: string;
  description?: string;
  statut?: string;
  urgence?: number;
  photo?: string;
}

export const CitizenMapPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  // Hooks
  const { dossiers, isLoading: loadingDossiers, fetchDossiers } = useDossiers();
  const { signalements, isLoading: loadingSignalements, fetchSignalements } = useSignalements();
  const { currentLocation, getCurrentLocation } = useGeolocation();
  
  // State
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showDossiers, setShowDossiers] = useState(true);
  const [showSignalements, setShowSignalements] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        // Vérifier que MapTiler est configuré
        if (!maptilerConfig.isConfigured()) {
          setMapError(t('citizen.mapApiKeyMissing') || 'MapTiler non configuré. Veuillez configurer REACT_APP_MAPTILER_API_KEY');
          return;
        }

        const apiKey = maptilerConfig.getApiKey();
        if (!apiKey) {
          setMapError(t('citizen.mapApiKeyMissing'));
          return;
        }

        // Créer la carte avec MapLibre GL
        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
          center: [12.3547, 7.3697], // Cameroun par défaut
          zoom: 6,
        });

        // Ajouter les contrôles de navigation
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        
        // Ajouter le contrôle de géolocalisation avec zoom automatique
        const geolocateControl = new maplibregl.GeolocateControl({
          positionOptions: { 
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          },
          trackUserLocation: true,
        });
        map.addControl(geolocateControl, 'top-right');
        
        // Déclencher la géolocalisation automatiquement après le chargement de la carte
        map.on('load', () => {
          // Demander la position de l'utilisateur avec haute précision
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { longitude, latitude, accuracy } = position.coords;
                console.log(`Position obtenue: ${latitude}, ${longitude} (précision: ${accuracy}m)`);
                map.flyTo({
                  center: [longitude, latitude],
                  zoom: accuracy < 100 ? 15 : accuracy < 500 ? 13 : 12,
                  duration: 2000,
                });
              },
              (error) => {
                console.warn('Geolocation error:', error.message);
                // Rester sur la vue par défaut du Cameroun
              },
              { 
                enableHighAccuracy: true, 
                timeout: 15000,
                maximumAge: 0 // Ne pas utiliser de cache pour avoir la position la plus récente
              }
            );
          }
        });
        
        map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

        mapRef.current = map;
        setMapError(null);
        
      } catch (err: any) {
        console.error('Map init error:', err);
        setMapError(err.message);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [t]);

  // Construire les marqueurs à partir des données
  useEffect(() => {
    const newMarkers: MapMarker[] = [];

    // Ajouter les dossiers
    if (showDossiers && dossiers) {
      dossiers.forEach((dossier: any) => {
        if (dossier.latitude_disparition && dossier.longitude_disparition) {
          newMarkers.push({
            id: dossier.id,
            type: 'dossier',
            lat: dossier.latitude_disparition,
            lng: dossier.longitude_disparition,
            title: `${dossier.prenom || ''} ${dossier.nom || ''}`.trim() || t('citizen.dossier'),
            description: dossier.lieu_disparition,
            statut: dossier.statut,
            urgence: dossier.niveau_urgence,
            photo: dossier.photo_principale,
          });
        }
      });
    }

    // Ajouter les signalements
    if (showSignalements && signalements) {
      signalements.forEach((signalement: any) => {
        if (signalement.latitude && signalement.longitude) {
          newMarkers.push({
            id: signalement.id,
            type: 'signalement',
            lat: signalement.latitude,
            lng: signalement.longitude,
            title: signalement.titre || t('citizen.report'),
            description: signalement.lieu || signalement.ville,
            statut: signalement.statut,
          });
        }
      });
    }

    // Ajouter la position utilisateur
    if (currentLocation) {
      newMarkers.push({
        id: 'user-location',
        type: 'user',
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        title: t('citizen.yourLocation'),
      });
    }

    setMarkers(newMarkers);
  }, [dossiers, signalements, currentLocation, showDossiers, showSignalements, t]);

  // Filtrer les marqueurs par recherche
  const filteredMarkers = markers.filter((marker) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      marker.title.toLowerCase().includes(query) ||
      marker.description?.toLowerCase().includes(query)
    );
  });

  // Ajouter les marqueurs sur la carte MapLibre
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  useEffect(() => {
    if (!mapRef.current) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    filteredMarkers.forEach((marker) => {
      const color = getMarkerColor(marker);
      
      // Créer l'élément du marqueur
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      el.innerHTML = marker.type === 'user' ? '📍' : marker.type === 'dossier' ? '👤' : '👁️';
      el.style.fontSize = '14px';

      // Créer le popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px;">
            <strong>${marker.title}</strong>
            ${marker.description ? `<p style="margin: 4px 0 0; font-size: 12px; color: #666;">${marker.description}</p>` : ''}
            ${marker.type !== 'user' ? `<button onclick="window.location.href='/citizen/${marker.type === 'dossier' ? 'dossier' : 'signalements'}/${marker.id}'" style="margin-top: 8px; padding: 4px 8px; background: #15803d; color: white; border: none; border-radius: 4px; cursor: pointer;">${t('common.viewDetails')}</button>` : ''}
          </div>
        `);

      // Ajouter le marqueur à la carte
      const mapMarker = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(mapMarker);
    });
  }, [filteredMarkers]);

  // Centrer sur la position utilisateur
  const handleCenterOnUser = useCallback(() => {
    getCurrentLocation();
    if (currentLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 12,
      });
    }
  }, [currentLocation, getCurrentLocation]);

  // Rafraîchir les données
  const handleRefresh = async () => {
    await Promise.all([fetchDossiers(), fetchSignalements()]);
  };

  // Naviguer vers les détails
  const handleViewDetails = () => {
    if (!selectedMarker) return;
    
    if (selectedMarker.type === 'dossier') {
      navigate(`/citizen/dossier/${selectedMarker.id}`);
    } else if (selectedMarker.type === 'signalement') {
      navigate(`/citizen/signalements/${selectedMarker.id}`);
    }
    setSelectedMarker(null);
  };

  // Obtenir la couleur selon le type
  const getMarkerColor = (marker: MapMarker) => {
    if (marker.type === 'user') return '#16a34a';
    if (marker.type === 'dossier') {
      if (marker.urgence && marker.urgence >= 8) return '#dc2626';
      if (marker.urgence && marker.urgence >= 5) return '#f59e0b';
      return '#15803d';
    }
    return '#8b5cf6';
  };

  const isLoading = loadingDossiers || loadingSignalements;

  return (
    <CitizenLayout>
      <div className={styles.mapPage}>
        {/* Toolbar */}
        <div className={styles['mapPage__toolbar']}>
          {/* Search */}
          <div className={styles['mapPage__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder={t('citizen.searchOnMap')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles['mapPage__search-input']}
            />
            {searchQuery && (
              <button 
                className={styles['mapPage__search-clear']}
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className={styles['mapPage__filters']}>
            <button
              className={`${styles['mapPage__filter-btn']} ${showDossiers ? styles['mapPage__filter-btn--active'] : ''}`}
              onClick={() => setShowDossiers(!showDossiers)}
            >
              <User size={16} />
              {t('citizen.missingPersons')}
            </button>
            <button
              className={`${styles['mapPage__filter-btn']} ${showSignalements ? styles['mapPage__filter-btn--active'] : ''}`}
              onClick={() => setShowSignalements(!showSignalements)}
            >
              <Eye size={16} />
              {t('citizen.sightings')}
            </button>
          </div>

          {/* Actions */}
          <div className={styles['mapPage__actions']}>
            <button 
              className={styles['mapPage__action-btn']}
              onClick={handleCenterOnUser}
              title={t('citizen.centerOnMe')}
            >
              <Target size={18} />
            </button>
            <button 
              className={styles['mapPage__action-btn']}
              onClick={handleRefresh}
              disabled={isLoading}
              title={t('common.refresh')}
            >
              <RefreshCw size={18} className={isLoading ? styles['mapPage__spin'] : ''} />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className={styles['mapPage__container']}>
          {/* Loading */}
          {isLoading && (
            <div className={styles['mapPage__loading']}>
              <Loader2 size={32} className={styles['mapPage__spin']} />
              <p>{t('common.loading')}</p>
            </div>
          )}

          {/* Map Error */}
          {mapError && (
            <div className={styles['mapPage__error']}>
              <AlertCircle size={32} />
              <p>{mapError}</p>
            </div>
          )}

          {/* MapLibre GL Map Container */}
          <div 
            ref={mapContainerRef} 
            className={styles['mapPage__map']}
            style={{ width: '100%', height: '100%', minHeight: '500px' }}
          />
          
          {/* Sidebar avec liste des marqueurs */}
          {selectedMarker && (
            <div className={styles['mapPage__sidebar']}>
              <div className={styles['mapPage__sidebar-header']}>
                <h3>{selectedMarker.title}</h3>
                <button onClick={() => setSelectedMarker(null)}>
                  <X size={18} />
                </button>
              </div>
              {selectedMarker.description && (
                <p className={styles['mapPage__sidebar-desc']}>{selectedMarker.description}</p>
              )}
              {selectedMarker.type !== 'user' && (
                <button 
                  className={styles['mapPage__sidebar-btn']}
                  onClick={handleViewDetails}
                >
                  {t('common.viewDetails')} <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className={styles['mapPage__stats']}>
          <div className={styles['mapPage__stat']}>
            <User size={16} />
            <span>{dossiers?.length || 0} {t('citizen.cases')}</span>
          </div>
          <div className={styles['mapPage__stat']}>
            <Eye size={16} />
            <span>{signalements?.length || 0} {t('citizen.sightings')}</span>
          </div>
          {currentLocation && (
            <div className={styles['mapPage__stat']}>
              <Navigation size={16} />
              <span>{t('citizen.locationActive')}</span>
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
};
