import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Map as MapIcon, MapPin } from 'lucide-react';
import { MapTilerMarker, MapTilerView } from '../maps';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import homeStyles from '../../pages/public/HomePage.module.css';
import styles from './HomeMapSection.module.css';

const USER_ZOOM = 12;

type GeoState = 'idle' | 'loading' | 'ready' | 'denied' | 'unavailable';

interface DossierGeo {
  id: string;
  statut_dossier: string;
  lieu_disparition?: string | null;
  ville_disparition?: string | null;
  latitude_disparition?: number | null;
  longitude_disparition?: number | null;
  personne?: {
    nom_complet?: string | null;
    photo_principale?: string | null;
  } | null;
}

export const HomeMapSection: React.FC = () => {
  const { t } = useI18n();

  const [state, setState] = useState<GeoState>('idle');
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [dossiers, setDossiers] = useState<DossierGeo[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadDossiers = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('dossier_disparition')
      .select(
        `
          id,
          statut_dossier,
          lieu_disparition,
          ville_disparition,
          visible_public,
          latitude_disparition,
          longitude_disparition,
          personne:id_personne ( nom_complet, photo_principale )
        `
      )
      .eq('visible_public', true)
      .not('latitude_disparition', 'is', null)
      .not('longitude_disparition', 'is', null)
      .order('date_disparition', { ascending: false })
      .limit(160);

    if (error) throw error;
    return (data || []) as DossierGeo[];
  }, []);

  const handleOpenMap = useCallback(async () => {
    if (state === 'loading') return;
    setState('loading');

    try {
      const dossiersPromise = loadDossiers();

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        const loaded = await dossiersPromise;
        if (!mountedRef.current) return;
        setDossiers(loaded);
        setState('unavailable');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const loaded = await dossiersPromise;
            if (!mountedRef.current) return;
            setDossiers(loaded);
            setCenter([pos.coords.latitude, pos.coords.longitude]);
            setState('ready');
          } catch (err) {
            console.error('map load error', err);
            if (mountedRef.current) setState('unavailable');
          }
        },
        async (err) => {
          try {
            const loaded = await dossiersPromise;
            if (!mountedRef.current) return;
            setDossiers(loaded);
            setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
          } catch (e) {
            console.error('map load error', e);
            if (mountedRef.current) setState('unavailable');
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
      );
    } catch (err) {
      console.error('map init error', err);
      if (mountedRef.current) setState('unavailable');
    }
  }, [state, loadDossiers]);

  const markers: MapTilerMarker[] = useMemo(
    () =>
      dossiers
        .filter((d) => d.latitude_disparition != null && d.longitude_disparition != null)
        .map((d) => ({
          id: d.id,
          lat: Number(d.latitude_disparition),
          lng: Number(d.longitude_disparition),
          label: d.personne?.nom_complet || t('public.home.map_marker_fallback', 'Dossier'),
          type:
            d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede'
              ? ('sighting' as const)
              : ('missing' as const),
          image: d.personne?.photo_principale || undefined,
          data: d as unknown as Record<string, unknown>,
        })),
    [dossiers, t]
  );

  const isLoading = state === 'loading';
  const isReady = state === 'ready' && !!center;

  return (
    <div className={homeStyles.mapContainer}>
      <div className={homeStyles.mapContent}>
        <div className={homeStyles.mapIcon}>
          <MapIcon size={48} />
        </div>
        <h3 className={homeStyles.mapTitle}>{t('public.home.map_title')}</h3>
        <p className={homeStyles.mapDescription}>{t('public.home.map_description')}</p>
        <button
          type="button"
          className={homeStyles.mapBtn}
          onClick={handleOpenMap}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? <Loader2 size={18} className={styles.spinIcon} aria-hidden /> : <MapPin size={18} aria-hidden />}
          <span>{isLoading ? t('public.home.map_cta_loading', 'Chargement…') : t('public.home.map_cta')}</span>
        </button>
      </div>

      <div className={styles.mapFrame} aria-live="polite">
        {state === 'idle' && (
          <div className={styles.mapInvite}>
            <MapIcon size={56} strokeWidth={1.25} aria-hidden />
            <p className={styles.inviteTitle}>{t('public.home.map_title')}</p>
          </div>
        )}

        {isLoading && (
          <div className={styles.skeleton} role="status">
            <Loader2 size={24} className={styles.spinIcon} aria-hidden />
            <span>{t('public.home.map_loading', 'Préparation de la carte…')}</span>
          </div>
        )}

        {isReady && (
          <MapTilerView
            markers={markers}
            center={center as [number, number]}
            zoom={USER_ZOOM}
            height="400px"
            showControls
            interactive
          />
        )}

        {(state === 'denied' || state === 'unavailable') && (
          <div className={styles.errorState} role="status">
            <AlertTriangle size={28} aria-hidden />
            <p className={styles.errorTitle}>
              {state === 'denied'
                ? t('public.home.map_geo_denied_title', 'Géolocalisation refusée')
                : t('public.home.map_geo_unavailable_title', 'Position indisponible')}
            </p>
            <p className={styles.errorText}>
              {state === 'denied'
                ? t('public.home.map_geo_denied_text', 'Autorisez la localisation puis réessayez.')
                : t('public.home.map_geo_unavailable_text', 'Position non obtenue. Réessayez plus tard.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeMapSection;
