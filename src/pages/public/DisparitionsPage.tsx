import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
} from 'lucide-react';
import styles from './DisparitionsPage.module.css';

interface Dossier {
  id: string;
  numero_dossier?: string;
  lieu_disparition?: string;
  ville_disparition?: string;
  region_disparition?: string;
  date_disparition: string;
  statut_dossier: 'en_cours' | 'retrouve_vivant' | 'retrouve_decede' | 'suspendu' | 'classe_sans_suite' | 'transfere';
  circonstances?: string;
  niveau_urgence?: string;
  // Champs de personne (optionnels si RLS bloque)
  personne?: {
    nom_complet?: string;
    photo_principale?: string;
    sexe?: string;
    age_estime_min?: number;
    age_estime_max?: number;
  } | null;
}

interface FilterState {
  status: string;
  location: string;
  searchTerm: string;
}

export const DisparitionsPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    location: '',
    searchTerm: '',
  });

  const itemsPerPage = 12;

  useEffect(() => {
    const nom = searchParams.get('nom')?.trim() || '';
    const location = searchParams.get('location')?.trim() || '';
    if (!nom && !location) return;
    setFilters((prev) => ({
      ...prev,
      searchTerm: nom || prev.searchTerm,
      location: location || prev.location,
    }));
  }, [searchParams]);

  const loadDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Essayer d'abord avec la jointure sur personne
      let query = supabase
        .from('dossier_disparition')
        .select(`
          id,
          numero_dossier,
          lieu_disparition,
          ville_disparition,
          region_disparition,
          date_disparition,
          statut_dossier,
          circonstances,
          niveau_urgence,
          personne:id_personne (
            nom_complet,
            photo_principale,
            sexe,
            age_estime_min,
            age_estime_max
          )
        `)
        .eq('visible_public', true);

      if (filters.status) {
        query = query.eq('statut_dossier', filters.status);
      }

      query = query.order('date_disparition', { ascending: false });

      let { data, error: err } = await query;

      // Si erreur RLS sur personne, essayer sans la jointure
      if (err && err.code === '42501') {
        console.warn('RLS error on personne table, fetching without join');
        let fallbackQuery = supabase
          .from('dossier_disparition')
          .select(`
            id,
            numero_dossier,
            lieu_disparition,
            ville_disparition,
            region_disparition,
            date_disparition,
            statut_dossier,
            circonstances,
            niveau_urgence
          `)
          .eq('visible_public', true);

        if (filters.status) {
          fallbackQuery = fallbackQuery.eq('statut_dossier', filters.status);
        }

        fallbackQuery = fallbackQuery.order('date_disparition', { ascending: false });

        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        err = fallbackResult.error;
      }

      if (err) throw err;

      if (data) {
        setDossiers(data as Dossier[]);
      }
    } catch (err) {
      console.error('Error loading dossiers:', err);
      setError(t('public.disparitions.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [filters.status, t]);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  // Filter locally by search term and location
  useEffect(() => {
    let result = dossiers;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.personne?.nom_complet?.toLowerCase().includes(term) ||
          d.circonstances?.toLowerCase().includes(term)
      );
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter(
        (d) =>
          d.lieu_disparition?.toLowerCase().includes(loc) ||
          d.ville_disparition?.toLowerCase().includes(loc) ||
          d.region_disparition?.toLowerCase().includes(loc)
      );
    }

    setFilteredDossiers(result);
    setCurrentPage(1);
  }, [dossiers, filters.searchTerm, filters.location]);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleViewDetails = (dossierId: string) => {
    navigate(`/disparitions/${dossierId}`);
  };

  // Pagination
  const totalPages = Math.ceil(filteredDossiers.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedDossiers = filteredDossiers.slice(startIdx, startIdx + itemsPerPage);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAgeDisplay = (dossier: Dossier) => {
    const min = dossier.personne?.age_estime_min;
    const max = dossier.personne?.age_estime_max;
    if (min && max && min !== max) {
      return `${min}-${max} ${language === 'fr' ? 'ans' : 'years'}`;
    }
    if (min) {
      return `${min} ${language === 'fr' ? 'ans' : 'years'}`;
    }
    return language === 'fr' ? 'Âge inconnu' : 'Unknown age';
  };

  return (
    <div className={styles.disparitionsPage}>
      <main className={styles.mainContent}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <h1>
              <Users size={32} />
              {t('public.disparitions.title')}
            </h1>
            <p>{t('public.disparitions.subtitle')}</p>
          </div>

          {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.searchBox}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t('public.home.search_placeholder')}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            <div className={styles.filterBox}>
              <MapPin size={18} />
              <input
                type="text"
                placeholder={t('public.home.location_placeholder')}
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className={styles.filterBox}>
              <Filter size={18} />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">{language === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
                <option value="en_cours">{t('public.status.active')}</option>
                <option value="retrouve_vivant">{t('public.status.resolved')}</option>
                <option value="classe_sans_suite">{t('public.status.closed')}</option>
              </select>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Results Info */}
          <div className={styles.resultsInfo}>
            <span>
              {filteredDossiers.length}{' '}
              {language === 'fr' ? 'résultats trouvés' : 'results found'}
            </span>
            {totalPages > 1 && (
              <span>
                {language === 'fr' ? 'Page' : 'Page'} {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>{t('public.map.loading')}</p>
            </div>
          ) : filteredDossiers.length === 0 ? (
            <div className={styles.noResults}>
              <Eye size={48} />
              <p>{t('public.map.no_results')}</p>
            </div>
          ) : (
            <>
              {/* Results Grid */}
              <div className={styles.resultsGrid}>
                {paginatedDossiers.map((dossier) => (
                  <div key={dossier.id} className={styles.resultCard}>
                    <div className={styles.cardPhoto}>
                      {dossier.personne?.photo_principale ? (
                        <img
                          src={dossier.personne.photo_principale}
                          alt={dossier.personne?.nom_complet || 'Photo'}
                        />
                      ) : (
                        <div className={styles.noPhoto}>
                          <User size={48} />
                        </div>
                      )}
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(dossier.statut_dossier) }}
                      >
                        {getStatusLabel(dossier.statut_dossier)}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <h3>
                        {dossier.personne?.nom_complet ||
                          (language === 'fr' ? 'Identité inconnue' : 'Unknown identity')}
                      </h3>

                      <div className={styles.cardInfo}>
                        <p>
                          <User size={14} />
                          {getAgeDisplay(dossier)}
                        </p>
                        <p>
                          <MapPin size={14} />
                          {dossier.lieu_disparition ||
                            dossier.ville_disparition ||
                            dossier.region_disparition ||
                            (language === 'fr' ? 'Lieu inconnu' : 'Unknown location')}
                        </p>
                        <p>
                          <Calendar size={14} />
                          {formatDate(dossier.date_disparition)}
                        </p>
                      </div>

                      <button
                        className={styles.detailBtn}
                        onClick={() => handleViewDetails(dossier.id)}
                      >
                        <Eye size={16} />
                        {t('public.map.view_details')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft size={18} />
                    {t('public.pagination.previous')}
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={currentPage === pageNum ? styles.activePage : ''}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    {t('public.pagination.next')}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>{t('public.footer.copyright').replace('{{year}}', String(new Date().getFullYear()))}</p>
        </div>
      </footer>
    </div>
  );
};

export default DisparitionsPage;
