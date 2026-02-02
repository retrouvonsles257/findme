import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { StatutDossier } from '../../@types/enums.types';
import styles from './SearchPage.module.css';

interface DossierSearchResult {
  id: string;
  nom_complet: string;
  age?: number | null;
  circonstances: string;
  date_disparition: string;
  localisation: string;
  photo_principale: string | null;
  statut_dossier: string;
}

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useI18n();

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

      let query: any = (supabase as any)
        .from('dossier_disparition')
        .select(`
          id,
          date_disparition,
          lieu_disparition,
          ville_disparition,
          region_disparition,
          pays_disparition,
          circonstances,
          statut_dossier,
          visible_public,
          personne:id_personne (
            nom,
            prenom,
            nom_complet,
            date_naissance,
            photo_principale
          )
        `)
        .eq('visible_public', true)
        .order('date_disparition', { ascending: false })
        .limit(500);

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.eq('statut_dossier', StatutDossier.EN_COURS);
        } else if (statusFilter === 'resolved') {
          query = query.in('statut_dossier', [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE]);
        } else if (statusFilter === 'closed') {
          query = query.in('statut_dossier', [StatutDossier.CLASSE_SANS_SUITE, StatutDossier.SUSPENDU, StatutDossier.TRANSFERE]);
        }
      }

      const { data, error: err } = await query;

      if (err) throw err;
      const mapped: DossierSearchResult[] = (data || []).map((d: any) => {
        const personne = d.personne || {};
        const nomComplet =
          personne.nom_complet ||
          `${personne.prenom || ''} ${personne.nom || ''}`.trim() ||
          '—';
        const localisation = [d.lieu_disparition, d.ville_disparition, d.region_disparition, d.pays_disparition]
          .filter(Boolean)
          .join(', ') || '—';
        const age = personne.date_naissance
          ? Math.max(0, Math.floor((Date.now() - new Date(personne.date_naissance).getTime()) / 31557600000))
          : null;
        return {
          id: d.id,
          nom_complet: nomComplet,
          age,
          circonstances: d.circonstances || '',
          date_disparition: d.date_disparition,
          localisation,
          photo_principale: personne.photo_principale || null,
          statut_dossier: d.statut_dossier,
        };
      });

      const term = searchTerm.trim().toLowerCase();
      const loc = locationFilter.trim().toLowerCase();
      const filtered = mapped.filter((r) => {
        const matchesTerm = term
          ? r.nom_complet.toLowerCase().includes(term) || r.circonstances.toLowerCase().includes(term)
          : true;
        const matchesLoc = loc ? r.localisation.toLowerCase().includes(loc) : true;
        return matchesTerm && matchesLoc;
      });

      setResults(filtered);
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
      case StatutDossier.EN_COURS:
        return { label: 'En cours', color: '#e74c3c' };
      case StatutDossier.RETROUVE_VIVANT:
      case StatutDossier.RETROUVE_DECEDE:
        return { label: 'Retrouvé(e)', color: '#27ae60' };
      case StatutDossier.CLASSE_SANS_SUITE:
      case StatutDossier.SUSPENDU:
      case StatutDossier.TRANSFERE:
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
                  const statusBadge = getStatusBadge(result.statut_dossier);
                  return (
                    <div key={result.id} className={styles.resultCard}>
                      {result.photo_principale && (
                        <div className={styles.photoContainer}>
                          <img src={result.photo_principale} alt={result.nom_complet} />
                        </div>
                      )}

                      <div className={styles.cardContent}>
                        <div className={styles.cardHeader}>
                          <h3>{result.nom_complet}</h3>
                          <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className={styles.cardInfo}>
                          <p>
                            <strong>Âge:</strong> {typeof result.age === 'number' ? `${result.age} ans` : '—'}
                          </p>
                          <p>
                            <strong>Localisation:</strong> {result.localisation}
                          </p>
                          <p>
                            <strong>Disparu(e) le:</strong>{' '}
                            {new Date(result.date_disparition).toLocaleDateString('fr-FR')}
                          </p>
                          {result.circonstances && (
                            <p>
                              <strong>Description:</strong>{' '}
                              {result.circonstances.length > 120
                                ? `${result.circonstances.substring(0, 120)}...`
                                : result.circonstances}
                            </p>
                          )}
                        </div>

                        <button
                          className={styles.detailBtn}
                          onClick={() => navigate(`/disparitions/${result.id}`)}
                        >
                          Voir les détails
                        </button>
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
