/**
 * =====================================================
 * RETROUVONSLES - Super Admin Résultats IA Page
 * Affichage des résultats d'analyse IA
 * Connecté à Supabase table: resultat_ia
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Brain, User, Calendar, Filter, Loader2, AlertCircle, 
  Eye, ChevronLeft, ChevronRight, CheckCircle, Percent
} from 'lucide-react';
import styles from './ResultatsIAPage.module.css';

interface ResultatIA {
  id: string;
  id_dossier?: string;
  id_signalement?: string;
  type_analyse: string;
  resultat: Record<string, any>;
  score_confiance?: number;
  statut_validation?: string;
  id_validateur?: string;
  date_validation?: string;
  date_analyse: string;
  dossier?: { titre: string; nom_personne: string };
  validateur?: { nom: string };
}

const ITEMS_PER_PAGE = 15;

export const SuperAdminResultatsIAPage: React.FC = () => {
  useI18n(); // For future i18n support

  const [resultats, setResultats] = useState<ResultatIA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0, avgScore: 0 });
  
  // Filtres
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');

  // Modal view
  const [selectedResultat, setSelectedResultat] = useState<ResultatIA | null>(null);

  const loadResultats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stats globales
      const [totalResult, validatedResult, pendingResult, scoresResult] = await Promise.all([
        (supabase as any).from('resultat_ia').select('id', { count: 'exact', head: true }),
        (supabase as any).from('resultat_ia').select('id', { count: 'exact', head: true }).eq('statut_validation', 'valide'),
        (supabase as any).from('resultat_ia').select('id', { count: 'exact', head: true }).eq('statut_validation', 'en_attente'),
        (supabase as any).from('resultat_ia').select('score_confiance'),
      ]);

      const scores = scoresResult.data || [];
      const validScores = scores.filter((s: any) => s.score_confiance != null);
      const avgScore = validScores.length > 0 
        ? validScores.reduce((sum: number, s: any) => sum + s.score_confiance, 0) / validScores.length 
        : 0;

      setStats({
        total: totalResult.count || 0,
        validated: validatedResult.count || 0,
        pending: pendingResult.count || 0,
        avgScore: Math.round(avgScore * 100),
      });

      // Compter avec filtres
      let countQuery = (supabase as any).from('resultat_ia').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_analyse', filterType);
      if (filterStatut) countQuery = countQuery.eq('statut_validation', filterStatut);
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les résultats avec pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('resultat_ia')
        .select('*')
        .order('date_analyse', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_analyse', filterType);
      if (filterStatut) query = query.eq('statut_validation', filterStatut);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec dossier et validateur
      const enrichedResultats = await Promise.all(
        (data || []).map(async (resultat: ResultatIA) => {
          let dossier, validateur;
          if (resultat.id_dossier) {
            const { data: d } = await (supabase as any)
              .from('dossier_disparition')
              .select('titre, nom_personne')
              .eq('id', resultat.id_dossier)
              .single();
            dossier = d;
          }
          if (resultat.id_validateur) {
            const { data: v } = await (supabase as any)
              .from('utilisateur')
              .select('nom')
              .eq('id', resultat.id_validateur)
              .single();
            validateur = v;
          }
          return { ...resultat, dossier, validateur };
        })
      );

      setResultats(enrichedResultats);
    } catch (err: any) {
      console.error('Erreur chargement résultats IA:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterStatut]);

  useEffect(() => {
    loadResultats();
  }, [loadResultats]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reconnaissance_faciale: 'Reconnaissance faciale',
      comparaison_photos: 'Comparaison photos',
      analyse_signalement: 'Analyse signalement',
      detection_anomalie: 'Détection anomalie',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      valide: 'Validé',
      rejete: 'Rejeté',
    };
    return labels[statut] || statut || 'En attente';
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      valide: 'success',
      rejete: 'danger',
    };
    return colors[statut] || 'warning';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  };

  return (
    <SuperAdminLayout title="Résultats IA" activeNav="resultats-ia">
      <div className={styles['sa-resultats-ia']}>
        {/* Stats Cards */}
        <div className={styles['sa-resultats-ia__stats']}>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <Brain size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.total}</span>
              <span className={styles['sa-resultats-ia__stat-label']}>Total analyses</span>
            </div>
          </div>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.validated}</span>
              <span className={styles['sa-resultats-ia__stat-label']}>Validées</span>
            </div>
          </div>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <AlertCircle size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.pending}</span>
              <span className={styles['sa-resultats-ia__stat-label']}>En attente</span>
            </div>
          </div>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <Percent size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.avgScore}%</span>
              <span className={styles['sa-resultats-ia__stat-label']}>Score moyen</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-resultats-ia__filters']}>
          <div className={styles['sa-resultats-ia__filter-group']}>
            <Filter size={16} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous types</option>
              <option value="reconnaissance_faciale">Reconnaissance faciale</option>
              <option value="comparaison_photos">Comparaison photos</option>
              <option value="analyse_signalement">Analyse signalement</option>
              <option value="detection_anomalie">Détection anomalie</option>
            </select>
          </div>
          <div className={styles['sa-resultats-ia__filter-group']}>
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous statuts</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="rejete">Rejeté</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-resultats-ia__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-resultats-ia__loading']}>
            <Loader2 size={32} className={styles['sa-resultats-ia__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-resultats-ia__table-wrapper']}>
            {resultats.length === 0 ? (
              <div className={styles['sa-resultats-ia__empty']}>
                <Brain size={48} />
                <p>Aucun résultat d'analyse IA</p>
              </div>
            ) : (
              <table className={styles['sa-resultats-ia__table']}>
                <thead>
                  <tr>
                    <th><Calendar size={16} /> Date</th>
                    <th><Brain size={16} /> Type</th>
                    <th><User size={16} /> Dossier</th>
                    <th>Score</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((resultat) => (
                    <tr key={resultat.id}>
                      <td>{new Date(resultat.date_analyse).toLocaleDateString('fr-FR')}</td>
                      <td>{getTypeLabel(resultat.type_analyse)}</td>
                      <td>{resultat.dossier?.nom_personne || '-'}</td>
                      <td>
                        {resultat.score_confiance != null ? (
                          <span className={`${styles['sa-resultats-ia__score']} ${styles[`sa-resultats-ia__score--${getScoreColor(resultat.score_confiance)}`]}`}>
                            {Math.round(resultat.score_confiance * 100)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`${styles['sa-resultats-ia__badge']} ${styles[`sa-resultats-ia__badge--${getStatutColor(resultat.statut_validation || 'en_attente')}`]}`}>
                          {getStatutLabel(resultat.statut_validation || 'en_attente')}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setSelectedResultat(resultat)} className={styles['sa-resultats-ia__btn-view']}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles['sa-resultats-ia__pagination']}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal View */}
        {selectedResultat && (
          <div className={styles['sa-resultats-ia__modal-overlay']} onClick={() => setSelectedResultat(null)}>
            <div className={styles['sa-resultats-ia__modal']} onClick={(e) => e.stopPropagation()}>
              <h2>Détails de l'analyse IA</h2>
              <div className={styles['sa-resultats-ia__details']}>
                <p><strong>Type:</strong> {getTypeLabel(selectedResultat.type_analyse)}</p>
                <p><strong>Date:</strong> {new Date(selectedResultat.date_analyse).toLocaleString('fr-FR')}</p>
                <p><strong>Score confiance:</strong> {selectedResultat.score_confiance != null ? `${Math.round(selectedResultat.score_confiance * 100)}%` : '-'}</p>
                <p><strong>Statut:</strong> {getStatutLabel(selectedResultat.statut_validation || 'en_attente')}</p>
                {selectedResultat.dossier && (
                  <p><strong>Dossier:</strong> {selectedResultat.dossier.nom_personne} - {selectedResultat.dossier.titre}</p>
                )}
                {selectedResultat.validateur && (
                  <p><strong>Validé par:</strong> {selectedResultat.validateur.nom}</p>
                )}
                {selectedResultat.date_validation && (
                  <p><strong>Date validation:</strong> {new Date(selectedResultat.date_validation).toLocaleDateString('fr-FR')}</p>
                )}
                <div className={styles['sa-resultats-ia__json']}>
                  <strong>Résultat:</strong>
                  <pre>{JSON.stringify(selectedResultat.resultat, null, 2)}</pre>
                </div>
              </div>
              <button onClick={() => setSelectedResultat(null)}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminResultatsIAPage;
