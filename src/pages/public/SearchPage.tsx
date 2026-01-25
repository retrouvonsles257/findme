import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import styles from './SearchPage.module.css';

interface DossierSearchResult {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  description: string;
  date_disparition: string;
  localisation: string;
  photo_url: string | null;
  statut: string;
  date_creation: string;
}

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useI18n();

  const [results, setResults] = useState<DossierSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('nom') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('dossiers').select('*');

      if (statusFilter !== 'all') {
        query = query.eq('statut', statusFilter);
      }

      if (searchTerm) {
        query = query.or(
          `nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
        );
      }

      if (locationFilter) {
        query = query.ilike('localisation', `%${locationFilter}%`);
      }

      const { data, error: err } = await (query.order('date_creation', {
        ascending: false,
      }) as any);

      if (err) throw err;
      setResults(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationFilter, statusFilter]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedResults = results.slice(startIdx, startIdx + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: '#e74c3c' };
      case 'resolved':
        return { label: 'Retrouvé(e)', color: '#27ae60' };
      case 'closed':
        return { label: 'Archivé', color: '#95a5a6' };
      default:
        return { label: 'Inconnu', color: '#999' };
    }
  };

  return (
    <div className={styles.searchPage}>
      <section className={styles.searchSection}>
        <div className={styles.container}>
          <h1>Rechercher une personne</h1>

          <div className={styles.filterBox}>
            <div className={styles.filterGroup}>
              <label>Nom ou Prénom</label>
              <input
                type="text"
                placeholder="Entrez un nom ou un prénom"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Région/Ville</label>
              <input
                type="text"
                placeholder="Où la personne a été vue"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Statut</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tous</option>
                <option value="active">En recherche active</option>
                <option value="resolved">Retrouvé(e)</option>
                <option value="closed">Archivé</option>
              </select>
            </div>

            <button className={styles.searchBtn} onClick={performSearch}>
              🔍 Rechercher
            </button>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Recherche en cours...</p>
            </div>
          ) : paginatedResults.length === 0 ? (
            <div className={styles.noResults}>
              <p>Aucun résultat trouvé. Veuillez affiner votre recherche.</p>
            </div>
          ) : (
            <>
              <div className={styles.resultsInfo}>
                <p>
                  {results.length} résultat(s) trouvé(s) - Page {currentPage} sur {totalPages}
                </p>
              </div>

              <div className={styles.resultsGrid}>
                {paginatedResults.map((result) => {
                  const statusBadge = getStatusBadge(result.statut);
                  return (
                    <div key={result.id} className={styles.resultCard}>
                      {result.photo_url && (
                        <div className={styles.photoContainer}>
                          <img src={result.photo_url} alt={`${result.nom} ${result.prenom}`} />
                        </div>
                      )}

                      <div className={styles.cardContent}>
                        <div className={styles.cardHeader}>
                          <h3>
                            {result.prenom} {result.nom}
                          </h3>
                          <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className={styles.cardInfo}>
                          <p>
                            <strong>Âge:</strong> {result.age} ans
                          </p>
                          <p>
                            <strong>Localisation:</strong> {result.localisation}
                          </p>
                          <p>
                            <strong>Disparu(e) le:</strong>{' '}
                            {new Date(result.date_disparition).toLocaleDateString('fr-FR')}
                          </p>
                          {result.description && (
                            <p>
                              <strong>Description:</strong> {result.description.substring(0, 100)}
                              ...
                            </p>
                          )}
                        </div>

                        <button className={styles.detailBtn}>Voir les détails</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    ← Précédent
                  </button>
                  <span>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
