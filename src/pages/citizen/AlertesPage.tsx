/**
 * =====================================================
 * RETROUVONSLES - Citizen Alertes Page
 * Page pour visualiser et gérer les alertes de proximité
 * Intégré avec useAlertes et useProximityAlerts
 * =====================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlertes } from '../../features/alertes/hooks/useAlertes';
import { useProximityAlerts } from '../../features/geolocalisation/hooks/useProximityAlerts';
import { useGeolocation } from '../../features/geolocalisation/hooks/useGeolocation';
import { useI18n } from '../../hooks';
import { CitizenLayout } from './CitizenLayout';
import { supabase } from '../../config';
import {
  Bell,
  MapPin,
  AlertTriangle,
  Clock,
  Eye,
  Share2,
  Navigation,
  Filter,
  RefreshCw,
  AlertCircle,
  Radio,
  Users,
  X,
} from 'lucide-react';
import { AdminListSkeleton } from 'components/skeletons';
import styles from './AlertesPage.module.css';

type FilterType = 'all' | 'active' | 'proximity' | 'closed';

export const CitizenAlertesPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusAlerteId = searchParams.get('alerte');

  // Hooks
  const { alertes, loading: loadingAlertes, error: errorAlertes, fetchAlertes } = useAlertes();
  const { 
    proximityAlerts, 
    activeAlerts, 
    isLoading: loadingProximity,
    error: errorProximity,
    checkProximity,
    dismissAlert 
  } = useProximityAlerts();
  const { currentLocation, error: geoError, getCurrentLocation } = useGeolocation();

  // Local state
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [dossierPhotos, setDossierPhotos] = useState<Record<string, string>>({});

  // Charger les alertes au montage
  useEffect(() => {
    fetchAlertes();
  }, [fetchAlertes]);

  // Charger les photos des dossiers liés aux alertes
  const loadDossierPhotos = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const { data } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, personne:id_personne(photo_principale)')
        .in('id', ids);
      const map: Record<string, string> = {};
      (data || []).forEach((d: any) => {
        const photo = d.personne?.photo_principale;
        if (d.id && photo) map[d.id] = photo;
      });
      setDossierPhotos((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const ids = [...new Set((alertes as any[]).map((a: any) => a.id_dossier).filter(Boolean))];
    loadDossierPhotos(ids);
  }, [alertes, loadDossierPhotos]);

  // Vérifier les alertes de proximité quand la position change
  useEffect(() => {
    if (currentLocation) {
      checkProximity({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy || 0,
        timestamp: Date.now(),
      });
    }
  }, [currentLocation, checkProximity]);

  // Rafraîchir les données
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlertes();
    getCurrentLocation();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Mapper le type pour l'icône
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'disparition_enfant':
        return <Users size={18} />;
      case 'urgente':
        return <AlertTriangle size={18} />;
      case 'info':
        return <Bell size={18} />;
      default:
        return <Radio size={18} />;
    }
  };

  // Formater la date relative
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('citizen.justNow');
    if (minutes < 60) return t('citizen.timeAgo.minutes').replace('{{count}}', String(minutes));
    if (hours < 24) return t('citizen.timeAgo.hours').replace('{{count}}', String(hours));
    if (days < 7) return t('citizen.timeAgo.days').replace('{{count}}', String(days));
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
  };

  // Normaliser le statut d'alerte vers une clé traduisible
  const getStatusKey = (statut?: string) => {
    switch (statut) {
      case 'active':
      case 'diffusee':
      case 'en_cours':
        return 'active';
      case 'cloturee':
      case 'terminee':
        return 'cloturee';
      case 'expiree':
        return 'expiree';
      case 'annulee':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  // Filtrer les alertes avec un statut normalisé
  const filteredAlertes = useMemo(
    () =>
      alertes.filter((alerte: any) => {
        const key = getStatusKey(alerte.statut);
        if (filter === 'all') return true;
        if (filter === 'active') return key === 'active';
        if (filter === 'closed') return key === 'cloturee' || key === 'expiree' || key === 'cancelled';
        if (filter === 'proximity') {
          // Alertes dans le rayon de l'utilisateur
          return activeAlerts.includes(alerte.id);
        }
        return true;
      }),
    [alertes, filter, activeAlerts]
  );

  // Cacher une alerte de proximité
  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    dismissAlert(alertId);
  };

  // Naviguer vers les détails
  const handleViewDetails = (alerteId: string, dossierId?: string) => {
    if (dossierId) {
      navigate(`/citizen/dossier/${dossierId}`);
    }
  };

  const isLoading = loadingAlertes || loadingProximity;
  const hasError = errorAlertes || errorProximity;

  useEffect(() => {
    if (focusAlerteId) {
      setFilter('all');
    }
  }, [focusAlerteId]);

  useEffect(() => {
    if (!focusAlerteId || isLoading) return;
    let removeHighlightTimer: number | undefined;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`citizen-alerte-${focusAlerteId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add(styles['alertes__card--focus']);
      removeHighlightTimer = window.setTimeout(() => {
        el?.classList.remove(styles['alertes__card--focus']);
      }, 6000);
    }, 400);
    return () => {
      clearTimeout(timer);
      if (removeHighlightTimer !== undefined) window.clearTimeout(removeHighlightTimer);
    };
  }, [focusAlerteId, isLoading, filteredAlertes.length]);

  return (
    <CitizenLayout>
      <div className={styles.alertes}>
        {/* Header avec localisation */}
        <div className={styles['alertes__header']}>
          <div className={styles['alertes__location']}>
            {currentLocation ? (
              <>
                <Navigation size={18} className={styles['alertes__location-icon']} />
                <span>
                  {t('citizen.locationActive')} ({currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)})
                </span>
              </>
            ) : (
              <>
                <MapPin size={18} />
                <span>{geoError || t('citizen.locationDisabled')}</span>
              </>
            )}
          </div>
          <button 
            className={styles['alertes__refresh-btn']}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={18} 
              className={isRefreshing ? styles['alertes__refresh-spin'] : ''} 
            />
          </button>
        </div>

        {/* Alertes de proximité actives */}
        {proximityAlerts.length > 0 && (
          <div className={styles['alertes__proximity']}>
            <h3 className={styles['alertes__proximity-title']}>
              <AlertTriangle size={20} />
              {t('citizen.proximityAlerts')} ({proximityAlerts.length})
            </h3>
            <div className={styles['alertes__proximity-list']}>
              {(proximityAlerts as any[])
                .filter((alert) => !dismissedAlerts.has(alert.id))
                .map((alert) => (
                  <div key={alert.id} className={styles['alertes__proximity-item']}>
                    <div className={styles['alertes__proximity-content']}>
                      <strong>{alert.titre || alert.type}</strong>
                      <p>{alert.message || ''}</p>
                      {alert.distance_km && (
                        <span className={styles['alertes__proximity-distance']}>
                          <MapPin size={14} />
                          {t('citizen.distanceAway').replace('{{distance}}', alert.distance_km.toFixed(1))}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles['alertes__proximity-dismiss']}
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className={styles['alertes__filters']}>
          <Filter size={18} />
          <button
            className={`${styles['alertes__filter-btn']} ${filter === 'all' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('citizen.allAlerts')}
          </button>
          <button
            className={`${styles['alertes__filter-btn']} ${filter === 'active' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('active')}
          >
            {t('citizen.activeAlerts')}
          </button>
          <button
            className={`${styles['alertes__filter-btn']} ${filter === 'proximity' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('proximity')}
          >
            {t('citizen.nearbyAlerts')}
          </button>
          <button
            className={`${styles['alertes__filter-btn']} ${filter === 'closed' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('closed')}
          >
            {t('citizen.closedAlerts')}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles['alertes__skeletonWrap']}>
            <AdminListSkeleton cardCount={6} showFilters={false} />
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className={styles['alertes__error']}>
            <AlertCircle size={24} />
            <p>{errorAlertes || errorProximity}</p>
            <button onClick={handleRefresh}>{t('common.retry')}</button>
          </div>
        )}

        {/* Liste des alertes */}
        {!isLoading && !hasError && (
          <div className={styles['alertes__list']}>
            {filteredAlertes.length === 0 ? (
              <div className={styles['alertes__empty']}>
                <Bell size={48} />
                <h3>{t('citizen.noAlerts')}</h3>
                <p>{t('citizen.noAlertsDescription')}</p>
              </div>
            ) : (
              <div className={styles['alertes__grid']}>
                {filteredAlertes.map((alerte: any) => {
                  const photo = alerte.id_dossier ? dossierPhotos[alerte.id_dossier] : null;
                  const statusKey = getStatusKey(alerte.statut);
                  return (
                    <div
                      key={alerte.id}
                      id={`citizen-alerte-${alerte.id}`}
                      className={styles['alertes__card']}
                      onClick={() => handleViewDetails(alerte.id, alerte.id_dossier)}
                    >
                      <div className={styles['alertes__card-media']}>
                        {photo ? (
                          <img src={photo} alt="" />
                        ) : (
                          <div className={styles['alertes__card-media-placeholder']}>
                            {getTypeIcon(alerte.type_alerte)}
                          </div>
                        )}
                        <span className={`${styles['alertes__card-status']} ${statusKey === 'active' ? styles['alertes__status--active'] : statusKey === 'cloturee' || statusKey === 'expiree' || statusKey === 'cancelled' ? styles['alertes__status--closed'] : styles['alertes__status--pending']}`}>
                          {t(`citizen.alertStatus.${statusKey}`)}
                        </span>
                      </div>
                      <div className={styles['alertes__card-body']}>
                        <h4 className={styles['alertes__card-title']}>{alerte.titre}</h4>
                        <p className={styles['alertes__card-message']}>
                          {alerte.message?.substring(0, 120)}
                          {(alerte.message?.length || 0) > 120 ? '...' : ''}
                        </p>
                        <div className={styles['alertes__card-meta']}>
                          <span className={styles['alertes__card-date']}>
                            <Clock size={14} />
                            {formatTimeAgo(alerte.created_at || new Date().toISOString())}
                          </span>
                          {alerte.rayon_km && (
                            <span className={styles['alertes__card-radius']}>
                              <MapPin size={14} />
                              {t('citizen.radiusKm').replace('{{radius}}', String(alerte.rayon_km))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {!isLoading && filteredAlertes.length > 0 && (
          <div className={styles['alertes__stats']}>
            <div className={styles['alertes__stat']}>
              <span className={styles['alertes__stat-value']}>{alertes.length}</span>
              <span className={styles['alertes__stat-label']}>{t('citizen.totalAlerts')}</span>
            </div>
            <div className={styles['alertes__stat']}>
              <span className={styles['alertes__stat-value']}>
                {(alertes as any[]).filter((a) => a.statut === 'active' || a.statut === 'diffusee').length}
              </span>
              <span className={styles['alertes__stat-label']}>{t('citizen.active')}</span>
            </div>
            <div className={styles['alertes__stat']}>
              <span className={styles['alertes__stat-value']}>{activeAlerts.length}</span>
              <span className={styles['alertes__stat-label']}>{t('citizen.nearby')}</span>
            </div>
          </div>
        )}
      </div>
    </CitizenLayout>
  );
};
