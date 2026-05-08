/**
 * =====================================================
 * RETROUVONSLES - Map View Page (Authority)
 * Vue carte des signalements et dossiers géolocalisés
 * avec MapTiler - Données 100% réelles Supabase
 * =====================================================
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAuth } from '../../contexts';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useAlertes } from '../../features/alertes/hooks/useAlertes';
import { AuthorityLayout } from '../../components/layout';
import { MapTilerView, MapTilerMarker } from '../../components/maps/MapTilerView/MapTilerView';
import { supabase } from '../../config';
import {
  MapPin,
  Filter,
  RefreshCw,
  Eye,
  X,
  List,
  Map,
  Clock,
  FolderOpen,
  Bell,
  Users,
  Layers,
} from 'lucide-react';
import styles from './MapViewPage.module.css';

// Types
type ViewLayer = 'signalements' | 'dossiers' | 'alertes' | 'all';

interface MapFilters {
  layer: ViewLayer;
  status: 'all' | 'en_attente' | 'en_verification' | 'valide' | 'invalide' | 'en_cours';
  dateRange: 'all' | '7days' | '30days' | '90days';
  urgency: 'all' | 'critique' | 'urgent' | 'normal';
}

export interface MapViewPageProps {
  noLayout?: boolean;
}

export const MapViewPage: React.FC<MapViewPageProps> = ({ noLayout = false }) => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { signalements, isLoading: signalementsLoading, fetchSignalements } = useSignalements();
  const { dossiers, isLoading: dossiersLoading, fetchDossiers } = useDossiers();
  const { alertes, loading: alertesLoading, fetchAlertes } = useAlertes();

  // State
  const [filters, setFilters] = useState<MapFilters>({
    layer: 'all',
    status: 'all',
    dateRange: 'all',
    urgency: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'signalement' | 'dossier' | 'alerte' | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.848, 11.502]); // Yaoundé default

  const isLoading = signalementsLoading || dossiersLoading || alertesLoading;

  // Charger les données au montage
  useEffect(() => {
    fetchSignalements();
    fetchDossiers();
    fetchAlertes();
  }, [fetchSignalements, fetchDossiers, fetchAlertes]);

  // Journaliser la consultation de la carte
  const logMapView = useCallback(async () => {
    if (!user?.id) return;
    try {
      await (supabase as any).from('journal_activite').insert({
        type_action: 'autre',
        action_detaillee: 'Consultation vue carte',
        description: `Consultation de la carte avec ${signalements.length} signalements, ${dossiers.length} dossiers`,
        id_utilisateur: user.id,
        date_action: new Date().toISOString(),
      });
    } catch (err) {
      // Erreur silencieuse
    }
  }, [user?.id, signalements.length, dossiers.length]);

  useEffect(() => {
    if (!isLoading && signalements.length > 0) {
      logMapView();
    }
  }, [isLoading, signalements.length, logMapView]);

  // Filtrer les signalements
  const filteredSignalements = useMemo(() => {
    if (filters.layer !== 'all' && filters.layer !== 'signalements') return [];

    return signalements.filter((sig) => {
      // Vérifier les coordonnées
      const lat = sig.latitude_observation ?? sig.latitude;
      const lng = sig.longitude_observation ?? sig.longitude;
      if (!lat || !lng || lat === 0 || lng === 0) return false;

      // Filtre par statut
      if (filters.status !== 'all') {
        const statut = sig.statut_validation || sig.etat;
        if (statut !== filters.status) return false;
      }

      // Filtre par date
      if (filters.dateRange !== 'all') {
        const sigDate = new Date(sig.date_observation);
        const now = new Date();
        const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        if (sigDate < cutoff) return false;
      }

      return true;
    });
  }, [signalements, filters]);

  // Filtrer les dossiers
  const filteredDossiers = useMemo(() => {
    if (filters.layer !== 'all' && filters.layer !== 'dossiers') return [];

    return dossiers.filter((d: any) => {
      // Vérifier les coordonnées
      const lat = d.latitude_disparition;
      const lng = d.longitude_disparition;
      if (!lat || !lng) return false;

      // Filtre par statut
      if (filters.status !== 'all' && filters.status === 'en_cours') {
        if (d.statut_dossier !== 'en_cours') return false;
      }

      // Filtre par urgence
      if (filters.urgency !== 'all') {
        if (d.niveau_urgence !== filters.urgency) return false;
      }

      // Filtre par date
      if (filters.dateRange !== 'all') {
        const dossierDate = new Date(d.date_disparition || d.created_at);
        const now = new Date();
        const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        if (dossierDate < cutoff) return false;
      }

      return true;
    });
  }, [dossiers, filters]);

  // Filtrer les alertes actives
  const filteredAlertes = useMemo(() => {
    if (filters.layer !== 'all' && filters.layer !== 'alertes') return [];

    return alertes.filter((a: any) => {
      // Vérifier les coordonnées
      const lat = a.latitude_centre;
      const lng = a.longitude_centre;
      if (!lat || !lng) return false;

      // Seulement les alertes actives
      if (a.statut_alerte !== 'en_cours') return false;

      return true;
    });
  }, [alertes, filters]);

  // Convertir en marqueurs MapTiler
  const mapMarkers: MapTilerMarker[] = useMemo(() => {
    const markers: MapTilerMarker[] = [];

    // Marqueurs signalements
    filteredSignalements.forEach((sig) => {
      const lat = sig.latitude_observation ?? sig.latitude ?? 0;
      const lng = sig.longitude_observation ?? sig.longitude ?? 0;
      const statut: string = sig.statut_validation || sig.etat || '';

      let markerType: MapTilerMarker['type'] = 'sighting';
      if (statut === 'en_attente' || statut === 'nouveau' || statut === 'en_verification') {
        markerType = 'alert';
      } else if (statut === 'valide') {
        markerType = 'organization';
      }

      markers.push({
        id: `sig-${sig.id}`,
        lat,
        lng,
        label: sig.lieu_observation || sig.ville_observation || 'Signalement',
        type: markerType,
        image: sig.photo_url,
        data: { type: 'signalement', id: sig.id } as Record<string, unknown>,
      });
    });

    // Marqueurs dossiers
    filteredDossiers.forEach((d: any) => {
      markers.push({
        id: `dos-${d.id}`,
        lat: d.latitude_disparition,
        lng: d.longitude_disparition,
        label: d.lieu_disparition || d.ville_disparition || 'Dossier',
        type: d.niveau_urgence === 'critique' || d.niveau_urgence === 'urgent' ? 'missing' : 'sighting',
        data: { type: 'dossier', id: d.id } as Record<string, unknown>,
      });
    });

    // Marqueurs alertes
    filteredAlertes.forEach((a: any) => {
      markers.push({
        id: `ale-${a.id}`,
        lat: a.latitude_centre,
        lng: a.longitude_centre,
        label: a.titre || 'Alerte',
        type: 'alert',
        data: { type: 'alerte', id: a.id } as Record<string, unknown>,
      });
    });

    return markers;
  }, [filteredSignalements, filteredDossiers, filteredAlertes]);

  // Gérer le clic sur un marqueur
  const handleMarkerClick = (marker: MapTilerMarker) => {
    const data = marker.data as { type: string; id: string };

    if (data.type === 'signalement') {
      const sig = signalements.find(s => s.id === data.id);
      setSelectedItem(sig);
      setSelectedItemType('signalement');
    } else if (data.type === 'dossier') {
      const dos = dossiers.find((d: any) => d.id === data.id);
      setSelectedItem(dos);
      setSelectedItemType('dossier');
    } else if (data.type === 'alerte') {
      const ale = alertes.find((a: any) => a.id === data.id);
      setSelectedItem(ale);
      setSelectedItemType('alerte');
    }
  };

  // Badge de statut
  const getStatusBadge = (item: any, type: string) => {
    if (type === 'signalement') {
      const statut = item.statut_validation || item.etat;
      const badges: Record<string, { label: string; color: string }> = {
        en_attente: { label: t('authority.map.status.pending'), color: '#f59e0b' },
        nouveau: { label: t('authority.map.status.new'), color: '#38bdf8' },
        en_verification: { label: t('authority.map.status.inProgress'), color: '#8b5cf6' },
        valide: { label: t('authority.map.status.validated'), color: '#0284c7' },
        invalide: { label: t('authority.map.status.rejected'), color: '#ef4444' },
      };
      return badges[statut] || { label: statut, color: '#6b7280' };
    } else if (type === 'dossier') {
      const badges: Record<string, { label: string; color: string }> = {
        en_cours: { label: t('authority.map.status.ongoing'), color: '#38bdf8' },
        retrouve_vivant: { label: t('authority.map.status.foundAlive'), color: '#0284c7' },
        retrouve_decede: { label: t('authority.map.status.foundDeceased'), color: '#6b7280' },
        suspendu: { label: t('authority.map.status.suspended'), color: '#f59e0b' },
      };
      return badges[item.statut_dossier] || { label: item.statut_dossier, color: '#6b7280' };
    } else {
      return { label: t('authority.map.status.active'), color: '#ef4444' };
    }
  };

  // Statistiques
  const stats = useMemo(() => ({
    signalements: filteredSignalements.length,
    dossiers: filteredDossiers.length,
    alertes: filteredAlertes.length,
    total: filteredSignalements.length + filteredDossiers.length + filteredAlertes.length,
  }), [filteredSignalements, filteredDossiers, filteredAlertes]);

  // Rafraîchir les données
  const handleRefresh = () => {
    fetchSignalements();
    fetchDossiers();
    fetchAlertes();
  };

  // Centrer sur le premier élément
  useEffect(() => {
    if (mapMarkers.length > 0) {
      setMapCenter([mapMarkers[0].lat, mapMarkers[0].lng]);
    }
  }, [mapMarkers]);

  const content = (
    <div className={styles['map-view']}>
        {/* Header */}
        <section className={styles['map-view__header']}>
          <div className={styles['map-view__header-content']}>
            <h1 className={styles['map-view__title']}>
              <MapPin size={28} />
              {t('authority.map.title')}
            </h1>
            <p className={styles['map-view__subtitle']}>
              {t('authority.map.subtitle')}
            </p>
          </div>

          {/* Toolbar */}
          <div className={styles['map-view__toolbar']}>
            <div className={styles['map-view__view-toggle']}>
              <button
                className={`${styles['map-view__toggle-btn']} ${viewMode === 'map' ? styles['map-view__toggle-btn--active'] : ''}`}
                onClick={() => setViewMode('map')}
              >
                <Map size={18} />
                {t('authority.map.viewMap')}
              </button>
              <button
                className={`${styles['map-view__toggle-btn']} ${viewMode === 'list' ? styles['map-view__toggle-btn--active'] : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
                {t('authority.map.viewList')}
              </button>
            </div>
            <button
              className={styles['map-view__toolbar-btn']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              {t('authority.map.filters')}
            </button>
            <button
              className={styles['map-view__toolbar-btn']}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={20} className={isLoading ? styles['map-view__spinner'] : ''} />
            </button>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className={styles['map-view__filters']}>
              <div className={styles['map-view__filter-group']}>
                <label>{t('authority.map.filterLayer')}</label>
                <select
                  value={filters.layer}
                  onChange={(e) => setFilters(prev => ({ ...prev, layer: e.target.value as ViewLayer }))}
                >
                  <option value="all">{t('authority.map.layerAll')}</option>
                  <option value="signalements">{t('authority.map.layerSignalements')}</option>
                  <option value="dossiers">{t('authority.map.layerDossiers')}</option>
                  <option value="alertes">{t('authority.map.layerAlertes')}</option>
                </select>
              </div>

              <div className={styles['map-view__filter-group']}>
                <label>{t('authority.map.filterStatus')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">{t('authority.map.statusAll')}</option>
                  <option value="en_attente">{t('authority.map.statusPending')}</option>
                  <option value="en_verification">{t('authority.map.statusInProgress')}</option>
                  <option value="en_cours">{t('authority.map.statusOngoing')}</option>
                  <option value="valide">{t('authority.map.statusValidated')}</option>
                </select>
              </div>

              <div className={styles['map-view__filter-group']}>
                <label>{t('authority.map.filterPeriod')}</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                >
                  <option value="all">{t('authority.map.periodAll')}</option>
                  <option value="7days">{t('authority.map.period7days')}</option>
                  <option value="30days">{t('authority.map.period30days')}</option>
                  <option value="90days">{t('authority.map.period90days')}</option>
                </select>
              </div>

              <div className={styles['map-view__filter-group']}>
                <label>{t('authority.map.filterUrgency')}</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value as any }))}
                >
                  <option value="all">{t('authority.map.urgencyAll')}</option>
                  <option value="critique">{t('authority.map.urgencyCritical')}</option>
                  <option value="urgent">{t('authority.map.urgencyUrgent')}</option>
                  <option value="normal">{t('authority.map.urgencyNormal')}</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Stats */}
        <div className={styles['map-view__stats']}>
          <div className={styles['map-view__stat']}>
            <Layers size={20} />
            <span>{stats.total} {t('authority.map.totalItems')}</span>
          </div>
          <div className={styles['map-view__stat']}>
            <Users size={20} />
            <span>{stats.signalements} {t('authority.map.signalements')}</span>
          </div>
          <div className={styles['map-view__stat']}>
            <FolderOpen size={20} />
            <span>{stats.dossiers} {t('authority.map.dossiers')}</span>
          </div>
          <div className={styles['map-view__stat']}>
            <Bell size={20} />
            <span>{stats.alertes} {t('authority.map.alertes')}</span>
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
                  zoom={7}
                  height="600px"
                  showControls={true}
                  interactive={true}
                  onMarkerClick={handleMarkerClick}
                  className={styles['map-view__maptiler']}
                />

                {/* Panel latéral */}
                <div className={styles['map-view__markers-panel']}>
                  <h4>{t('authority.map.onMap')} ({mapMarkers.length})</h4>
                  <div className={styles['map-view__markers-list']}>
                    {mapMarkers.slice(0, 20).map((marker) => {
                      const data = marker.data as { type: string; id: string };
                      const typeIcon = data.type === 'signalement' ? <Users size={14} /> :
                                       data.type === 'dossier' ? <FolderOpen size={14} /> :
                                       <Bell size={14} />;

                      return (
                        <div
                          key={marker.id}
                          className={styles['map-view__marker-item']}
                          onClick={() => handleMarkerClick(marker)}
                        >
                          <div className={styles['map-view__marker-dot']}>
                            {typeIcon}
                          </div>
                          <div className={styles['map-view__marker-info']}>
                            <span className={styles['map-view__marker-location']}>
                              {marker.label}
                            </span>
                            <span className={styles['map-view__marker-coords']}>
                              {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {mapMarkers.length > 20 && (
                    <p className={styles['map-view__more-markers']}>
                      + {mapMarkers.length - 20} {t('authority.map.moreItems')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Vue Liste */
              <div className={styles['map-view__list']}>
                {mapMarkers.length > 0 ? (
                  mapMarkers.map((marker) => {
                    const data = marker.data as { type: string; id: string };
                    const item = data.type === 'signalement' 
                      ? signalements.find(s => s.id === data.id)
                      : data.type === 'dossier'
                        ? dossiers.find((d: any) => d.id === data.id)
                        : alertes.find((a: any) => a.id === data.id);

                    if (!item) return null;

                    const statusBadge = getStatusBadge(item, data.type);
                    const typeIcon = data.type === 'signalement' ? <Users size={20} /> :
                                     data.type === 'dossier' ? <FolderOpen size={20} /> :
                                     <Bell size={20} />;

                    return (
                      <div
                        key={marker.id}
                        className={styles['map-view__list-item']}
                        onClick={() => {
                          setSelectedItem(item);
                          setSelectedItemType(data.type as any);
                        }}
                      >
                        <div className={styles['map-view__list-marker']}>
                          {typeIcon}
                        </div>
                        <div className={styles['map-view__list-content']}>
                          <h4>{marker.label}</h4>
                          <div className={styles['map-view__list-meta']}>
                            <span>
                              <Clock size={14} />
                              {new Date(item.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                            </span>
                            <span>
                              <MapPin size={14} />
                              {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
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
                              const path = data.type === 'signalement' 
                                ? `/authority/signalements/${data.id}`
                                : data.type === 'dossier'
                                  ? `/authority/dossiers/${data.id}`
                                  : `/authority/alertes/${data.id}`;
                              navigate(path);
                            }}
                          >
                            <Eye size={16} />
                            {t('authority.map.view')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles['map-view__empty']}>
                    <MapPin size={48} />
                    <p>{t('authority.map.noItems')}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal détail */}
        {selectedItem && selectedItemType && (
          <div
            className={styles['map-view__modal']}
            onClick={() => {
              setSelectedItem(null);
              setSelectedItemType(null);
            }}
          >
            <div
              className={styles['map-view__modal-content']}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles['map-view__close-btn']}
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedItemType(null);
                }}
              >
                <X size={24} />
              </button>

              <div className={styles['map-view__modal-header']}>
                {selectedItemType === 'signalement' && <Users size={24} />}
                {selectedItemType === 'dossier' && <FolderOpen size={24} />}
                {selectedItemType === 'alerte' && <Bell size={24} />}
                <h3>
                  {selectedItemType === 'signalement' && (selectedItem.lieu_observation || t('authority.map.signalement'))}
                  {selectedItemType === 'dossier' && (selectedItem.numero_dossier || t('authority.map.dossier'))}
                  {selectedItemType === 'alerte' && (selectedItem.titre || t('authority.map.alerte'))}
                </h3>
              </div>

              <div className={styles['map-view__modal-body']}>
                <div className={styles['map-view__modal-grid']}>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('authority.map.labels.coordinates')}</label>
                    <span>
                      {selectedItemType === 'signalement' && 
                        `${(selectedItem.latitude_observation ?? selectedItem.latitude)?.toFixed(6)}, ${(selectedItem.longitude_observation ?? selectedItem.longitude)?.toFixed(6)}`
                      }
                      {selectedItemType === 'dossier' && 
                        `${selectedItem.latitude_disparition?.toFixed(6)}, ${selectedItem.longitude_disparition?.toFixed(6)}`
                      }
                      {selectedItemType === 'alerte' && 
                        `${selectedItem.latitude_centre?.toFixed(6)}, ${selectedItem.longitude_centre?.toFixed(6)}`
                      }
                    </span>
                  </div>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('authority.map.labels.date')}</label>
                    <span>
                      {new Date(
                        selectedItemType === 'signalement' ? selectedItem.date_observation :
                        selectedItemType === 'dossier' ? selectedItem.date_disparition :
                        selectedItem.date_diffusion || selectedItem.created_at
                      ).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                  <div className={styles['map-view__modal-row']}>
                    <label>{t('authority.map.labels.status')}</label>
                    <span
                      className={styles['map-view__modal-status']}
                      style={{ backgroundColor: getStatusBadge(selectedItem, selectedItemType).color }}
                    >
                      {getStatusBadge(selectedItem, selectedItemType).label}
                    </span>
                  </div>
                </div>

                {selectedItemType === 'signalement' && selectedItem.description && (
                  <div className={styles['map-view__modal-description']}>
                    <label>{t('authority.map.labels.description')}</label>
                    <p>{selectedItem.description}</p>
                  </div>
                )}

                {selectedItemType === 'dossier' && selectedItem.circonstances && (
                  <div className={styles['map-view__modal-description']}>
                    <label>{t('authority.map.labels.circumstances')}</label>
                    <p>{selectedItem.circonstances}</p>
                  </div>
                )}

                {selectedItemType === 'alerte' && selectedItem.message && (
                  <div className={styles['map-view__modal-description']}>
                    <label>{t('authority.map.labels.message')}</label>
                    <p>{selectedItem.message}</p>
                  </div>
                )}

                <button
                  className={styles['map-view__modal-action-btn']}
                  onClick={() => {
                    const path = selectedItemType === 'signalement' 
                      ? `/authority/signalements/${selectedItem.id}`
                      : selectedItemType === 'dossier'
                        ? `/authority/dossiers/${selectedItem.id}`
                        : `/authority/alertes/${selectedItem.id}`;
                    navigate(path);
                  }}
                >
                  <Eye size={18} />
                  {t('authority.map.viewDetails')}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default MapViewPage;
