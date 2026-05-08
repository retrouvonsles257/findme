import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import { MapTilerView, MapTilerMarker } from '../../components/maps/MapTilerView';
import {
  Search,
  Filter,
  X,
  MapPin,
  Eye,
  ChevronRight,
  Users,
  AlertTriangle,
} from 'lucide-react';
import styles from './MapPage.module.css';

interface Dossier {
  id: string;
  numero_dossier?: string;
  lieu_disparition?: string;
  ville_disparition?: string;
  statut_dossier: 'en_cours' | 'retrouve_vivant' | 'retrouve_decede' | 'suspendu' | 'classe_sans_suite' | 'transfere';
  latitude_disparition?: number;
  longitude_disparition?: number;
  personne?: {
    nom_complet?: string;
    photo_principale?: string;
  } | null;
}

export const MapPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Convert dossiers to map markers
  const markers: MapTilerMarker[] = filteredDossiers
    .filter((d) => d.latitude_disparition && d.longitude_disparition)
    .map((d) => ({
      id: d.id,
      lat: d.latitude_disparition!,
      lng: d.longitude_disparition!,
      label: d.personne?.nom_complet || d.numero_dossier || 'Dossier',
      type: d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede' ? 'sighting' : 'missing',
      image: d.personne?.photo_principale,
      data: d as unknown as Record<string, unknown>,
    }));

  const loadDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('dossier_disparition')
        .select(`
          id,
          numero_dossier,
          lieu_disparition,
          ville_disparition,
          statut_dossier,
          latitude_disparition,
          longitude_disparition,
          personne:id_personne (
            nom_complet,
            photo_principale
          )
        `)
        .eq('visible_public', true);

      if (statusFilter) {
        query = query.eq('statut_dossier', statusFilter);
      }

      query = query.order('created_at', { ascending: false });

      let { data, error: err } = await query;

      // Si erreur RLS sur personne, essayer sans la jointure
      if (err && err.code === '42501') {

        let fallbackQuery = supabase
          .from('dossier_disparition')
          .select(`
            id,
            numero_dossier,
            lieu_disparition,
            ville_disparition,
            statut_dossier,
            latitude_disparition,
            longitude_disparition
          `)
          .eq('visible_public', true);

        if (statusFilter) {
          fallbackQuery = fallbackQuery.eq('statut_dossier', statusFilter);
        }

        fallbackQuery = fallbackQuery.order('created_at', { ascending: false });

        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        err = fallbackResult.error;
      }

      if (err) throw err;

      if (data) {
        // Utiliser uniquement les dossiers avec des coordonnées réelles
        setDossiers(data);
        setFilteredDossiers(data);
      }
    } catch (err) {
      console.error('Error loading dossiers:', err);
      setError(t('public.map.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  // Filter by search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDossiers(dossiers);
    } else {
      const filtered = dossiers.filter((d) =>
        d.personne?.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.numero_dossier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.lieu_disparition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ville_disparition?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDossiers(filtered);
    }
  }, [searchTerm, dossiers]);

  const handleMarkerClick = (marker: MapTilerMarker) => {
    const dossier = dossiers.find((d) => d.id === marker.id);
    if (dossier) {
      setSelectedDossier(dossier);
    }
  };

  const handleViewDetails = (dossier: Dossier) => {
    navigate(`/disparitions/${dossier.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return '#ef4444';
      case 'retrouve_vivant':
        return '#10b981';
      case 'retrouve_decede':
        return '#6b7280';
      case 'suspendu':
      case 'classe_sans_suite':
      case 'transfere':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours':
        return t('public.status.active');
      case 'retrouve_vivant':
      case 'retrouve_decede':
        return t('public.status.resolved');
      case 'suspendu':
      case 'classe_sans_suite':
      case 'transfere':
        return t('public.status.closed');
      default:
        return status;
    }
  };

  return (
    <div className={styles.mapPage}>
      {/* Main Content - Layout: Filtres | Carte | Résultats */}
      <div className={styles.mainContent}>
        {/* Panneau de filtres (gauche) */}
        <aside className={styles.filtersPanel}>
          <div className={styles.filtersPanelHeader}>
            <h2>
              <Filter size={20} />
              {t('public.map.filters')}
            </h2>
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('public.home.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className={styles.filterBox}>
            <label>
              <Filter size={16} />
              {t('public.map.status_filter')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{language === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
              <option value="en_cours">{t('public.status.active')}</option>
              <option value="résolu">{t('public.status.resolved')}</option>
              <option value="classé">{t('public.status.closed')}</option>
            </select>
          </div>

          {/* Stats */}
          <div className={styles.statsBox}>
            <div className={styles.statItem}>
              <Users size={18} />
              <span>{filteredDossiers.length}</span>
              <small>{t('public.home.total_cases')}</small>
            </div>
            <div className={styles.statItem}>
              <AlertTriangle size={18} />
              <span>{filteredDossiers.filter(d => d.statut_dossier === 'en_cours').length}</span>
              <small>{t('public.status.active')}</small>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </aside>

        {/* Carte (centre) */}
        <div className={styles.mapContainer}>
          <div className={styles.mapWrapper}>
            <MapTilerView
              markers={markers}
              center={[3.848, 11.5021]}
              zoom={6}
              height="100%"
              onMarkerClick={handleMarkerClick}
              showControls={true}
            />
          </div>

          {/* Toggle Sidebar Button (mobile) */}
          <button
            className={styles.toggleSidebar}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Users size={20} />}
          </button>
        </div>

        {/* Panneau de résultats (droite) */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>
              <MapPin size={20} />
              {t('public.map.results')} ({filteredDossiers.length})
            </h2>
            <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Dossiers List */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>{t('public.map.loading')}</p>
            </div>
          ) : (
            <div className={styles.dossiersList}>
              {filteredDossiers.map((dossier) => (
                <div
                  key={dossier.id}
                  className={`${styles.dossierItem} ${selectedDossier?.id === dossier.id ? styles.selected : ''}`}
                  onClick={() => setSelectedDossier(dossier)}
                >
                  <div className={styles.dossierPhoto}>
                    {dossier.personne?.photo_principale ? (
                      <img src={dossier.personne.photo_principale} alt={dossier.personne?.nom_complet || dossier.numero_dossier || 'Photo'} />
                    ) : (
                      <Users size={24} />
                    )}
                  </div>
                  <div className={styles.dossierInfo}>
                    <h4>{dossier.personne?.nom_complet || dossier.numero_dossier || (language === 'fr' ? 'Inconnu' : 'Unknown')}</h4>
                    <p>
                      <MapPin size={14} />
                      {dossier.lieu_disparition || dossier.ville_disparition || (language === 'fr' ? 'Non spécifié' : 'Not specified')}
                    </p>
                  </div>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(dossier.statut_dossier) }}
                  >
                    {getStatusLabel(dossier.statut_dossier)}
                  </span>
                </div>
              ))}

              {filteredDossiers.length === 0 && (
                <div className={styles.noResults}>
                  <Eye size={32} />
                  <p>{t('public.map.no_results')}</p>
                </div>
              )}
            </div>
          )}

          {/* Selected Dossier Details */}
          {selectedDossier && (
            <div className={styles.detailsBox}>
              <div className={styles.detailsHeader}>
                <h3>{selectedDossier.personne?.nom_complet || selectedDossier.numero_dossier || (language === 'fr' ? 'Inconnu' : 'Unknown')}</h3>
                <button onClick={() => setSelectedDossier(null)}>
                  <X size={18} />
                </button>
              </div>
              {selectedDossier.personne?.photo_principale && (
                <img
                  src={selectedDossier.personne.photo_principale}
                  alt={selectedDossier.personne?.nom_complet || selectedDossier.numero_dossier || 'Photo'}
                  className={styles.detailsPhoto}
                />
              )}
              <p className={styles.detailsLocation}>
                <MapPin size={16} />
                {selectedDossier.lieu_disparition || selectedDossier.ville_disparition || (language === 'fr' ? 'Non spécifié' : 'Not specified')}
              </p>
              <button
                className={styles.viewBtn}
                onClick={() => handleViewDetails(selectedDossier)}
              >
                {t('public.map.view_details')}
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MapPage;
