/**
 * Page citoyen — alertes de proximité + panneau détail (?alerte=uuid).
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCitizenAlertes } from '../../features/alertes/hooks/useCitizenAlertes';
import { getCitizenAlerteById } from '../../features/alertes/services/citizenAlerteAPI';
import { useNotifications } from '../../features/notifications/hooks';
import { useProximityAlerts } from '../../features/geolocalisation/hooks/useProximityAlerts';
import { useGeolocation } from '../../features/geolocalisation/hooks/useGeolocation';
import { maybeSyncCitizenGpsToProfileDebounced } from '../../features/users/services/citizenLocationSync';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { CitizenLayout } from './CitizenLayout';
import { supabase } from '../../config';
import type { Alerte } from '../../@types/alertes.types';
import {
  Bell,
  MapPin,
  AlertTriangle,
  Clock,
  Navigation,
  Filter,
  RefreshCw,
  AlertCircle,
  Radio,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { AdminListSkeleton } from 'components/skeletons';
import styles from './AlertesPage.module.css';

type FilterType = 'all' | 'active' | 'proximity' | 'closed';

function alerteStatutRaw(alerte: Alerte): string | undefined {
  return alerte.statut_alerte;
}

function getStatusKey(statut?: string) {
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
}

export const CitizenAlertesPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusAlerteId = searchParams.get('alerte');
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as { id?: string } | null)?.id;

  const { alertes, loading: loadingAlertes, error: errorAlertes, fetchAlertes } = useCitizenAlertes();
  const { fetchNotifications } = useNotifications();
  const {
    proximityAlerts,
    activeAlerts,
    isLoading: loadingProximity,
    error: errorProximity,
    checkProximity,
    dismissAlert,
  } = useProximityAlerts();
  const { currentLocation, error: geoError, getCurrentLocation } = useGeolocation();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [dossierPhotos, setDossierPhotos] = useState<Record<string, string>>({});

  const [detailAlerte, setDetailAlerte] = useState<Alerte | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAlertes();
  }, [fetchAlertes]);

  const alertesRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`citizen-alertes-notif:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter: `id_utilisateur=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { type_notification?: string } | undefined;
          if (row?.type_notification === 'nouvelle_alerte') {
            if (alertesRefreshTimerRef.current) clearTimeout(alertesRefreshTimerRef.current);
            alertesRefreshTimerRef.current = setTimeout(() => {
              void fetchAlertes();
            }, 2000);
          }
          void fetchNotifications(userId);
        },
      )
      .subscribe();
    return () => {
      if (alertesRefreshTimerRef.current) clearTimeout(alertesRefreshTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchAlertes, fetchNotifications]);

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
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const ids = [
      ...new Set(
        [...alertes, detailAlerte ? [detailAlerte] : []]
          .flat()
          .map((a) => (a as Alerte).id_dossier)
          .filter(Boolean) as string[],
      ),
    ];
    void loadDossierPhotos(ids);
  }, [alertes, detailAlerte, loadDossierPhotos]);

  useEffect(() => {
    if (currentLocation) {
      checkProximity({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy || 0,
        timestamp: Date.now(),
      });
      if (userId) {
        void maybeSyncCitizenGpsToProfileDebounced(
          userId,
          currentLocation.latitude,
          currentLocation.longitude,
        );
      }
    }
  }, [currentLocation, checkProximity, userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlertes();
    getCurrentLocation();
    if (focusAlerteId) {
      try {
        const refreshed = await getCitizenAlerteById(focusAlerteId);
        setDetailAlerte(refreshed);
        setDetailError(refreshed ? null : t('citizen.alertDetail.notFound'));
      } catch {
        /* garde le panneau actuel */
      }
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

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

  const filteredAlertes = useMemo(
    () =>
      alertes.filter((alerte) => {
        const key = getStatusKey(alerteStatutRaw(alerte));
        if (filter === 'all') return true;
        if (filter === 'active') return key === 'active';
        if (filter === 'closed') return key === 'cloturee' || key === 'expiree' || key === 'cancelled';
        if (filter === 'proximity') return activeAlerts.includes(alerte.id);
        return true;
      }),
    [alertes, filter, activeAlerts],
  );

  const openAlerteDetail = useCallback(
    (alerteId: string) => {
      setSearchParams({ alerte: alerteId }, { replace: false });
    },
    [setSearchParams],
  );

  const closeAlerteDetail = useCallback(() => {
    setDetailAlerte(null);
    setDetailError(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (!focusAlerteId) {
      setDetailAlerte(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    setFilter('all');

    const inList = alertes.find((a) => a.id === focusAlerteId);
    if (inList) {
      setDetailAlerte(inList);
      setDetailError(null);
      setDetailLoading(false);
    }

    let cancelled = false;
    setDetailLoading(!inList);
    setDetailError(null);

    void (async () => {
      try {
        const row = await getCitizenAlerteById(focusAlerteId);
        if (cancelled) return;
        if (row) {
          setDetailAlerte(row);
          setDetailError(null);
        } else if (!inList) {
          setDetailAlerte(null);
          setDetailError(t('citizen.alertDetail.notFound'));
        }
      } catch (err) {
        if (cancelled) return;
        setDetailError(err instanceof Error ? err.message : t('citizen.alertDetail.loadError'));
        if (!inList) setDetailAlerte(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focusAlerteId, alertes, t]);

  useEffect(() => {
    if (!focusAlerteId || loadingAlertes) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`citizen-alerte-${focusAlerteId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add(styles['alertes__card--focus']);
      window.setTimeout(() => el?.classList.remove(styles['alertes__card--focus']), 6000);
    }, 400);
    return () => clearTimeout(timer);
  }, [focusAlerteId, loadingAlertes, filteredAlertes.length]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    dismissAlert(alertId);
  };

  const handleOpenDossier = (dossierId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/citizen/dossier/${dossierId}`);
  };

  const isLoading = loadingAlertes || loadingProximity;
  const hasError = errorAlertes || errorProximity;
  const showDetailPanel = Boolean(focusAlerteId);

  const renderDetailPanel = () => {
    if (!showDetailPanel) return null;

    const statut = detailAlerte ? alerteStatutRaw(detailAlerte) : undefined;
    const statusKey = getStatusKey(statut);
    const photo = detailAlerte?.id_dossier ? dossierPhotos[detailAlerte.id_dossier] : null;

    return (
      <div
        className={styles['alertes__detail']}
        role="dialog"
        aria-labelledby="citizen-alerte-detail-title"
        aria-modal="true"
      >
        <div className={styles['alertes__detail-header']}>
          <h2 id="citizen-alerte-detail-title" className={styles['alertes__detail-title']}>
            {t('citizen.alertDetail.title')}
          </h2>
          <button
            type="button"
            className={styles['alertes__detail-close']}
            onClick={closeAlerteDetail}
            aria-label={t('citizen.alertDetail.close')}
          >
            <X size={20} />
          </button>
        </div>

        {detailLoading && (
          <div className={styles['alertes__detail-loading']}>
            <Loader2 size={28} className={styles['alertes__refresh-spin']} />
            <span>{t('citizen.alertDetail.loading')}</span>
          </div>
        )}

        {!detailLoading && detailError && (
          <div className={styles['alertes__detail-error']}>
            <AlertCircle size={22} />
            <p>{detailError}</p>
            <button type="button" onClick={handleRefresh}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {!detailLoading && !detailError && detailAlerte && (
          <div className={styles['alertes__detail-body']}>
            <div className={styles['alertes__detail-media']}>
              {photo ? (
                <img src={photo} alt="" />
              ) : (
                <div className={styles['alertes__card-media-placeholder']}>
                  {getTypeIcon(detailAlerte.type_alerte || '')}
                </div>
              )}
              <span
                className={`${styles['alertes__card-status']} ${
                  statusKey === 'active'
                    ? styles['alertes__status--active']
                    : statusKey === 'cloturee' || statusKey === 'expiree' || statusKey === 'cancelled'
                      ? styles['alertes__status--closed']
                      : styles['alertes__status--pending']
                }`}
              >
                {t(`citizen.alertStatus.${statusKey}`)}
              </span>
            </div>
            <h3 className={styles['alertes__detail-name']}>{detailAlerte.titre}</h3>
            <p className={styles['alertes__detail-message']}>{detailAlerte.message}</p>
            <div className={styles['alertes__detail-meta']}>
              <span>
                <Clock size={14} />
                {formatTimeAgo(
                  detailAlerte.date_diffusion ||
                    detailAlerte.created_at ||
                    new Date().toISOString(),
                )}
              </span>
              {detailAlerte.rayon_km != null && (
                <span>
                  <MapPin size={14} />
                  {t('citizen.radiusKm').replace('{{radius}}', String(detailAlerte.rayon_km))}
                </span>
              )}
            </div>
            {detailAlerte.id_dossier && (
              <button
                type="button"
                className={styles['alertes__detail-dossier-btn']}
                onClick={(e) => handleOpenDossier(detailAlerte.id_dossier!, e)}
              >
                {t('citizen.viewLinkedDossier')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <CitizenLayout>
      <div className={styles.alertes}>
        <div className={styles['alertes__header']}>
          <div className={styles['alertes__location']}>
            {currentLocation ? (
              <>
                <Navigation size={18} className={styles['alertes__location-icon']} />
                <span>
                  {t('citizen.locationActive')} ({currentLocation.latitude.toFixed(4)},{' '}
                  {currentLocation.longitude.toFixed(4)})
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
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            type="button"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? styles['alertes__refresh-spin'] : ''}
            />
          </button>
        </div>

        {renderDetailPanel()}

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
                          {t('citizen.distanceAway').replace(
                            '{{distance}}',
                            alert.distance_km.toFixed(1),
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
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

        <div className={styles['alertes__filters']}>
          <Filter size={18} />
          <button
            type="button"
            className={`${styles['alertes__filter-btn']} ${filter === 'all' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('citizen.allAlerts')}
          </button>
          <button
            type="button"
            className={`${styles['alertes__filter-btn']} ${filter === 'active' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('active')}
          >
            {t('citizen.activeAlerts')}
          </button>
          <button
            type="button"
            className={`${styles['alertes__filter-btn']} ${filter === 'proximity' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('proximity')}
          >
            {t('citizen.nearbyAlerts')}
          </button>
          <button
            type="button"
            className={`${styles['alertes__filter-btn']} ${filter === 'closed' ? styles['alertes__filter-btn--active'] : ''}`}
            onClick={() => setFilter('closed')}
          >
            {t('citizen.closedAlerts')}
          </button>
        </div>

        {isLoading && (
          <div className={styles['alertes__skeletonWrap']}>
            <AdminListSkeleton cardCount={6} showFilters={false} />
          </div>
        )}

        {hasError && !isLoading && (
          <div className={styles['alertes__error']}>
            <AlertCircle size={24} />
            <p>{errorAlertes || errorProximity}</p>
            <button type="button" onClick={() => void handleRefresh()}>
              {t('common.retry')}
            </button>
          </div>
        )}

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
                {filteredAlertes.map((alerte) => {
                  const photo = alerte.id_dossier ? dossierPhotos[alerte.id_dossier] : null;
                  const statusKey = getStatusKey(alerteStatutRaw(alerte));
                  const isSelected = focusAlerteId === alerte.id;
                  return (
                    <div
                      key={alerte.id}
                      id={`citizen-alerte-${alerte.id}`}
                      className={`${styles['alertes__card']} ${isSelected ? styles['alertes__card--selected'] : ''}`}
                      onClick={() => openAlerteDetail(alerte.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openAlerteDetail(alerte.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles['alertes__card-media']}>
                        {photo ? (
                          <img src={photo} alt="" />
                        ) : (
                          <div className={styles['alertes__card-media-placeholder']}>
                            {getTypeIcon(alerte.type_alerte || '')}
                          </div>
                        )}
                        <span
                          className={`${styles['alertes__card-status']} ${
                            statusKey === 'active'
                              ? styles['alertes__status--active']
                              : statusKey === 'cloturee' ||
                                  statusKey === 'expiree' ||
                                  statusKey === 'cancelled'
                                ? styles['alertes__status--closed']
                                : styles['alertes__status--pending']
                          }`}
                        >
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
                            {formatTimeAgo(
                              alerte.date_diffusion ||
                                alerte.created_at ||
                                new Date().toISOString(),
                            )}
                          </span>
                          {alerte.rayon_km != null && (
                            <span className={styles['alertes__card-radius']}>
                              <MapPin size={14} />
                              {t('citizen.radiusKm').replace('{{radius}}', String(alerte.rayon_km))}
                            </span>
                          )}
                          {alerte.id_dossier && (
                            <button
                              type="button"
                              className={styles['alertes__card-dossier-link']}
                              onClick={(e) => handleOpenDossier(alerte.id_dossier!, e)}
                            >
                              {t('citizen.viewLinkedDossier')}
                            </button>
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

        {!isLoading && filteredAlertes.length > 0 && (
          <div className={styles['alertes__stats']}>
            <div className={styles['alertes__stat']}>
              <span className={styles['alertes__stat-value']}>{alertes.length}</span>
              <span className={styles['alertes__stat-label']}>{t('citizen.totalAlerts')}</span>
            </div>
            <div className={styles['alertes__stat']}>
              <span className={styles['alertes__stat-value']}>
                {alertes.filter((a) => getStatusKey(alerteStatutRaw(a)) === 'active').length}
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
