/**
 * =====================================================
 * RETROUVONSLES - IA Results Page (Moderator)
 * Consultation des résultats d'analyse IA
 * Le modérateur peut voir les résultats mais ne peut pas valider
 * (validation réservée aux officiers niveau 4+)
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { ModerationLayout } from './ModerationLayout';
import { supabase } from '../../config';
import {
  Brain,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent,
  MapPin,
  User,
  Image,
  Activity,
  TrendingUp,
  BarChart3,
  Flag,
  Columns,
  XCircle,
} from 'lucide-react';
import styles from './IAResultsPage.module.css';

// Helper to bypass Supabase typing issues
const db = () => supabase as any;

// Types basés sur le modèle de données
interface ResultatIA {
  id: string;
  type_analyse: 'reconnaissance_faciale' | 'comparaison_photos' | 'prediction_localisation' | 
                'detection_similitudes' | 'analyse_biometrique' | 'regroupement_cas' |
                'estimation_age' | 'analyse_vetements' | 'detection_objets' | 'autre';
  score_confiance: number;
  seuil_decision: number;
  donnees_brutes: any;
  donnees_interpretees: any;
  correspondances_trouvees: any;
  zones_predites: any;
  facteurs_cles: any;
  modele_ia_utilise: string;
  version_algorithme: string;
  temps_traitement_ms: number;
  statut_validation: 'en_attente' | 'confirme' | 'infirme' | 'incertain' | 'necessite_verification';
  valide_par?: string;
  date_validation?: string;
  commentaire_validation?: string;
  action_generee?: string;
  faux_positif?: boolean;
  date_analyse: string;
  id_photo?: string;
  id_dossier?: string;
  id_signalement?: string;
  // Relations
  dossier?: any;
  signalement?: any;
  photo?: any;
}

interface IAFilters {
  type: 'all' | ResultatIA['type_analyse'];
  status: 'all' | ResultatIA['statut_validation'];
  minScore: number;
  dateRange: 'all' | '7days' | '30days' | '90days';
  search: string;
}

export const IAResultsPage: React.FC = () => {
  const currentUser = useAppSelector(selectUser);

  // State
  const [results, setResults] = useState<ResultatIA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<IAFilters>({
    type: 'all',
    status: 'all',
    minScore: 0,
    dateRange: 'all',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultatIA | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    confirmes: 0,
    scoresMoyen: 0,
  });
  const pageSize = 15;
  
  // État pour la comparaison côte à côte
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPhotos, setComparisonPhotos] = useState<{ left: string | null; right: string | null }>({
    left: null,
    right: null,
  });
  
  // État pour le signalement de faux positif
  const [showFalsePositiveForm, setShowFalsePositiveForm] = useState(false);
  const [falsePositiveReason, setFalsePositiveReason] = useState('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState<string | null>(null);

  // Charger les résultats IA
  const loadResults = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('resultat_ia')
        .select(`
          *,
          dossier:id_dossier(id, numero_dossier, statut_dossier),
          signalement:id_signalement(id, lieu_observation, description),
          photo:id_photo(id, url_cloudinary, url_thumbnail)
        `, { count: 'exact' })
        .order('date_analyse', { ascending: false });

      // Filtres
      if (filters.type !== 'all') {
        query = query.eq('type_analyse', filters.type);
      }

      if (filters.status !== 'all') {
        query = query.eq('statut_validation', filters.status);
      }

      if (filters.minScore > 0) {
        query = query.gte('score_confiance', filters.minScore);
      }

      if (filters.dateRange !== 'all') {
        const now = new Date();
        const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        query = query.gte('date_analyse', cutoff.toISOString());
      }

      // Pagination
      const start = (currentPage - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      setResults(data || []);
      setTotalResults(count || 0);

      // Calculer les stats
      await loadStats();
    } catch (err) {
      console.error('Error loading IA results:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const { data, error } = await db()
        .from('resultat_ia')
        .select('statut_validation, score_confiance');

      if (!error && data) {
        const total = data.length;
        const enAttente = data.filter((r: any) => r.statut_validation === 'en_attente').length;
        const confirmes = data.filter((r: any) => r.statut_validation === 'confirme').length;
        const scoresMoyen = total > 0
          ? data.reduce((sum: number, r: any) => sum + (r.score_confiance || 0), 0) / total
          : 0;

        setStats({
          total,
          enAttente,
          confirmes,
          scoresMoyen: Math.round(scoresMoyen),
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Charger les photos pour la comparaison côte à côte
  const loadComparisonPhotos = useCallback(async (result: ResultatIA) => {
    if (result.type_analyse !== 'comparaison_photos' && result.type_analyse !== 'reconnaissance_faciale') {
      return;
    }

    try {
      // Charger la photo analysée
      const leftPhoto = result.photo?.url_cloudinary || null;
      
      // Chercher la photo de référence dans les correspondances
      let rightPhoto = null;
      if (result.correspondances_trouvees) {
        const correspondances = typeof result.correspondances_trouvees === 'string' 
          ? JSON.parse(result.correspondances_trouvees) 
          : result.correspondances_trouvees;
        
        if (correspondances.photo_reference_url) {
          rightPhoto = correspondances.photo_reference_url;
        } else if (correspondances.id_photo_reference) {
          const { data } = await db()
            .from('photo')
            .select('url_cloudinary')
            .eq('id', correspondances.id_photo_reference)
            .single();
          
          if (data) {
            rightPhoto = data.url_cloudinary;
          }
        }
      }

      // Si pas de correspondance explicite, chercher dans le dossier associé
      if (!rightPhoto && result.id_dossier) {
        // Schéma: dossier_disparition -> id_personne ; photo est liée à id_personne (pas id_dossier)
        const { data: dossier } = await db()
          .from('dossier_disparition')
          .select('id_personne')
          .eq('id', result.id_dossier)
          .single();

        const personneId = dossier?.id_personne as string | undefined;
        if (personneId) {
          const { data } = await db()
            .from('photo')
            .select('url_cloudinary')
            .eq('id_personne', personneId)
            .eq('type_photo', 'portrait')
            .eq('approuvee', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (data) {
            rightPhoto = data.url_cloudinary;
          }
        }
      }

      setComparisonPhotos({ left: leftPhoto, right: rightPhoto });
    } catch (err) {
      console.error('Error loading comparison photos:', err);
    }
  }, []);

  // Signaler un faux positif évident
  const reportFalsePositive = async () => {
    if (!selectedResult || !currentUser?.id || !falsePositiveReason.trim()) return;
    
    setIsSubmittingFlag(true);
    try {
      // Mettre à jour le résultat IA avec le flag faux_positif
      const { error: updateError } = await db()
        .from('resultat_ia')
        .update({
          faux_positif: true,
          statut_validation: 'necessite_verification',
        })
        .eq('id', selectedResult.id);

      if (updateError) throw updateError;

      // Enregistrer dans le journal d'activité
      await db().from('journal_activite').insert({
        type_action: 'alerte_ia',
        action_detaillee: 'Signalement de faux positif IA par modérateur',
        description: `Résultat IA ${selectedResult.id} signalé comme faux positif. Raison: ${falsePositiveReason}. Type: ${selectedResult.type_analyse}, Score: ${selectedResult.score_confiance}%`,
        id_utilisateur: currentUser.id,
        id_signalement: selectedResult.id_signalement,
      });

      setFlagSuccess('Faux positif signalé avec succès. Un officier examinera ce résultat.');
      setShowFalsePositiveForm(false);
      setFalsePositiveReason('');
      
      // Rafraîchir la liste
      setTimeout(() => {
        loadResults();
        setFlagSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error reporting false positive:', err);
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  // Ouvrir le modal avec chargement des photos de comparaison
  const openResultModal = (result: ResultatIA) => {
    setSelectedResult(result);
    setShowComparison(false);
    setShowFalsePositiveForm(false);
    setFalsePositiveReason('');
    setFlagSuccess(null);
    
    // Charger les photos pour la comparaison si applicable
    if (result.type_analyse === 'comparaison_photos' || result.type_analyse === 'reconnaissance_faciale') {
      loadComparisonPhotos(result);
    }
  };

  // Labels et couleurs pour les types d'analyse
  const getTypeAnalyseInfo = (type: string) => {
    const info: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      reconnaissance_faciale: { label: 'Reconnaissance faciale', color: '#3b82f6', icon: <User size={16} /> },
      comparaison_photos: { label: 'Comparaison photos', color: '#8b5cf6', icon: <Image size={16} /> },
      prediction_localisation: { label: 'Prédiction localisation', color: '#10b981', icon: <MapPin size={16} /> },
      detection_similitudes: { label: 'Détection similitudes', color: '#f59e0b', icon: <Activity size={16} /> },
      analyse_biometrique: { label: 'Analyse biométrique', color: '#ec4899', icon: <User size={16} /> },
      regroupement_cas: { label: 'Regroupement cas', color: '#06b6d4', icon: <BarChart3 size={16} /> },
      estimation_age: { label: 'Estimation âge', color: '#84cc16', icon: <TrendingUp size={16} /> },
      analyse_vetements: { label: 'Analyse vêtements', color: '#f97316', icon: <Eye size={16} /> },
      detection_objets: { label: 'Détection objets', color: '#6366f1', icon: <Search size={16} /> },
      autre: { label: 'Autre', color: '#6b7280', icon: <Brain size={16} /> },
    };
    return info[type] || info.autre;
  };

  // Labels pour les statuts
  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string }> = {
      en_attente: { label: 'En attente', color: '#f59e0b' },
      confirme: { label: 'Confirmé', color: '#10b981' },
      infirme: { label: 'Infirmé', color: '#ef4444' },
      incertain: { label: 'Incertain', color: '#6b7280' },
      necessite_verification: { label: 'À vérifier', color: '#8b5cf6' },
    };
    return info[status] || { label: status, color: '#6b7280' };
  };

  // Couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <ModerationLayout title="Résultats IA" activeNav="ia">
      <div className={styles['ia-results']}>
        {/* Header */}
        <section className={styles['ia-results__header']}>
          <div className={styles['ia-results__header-content']}>
            <h1 className={styles['ia-results__title']}>
              <Brain size={28} />
              Résultats d'Analyse IA
            </h1>
            <p className={styles['ia-results__subtitle']}>
              Consultez les correspondances et analyses effectuées par l'intelligence artificielle.
              <br />
              <em>Note : La validation des résultats est réservée aux autorités (niveau 4+).</em>
            </p>
          </div>

          {/* Toolbar */}
          <div className={styles['ia-results__toolbar']}>
            <div className={styles['ia-results__search-wrapper']}>
              <Search size={20} className={styles['ia-results__search-icon']} />
              <input
                type="text"
                placeholder="Rechercher par dossier, signalement..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={styles['ia-results__search-input']}
              />
            </div>
            <button
              className={styles['ia-results__toolbar-btn']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              Filtres
            </button>
            <button
              className={styles['ia-results__toolbar-btn']}
              onClick={loadResults}
            >
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className={styles['ia-results__filters']}>
              <div className={styles['ia-results__filter-group']}>
                <label>Type d'analyse</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="all">Tous</option>
                  <option value="reconnaissance_faciale">Reconnaissance faciale</option>
                  <option value="comparaison_photos">Comparaison photos</option>
                  <option value="prediction_localisation">Prédiction localisation</option>
                  <option value="detection_similitudes">Détection similitudes</option>
                  <option value="analyse_biometrique">Analyse biométrique</option>
                  <option value="regroupement_cas">Regroupement cas</option>
                  <option value="estimation_age">Estimation âge</option>
                </select>
              </div>

              <div className={styles['ia-results__filter-group']}>
                <label>Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">Tous</option>
                  <option value="en_attente">En attente</option>
                  <option value="confirme">Confirmés</option>
                  <option value="infirme">Infirmés</option>
                  <option value="incertain">Incertains</option>
                  <option value="necessite_verification">À vérifier</option>
                </select>
              </div>

              <div className={styles['ia-results__filter-group']}>
                <label>Score minimum</label>
                <select
                  value={filters.minScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                >
                  <option value="0">Tous</option>
                  <option value="50">&ge; 50%</option>
                  <option value="70">&ge; 70%</option>
                  <option value="85">&ge; 85%</option>
                </select>
              </div>

              <div className={styles['ia-results__filter-group']}>
                <label>Période</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                >
                  <option value="all">Toutes</option>
                  <option value="7days">7 derniers jours</option>
                  <option value="30days">30 derniers jours</option>
                  <option value="90days">90 derniers jours</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Stats */}
        <div className={styles['ia-results__stats']}>
          <div className={styles['ia-results__stat']}>
            <Brain size={24} />
            <div>
              <span className={styles['ia-results__stat-value']}>{stats.total}</span>
              <span className={styles['ia-results__stat-label']}>Total analyses</span>
            </div>
          </div>
          <div className={styles['ia-results__stat']}>
            <Clock size={24} />
            <div>
              <span className={styles['ia-results__stat-value']}>{stats.enAttente}</span>
              <span className={styles['ia-results__stat-label']}>En attente</span>
            </div>
          </div>
          <div className={styles['ia-results__stat']}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['ia-results__stat-value']}>{stats.confirmes}</span>
              <span className={styles['ia-results__stat-label']}>Confirmés</span>
            </div>
          </div>
          <div className={styles['ia-results__stat']}>
            <Percent size={24} />
            <div>
              <span className={styles['ia-results__stat-value']}>{stats.scoresMoyen}%</span>
              <span className={styles['ia-results__stat-label']}>Score moyen</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles['ia-results__loading']}>
            <RefreshCw size={32} className={styles['ia-results__spinner']} />
            Chargement des résultats...
          </div>
        ) : (
          <>
            {/* Liste des résultats */}
            <div className={styles['ia-results__list']}>
              {results.length > 0 ? (
                results.map((result) => {
                  const typeInfo = getTypeAnalyseInfo(result.type_analyse);
                  const statusInfo = getStatusInfo(result.statut_validation);

                  return (
                    <div
                      key={result.id}
                      className={styles['ia-results__item']}
                      onClick={() => openResultModal(result)}
                    >
                      <div className={styles['ia-results__item-header']}>
                        <div className={styles['ia-results__item-type']} style={{ color: typeInfo.color }}>
                          {typeInfo.icon}
                          <span>{typeInfo.label}</span>
                        </div>
                        <span
                          className={styles['ia-results__item-status']}
                          style={{ backgroundColor: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className={styles['ia-results__item-body']}>
                        {/* Score */}
                        <div className={styles['ia-results__score']}>
                          <div
                            className={styles['ia-results__score-circle']}
                            style={{ borderColor: getScoreColor(result.score_confiance) }}
                          >
                            <span style={{ color: getScoreColor(result.score_confiance) }}>
                              {Math.round(result.score_confiance)}%
                            </span>
                          </div>
                          <span className={styles['ia-results__score-label']}>Confiance</span>
                        </div>

                        {/* Info */}
                        <div className={styles['ia-results__item-info']}>
                          {result.dossier && (
                            <p className={styles['ia-results__item-dossier']}>
                              <strong>Dossier:</strong> {result.dossier.numero_dossier}
                            </p>
                          )}
                          {result.signalement && (
                            <p className={styles['ia-results__item-signalement']}>
                              <MapPin size={14} />
                              {result.signalement.lieu_observation}
                            </p>
                          )}
                          <p className={styles['ia-results__item-date']}>
                            <Clock size={14} />
                            {new Date(result.date_analyse).toLocaleString('fr-FR')}
                          </p>
                          {result.modele_ia_utilise && (
                            <p className={styles['ia-results__item-model']}>
                              <Brain size={14} />
                              {result.modele_ia_utilise}
                            </p>
                          )}
                        </div>

                        {/* Photo miniature */}
                        {result.photo?.url_thumbnail && (
                          <div className={styles['ia-results__item-thumbnail']}>
                            <img src={result.photo.url_thumbnail} alt="Analyse" />
                          </div>
                        )}
                      </div>

                      <button className={styles['ia-results__item-view-btn']}>
                        <Eye size={18} />
                        Voir détails
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className={styles['ia-results__empty']}>
                  <Brain size={48} />
                  <p>Aucun résultat d'analyse IA trouvé</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles['ia-results__pagination']}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={20} />
                  Précédent
                </button>
                <span>Page {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Suivant
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal détails */}
        {selectedResult && (
          <div
            className={styles['ia-results__modal']}
            onClick={() => setSelectedResult(null)}
          >
            <div
              className={styles['ia-results__modal-content']}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles['ia-results__close-btn']}
                onClick={() => setSelectedResult(null)}
              >
                <X size={24} />
              </button>

              <div className={styles['ia-results__modal-header']}>
                <div className={styles['ia-results__modal-type']}>
                  {getTypeAnalyseInfo(selectedResult.type_analyse).icon}
                  <h3>{getTypeAnalyseInfo(selectedResult.type_analyse).label}</h3>
                </div>
                <span
                  className={styles['ia-results__modal-status']}
                  style={{ backgroundColor: getStatusInfo(selectedResult.statut_validation).color }}
                >
                  {getStatusInfo(selectedResult.statut_validation).label}
                </span>
              </div>

              <div className={styles['ia-results__modal-body']}>
                {/* Score principal */}
                <div className={styles['ia-results__modal-score-section']}>
                  <div
                    className={styles['ia-results__modal-score']}
                    style={{ borderColor: getScoreColor(selectedResult.score_confiance) }}
                  >
                    <span className={styles['ia-results__modal-score-value']}>
                      {Math.round(selectedResult.score_confiance)}%
                    </span>
                    <span className={styles['ia-results__modal-score-label']}>Score de confiance</span>
                  </div>
                  <p className={styles['ia-results__modal-threshold']}>
                    Seuil de décision: {selectedResult.seuil_decision}%
                  </p>
                </div>

                {/* Informations */}
                <div className={styles['ia-results__modal-info']}>
                  <h4>Informations</h4>
                  <div className={styles['ia-results__modal-grid']}>
                    <div className={styles['ia-results__modal-row']}>
                      <label>Date d'analyse</label>
                      <span>{new Date(selectedResult.date_analyse).toLocaleString('fr-FR')}</span>
                    </div>
                    {selectedResult.modele_ia_utilise && (
                      <div className={styles['ia-results__modal-row']}>
                        <label>Modèle IA</label>
                        <span>{selectedResult.modele_ia_utilise}</span>
                      </div>
                    )}
                    {selectedResult.version_algorithme && (
                      <div className={styles['ia-results__modal-row']}>
                        <label>Version</label>
                        <span>{selectedResult.version_algorithme}</span>
                      </div>
                    )}
                    {selectedResult.temps_traitement_ms && (
                      <div className={styles['ia-results__modal-row']}>
                        <label>Temps de traitement</label>
                        <span>{selectedResult.temps_traitement_ms}ms</span>
                      </div>
                    )}
                    {selectedResult.dossier && (
                      <div className={styles['ia-results__modal-row']}>
                        <label>Dossier</label>
                        <span>{selectedResult.dossier.numero_dossier}</span>
                      </div>
                    )}
                    {selectedResult.signalement && (
                      <div className={styles['ia-results__modal-row']}>
                        <label>Signalement</label>
                        <span>{selectedResult.signalement.lieu_observation}</span>
                      </div>
                    )}
                    {selectedResult.action_generee && (
                      <div className={styles['ia-results__modal-row']}>
                        <label>Action générée</label>
                        <span>{selectedResult.action_generee}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparaison côte à côte pour reconnaissance faciale/comparaison photos */}
                {(selectedResult.type_analyse === 'comparaison_photos' || 
                  selectedResult.type_analyse === 'reconnaissance_faciale') && (
                  <div className={styles['ia-results__modal-comparison-section']}>
                    <div className={styles['ia-results__modal-comparison-header']}>
                      <h4>
                        <Columns size={18} />
                        Comparaison visuelle
                      </h4>
                      <button
                        className={styles['ia-results__comparison-toggle']}
                        onClick={() => setShowComparison(!showComparison)}
                      >
                        {showComparison ? 'Masquer' : 'Afficher la comparaison'}
                      </button>
                    </div>
                    
                    {showComparison && (
                      <div className={styles['ia-results__comparison-grid']}>
                        <div className={styles['ia-results__comparison-item']}>
                          <span className={styles['ia-results__comparison-label']}>Photo analysée</span>
                          {comparisonPhotos.left ? (
                            <img src={comparisonPhotos.left} alt="Sujet analysé" />
                          ) : (
                            <div className={styles['ia-results__comparison-placeholder']}>
                              <Image size={32} />
                              <span>Photo non disponible</span>
                            </div>
                          )}
                        </div>
                        <div className={styles['ia-results__comparison-divider']}>
                          <span className={styles['ia-results__comparison-score']}>
                            {Math.round(selectedResult.score_confiance)}%
                          </span>
                          <span>similarité</span>
                        </div>
                        <div className={styles['ia-results__comparison-item']}>
                          <span className={styles['ia-results__comparison-label']}>Photo de référence</span>
                          {comparisonPhotos.right ? (
                            <img src={comparisonPhotos.right} alt="Sujet de référence" />
                          ) : (
                            <div className={styles['ia-results__comparison-placeholder']}>
                              <Image size={32} />
                              <span>Référence non disponible</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo associée (pour les autres types d'analyse) */}
                {selectedResult.photo?.url_cloudinary && 
                 selectedResult.type_analyse !== 'comparaison_photos' && 
                 selectedResult.type_analyse !== 'reconnaissance_faciale' && (
                  <div className={styles['ia-results__modal-photo']}>
                    <h4>Photo analysée</h4>
                    <img src={selectedResult.photo.url_cloudinary} alt="Sujet analysé" />
                  </div>
                )}

                {/* Facteurs clés */}
                {selectedResult.facteurs_cles && (
                  <div className={styles['ia-results__modal-factors']}>
                    <h4>Facteurs clés</h4>
                    <pre>{JSON.stringify(selectedResult.facteurs_cles, null, 2)}</pre>
                  </div>
                )}

                {/* Correspondances */}
                {selectedResult.correspondances_trouvees && (
                  <div className={styles['ia-results__modal-matches']}>
                    <h4>Correspondances trouvées</h4>
                    <pre>{JSON.stringify(selectedResult.correspondances_trouvees, null, 2)}</pre>
                  </div>
                )}

                {/* Commentaire de validation */}
                {selectedResult.commentaire_validation && (
                  <div className={styles['ia-results__modal-comment']}>
                    <h4>Commentaire de validation</h4>
                    <p>{selectedResult.commentaire_validation}</p>
                    {selectedResult.date_validation && (
                      <small>
                        Validé le {new Date(selectedResult.date_validation).toLocaleString('fr-FR')}
                      </small>
                    )}
                  </div>
                )}

                {/* Signalement de faux positif */}
                {selectedResult.statut_validation === 'en_attente' && !selectedResult.faux_positif && (
                  <div className={styles['ia-results__modal-false-positive']}>
                    <div className={styles['ia-results__modal-fp-header']}>
                      <h4>
                        <Flag size={18} />
                        Signaler un faux positif évident
                      </h4>
                      {!showFalsePositiveForm && (
                        <button
                          className={styles['ia-results__fp-btn']}
                          onClick={() => setShowFalsePositiveForm(true)}
                        >
                          <XCircle size={16} />
                          Signaler
                        </button>
                      )}
                    </div>
                    
                    {showFalsePositiveForm && (
                      <div className={styles['ia-results__fp-form']}>
                        <p className={styles['ia-results__fp-info']}>
                          Si ce résultat est manifestement erroné (visages clairement différents, 
                          mauvaise correspondance évidente...), vous pouvez le signaler pour 
                          examen prioritaire par un officier.
                        </p>
                        <textarea
                          value={falsePositiveReason}
                          onChange={(e) => setFalsePositiveReason(e.target.value)}
                          placeholder="Décrivez pourquoi ce résultat est un faux positif évident..."
                          rows={3}
                          className={styles['ia-results__fp-textarea']}
                        />
                        <div className={styles['ia-results__fp-actions']}>
                          <button
                            className={styles['ia-results__fp-cancel']}
                            onClick={() => {
                              setShowFalsePositiveForm(false);
                              setFalsePositiveReason('');
                            }}
                          >
                            Annuler
                          </button>
                          <button
                            className={styles['ia-results__fp-submit']}
                            onClick={reportFalsePositive}
                            disabled={isSubmittingFlag || !falsePositiveReason.trim()}
                          >
                            {isSubmittingFlag ? 'Envoi...' : 'Envoyer le signalement'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Badge faux positif si déjà signalé */}
                {selectedResult.faux_positif && (
                  <div className={styles['ia-results__modal-flagged']}>
                    <Flag size={18} />
                    <span>Ce résultat a été signalé comme faux positif potentiel</span>
                  </div>
                )}

                {/* Message de succès */}
                {flagSuccess && (
                  <div className={styles['ia-results__modal-success']}>
                    <CheckCircle size={18} />
                    <span>{flagSuccess}</span>
                  </div>
                )}

                {/* Note pour le modérateur */}
                <div className={styles['ia-results__modal-note']}>
                  <AlertTriangle size={18} />
                  <p>
                    En tant que modérateur, vous pouvez consulter ces résultats et signaler les 
                    faux positifs évidents. La validation finale est réservée aux autorités (niveau 4+).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModerationLayout>
  );
};

export default IAResultsPage;
