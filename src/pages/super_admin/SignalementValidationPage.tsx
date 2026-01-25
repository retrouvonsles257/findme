/**
 * =====================================================
 * RETROUVONSLES - Super Admin Signalement Validation Page
 * Page de validation des signalements utilisateurs
 * Connecté à Supabase table: signalement
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  AlertTriangle, MapPin, Calendar, User, Check, X, Eye,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Filter,
  Clock, CheckCircle, XCircle
} from 'lucide-react';
import styles from './SignalementValidationPage.module.css';

interface Signalement {
  id: string;
  id_dossier?: string;
  id_utilisateur?: string;
  description: string;
  lieu_observation?: string;
  date_observation?: string;
  statut_validation: string;
  score_pertinence?: number;
  latitude_observation?: number;
  longitude_observation?: number;
  created_at: string;
  dossier?: { numero_dossier: string; personne_nom: string };
  signaleur?: { nom: string; email: string };
}

const ITEMS_PER_PAGE = 15;

export const SuperAdminSignalementValidationPage: React.FC = () => {
  useI18n(); // For future i18n support

  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, validated: 0, rejected: 0 });
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState<string>('en_attente');

  // Modal
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSignalements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stats globales
      const [totalResult, pendingResult, validatedResult, rejectedResult] = await Promise.all([
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'en_attente'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'valide'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'invalide'),
      ]);

      setStats({
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        validated: validatedResult.count || 0,
        rejected: rejectedResult.count || 0,
      });

      // Compter avec filtres
      let countQuery = (supabase as any).from('signalement').select('id', { count: 'exact', head: true });
      if (filterStatut) countQuery = countQuery.eq('statut_validation', filterStatut);
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les signalements avec pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('signalement')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterStatut) query = query.eq('statut_validation', filterStatut);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec dossier et signaleur
      const enrichedSignalements = await Promise.all(
        (data || []).map(async (signalement: Signalement) => {
          let dossier, signaleur;
          if (signalement.id_dossier) {
            const { data: d } = await (supabase as any)
              .from('dossier_disparition')
              .select('numero_dossier')
              .eq('id', signalement.id_dossier)
              .single();
            if (d) {
              // Récupérer le nom de la personne disparue
              const { data: dossierFull } = await (supabase as any)
                .from('dossier_disparition')
                .select('id_personne')
                .eq('id', signalement.id_dossier)
                .single();
              if (dossierFull?.id_personne) {
                const { data: personne } = await (supabase as any)
                  .from('personne')
                  .select('nom, prenom')
                  .eq('id', dossierFull.id_personne)
                  .single();
                dossier = { 
                  numero_dossier: d.numero_dossier, 
                  personne_nom: personne ? `${personne.prenom} ${personne.nom}` : '-'
                };
              } else {
                dossier = { numero_dossier: d.numero_dossier, personne_nom: '-' };
              }
            }
          }
          if (signalement.id_utilisateur) {
            const { data: s } = await (supabase as any)
              .from('utilisateur')
              .select('nom, email')
              .eq('id', signalement.id_utilisateur)
              .single();
            signaleur = s;
          }
          return { ...signalement, dossier, signaleur };
        })
      );

      setSignalements(enrichedSignalements);
    } catch (err: any) {
      console.error('Erreur chargement signalements:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatut]);

  useEffect(() => {
    loadSignalements();
  }, [loadSignalements]);

  const handleValidate = async (signalement: Signalement, newStatut: 'valide' | 'rejete') => {
    try {
      setIsProcessing(true);
      
      const { error: updateError } = await (supabase as any)
        .from('signalement')
        .update({ 
          statut_validation: newStatut,
          updated_at: new Date().toISOString()
        })
        .eq('id', signalement.id);

      if (updateError) throw updateError;

      setSelectedSignalement(null);
      loadSignalements();
    } catch (err: any) {
      console.error('Erreur validation:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      valide: 'success',
      rejete: 'danger',
      en_cours_verification: 'info',
    };
    return colors[statut] || 'default';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      valide: 'Validé',
      rejete: 'Rejeté',
      en_cours_verification: 'En vérification',
    };
    return labels[statut] || statut;
  };

  const getScorePertinenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.5) return 'warning';
    return 'danger';
  };

  return (
    <SuperAdminLayout title="Validation des Signalements" activeNav="signalement-validation">
      <div className={styles['sa-signalement-validation']}>
        {/* Stats Cards */}
        <div className={styles['sa-signalement-validation__stats']}>
          <div className={styles['sa-signalement-validation__stat-card']}>
            <AlertTriangle size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.total}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>Total signalements</span>
            </div>
          </div>
          <div className={`${styles['sa-signalement-validation__stat-card']} ${styles['sa-signalement-validation__stat-card--warning']}`}>
            <Clock size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.pending}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>En attente</span>
            </div>
          </div>
          <div className={`${styles['sa-signalement-validation__stat-card']} ${styles['sa-signalement-validation__stat-card--success']}`}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.validated}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>Validés</span>
            </div>
          </div>
          <div className={`${styles['sa-signalement-validation__stat-card']} ${styles['sa-signalement-validation__stat-card--danger']}`}>
            <XCircle size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.rejected}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>Rejetés</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-signalement-validation__filters']}>
          <div className={styles['sa-signalement-validation__filter-group']}>
            <Filter size={16} />
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="rejete">Rejeté</option>
              <option value="en_cours_verification">En vérification</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-signalement-validation__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-signalement-validation__loading']}>
            <Loader2 size={32} className={styles['sa-signalement-validation__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-signalement-validation__table-wrapper']}>
            {signalements.length === 0 ? (
              <div className={styles['sa-signalement-validation__empty']}>
                <AlertTriangle size={48} />
                <p>Aucun signalement trouvé</p>
              </div>
            ) : (
              <table className={styles['sa-signalement-validation__table']}>
                <thead>
                  <tr>
                    <th><Calendar size={16} /> Date</th>
                    <th><User size={16} /> Signaleur</th>
                    <th>Dossier</th>
                    <th><MapPin size={16} /> Lieu</th>
                    <th>Fiabilité</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signalements.map((signalement) => (
                    <tr key={signalement.id}>
                      <td>{new Date(signalement.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {signalement.signaleur ? (
                          <span>{signalement.signaleur.nom}</span>
                        ) : (
                          <span className={styles['sa-signalement-validation__anonymous']}>Anonyme</span>
                        )}
                      </td>
                      <td>
                        {signalement.dossier ? (
                          <div>
                            <div>{signalement.dossier.numero_dossier}</div>
                            <small>{signalement.dossier.personne_nom}</small>
                          </div>
                        ) : '-'}
                      </td>
                      <td>{signalement.lieu_observation || '-'}</td>
                      <td>
                        {signalement.score_pertinence != null ? (
                          <span className={`${styles['sa-signalement-validation__fiabilite']} ${styles[`sa-signalement-validation__fiabilite--${getScorePertinenceColor(signalement.score_pertinence)}`]}`}>
                            {Math.round(signalement.score_pertinence * 100)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`${styles['sa-signalement-validation__badge']} ${styles[`sa-signalement-validation__badge--${getStatutColor(signalement.statut_validation)}`]}`}>
                          {getStatutLabel(signalement.statut_validation)}
                        </span>
                      </td>
                      <td className={styles['sa-signalement-validation__actions']}>
                        <button onClick={() => setSelectedSignalement(signalement)} title="Voir détails">
                          <Eye size={16} />
                        </button>
                        {signalement.statut_validation === 'en_attente' && (
                          <>
                            <button 
                              onClick={() => handleValidate(signalement, 'valide')}
                              className={styles['sa-signalement-validation__btn-validate']}
                              title="Valider"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleValidate(signalement, 'rejete')}
                              className={styles['sa-signalement-validation__btn-reject']}
                              title="Rejeter"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
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
          <div className={styles['sa-signalement-validation__pagination']}>
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
        {selectedSignalement && (
          <div className={styles['sa-signalement-validation__modal-overlay']} onClick={() => setSelectedSignalement(null)}>
            <div className={styles['sa-signalement-validation__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-signalement-validation__modal-header']}>
                <h2>Détails du signalement</h2>
                <button onClick={() => setSelectedSignalement(null)}><X size={20} /></button>
              </div>
              
              <div className={styles['sa-signalement-validation__modal-body']}>
                <div className={styles['sa-signalement-validation__detail-grid']}>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Date de création</label>
                    <span>{new Date(selectedSignalement.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Date d'observation</label>
                    <span>{selectedSignalement.date_observation ? new Date(selectedSignalement.date_observation).toLocaleDateString('fr-FR') : '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Signaleur</label>
                    <span>{selectedSignalement.signaleur ? `${selectedSignalement.signaleur.nom} (${selectedSignalement.signaleur.email})` : 'Anonyme'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Dossier</label>
                    <span>{selectedSignalement.dossier ? `${selectedSignalement.dossier.numero_dossier} - ${selectedSignalement.dossier.personne_nom}` : '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Lieu d'observation</label>
                    <span>{selectedSignalement.lieu_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Coordonnées</label>
                    <span>
                      {selectedSignalement.latitude_observation && selectedSignalement.longitude_observation 
                        ? `${selectedSignalement.latitude_observation}, ${selectedSignalement.longitude_observation}` 
                        : '-'}
                    </span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Score de pertinence</label>
                    <span>{selectedSignalement.score_pertinence != null ? `${Math.round(selectedSignalement.score_pertinence * 100)}%` : '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Statut</label>
                    <span className={`${styles['sa-signalement-validation__badge']} ${styles[`sa-signalement-validation__badge--${getStatutColor(selectedSignalement.statut_validation)}`]}`}>
                      {getStatutLabel(selectedSignalement.statut_validation)}
                    </span>
                  </div>
                </div>

                <div className={styles['sa-signalement-validation__description']}>
                  <label>Description</label>
                  <p>{selectedSignalement.description || 'Aucune description'}</p>
                </div>
              </div>

              <div className={styles['sa-signalement-validation__modal-footer']}>
                {selectedSignalement.statut_validation === 'en_attente' && (
                  <>
                    <button 
                      onClick={() => handleValidate(selectedSignalement, 'rejete')}
                      className={styles['sa-signalement-validation__btn-reject-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <X size={16} />}
                      Rejeter
                    </button>
                    <button 
                      onClick={() => handleValidate(selectedSignalement, 'valide')}
                      className={styles['sa-signalement-validation__btn-validate-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Check size={16} />}
                      Valider
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedSignalement(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSignalementValidationPage;
