/**
 * =====================================================
 * RETROUVONSLES - Citizen Alertes Page
 * Page pour visualiser et gérer les alertes de proximité
 * Intégré avec useAlertes et useProximityAlerts
 * =====================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertes } from '../../features/alertes/hooks/useAlertes';
import { useProximityAlerts } from '../../features/geolocalisation/hooks/useProximityAlerts';
import { useGeolocation } from '../../features/geolocalisation/hooks/useGeolocation';
import { useI18n } from '../../hooks';
import { CitizenLayout } from './CitizenLayout';
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
  Loader2,
  AlertCircle,
  ChevronRight,
  Radio,
  Users,
  X,
} from 'lucide-react';
import styles from './AlertesPage.module.css';

type FilterType = 'all' | 'active' | 'proximity' | 'closed';

export const CitizenAlertesPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  
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

  // Charger les alertes au montage
  useEffect(() => {
    fetchAlertes();
  }, [fetchAlertes]);

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
          <div className={styles['alertes__loading']}>
            <Loader2 size={32} className={styles['alertes__loading-spin']} />
            <p>{t('common.loading')}</p>
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
              filteredAlertes.map((alerte: any) => (
                <div 
                  key={alerte.id} 
                  className={styles['alertes__card']}
                  onClick={() => handleViewDetails(alerte.id, alerte.id_dossier)}
                >
                  <div className={styles['alertes__card-icon']}>
                    {getTypeIcon(alerte.type_alerte)}
                  </div>
                  
                  <div className={styles['alertes__card-content']}>
                    <div className={styles['alertes__card-header']}>
                      <h4 className={styles['alertes__card-title']}>{alerte.titre}</h4>
                      <span className={`${styles['alertes__status']} ${getStatusKey(alerte.statut) === 'active' ? styles['alertes__status--active'] : getStatusKey(alerte.statut) === 'cloturee' || getStatusKey(alerte.statut) === 'expiree' || getStatusKey(alerte.statut) === 'cancelled' ? styles['alertes__status--closed'] : styles['alertes__status--pending']}`}>
                        {t(`citizen.alertStatus.${getStatusKey(alerte.statut)}`)}
                      </span>
                    </div>
                    
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
                      
                      {alerte.vues !== undefined && (
                        <span className={styles['alertes__card-views']}>
                          <Eye size={14} />
                          {t('citizen.views').replace('{{count}}', String(alerte.vues))}
                        </span>
                      )}
                      
                      {alerte.partages !== undefined && (
                        <span className={styles['alertes__card-shares']}>
                          <Share2 size={14} />
                          {t('citizen.shares').replace('{{count}}', String(alerte.partages))}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight size={20} className={styles['alertes__card-arrow']} />
                </div>
              ))
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
