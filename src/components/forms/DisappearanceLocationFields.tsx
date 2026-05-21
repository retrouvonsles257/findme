/**
 * Lieu de disparition : recherche + carte (aligné création dossier autorité).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useI18n } from '../../hooks';
import { mapConfig } from '../../config/map.config';
import { MapSearch, MapTilerView, type MapSearchLocation } from '../maps';
import styles from '../../pages/authority/CreateDossierPage.module.css';

export interface DisappearanceLocationValue {
  lieu_disparition: string;
  ville_disparition: string;
  region_disparition: string;
  pays_disparition: string;
  latitude_disparition: number | null;
  longitude_disparition: number | null;
}

export interface DisappearanceLocationFieldsProps {
  value: DisappearanceLocationValue;
  onChange: (patch: Partial<DisappearanceLocationValue>) => void;
  required?: boolean;
}

export const DisappearanceLocationFields: React.FC<DisappearanceLocationFieldsProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const { t, language } = useI18n();
  const [showMap, setShowMap] = useState(false);
  const [geoResults, setGeoResults] = useState<MapSearchLocation[]>([]);
  const [isGeoSearching, setIsGeoSearching] = useState(false);
  const geoTimerRef = useRef<number | null>(null);

  const hasCoords = value.latitude_disparition != null && value.longitude_disparition != null;

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
      .map((f: { id?: string; center?: number[]; place_name?: string; text?: string; context?: { text?: string }[] }) => {
        const [lng, lat] = f?.center || [];
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return {
          id: String(f.id || `${lat},${lng}`),
          name: String(f.place_name || f.text || 'Lieu'),
          lat,
          lng,
          type: 'organization' as const,
          region: f?.context?.map((c) => c?.text).filter(Boolean).join(', '),
        } as MapSearchLocation;
      })
      .filter(Boolean) as MapSearchLocation[];
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
      if (geoTimerRef.current) window.clearTimeout(geoTimerRef.current);
      geoTimerRef.current = window.setTimeout(async () => {
        try {
          setGeoResults(await geocodeMapTiler(q));
        } catch {
          setGeoResults([]);
        } finally {
          setIsGeoSearching(false);
          geoTimerRef.current = null;
        }
      }, 250);
    },
    [language],
  );

  const handleGeoSelect = (loc: MapSearchLocation) => {
    onChange({
      latitude_disparition: loc.lat,
      longitude_disparition: loc.lng,
      lieu_disparition: value.lieu_disparition?.trim() ? value.lieu_disparition : loc.name,
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    onChange({ latitude_disparition: lat, longitude_disparition: lng });
  };

  useEffect(() => {
    return () => {
      if (geoTimerRef.current) window.clearTimeout(geoTimerRef.current);
    };
  }, []);

  return (
    <div className={styles.formGroupFull}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 0.75rem', fontSize: '1rem' }}>
        <MapPin size={18} aria-hidden />
        {t('citizen.preDeclaration.locationSectionTitle')}
      </h3>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{t('citizen.preDeclaration.fieldLieu')}</label>
          <input
            type="text"
            value={value.lieu_disparition}
            onChange={(e) => onChange({ lieu_disparition: e.target.value })}
            required={required}
          />
        </div>
        <div className={styles.formGroup}>
          <label>{t('citizen.preDeclaration.fieldVille')}</label>
          <input
            type="text"
            value={value.ville_disparition}
            onChange={(e) => onChange({ ville_disparition: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label>{t('citizen.preDeclaration.fieldRegion')}</label>
          <input
            type="text"
            value={value.region_disparition}
            onChange={(e) => onChange({ region_disparition: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label>{t('citizen.preDeclaration.fieldPays')}</label>
          <input
            type="text"
            value={value.pays_disparition}
            onChange={(e) => onChange({ pays_disparition: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.mapHeader} style={{ marginTop: '0.75rem' }}>
        <label>{t('authority.createDossier.step2.map.title')}</label>
        <button type="button" className={styles.mapToggle} onClick={() => setShowMap((v) => !v)}>
          {showMap ? t('authority.createDossier.step2.map.hide') : t('authority.createDossier.step2.map.show')}
        </button>
      </div>

      {hasCoords && (
        <p className={styles.coordsInfo}>
          {t('authority.createDossier.step2.map.coords')}: {value.latitude_disparition!.toFixed(6)},{' '}
          {value.longitude_disparition!.toFixed(6)}
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
            height="280px"
            center={
              hasCoords
                ? [value.latitude_disparition!, value.longitude_disparition!]
                : [3.848, 11.5021]
            }
            zoom={hasCoords ? 12 : 7}
            onMapClick={handleMapClick}
            markers={
              hasCoords
                ? [
                    {
                      id: 'disappearance-point',
                      lat: value.latitude_disparition!,
                      lng: value.longitude_disparition!,
                      label: t('authority.createDossier.step2.map.markerLabel'),
                      type: 'missing',
                    },
                  ]
                : []
            }
            showControls
            interactive
          />
          {!mapConfig.maptiler.apiKey && (
            <p className={styles.mapHint}>{t('authority.createDossier.step2.map.apiKeyMissing')}</p>
          )}
          <p className={styles.mapHint}>{t('authority.createDossier.step2.map.hint')}</p>
        </div>
      )}
    </div>
  );
};
