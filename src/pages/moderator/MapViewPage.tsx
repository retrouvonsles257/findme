/**
 * =====================================================
 * RETROUVONSLES - Map View Page (Moderator)
 * Vue carte des signalements géolocalisés avec MapTiler
 * =====================================================
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { ModerationLayout } from './ModerationLayout';
import { MapTilerView, MapTilerMarker } from '../../components/maps/MapTilerView/MapTilerView';
import {
  MapPin,
  Filter,
  RefreshCw,
  Eye,
  X,
  List,
  Map,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import styles from './MapViewPage.module.css';

// Types
interface MapFilters {
  status: 'all' | 'en_attente' | 'en_verification' | 'valide' | 'invalide';
  dateRange: 'all' | '7days' | '30days' | '90days';
  minScore: number;
}

export const MapViewPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { signalements, isLoading, fetchSignalements } = useSignalements();

  // State
  const [filters, setFilters] = useState<MapFilters>({
    status: 'all',
    dateRange: 'all',
    minScore: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapCenter, setMapCenter] = useState<[number, number]>([5.3599, -4.0082]); // Abidjan default

  // Charger les signalements
  useEffect(() => {
    fetchSignalements(undefined, 1);
  }, [fetchSignalements]);

  // Filtrer les signalements par statut, date, score (sans filtre de coordonnées pour la liste)
  const filteredByOtherCriteria = useMemo(() => {
    return signalements.filter((sig) => {
      // Filtre par statut
      if (filters.status !== 'all') {
        const statut = sig.statut_validation || sig.etat;
        if (filters.status === 'en_attente' && statut !== 'en_attente' && sig.etat !== 'nouveau') return false;
        if (filters.status === 'en_verification' && statut !== 'en_verification') return false;
        if (filters.status === 'valide' && statut !== 'valide') return false;
        if (filters.status === 'invalide' && statut !== 'invalide') return false;
      }

      // Filtre par date
      if (filters.dateRange !== 'all') {
        const sigDate = new Date(sig.date_observation);
        const now = new Date();
        const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        if (sigDate < cutoff) return false;
      }

      // Filtre par score
      if (filters.minScore > 0) {
        const raw = sig.score_pertinence ?? sig.score_correspondance ?? 0;
        const score = typeof raw === 'number' && raw > 1 ? raw : raw * 100;
        if (score < filters.minScore) return false;
      }

      return true;
    });
  }, [signalements, filters]);

  // Signalements avec coordonnées valides (pour la carte)
  const filteredSignalements = useMemo(() => {
    return filteredByOtherCriteria.filter((sig) => {
      const lat = sig.latitude_observation ?? sig.latitude;
      const lng = sig.longitude_observation ?? sig.longitude;
      return lat && lng && lat !== 0 && lng !== 0;
    });
  }, [filteredByOtherCriteria]);

  // Signalements sans coordonnées
  const signalementsSansCoordonnees = useMemo(() => {
    return filteredByOtherCriteria.filter((sig) => {
      const lat = sig.latitude_observation ?? sig.latitude;
      const lng = sig.longitude_observation ?? sig.longitude;
      return !lat || !lng || lat === 0 || lng === 0;
    });
  }, [filteredByOtherCriteria]);

  // Convertir les signalements en marqueurs MapTiler
  const mapMarkers: MapTilerMarker[] = useMemo(() => {
    return filteredSignalements.map((sig) => {
      const lat = sig.latitude_observation ?? sig.latitude ?? 0;
      const lng = sig.longitude_observation ?? sig.longitude ?? 0;
      const statut: string = sig.statut_validation || sig.etat || '';
      
      // Déterminer le type pour la couleur
      let markerType: MapTilerMarker['type'] = 'sighting';
      if (statut === 'en_attente' || statut === 'nouveau') {
        markerType = 'alert';
      } else if (statut === 'valide') {
        markerType = 'organization';
      } else if (statut === 'invalide' || statut === 'rejete') {
        markerType = 'missing';
      }

      return {
        id: sig.id,
        lat: lat,
        lng: lng,
        label: sig.lieu_observation || sig.ville_observation || t('moderator.reportLabel'),
        type: markerType,
        image: sig.photo_url,
        data: { signalementId: sig.id } as Record<string, unknown>,
      };
    });
  }, [filteredSignalements]);

  // Gérer le clic sur un marqueur
  const handleMarkerClick = (marker: MapTilerMarker) => {
    const sig = filteredSignalements.find(s => s.id === marker.id);
    if (sig) {
      setSelectedSignalement(sig);
    }
  };

  // Badge de statut
  const getStatusBadge = (sig: any) => {
    const statut = sig.statut_validation || sig.etat;
    const badges: Record<string, { label: string; color: string }> = {
      en_attente: { label: t('moderator.pendingLabel'), color: '#f59e0b' },
      nouveau: { label: t('moderator.nouveau'), color: '#3b82f6' },
      en_verification: { label: t('moderator.enCours'), color: '#8b5cf6' },
      valide: { label: t('moderator.valides'), color: '#10b981' },
      invalide: { label: t('moderator.rejected'), color: '#ef4444' },
    };
    return badges[statut] || { label: statut, color: '#6b7280' };
  };

  // Couleur du marqueur selon le statut
  const getMarkerColor = (sig: any) => {
    const statut = sig.statut_validation || sig.etat;
    const colors: Record<string, string> = {
      en_attente: '#f59e0b',
      nouveau: '#3b82f6',
      en_verification: '#8b5cf6',
      en_cours: '#8b5cf6',
      valide: '#10b981',
      invalide: '#ef4444',
      rejete: '#ef4444',
      spam: '#dc2626',
      doublonne: '#6b7280',
    };
    return colors[statut] || '#6b7280';
  };

  // Statistiques
  const stats = useMemo(() => {
    const all = filteredByOtherCriteria;
    return {
      total: all.length,
      avecCoordonnees: filteredSignalements.length,
      sansCoordonnees: signalementsSansCoordonnees.length,
      enAttente: all.filter(s => (s.statut_validation || s.etat) === 'en_attente' || s.etat === 'nouveau').length,
      valides: all.filter(s => (s.statut_validation || s.etat) === 'valide').length,
      rejetes: all.filter(s => (s.statut_validation || s.etat) === 'invalide' || s.etat === 'rejete').length,
    };
  }, [filteredByOtherCriteria, filteredSignalements, signalementsSansCoordonnees]);

  // Ouvrir dans la page de validation
  const handleViewDetails = (sig: any) => {
    navigate(`/moderator/signalements-validation?id=${sig.id}`);
  };

  // Centrer sur le premier signalement si disponible
  useEffect(() => {
    if (filteredSignalements.length > 0) {
      const firstSig = filteredSignalements[0];
      const lat = firstSig.latitude_observation ?? firstSig.latitude;
      const lng = firstSig.longitude_observation ?? firstSig.longitude;
      if (lat && lng) {
        setMapCenter([lat, lng]);
      }
    }
  }, [filteredSignalements]);

  return (
    <ModerationLayout title={t('moderator.mapViewTitle')} activeNav="map">
      <div className={styles['map-view']}>
        <section className={styles['map-view__header']}>
          <div className={styles['map-view__header-content']}>
            <h1 className={styles['map-view__title']}>
              <MapPin size={28} />
              {t('moderator.mapViewTitleFull')}
            </h1>
            <p className={styles['map-view__subtitle']}>
              {t('moderator.mapViewSubtitle')}
            </p>
          </div>

          <div className={styles['map-view__toolbar']}>
            <div className={styles['map-view__view-toggle']}>
              <button
                type="button"
                className={`${styles['map-view__toggle-btn']} ${viewMode === 'map' ? styles['map-view__toggle-btn--active'] : ''}`}
                onClick={() => setViewMode('map')}
              >
                <Map size={18} />
                {t('moderator.mapViewMap')}
              </button>
              <button
                type="button"
                className={`${styles['map-view__toggle-btn']} ${viewMode === 'list' ? styles['map-view__toggle-btn--active'] : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
                {t('moderator.mapViewList')}
              </button>
            </div>
            <button
              type="button"
              className={styles['map-view__toolbar-btn']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              {t('moderator.filters')}
            </button>
            <button
              className={styles['map-view__toolbar-btn']}
              onClick={() => fetchSignalements(undefined, 1)}
            >
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className={styles['map-view__filters']}>
              <div className={styles['map-view__filter-group']}>
                <label>{t('moderator.status')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">{t('moderator.allTypes')}</option>
                  <option value="en_attente">{t('moderator.pendingLabel')}</option>
                  <option value="en_verification">{t('moderator.enCours')}</option>
                  <option value="valide">{t('moderator.valides')}</option>
                  <option value="invalide">{t('moderator.rejected')}</option>
                </select>
              </div>

              <div className={styles['map-view__filter-group']}>
                <label>{t('moderator.period')}</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                >
                  <option value="all">{t('moderator.notifications.all')}</option>
                  <option value="7days">{t('moderator.last7Days')}</option>
                  <option value="30days">{t('moderator.lastMonth')}</option>
                  <option value="90days">{t('moderator.days90')}</option>
                </select>
              </div>

              <div className={styles['map-view__filter-group']}>
                <label>{t('moderator.minScore')}</label>
                <select
                  value={filters.minScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                >
                  <option value="0">{t('moderator.allTypes')}</option>
                  <option value="50">≥ 50%</option>
                  <option value="70">≥ 70%</option>
                  <option value="85">≥ 85%</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Stats */}
        <div className={styles['map-view__stats']}>
          <div className={styles['map-view__stat']}>
            <MapPin size={20} />
            <span>{stats.total} {t('moderator.reportsTotal')}</span>
          </div>
          <div className={styles['map-view__stat']} title={t('moderator.reportsVisibleOnMap')}>
            <Map size={20} />
            <span>{stats.avecCoordonnees} {t('moderator.geolocated')}</span>
          </div>
          {stats.sansCoordonnees > 0 && (
            <div className={styles['map-view__stat']} style={{ color: '#f59e0b' }} title={t('moderator.reportsWithoutGps')}>
              <AlertTriangle size={20} />
              <span>{stats.sansCoordonnees} {t('moderator.withoutGps')}</span>
            </div>
          )}
          <div className={styles['map-view__stat']}>
            <Clock size={20} />
            <span>{stats.enAttente} {t('moderator.pendingLabel')}</span>
          </div>
          <div className={styles['map-view__stat']}>
            <CheckCircle size={20} />
            <span>{stats.valides} {t('moderator.valides')}</span>
          </div>
        </div>

        {isLoading ? (
          <div className={styles['map-view__skeletonWrap']}>
            <div className={styles['map-view__map-skeleton-container']} aria-hidden>
              <div className={styles['map-view__map-skeleton']}>
                <div className={styles['map-view__map-skeleton-inner']} />
              </div>
              <div className={styles['map-view__map-skeleton-panel']}>
                <div className={styles['map-view__map-skeleton-panel-title']} />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={styles['map-view__map-skeleton-panel-item']}>
                    <div className={styles['map-view__map-skeleton-panel-dot']} />
                    <div className={styles['map-view__map-skeleton-panel-lines']}>
                      <div className={styles['map-view__map-skeleton-panel-line']} />
                      <div className={styles['map-view__map-skeleton-panel-line-short']} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'map' ? (
              /* Vue Carte avec MapTiler */
              <div className={styles['map-view__map-container']}>
                <MapTilerView
                  markers={mapMarkers}
                  center={mapCenter}
                  zoom={8}
                  height="600px"
                  showControls={true}
                  interactive={true}
                  onMarkerClick={handleMarkerClick}
                  className={styles['map-view__maptiler']}
                />
                
                {/* Panel latéral des signalements */}
                <div className={styles['map-view__markers-panel']}>
                  <h4>{t('moderator.onMapCount').replace('{{count}}', String(filteredSignalements.length))}</h4>
                  <div className={styles['map-view__markers-list']}>
                    {filteredSignalements.slice(0, 15).map((sig) => {
                      const statusBadge = getStatusBadge(sig);
                      const lat = sig.latitude_observation ?? sig.latitude;
                      const lng = sig.longitude_observation ?? sig.longitude;

                      return (
                        <div
                          key={sig.id}
                          className={styles['map-view__marker-item']}
                          onClick={() => setSelectedSignalement(sig)}
                        >
                          <div
                            className={styles['map-view__marker-dot']}
                            style={{ backgroundColor: getMarkerColor(sig) }}
                          />
                          <div className={styles['map-view__marker-info']}>
                            <span className={styles['map-view__marker-location']}>
                              {sig.lieu_observation || sig.ville_observation || t('moderator.placeUnspecified')}
                            </span>
                            <span className={styles['map-view__marker-coords']}>
                              {lat?.toFixed(4)}, {lng?.toFixed(4)}
                            </span>
                          </div>
                          <span
                            className={styles['map-view__marker-status']}
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {filteredSignalements.length > 15 && (
                    <p className={styles['map-view__more-markers']}>
                      {t('moderator.othersOnMap').replace('{{count}}', String(filteredSignalements.length - 15))}
                    </p>
                  )}

                  {/* Signalements sans coordonnées */}
                  {signalementsSansCoordonnees.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '16px', color: '#f59e0b' }}>
                        <AlertTriangle size={16} style={{ marginRight: '6px' }} />
                        {t('moderator.withoutGpsCount').replace('{{count}}', String(signalementsSansCoordonnees.length))}
                      </h4>
                      <div className={styles['map-view__markers-list']}>
                        {signalementsSansCoordonnees.slice(0, 5).map((sig) => {
                          const statusBadge = getStatusBadge(sig);

                          return (
                            <div
                              key={sig.id}
                              className={styles['map-view__marker-item']}
                              onClick={() => setSelectedSignalement(sig)}
                              style={{ opacity: 0.7 }}
                            >
                              <div
                                className={styles['map-view__marker-dot']}
                                style={{ backgroundColor: '#9ca3af' }}
                              />
                              <div className={styles['map-view__marker-info']}>
                                <span className={styles['map-view__marker-location']}>
                                  {sig.lieu_observation || sig.ville_observation || t('moderator.placeUnspecified')}
                                </span>
                                <span className={styles['map-view__marker-coords']} style={{ color: '#f59e0b' }}>
                                  {t('moderator.coordinatesMissing')}
                                </span>
                              </div>
                              <span
                                className={styles['map-view__marker-status']}
                                style={{ backgroundColor: statusBadge.color }}
                              >
                                {statusBadge.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {signalementsSansCoordonnees.length > 5 && (
                        <p className={styles['map-view__more-markers']}>
                          {t('moderator.othersWithoutCoords').replace('{{count}}', String(signalementsSansCoordonnees.length - 5))}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Vue Liste - Affiche TOUS les signalements */
              <div className={styles['map-view__list']}>
                {filteredByOtherCriteria.length > 0 ? (
                  filteredByOtherCriteria.map((sig) => {
                    const statusBadge = getStatusBadge(sig);
                    const lat = sig.latitude_observation ?? sig.latitude;
                    const lng = sig.longitude_observation ?? sig.longitude;
                    const hasCoords = lat && lng && lat !== 0 && lng !== 0;

                    return (
                      <div
                        key={sig.id}
                        className={styles['map-view__list-item']}
                        onClick={() => setSelectedSignalement(sig)}
                      >
                        <div
                          className={styles['map-view__list-marker']}
                          style={{ backgroundColor: hasCoords ? getMarkerColor(sig) : '#9ca3af' }}
                        >
                          <MapPin size={20} />
                        </div>
                        <div className={styles['map-view__list-content']}>
                          <h4>
                            {sig.lieu_observation || sig.ville_observation || t('moderator.placeUnspecified')}
                            {!hasCoords && <span style={{ color: '#f59e0b', fontSize: '12px', marginLeft: '8px' }}>{t('moderator.withoutGpsShort')}</span>}
                          </h4>
                          <p className={styles['map-view__list-description']}>
                            {sig.description?.substring(0, 100)}...
                          </p>
                          <div className={styles['map-view__list-meta']}>
                            <span>
                              <Clock size={14} />
                              {new Date(sig.date_observation).toLocaleDateString('fr-FR')}
                            </span>
                            {hasCoords ? (
                              <span>
                                {lat?.toFixed(4)}, {lng?.toFixed(4)}
                              </span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>{t('moderator.coordinatesMissing')}</span>
                            )}
                            <span>
                              {t('moderator.modalScore')}: {Math.round((sig.score_correspondance || sig.score_pertinence || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles['map-view__list-actions']}>
                          <span
                            className={styles['map-view__list-status']}
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                          <button
                            className={styles['map-view__list-view-btn']}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(sig);
                            }}
                          >
                            <Eye size={16} />
                            {t('common.view')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles['map-view__empty']}>
                    <MapPin size={48} />
                    <p>{t('moderator.noReportsFound')}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal détail signalement */}
        {selectedSignalement && (
          <div
            className={styles['map-view__modal']}
            onClick={() => setSelectedSignalement(null)}
          >
            <div
              className={styles['map-view__modal-content']}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles['map-view__close-btn']}
                onClick={() => setSelectedSignalement(null)}
              >
                <X size={24} />
              </button>

              <div className={styles['map-view__modal-header']}>
                <MapPin size={24} />
                <h3>{selectedSignalement.lieu_observation || selectedSignalement.ville_observation}</h3>
              </div>

              <div className={styles['map-view__modal-body']}>
                <div className={styles['map-view__modal-grid']}>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('moderator.modalCoordinates')}</label>
                    <span>
                      {(selectedSignalement.latitude_observation ?? selectedSignalement.latitude)?.toFixed(6)}, 
                      {(selectedSignalement.longitude_observation ?? selectedSignalement.longitude)?.toFixed(6)}
                    </span>
                  </div>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('moderator.modalObservationDate')}</label>
                    <span>{new Date(selectedSignalement.date_observation).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('moderator.status')}</label>
                    <span
                      className={styles['map-view__modal-status']}
                      style={{ backgroundColor: getStatusBadge(selectedSignalement).color }}
                    >
                      {getStatusBadge(selectedSignalement).label}
                    </span>
                  </div>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('moderator.modalScore')}</label>
                    <span>
                      {Math.round((selectedSignalement.score_correspondance || selectedSignalement.score_pertinence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div className={styles['map-view__modal-description']}>
                  <label>{t('common.description')}</label>
                  <p>{selectedSignalement.description}</p>
                </div>

                {selectedSignalement.photo_url && (
                  <div className={styles['map-view__modal-photo']}>
                    <img src={selectedSignalement.photo_url} alt="Signalement" />
                  </div>
                )}

                <button
                  className={styles['map-view__modal-action-btn']}
                  onClick={() => handleViewDetails(selectedSignalement)}
                >
                  <Eye size={18} />
                  {t('moderator.openInValidation')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModerationLayout>
  );
};

export default MapViewPage;
