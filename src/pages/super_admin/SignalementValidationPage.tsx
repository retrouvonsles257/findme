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
  AlertTriangle, MapPin, Calendar, User, Check, X, Eye, Edit2, Trash2,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Filter,
  Clock, CheckCircle, XCircle, Download
} from 'lucide-react';
import styles from './SignalementValidationPage.module.css';

interface Signalement {
  id: string;
  numero_signalement?: string;
  id_dossier?: string;
  id_utilisateur?: string;
  description: string;
  date_observation: string;
  lieu_observation?: string;
  ville_observation?: string;
  region_observation?: string;
  pays_observation?: string;
  latitude_observation?: number;
  longitude_observation?: number;
  point_observation?: any; // GEOGRAPHY(POINT)
  precision_localisation?: string;
  niveau_certitude?: string;
  distance_observation?: string;
  duree_observation?: string;
  contexte_observation?: string;
  etat_personne_observee?: string;
  accompagnement?: string;
  direction_deplacement?: string;
  moyen_deplacement?: string;
  statut_validation: string;
  priorite_traitement?: string;
  score_pertinence?: number;
  raisons_score?: Record<string, any>; // JSONB
  verifie_par?: string;
  date_verification?: string;
  commentaire_verification?: string;
  transmis_autorites?: boolean;
  date_transmission?: string;
  autorite_destinataire?: string;
  actions_entreprises?: string;
  temoin_anonyme?: boolean;
  nom_temoin?: string;
  telephone_temoin?: string;
  email_temoin?: string;
  accepte_contact_suivi?: boolean;
  source_signalement?: string;
  ip_signalement?: string;
  user_agent?: string;
  created_at: string;
  updated_at?: string;
  dossier?: { numero_dossier: string; personne_nom: string };
  signaleur?: { nom: string; email: string };
  verificateur?: { nom: string; email: string };
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
  
  // Filtres — par défaut "Tous" pour afficher valides, non valides, etc.
  const [filterStatut, setFilterStatut] = useState<string>('');

  // Modal
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commentaireVerification, setCommentaireVerification] = useState('');
  const [editingSignalement, setEditingSignalement] = useState<Signalement | null>(null);
  const [editStatut, setEditStatut] = useState('');
  const [editCommentaire, setEditCommentaire] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadSignalements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stats globales
      const [totalResult, pendingResult, validatedResult, rejectedResult, spamResult, doublonResult] = await Promise.all([
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'en_attente'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'valide'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'invalide'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'spam'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'doublonne'),
      ]);

      setStats({
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        validated: validatedResult.count || 0,
        rejected: (rejectedResult.count || 0) + (spamResult.count || 0) + (doublonResult.count || 0),
      });

      // Compter avec filtres (vide = tous les statuts)
      let countQuery = (supabase as any).from('signalement').select('id', { count: 'exact', head: true });
      if (filterStatut) countQuery = countQuery.eq('statut_validation', filterStatut);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les signalements avec pagination — tous statuts si filtre vide
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('signalement')
        .select(`
          *,
          signaleur:utilisateur!signalement_id_utilisateur_fkey(nom, email),
          verificateur:utilisateur!signalement_verifie_par_fkey(nom, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      if (filterStatut) query = query.eq('statut_validation', filterStatut);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec dossier (personne disparue)
      const enrichedSignalements = await Promise.all(
        (data || []).map(async (signalement: any) => {
          let dossier = null;
          
          if (signalement.id_dossier) {
            const { data: d } = await (supabase as any)
              .from('dossier_disparition')
              .select('numero_dossier, id_personne')
              .eq('id', signalement.id_dossier)
              .single();
            
            if (d?.id_personne) {
              const { data: personne } = await (supabase as any)
                .from('personne')
                .select('nom, prenom')
                .eq('id', d.id_personne)
                .single();
              dossier = { 
                numero_dossier: d.numero_dossier, 
                personne_nom: personne ? `${personne.prenom || ''} ${personne.nom || ''}`.trim() : '-'
              };
            } else if (d) {
              dossier = { numero_dossier: d.numero_dossier, personne_nom: '-' };
            }
          }
          
          return {
            ...signalement,
            dossier: dossier || null,
            signaleur: signalement.signaleur || null,
            verificateur: signalement.verificateur || null,
          };
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

  const handleValidate = async (
    signalement: Signalement,
    newStatut: 'valide' | 'invalide' | 'spam' | 'doublonne',
    commentaire?: string
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Record<string, unknown> = {
        statut_validation: newStatut,
        verifie_par: user?.id || null,
        date_verification: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (commentaire != null && commentaire.trim()) payload.commentaire_verification = commentaire.trim();
      const { error: updateError } = await (supabase as any)
        .from('signalement')
        .update(payload)
        .eq('id', signalement.id);
      if (updateError) throw updateError;
      setCommentaireVerification('');
      setSelectedSignalement(null);
      loadSignalements();
    } catch (err: any) {
      console.error('Erreur validation:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSignalement || !editStatut) return;
    try {
      setIsProcessing(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Record<string, unknown> = {
        statut_validation: editStatut,
        verifie_par: user?.id || null,
        date_verification: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (editCommentaire.trim()) payload.commentaire_verification = editCommentaire.trim();
      const { error: updateError } = await (supabase as any)
        .from('signalement')
        .update(payload)
        .eq('id', editingSignalement.id);
      if (updateError) throw updateError;
      setEditingSignalement(null);
      setEditStatut('');
      setEditCommentaire('');
      setSelectedSignalement(null);
      loadSignalements();
    } catch (err: any) {
      console.error('Erreur mise à jour:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      const { error: deleteError } = await (supabase as any).from('signalement').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setDeleteConfirm(null);
      setSelectedSignalement(null);
      loadSignalements();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      let query = (supabase as any)
        .from('signalement')
        .select(`
          *,
          signaleur:utilisateur(nom, email),
          dossier:dossier_disparition(numero_dossier, id_personne)
        `)
        .order('created_at', { ascending: false });

      if (filterStatut) query = query.eq('statut_validation', filterStatut);

      const { data: allSignalements, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec personne du dossier
      const enrichedSignalements = await Promise.all(
        (allSignalements || []).map(async (s: any) => {
          let dossier = s.dossier;
          if (dossier?.id_personne) {
            const { data: personne } = await (supabase as any)
              .from('personne')
              .select('nom, prenom')
              .eq('id', dossier.id_personne)
              .single();
            dossier = { ...dossier, personne };
          }
          return { ...s, dossier: dossier || null };
        })
      );

      const headers = [
        'ID', 'Numéro signalement', 'Description', 'Date observation', 'Lieu observation',
        'Ville', 'Région', 'Pays', 'Latitude', 'Longitude', 'Précision localisation',
        'Niveau certitude', 'Distance observation', 'Durée observation', 'Contexte observation',
        'État personne observée', 'Accompagnement', 'Direction déplacement', 'Moyen déplacement',
        'Statut validation', 'Priorité traitement', 'Score pertinence', 'Raisons score',
        'Vérifié par', 'Date vérification', 'Commentaire vérification', 'Transmis autorités',
        'Date transmission', 'Autorité destinataire', 'Actions entreprises', 'Témoin anonyme',
        'Nom témoin', 'Téléphone témoin', 'Email témoin', 'Accepte contact suivi',
        'Source signalement', 'Signaleur', 'Dossier', 'Personne dossier', 'Date création'
      ];
      
      const rows = enrichedSignalements.map((s: any) => [
        s.id,
        s.numero_signalement || '',
        s.description,
        s.date_observation ? new Date(s.date_observation).toLocaleString('fr-FR') : '',
        s.lieu_observation || '',
        s.ville_observation || '',
        s.region_observation || '',
        s.pays_observation || '',
        s.latitude_observation || '',
        s.longitude_observation || '',
        s.precision_localisation || '',
        s.niveau_certitude || '',
        s.distance_observation || '',
        s.duree_observation || '',
        s.contexte_observation || '',
        s.etat_personne_observee || '',
        s.accompagnement || '',
        s.direction_deplacement || '',
        s.moyen_deplacement || '',
        s.statut_validation,
        s.priorite_traitement || '',
        s.score_pertinence || '',
        s.raisons_score ? JSON.stringify(s.raisons_score) : '',
        s.verifie_par || '',
        s.date_verification ? new Date(s.date_verification).toLocaleString('fr-FR') : '',
        s.commentaire_verification || '',
        s.transmis_autorites ? 'Oui' : 'Non',
        s.date_transmission ? new Date(s.date_transmission).toLocaleString('fr-FR') : '',
        s.autorite_destinataire || '',
        s.actions_entreprises || '',
        s.temoin_anonyme ? 'Oui' : 'Non',
        s.nom_temoin || '',
        s.telephone_temoin || '',
        s.email_temoin || '',
        s.accepte_contact_suivi ? 'Oui' : 'Non',
        s.source_signalement || '',
        s.signaleur ? `${s.signaleur.nom} (${s.signaleur.email})` : 'Anonyme',
        s.dossier?.numero_dossier || '',
        s.dossier?.personne ? `${s.dossier.personne.prenom || ''} ${s.dossier.personne.nom}`.trim() : '',
        s.created_at ? new Date(s.created_at).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `signalements_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      valide: 'success',
      invalide: 'danger',
      spam: 'danger',
      doublonne: 'info',
      en_cours_verification: 'info',
    };
    return colors[statut] || 'default';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      valide: 'Validé',
      invalide: 'Invalide',
      spam: 'Spam',
      doublonne: 'Doublon',
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
              <option value="en_cours_verification">En cours de vérification</option>
              <option value="valide">Validé</option>
              <option value="invalide">Invalide</option>
              <option value="spam">Spam</option>
              <option value="doublonne">Doublon</option>
            </select>
          </div>
          <button onClick={exportToCSV} disabled={isLoading} style={{
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}>
            <Download size={16} />
            Exporter CSV
          </button>
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
                        <button type="button" onClick={() => setSelectedSignalement(signalement)} title="Voir détails">
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSignalement(signalement);
                            setEditStatut(signalement.statut_validation);
                            setEditCommentaire(signalement.commentaire_verification || '');
                          }}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        {signalement.statut_validation === 'en_attente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleValidate(signalement, 'valide')}
                              className={styles['sa-signalement-validation__btn-validate']}
                              title="Valider"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleValidate(signalement, 'invalide')}
                              className={styles['sa-signalement-validation__btn-reject']}
                              title="Invalider"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(signalement.id)}
                          className={styles['sa-signalement-validation__btn-delete']}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
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
                    <label>Numéro signalement</label>
                    <span>{selectedSignalement.numero_signalement || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Date de création</label>
                    <span>{new Date(selectedSignalement.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Date d'observation</label>
                    <span>{selectedSignalement.date_observation ? new Date(selectedSignalement.date_observation).toLocaleString('fr-FR') : '-'}</span>
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
                    <label>Ville</label>
                    <span>{selectedSignalement.ville_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Région</label>
                    <span>{selectedSignalement.region_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Pays</label>
                    <span>{selectedSignalement.pays_observation || '-'}</span>
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
                    <label>Précision localisation</label>
                    <span>{selectedSignalement.precision_localisation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Niveau certitude</label>
                    <span>{selectedSignalement.niveau_certitude || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Distance observation</label>
                    <span>{selectedSignalement.distance_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Durée observation</label>
                    <span>{selectedSignalement.duree_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Priorité traitement</label>
                    <span>{selectedSignalement.priorite_traitement || '-'}</span>
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
                  {selectedSignalement.verificateur && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Vérifié par</label>
                      <span>{selectedSignalement.verificateur.nom} ({selectedSignalement.verificateur.email})</span>
                    </div>
                  )}
                  {selectedSignalement.date_verification && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Date vérification</label>
                      <span>{new Date(selectedSignalement.date_verification).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {selectedSignalement.commentaire_verification && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>Commentaire vérification</label>
                      <span>{selectedSignalement.commentaire_verification}</span>
                    </div>
                  )}
                  {selectedSignalement.transmis_autorites && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Transmis aux autorités</label>
                      <span>{selectedSignalement.transmis_autorites ? 'Oui' : 'Non'}</span>
                    </div>
                  )}
                  {selectedSignalement.date_transmission && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Date transmission</label>
                      <span>{new Date(selectedSignalement.date_transmission).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {selectedSignalement.autorite_destinataire && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Autorité destinataire</label>
                      <span>{selectedSignalement.autorite_destinataire}</span>
                    </div>
                  )}
                  {selectedSignalement.actions_entreprises && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>Actions entreprises</label>
                      <span>{selectedSignalement.actions_entreprises}</span>
                    </div>
                  )}
                  {selectedSignalement.temoin_anonyme !== undefined && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Témoin anonyme</label>
                      <span>{selectedSignalement.temoin_anonyme ? 'Oui' : 'Non'}</span>
                    </div>
                  )}
                  {selectedSignalement.nom_temoin && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Nom témoin</label>
                      <span>{selectedSignalement.nom_temoin}</span>
                    </div>
                  )}
                  {selectedSignalement.telephone_temoin && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Téléphone témoin</label>
                      <span>{selectedSignalement.telephone_temoin}</span>
                    </div>
                  )}
                  {selectedSignalement.email_temoin && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Email témoin</label>
                      <span>{selectedSignalement.email_temoin}</span>
                    </div>
                  )}
                  {selectedSignalement.accepte_contact_suivi !== undefined && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Accepte contact suivi</label>
                      <span>{selectedSignalement.accepte_contact_suivi ? 'Oui' : 'Non'}</span>
                    </div>
                  )}
                  {selectedSignalement.source_signalement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Source signalement</label>
                      <span>{selectedSignalement.source_signalement}</span>
                    </div>
                  )}
                  {selectedSignalement.raisons_score && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>Raisons du score</label>
                      <pre style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem', marginTop: '0.25rem' }}>
                        {JSON.stringify(selectedSignalement.raisons_score, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedSignalement.contexte_observation && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>Contexte observation</label>
                      <span>{selectedSignalement.contexte_observation}</span>
                    </div>
                  )}
                  {selectedSignalement.etat_personne_observee && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>État personne observée</label>
                      <span>{selectedSignalement.etat_personne_observee}</span>
                    </div>
                  )}
                  {selectedSignalement.accompagnement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Accompagnement</label>
                      <span>{selectedSignalement.accompagnement}</span>
                    </div>
                  )}
                  {selectedSignalement.direction_deplacement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Direction déplacement</label>
                      <span>{selectedSignalement.direction_deplacement}</span>
                    </div>
                  )}
                  {selectedSignalement.moyen_deplacement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>Moyen déplacement</label>
                      <span>{selectedSignalement.moyen_deplacement}</span>
                    </div>
                  )}
                </div>

                <div className={styles['sa-signalement-validation__description']}>
                  <label>Description</label>
                  <p>{selectedSignalement.description || 'Aucune description'}</p>
                </div>

                {selectedSignalement.statut_validation === 'en_attente' && (
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Commentaire vérification (optionnel)</label>
                    <textarea
                      value={commentaireVerification}
                      onChange={(e) => setCommentaireVerification(e.target.value)}
                      rows={2}
                      placeholder="Ajouter un commentaire avant de valider/invalider..."
                    />
                  </div>
                )}
              </div>

              <div className={styles['sa-signalement-validation__modal-footer']}>
                {selectedSignalement.statut_validation === 'en_attente' && (
                  <>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'invalide', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-reject-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <X size={16} />}
                      Invalider
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'spam', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-reject-large']}
                      disabled={isProcessing}
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <X size={16} />}
                      Marquer Spam
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'doublonne', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-reject-large']}
                      disabled={isProcessing}
                      style={{ backgroundColor: '#64748b' }}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <X size={16} />}
                      Marquer Doublon
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'valide', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-validate-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Check size={16} />}
                      Valider
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setSelectedSignalement(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit */}
        {editingSignalement && (
          <div className={styles['sa-signalement-validation__modal-overlay']} onClick={() => { setEditingSignalement(null); setEditStatut(''); setEditCommentaire(''); }}>
            <div className={styles['sa-signalement-validation__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-signalement-validation__modal-header']}>
                <h2>Modifier le signalement</h2>
                <button type="button" onClick={() => { setEditingSignalement(null); setEditStatut(''); setEditCommentaire(''); }}><X size={20} /></button>
              </div>
              <div className={styles['sa-signalement-validation__modal-body']}>
                <div className={styles['sa-signalement-validation__detail-grid']}>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>Statut</label>
                    <select value={editStatut} onChange={(e) => setEditStatut(e.target.value)}>
                      <option value="en_attente">En attente</option>
                      <option value="en_cours_verification">En cours de vérification</option>
                      <option value="valide">Validé</option>
                      <option value="invalide">Invalide</option>
                      <option value="spam">Spam</option>
                      <option value="doublonne">Doublon</option>
                    </select>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                    <label>Commentaire vérification</label>
                    <textarea value={editCommentaire} onChange={(e) => setEditCommentaire(e.target.value)} rows={3} placeholder="Optionnel" />
                  </div>
                </div>
              </div>
              <div className={styles['sa-signalement-validation__modal-footer']}>
                <button type="button" onClick={() => { setEditingSignalement(null); setEditStatut(''); setEditCommentaire(''); }}>Annuler</button>
                <button type="button" onClick={handleUpdate} disabled={isProcessing || !editStatut} className={styles['sa-signalement-validation__btn-validate-large']}>
                  {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Check size={16} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Delete Confirm */}
        {deleteConfirm && (
          <div className={styles['sa-signalement-validation__modal-overlay']} onClick={() => setDeleteConfirm(null)}>
            <div className={styles['sa-signalement-validation__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-signalement-validation__modal-header']}>
                <h2>Supprimer le signalement</h2>
                <button type="button" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-signalement-validation__modal-body']}>
                <p>Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible.</p>
              </div>
              <div className={styles['sa-signalement-validation__modal-footer']}>
                <button type="button" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={isProcessing} className={styles['sa-signalement-validation__btn-reject-large']}>
                  {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Trash2 size={16} />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSignalementValidationPage;
