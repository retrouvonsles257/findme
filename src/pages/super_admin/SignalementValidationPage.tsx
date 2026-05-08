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
import { AdminTableSkeleton } from 'components/skeletons';
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
  const { t } = useI18n();

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
        visible_detail_public: newStatut === 'valide',
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
        visible_detail_public: editStatut === 'valide',
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
      en_attente: t('super_admin.signalementStatutEnAttente'),
      valide: t('super_admin.signalementStatutValide'),
      invalide: t('super_admin.signalementStatutInvalide'),
      spam: t('super_admin.signalementStatutSpam'),
      doublonne: t('super_admin.signalementStatutDoublon'),
      en_cours_verification: t('super_admin.signalementStatutEnVerification'),
    };
    return labels[statut] || statut;
  };

  const getScorePertinenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.5) return 'warning';
    return 'danger';
  };

  return (
    <SuperAdminLayout title={t('super_admin.signalementValidationTitle')} activeNav="signalement-validation">
      <div className={styles['sa-signalement-validation']}>
        {/* Stats Cards */}
        <div className={styles['sa-signalement-validation__stats']}>
          <div className={styles['sa-signalement-validation__stat-card']}>
            <AlertTriangle size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.total}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>{t('super_admin.signalementTotal')}</span>
            </div>
          </div>
          <div className={`${styles['sa-signalement-validation__stat-card']} ${styles['sa-signalement-validation__stat-card--warning']}`}>
            <Clock size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.pending}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>{t('super_admin.signalementPending')}</span>
            </div>
          </div>
          <div className={`${styles['sa-signalement-validation__stat-card']} ${styles['sa-signalement-validation__stat-card--success']}`}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.validated}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>{t('super_admin.signalementValidated')}</span>
            </div>
          </div>
          <div className={`${styles['sa-signalement-validation__stat-card']} ${styles['sa-signalement-validation__stat-card--danger']}`}>
            <XCircle size={24} />
            <div>
              <span className={styles['sa-signalement-validation__stat-value']}>{stats.rejected}</span>
              <span className={styles['sa-signalement-validation__stat-label']}>{t('super_admin.signalementRejected')}</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-signalement-validation__filters']}>
          <div className={styles['sa-signalement-validation__filter-group']}>
            <Filter size={16} />
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
              <option value="">{t('super_admin.signalementFilterAllStatuses')}</option>
              <option value="en_attente">{t('super_admin.signalementStatutEnAttente')}</option>
              <option value="en_cours_verification">{t('super_admin.signalementStatutEnCoursVerification')}</option>
              <option value="valide">{t('super_admin.signalementStatutValide')}</option>
              <option value="invalide">{t('super_admin.signalementStatutInvalide')}</option>
              <option value="spam">{t('super_admin.signalementStatutSpam')}</option>
              <option value="doublonne">{t('super_admin.signalementStatutDoublon')}</option>
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
            {t('super_admin.signalementExportCsv')}
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
          <div className={styles['sa-signalement-validation__skeletonWrap']}>
            <AdminTableSkeleton columns={7} rows={8} />
          </div>
        ) : (
          <div className={styles['sa-signalement-validation__table-wrapper']}>
            {signalements.length === 0 ? (
              <div className={styles['sa-signalement-validation__empty']}>
                <AlertTriangle size={48} />
                <p>{t('super_admin.signalementNoData')}</p>
              </div>
            ) : (
              <table className={styles['sa-signalement-validation__table']}>
                <thead>
                  <tr>
                    <th><Calendar size={16} /> {t('super_admin.signalementTableDate')}</th>
                    <th><User size={16} /> {t('super_admin.signalementTableSignaleur')}</th>
                    <th>{t('super_admin.signalementTableDossier')}</th>
                    <th><MapPin size={16} /> {t('super_admin.signalementTableLieu')}</th>
                    <th>{t('super_admin.signalementTableFiabilite')}</th>
                    <th>{t('super_admin.signalementTableStatut')}</th>
                    <th>{t('common.actions')}</th>
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
                        <button type="button" onClick={() => setSelectedSignalement(signalement)} title={t('super_admin.signalementViewDetails')}>
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSignalement(signalement);
                            setEditStatut(signalement.statut_validation);
                            setEditCommentaire(signalement.commentaire_verification || '');
                          }}
                          title={t('common.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        {signalement.statut_validation === 'en_attente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleValidate(signalement, 'valide')}
                              className={styles['sa-signalement-validation__btn-validate']}
                              title={t('super_admin.signalementValidate')}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleValidate(signalement, 'invalide')}
                              className={styles['sa-signalement-validation__btn-reject']}
                              title={t('super_admin.signalementInvalidate')}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(signalement.id)}
                          className={styles['sa-signalement-validation__btn-delete']}
                          title={t('super_admin.signalementDelete')}
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
              <ChevronLeft size={16} /> {t('common.previous')}
            </button>
            <span>{t('super_admin.systemLogsPageOf', { current: currentPage, total: totalPages })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              {t('common.next')} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal View */}
        {selectedSignalement && (
          <div className={styles['sa-signalement-validation__modal-overlay']} onClick={() => setSelectedSignalement(null)}>
            <div className={styles['sa-signalement-validation__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-signalement-validation__modal-header']}>
                <h2>{t('super_admin.signalementDetailsTitle')}</h2>
                <button onClick={() => setSelectedSignalement(null)}><X size={20} /></button>
              </div>

              <div className={styles['sa-signalement-validation__modal-body']}>
                <div className={styles['sa-signalement-validation__detail-grid']}>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelNumeroSignalement')}</label>
                    <span>{selectedSignalement.numero_signalement || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelDateCreation')}</label>
                    <span>{new Date(selectedSignalement.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelDateObservation')}</label>
                    <span>{selectedSignalement.date_observation ? new Date(selectedSignalement.date_observation).toLocaleString('fr-FR') : '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelSignaleur')}</label>
                    <span>{selectedSignalement.signaleur ? `${selectedSignalement.signaleur.nom} (${selectedSignalement.signaleur.email})` : t('super_admin.signalementAnonymous')}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelDossier')}</label>
                    <span>{selectedSignalement.dossier ? `${selectedSignalement.dossier.numero_dossier} - ${selectedSignalement.dossier.personne_nom}` : '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelLieuObservation')}</label>
                    <span>{selectedSignalement.lieu_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelVille')}</label>
                    <span>{selectedSignalement.ville_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelRegion')}</label>
                    <span>{selectedSignalement.region_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelPays')}</label>
                    <span>{selectedSignalement.pays_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelCoordonnees')}</label>
                    <span>
                      {selectedSignalement.latitude_observation && selectedSignalement.longitude_observation 
                        ? `${selectedSignalement.latitude_observation}, ${selectedSignalement.longitude_observation}` 
                        : '-'}
                    </span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelPrecisionLocalisation')}</label>
                    <span>{selectedSignalement.precision_localisation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelNiveauCertitude')}</label>
                    <span>{selectedSignalement.niveau_certitude || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelDistanceObservation')}</label>
                    <span>{selectedSignalement.distance_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelDureeObservation')}</label>
                    <span>{selectedSignalement.duree_observation || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelPrioriteTraitement')}</label>
                    <span>{selectedSignalement.priorite_traitement || '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelScorePertinence')}</label>
                    <span>{selectedSignalement.score_pertinence != null ? `${Math.round(selectedSignalement.score_pertinence * 100)}%` : '-'}</span>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementLabelStatut')}</label>
                    <span className={`${styles['sa-signalement-validation__badge']} ${styles[`sa-signalement-validation__badge--${getStatutColor(selectedSignalement.statut_validation)}`]}`}>
                      {getStatutLabel(selectedSignalement.statut_validation)}
                    </span>
                  </div>
                  {selectedSignalement.verificateur && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelVerifiePar')}</label>
                      <span>{selectedSignalement.verificateur.nom} ({selectedSignalement.verificateur.email})</span>
                    </div>
                  )}
                  {selectedSignalement.date_verification && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelDateVerification')}</label>
                      <span>{new Date(selectedSignalement.date_verification).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {selectedSignalement.commentaire_verification && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>{t('super_admin.signalementLabelCommentaireVerification')}</label>
                      <span>{selectedSignalement.commentaire_verification}</span>
                    </div>
                  )}
                  {selectedSignalement.transmis_autorites && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelTransmisAutorites')}</label>
                      <span>{selectedSignalement.transmis_autorites ? t('common.yes') : t('common.no')}</span>
                    </div>
                  )}
                  {selectedSignalement.date_transmission && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelDateTransmission')}</label>
                      <span>{new Date(selectedSignalement.date_transmission).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {selectedSignalement.autorite_destinataire && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelAutoriteDestinataire')}</label>
                      <span>{selectedSignalement.autorite_destinataire}</span>
                    </div>
                  )}
                  {selectedSignalement.actions_entreprises && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>{t('super_admin.signalementLabelActionsEntreprises')}</label>
                      <span>{selectedSignalement.actions_entreprises}</span>
                    </div>
                  )}
                  {selectedSignalement.temoin_anonyme !== undefined && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelTemoinAnonyme')}</label>
                      <span>{selectedSignalement.temoin_anonyme ? t('common.yes') : t('common.no')}</span>
                    </div>
                  )}
                  {selectedSignalement.nom_temoin && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelNomTemoin')}</label>
                      <span>{selectedSignalement.nom_temoin}</span>
                    </div>
                  )}
                  {selectedSignalement.telephone_temoin && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelTelephoneTemoin')}</label>
                      <span>{selectedSignalement.telephone_temoin}</span>
                    </div>
                  )}
                  {selectedSignalement.email_temoin && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelEmailTemoin')}</label>
                      <span>{selectedSignalement.email_temoin}</span>
                    </div>
                  )}
                  {selectedSignalement.accepte_contact_suivi !== undefined && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelAccepteContactSuivi')}</label>
                      <span>{selectedSignalement.accepte_contact_suivi ? t('common.yes') : t('common.no')}</span>
                    </div>
                  )}
                  {selectedSignalement.source_signalement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelSourceSignalement')}</label>
                      <span>{selectedSignalement.source_signalement}</span>
                    </div>
                  )}
                  {selectedSignalement.raisons_score && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>{t('super_admin.signalementLabelRaisonsScore')}</label>
                      <pre style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem', marginTop: '0.25rem' }}>
                        {JSON.stringify(selectedSignalement.raisons_score, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedSignalement.contexte_observation && (
                    <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                      <label>{t('super_admin.signalementLabelContexteObservation')}</label>
                      <span>{selectedSignalement.contexte_observation}</span>
                    </div>
                  )}
                  {selectedSignalement.etat_personne_observee && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelEtatPersonneObservee')}</label>
                      <span>{selectedSignalement.etat_personne_observee}</span>
                    </div>
                  )}
                  {selectedSignalement.accompagnement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelAccompagnement')}</label>
                      <span>{selectedSignalement.accompagnement}</span>
                    </div>
                  )}
                  {selectedSignalement.direction_deplacement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelDirectionDeplacement')}</label>
                      <span>{selectedSignalement.direction_deplacement}</span>
                    </div>
                  )}
                  {selectedSignalement.moyen_deplacement && (
                    <div className={styles['sa-signalement-validation__detail-item']}>
                      <label>{t('super_admin.signalementLabelMoyenDeplacement')}</label>
                      <span>{selectedSignalement.moyen_deplacement}</span>
                    </div>
                  )}
                </div>

                <div className={styles['sa-signalement-validation__description']}>
                  <label>{t('super_admin.signalementDescription')}</label>
                  <p>{selectedSignalement.description || t('super_admin.signalementNoDescription')}</p>
                </div>

                {selectedSignalement.statut_validation === 'en_attente' && (
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementCommentaireVerificationOptional')}</label>
                    <textarea
                      value={commentaireVerification}
                      onChange={(e) => setCommentaireVerification(e.target.value)}
                      rows={2}
                      placeholder={t('super_admin.signalementPlaceholderCommentaireValidation')}
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
                      {t('super_admin.signalementInvalidate')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'spam', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-reject-large']}
                      disabled={isProcessing}
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <X size={16} />}
                      {t('super_admin.signalementButtonMarquerSpam')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'doublonne', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-reject-large']}
                      disabled={isProcessing}
                      style={{ backgroundColor: '#64748b' }}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <X size={16} />}
                      {t('super_admin.signalementButtonMarquerDoublon')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedSignalement, 'valide', commentaireVerification)}
                      className={styles['sa-signalement-validation__btn-validate-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Check size={16} />}
                      {t('super_admin.signalementValidate')}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setSelectedSignalement(null)}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit */}
        {editingSignalement && (
          <div className={styles['sa-signalement-validation__modal-overlay']} onClick={() => { setEditingSignalement(null); setEditStatut(''); setEditCommentaire(''); }}>
            <div className={styles['sa-signalement-validation__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-signalement-validation__modal-header']}>
                <h2>{t('super_admin.signalementEditModalTitle')}</h2>
                <button type="button" onClick={() => { setEditingSignalement(null); setEditStatut(''); setEditCommentaire(''); }}><X size={20} /></button>
              </div>
              <div className={styles['sa-signalement-validation__modal-body']}>
                <div className={styles['sa-signalement-validation__detail-grid']}>
                  <div className={styles['sa-signalement-validation__detail-item']}>
                    <label>{t('super_admin.signalementEditStatutLabel')}</label>
                    <select value={editStatut} onChange={(e) => setEditStatut(e.target.value)}>
                      <option value="en_attente">{t('super_admin.signalementStatutEnAttente')}</option>
                      <option value="en_cours_verification">{t('super_admin.signalementStatutEnCoursVerification')}</option>
                      <option value="valide">{t('super_admin.signalementStatutValide')}</option>
                      <option value="invalide">{t('super_admin.signalementStatutInvalide')}</option>
                      <option value="spam">{t('super_admin.signalementStatutSpam')}</option>
                      <option value="doublonne">{t('super_admin.signalementStatutDoublon')}</option>
                    </select>
                  </div>
                  <div className={styles['sa-signalement-validation__detail-item']} style={{ gridColumn: '1 / -1' }}>
                    <label>{t('super_admin.signalementEditCommentaireLabel')}</label>
                    <textarea value={editCommentaire} onChange={(e) => setEditCommentaire(e.target.value)} rows={3} placeholder={t('super_admin.signalementPlaceholderOptional')} />
                  </div>
                </div>
              </div>
              <div className={styles['sa-signalement-validation__modal-footer']}>
                <button type="button" onClick={() => { setEditingSignalement(null); setEditStatut(''); setEditCommentaire(''); }}>{t('common.cancel')}</button>
                <button type="button" onClick={handleUpdate} disabled={isProcessing || !editStatut} className={styles['sa-signalement-validation__btn-validate-large']}>
                  {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Check size={16} />}
                  {t('common.save')}
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
                <h2>{t('super_admin.signalementDeleteModalTitle')}</h2>
                <button type="button" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-signalement-validation__modal-body']}>
                <p>{t('super_admin.signalementDeleteConfirmMessage')}</p>
              </div>
              <div className={styles['sa-signalement-validation__modal-footer']}>
                <button type="button" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={isProcessing} className={styles['sa-signalement-validation__btn-reject-large']}>
                  {isProcessing ? <Loader2 size={16} className={styles['sa-signalement-validation__spinner']} /> : <Trash2 size={16} />}
                  {t('super_admin.signalementDelete')}
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
