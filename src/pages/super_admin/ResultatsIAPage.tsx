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
import { AdminTableSkeleton } from '../admin/skeletons';
import { 
  Brain, User, Calendar, Filter, Loader2, AlertCircle, 
  Eye, ChevronLeft, ChevronRight, CheckCircle, Percent, X,
  CheckSquare, Square, Download
} from 'lucide-react';
import styles from './ResultatsIAPage.module.css';

interface ResultatIA {
  id: string;
  id_dossier?: string;
  id_signalement?: string;
  type_analyse: string;
  score_confiance: number;
  seuil_decision?: number;
  donnees_brutes: Record<string, any>; // JSONB
  donnees_interpretees?: Record<string, any>; // JSONB
  correspondances_trouvees?: Record<string, any>; // JSONB
  zones_predites?: Record<string, any>; // JSONB
  facteurs_cles?: Record<string, any>; // JSONB
  recommandations?: Record<string, any>; // JSONB
  temps_traitement_ms?: number;
  modele_ia_utilise?: string;
  version_modele?: string;
  statut_validation?: string;
  id_utilisateur_demandeur?: string; // Correspond à declenche_par dans le modèle SQL
  id_utilisateur_validateur?: string; // Correspond à valide_par dans le modèle SQL
  date_validation?: string;
  commentaire_validation?: string;
  date_analyse: string;
  dossier?: { numero_dossier: string; personne?: { nom: string; prenom?: string } };
  signalement?: { numero_signalement?: string };
  demandeur?: { nom: string; email: string };
  validateur?: { nom: string; email: string };
}

const ITEMS_PER_PAGE = 15;

export const SuperAdminResultatsIAPage: React.FC = () => {
  const { t } = useI18n();

  const [resultats, setResultats] = useState<ResultatIA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0, avgScore: 0 });
  
  // Filtres
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');

  // Modal view
  const [selectedResultat, setSelectedResultat] = useState<ResultatIA | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Sélection multiple pour actions en masse
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessingMass, setIsProcessingMass] = useState(false);

  const loadResultats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stats globales
      const [totalResult, validatedResult, pendingResult, scoresResult] = await Promise.all([
        (supabase as any).from('resultat_ia').select('id', { count: 'exact', head: true }),
        (supabase as any).from('resultat_ia').select('id', { count: 'exact', head: true }).eq('statut_validation', 'confirme'),
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

      // Charger les résultats avec pagination - RÉCUPÉRER TOUS LES CHAMPS
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('resultat_ia')
        .select(`
          *,
          dossier:dossier_disparition(numero_dossier, id_personne),
          signalement:signalement(numero_signalement),
          demandeur:utilisateur!resultat_ia_declenche_par_fkey(nom, email),
          validateur:utilisateur!resultat_ia_valide_par_fkey(nom, email)
        `)
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
          if (resultat.id_utilisateur_validateur) {
            const { data: v } = await (supabase as any)
              .from('utilisateur')
              .select('nom')
              .eq('id', resultat.id_utilisateur_validateur)
              .single();
            validateur = v;
          }
          return { ...resultat, dossier, validateur };
        })
      );

      setResultats(enrichedResultats);
      // Réinitialiser la sélection lors du changement de page/filtre
      setSelectedIds(new Set());
      setIsSelecting(false);
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

  const handleValidate = async (resultat: ResultatIA, newStatut: 'confirme' | 'infirme' | 'incertain') => {
    try {
      setIsProcessing(true);
      
      // Récupérer l'utilisateur courant pour enregistrer qui a validé
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await (supabase as any)
        .from('resultat_ia')
        .update({ 
          statut_validation: newStatut,
          id_utilisateur_validateur: user?.id || null,
          date_validation: new Date().toISOString(),
        })
        .eq('id', resultat.id);

      if (updateError) throw updateError;

      setSelectedResultat(null);
      loadResultats();
    } catch (err: any) {
      console.error('Erreur validation:', err);
      setError(t('super_admin.resultatsIAValidationError', { message: err.message }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Actions en masse
  const toggleSelectAll = () => {
    if (selectedIds.size === resultats.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(resultats.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMassValidate = async (newStatut: 'confirme' | 'infirme' | 'incertain') => {
    if (selectedIds.size === 0) {
      setError(t('super_admin.resultatsIASelectOne'));
      return;
    }

    try {
      setIsProcessingMass(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const idsArray = Array.from(selectedIds);
      const { error: updateError } = await (supabase as any)
        .from('resultat_ia')
        .update({ 
          statut_validation: newStatut,
          id_utilisateur_validateur: user?.id || null,
          date_validation: new Date().toISOString(),
        })
        .in('id', idsArray);

      if (updateError) throw updateError;

      setSelectedIds(new Set());
      setIsSelecting(false);
      loadResultats();
      const statusKey = newStatut === 'confirme' ? 'resultatsIAConfirmes' : newStatut === 'infirme' ? 'resultatsIAInfirmes' : 'resultatsIAIncertains';
      setSuccess(t('super_admin.resultatsIAMassSuccess', { count: idsArray.length, status: t(`super_admin.${statusKey}`) }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur validation en masse:', err);
      setError(t('super_admin.resultatsIAMassError', { message: err.message }));
    } finally {
      setIsProcessingMass(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      let query = (supabase as any)
        .from('resultat_ia')
        .select(`
          *,
          dossier:dossier_disparition(numero_dossier, id_personne),
          signalement:signalement(numero_signalement),
          demandeur:utilisateur!resultat_ia_declenche_par_fkey(nom, email),
          validateur:utilisateur!resultat_ia_valide_par_fkey(nom, email)
        `)
        .order('date_analyse', { ascending: false });

      if (filterType) query = query.eq('type_analyse', filterType);
      if (filterStatut) query = query.eq('statut_validation', filterStatut);

      const { data: allResultats, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec personne
      const enrichedResultats = await Promise.all(
        (allResultats || []).map(async (r: any) => {
          let dossier = r.dossier;
          if (dossier?.id_personne) {
            const { data: personne } = await (supabase as any)
              .from('personne')
              .select('nom, prenom')
              .eq('id', dossier.id_personne)
              .single();
            dossier = { ...dossier, personne };
          }
          return { ...r, dossier: dossier || null };
        })
      );

      const headers = [
        'ID', 'Type analyse', 'Score confiance', 'Seuil décision', 'Données brutes',
        'Données interprétées', 'Correspondances trouvées', 'Zones prédites',
        'Facteurs clés', 'Recommandations', 'Temps traitement (ms)', 'Modèle IA',
        'Version modèle', 'Statut validation', 'Demandeur', 'Validateur',
        'Date validation', 'Commentaire validation', 'Dossier', 'Personne dossier',
        'Signalement', 'Date analyse'
      ];
      
      const rows = enrichedResultats.map((r: any) => [
        r.id,
        r.type_analyse,
        r.score_confiance || '',
        r.seuil_decision || '',
        r.donnees_brutes ? JSON.stringify(r.donnees_brutes) : '',
        r.donnees_interpretees ? JSON.stringify(r.donnees_interpretees) : '',
        r.correspondances_trouvees ? JSON.stringify(r.correspondances_trouvees) : '',
        r.zones_predites ? JSON.stringify(r.zones_predites) : '',
        r.facteurs_cles ? JSON.stringify(r.facteurs_cles) : '',
        r.recommandations ? JSON.stringify(r.recommandations) : '',
        r.temps_traitement_ms || '',
        r.modele_ia_utilise || '',
        r.version_modele || '',
        r.statut_validation || '',
        r.demandeur ? `${r.demandeur.nom} (${r.demandeur.email})` : '',
        r.validateur ? `${r.validateur.nom} (${r.validateur.email})` : '',
        r.date_validation ? new Date(r.date_validation).toLocaleString('fr-FR') : '',
        r.commentaire_validation || '',
        r.dossier?.numero_dossier || '',
        r.dossier?.personne ? `${r.dossier.personne.prenom || ''} ${r.dossier.personne.nom}`.trim() : '',
        r.signalement?.numero_signalement || '',
        r.date_analyse ? new Date(r.date_analyse).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `resultats_ia_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError(t('super_admin.resultatsIAExportError', { message: err.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reconnaissance_faciale: t('super_admin.resultatsIATypeReconnaissanceFaciale'),
      comparaison_photos: t('super_admin.resultatsIATypeComparaisonPhotos'),
      analyse_signalement: t('super_admin.resultatsIATypeAnalyseSignalement'),
      detection_anomalie: t('super_admin.resultatsIATypeDetectionAnomalie'),
      autre: t('super_admin.resultatsIATypeAutre'),
    };
    return labels[type] || type;
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: t('super_admin.resultatsIAStatutEnAttente'),
      confirme: t('super_admin.resultatsIAStatutConfirme'),
      infirme: t('super_admin.resultatsIAStatutInfirme'),
      incertain: t('super_admin.resultatsIAStatutIncertain'),
      necessite_verification: t('super_admin.resultatsIAStatutNecessiteVerification'),
    };
    return labels[statut] || statut || t('super_admin.resultatsIAStatutEnAttente');
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      confirme: 'success',
      infirme: 'danger',
      incertain: 'warning',
      necessite_verification: 'info',
    };
    return colors[statut] || 'warning';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  };

  return (
    <SuperAdminLayout title={t('super_admin.resultatsIATitle')} activeNav="resultats-ia">
      <div className={styles['sa-resultats-ia']}>
        {/* Stats Cards */}
        <div className={styles['sa-resultats-ia__stats']}>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <Brain size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.total}</span>
              <span className={styles['sa-resultats-ia__stat-label']}>{t('super_admin.resultatsIAStatTotal')}</span>
            </div>
          </div>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.validated}</span>
              <span className={styles['sa-resultats-ia__stat-label']}>{t('super_admin.resultatsIAStatValidated')}</span>
            </div>
          </div>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <AlertCircle size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.pending}</span>
              <span className={styles['sa-resultats-ia__stat-label']}>{t('super_admin.resultatsIAStatPending')}</span>
            </div>
          </div>
          <div className={styles['sa-resultats-ia__stat-card']}>
            <Percent size={24} />
            <div>
              <span className={styles['sa-resultats-ia__stat-value']}>{stats.avgScore}%</span>
              <span className={styles['sa-resultats-ia__stat-label']}>{t('super_admin.resultatsIAStatAvgScore')}</span>
            </div>
          </div>
        </div>

        {/* Filtres et Actions en masse */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className={styles['sa-resultats-ia__filters']} style={{ flex: 1, minWidth: '300px' }}>
            <div className={styles['sa-resultats-ia__filter-group']}>
              <Filter size={16} />
              <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
                <option value="">{t('super_admin.resultatsIAFilterAllTypes')}</option>
                <option value="reconnaissance_faciale">{t('super_admin.resultatsIATypeReconnaissanceFaciale')}</option>
                <option value="comparaison_photos">{t('super_admin.resultatsIATypeComparaisonPhotos')}</option>
                <option value="analyse_signalement">{t('super_admin.resultatsIATypeAnalyseSignalement')}</option>
                <option value="detection_anomalie">{t('super_admin.resultatsIATypeDetectionAnomalie')}</option>
              </select>
            </div>
            <div className={styles['sa-resultats-ia__filter-group']}>
              <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
                <option value="">{t('super_admin.resultatsIAFilterAllStatuses')}</option>
                <option value="en_attente">{t('super_admin.resultatsIAStatutEnAttente')}</option>
                <option value="confirme">{t('super_admin.resultatsIAStatutConfirme')}</option>
                <option value="infirme">{t('super_admin.resultatsIAStatutInfirme')}</option>
                <option value="incertain">{t('super_admin.resultatsIAStatutIncertain')}</option>
                <option value="necessite_verification">{t('super_admin.resultatsIAStatutNecessiteVerification')}</option>
              </select>
            </div>
          </div>
          
          {/* Actions en masse */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={exportToCSV} 
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
              {t('common.exportCsv')}
            </button>
            {!isSelecting ? (
              <button 
                onClick={() => setIsSelecting(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckSquare size={16} />
                {t('super_admin.resultatsIASelectionMultiple')}
              </button>
            ) : (
              <>
                <button 
                  onClick={toggleSelectAll}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {selectedIds.size === resultats.length ? <Square size={16} /> : <CheckSquare size={16} />}
                  {selectedIds.size === resultats.length ? t('super_admin.resultatsIADeselectAll') : t('super_admin.resultatsIASelectAll')} ({selectedIds.size})
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <button 
                      onClick={() => handleMassValidate('confirme')}
                      disabled={isProcessingMass}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isProcessingMass ? <Loader2 size={16} className={styles['sa-resultats-ia__spinner']} /> : <CheckCircle size={16} />}
                      {t('super_admin.resultatsIAValidate')} ({selectedIds.size})
                    </button>
                    <button 
                      onClick={() => handleMassValidate('infirme')}
                      disabled={isProcessingMass}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isProcessingMass ? <Loader2 size={16} className={styles['sa-resultats-ia__spinner']} /> : <X size={16} />}
                      {t('super_admin.resultatsIAInfirm')} ({selectedIds.size})
                    </button>
                    <button 
                      onClick={() => { setIsSelecting(false); setSelectedIds(new Set()); }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#64748b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-resultats-ia__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '0.75rem 1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <CheckCircle size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-resultats-ia__skeletonWrap']}>
            <AdminTableSkeleton columns={7} rows={8} />
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
                    {isSelecting && (
                      <th style={{ width: '40px' }}>
                        <button 
                          onClick={toggleSelectAll}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          {selectedIds.size === resultats.length ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </th>
                    )}
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
                    <tr key={resultat.id} style={selectedIds.has(resultat.id) ? { background: '#eff6ff' } : {}}>
                      {isSelecting && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(resultat.id)}
                            onChange={() => toggleSelect(resultat.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      )}
                      <td>{new Date(resultat.date_analyse).toLocaleDateString('fr-FR')}</td>
                      <td>{getTypeLabel(resultat.type_analyse)}</td>
                      <td>
                        {resultat.dossier ? (
                          <div>
                            <div>{resultat.dossier.numero_dossier}</div>
                            <small>{resultat.dossier.personne ? `${resultat.dossier.personne.prenom || ''} ${resultat.dossier.personne.nom || ''}`.trim() : '-'}</small>
                          </div>
                        ) : '-'}
                      </td>
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
                      <td className={styles['sa-resultats-ia__actions']}>
                        <button onClick={() => setSelectedResultat(resultat)} className={styles['sa-resultats-ia__btn-view']}>
                          <Eye size={16} />
                        </button>
                        {resultat.statut_validation === 'en_attente' && (
                          <>
                            <button 
                              onClick={() => handleValidate(resultat, 'confirme')}
                              className={styles['sa-resultats-ia__btn-validate']}
                              title={t('common.confirm')}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              onClick={() => handleValidate(resultat, 'infirme')}
                              className={styles['sa-resultats-ia__btn-reject']}
                              title={t('super_admin.resultatsIAInfirm')}
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
          <div className={styles['sa-resultats-ia__pagination']}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> {t('common.previous')}
            </button>
            <span>{t('super_admin.resultatsIAPageOf', { current: currentPage, total: totalPages })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              {t('common.next')} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal View */}
        {selectedResultat && (
          <div className={styles['sa-resultats-ia__modal-overlay']} onClick={() => setSelectedResultat(null)}>
            <div className={styles['sa-resultats-ia__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-resultats-ia__modal-header']}>
                <h2>{t('super_admin.resultatsIAModalTitle')}</h2>
                <button type="button" onClick={() => setSelectedResultat(null)} className={styles['sa-resultats-ia__modal-close']} aria-label={t('common.close')}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles['sa-resultats-ia__modal-body']}>
              <div className={styles['sa-resultats-ia__details']}>
                <p><strong>{t('super_admin.resultatsIADetailType')}:</strong> {getTypeLabel(selectedResultat.type_analyse)}</p>
                <p><strong>{t('super_admin.resultatsIADetailDateAnalyse')}:</strong> {new Date(selectedResultat.date_analyse).toLocaleString('fr-FR')}</p>
                <p><strong>{t('super_admin.resultatsIADetailScore')}:</strong> {selectedResultat.score_confiance != null ? `${Math.round(selectedResultat.score_confiance * 100)}%` : '-'}</p>
                <p><strong>{t('super_admin.resultatsIADetailSeuil')}:</strong> {selectedResultat.seuil_decision != null ? `${Math.round(selectedResultat.seuil_decision * 100)}%` : '-'}</p>
                <p><strong>{t('super_admin.resultatsIADetailStatut')}:</strong> {getStatutLabel(selectedResultat.statut_validation || 'en_attente')}</p>
                {selectedResultat.dossier && (
                  <p><strong>{t('super_admin.resultatsIADetailDossier')}:</strong> {selectedResultat.dossier.numero_dossier} - {selectedResultat.dossier.personne ? `${selectedResultat.dossier.personne.prenom || ''} ${selectedResultat.dossier.personne.nom || ''}`.trim() : '-'}</p>
                )}
                {selectedResultat.signalement && (
                  <p><strong>{t('super_admin.resultatsIADetailSignalement')}:</strong> {selectedResultat.signalement.numero_signalement || '-'}</p>
                )}
                {selectedResultat.demandeur && (
                  <p><strong>{t('super_admin.resultatsIADetailDeclenchePar')}:</strong> {selectedResultat.demandeur.nom} ({selectedResultat.demandeur.email})</p>
                )}
                {selectedResultat.validateur && (
                  <p><strong>{t('super_admin.resultatsIADetailValidePar')}:</strong> {selectedResultat.validateur.nom} ({selectedResultat.validateur.email})</p>
                )}
                {selectedResultat.date_validation && (
                  <p><strong>{t('super_admin.resultatsIADetailDateValidation')}:</strong> {new Date(selectedResultat.date_validation).toLocaleString('fr-FR')}</p>
                )}
                {selectedResultat.commentaire_validation && (
                  <p><strong>{t('super_admin.resultatsIADetailCommentaireValidation')}:</strong> {selectedResultat.commentaire_validation}</p>
                )}
                {selectedResultat.modele_ia_utilise && (
                  <p><strong>{t('super_admin.resultatsIADetailModeleIA')}:</strong> {selectedResultat.modele_ia_utilise} {selectedResultat.version_modele ? `(v${selectedResultat.version_modele})` : ''}</p>
                )}
                {selectedResultat.temps_traitement_ms != null && (
                  <p><strong>{t('super_admin.resultatsIADetailTempsTraitement')}:</strong> {selectedResultat.temps_traitement_ms}ms</p>
                )}
                <div className={styles['sa-resultats-ia__json']}>
                  <strong>{t('super_admin.resultatsIADonneesBrutes')}:</strong>
                  <pre>{JSON.stringify(selectedResultat.donnees_brutes, null, 2)}</pre>
                </div>
                {selectedResultat.donnees_interpretees && (
                  <div className={styles['sa-resultats-ia__json']}>
                    <strong>{t('super_admin.resultatsIADonneesInterpretees')}:</strong>
                    <pre>{JSON.stringify(selectedResultat.donnees_interpretees, null, 2)}</pre>
                  </div>
                )}
                {selectedResultat.correspondances_trouvees && (
                  <div className={styles['sa-resultats-ia__json']}>
                    <strong>{t('super_admin.resultatsIACorrespondancesTrouvees')}:</strong>
                    <pre>{JSON.stringify(selectedResultat.correspondances_trouvees, null, 2)}</pre>
                  </div>
                )}
                {selectedResultat.zones_predites && (
                  <div className={styles['sa-resultats-ia__json']}>
                    <strong>{t('super_admin.resultatsIAZonesPredites')}:</strong>
                    <pre>{JSON.stringify(selectedResultat.zones_predites, null, 2)}</pre>
                  </div>
                )}
                {selectedResultat.facteurs_cles && (
                  <div className={styles['sa-resultats-ia__json']}>
                    <strong>{t('super_admin.resultatsIAFacteursCles')}:</strong>
                    <pre>{JSON.stringify(selectedResultat.facteurs_cles, null, 2)}</pre>
                  </div>
                )}
                {selectedResultat.recommandations && (
                  <div className={styles['sa-resultats-ia__json']}>
                    <strong>{t('super_admin.resultatsIARecommandations')}:</strong>
                    <pre>{JSON.stringify(selectedResultat.recommandations, null, 2)}</pre>
                  </div>
                )}
              </div>
              </div>
              <div className={styles['sa-resultats-ia__modal-footer']}>
                {selectedResultat.statut_validation === 'en_attente' && (
                  <>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedResultat, 'infirme')}
                      className={styles['sa-resultats-ia__btn-reject-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-resultats-ia__spinner']} /> : <X size={16} />}
                      {t('super_admin.resultatsIAInfirm')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedResultat, 'incertain')}
                      className={styles['sa-resultats-ia__btn-warning-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-resultats-ia__spinner']} /> : <AlertCircle size={16} />}
                      {t('super_admin.resultatsIAIncertain')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleValidate(selectedResultat, 'confirme')}
                      className={styles['sa-resultats-ia__btn-validate-large']}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={16} className={styles['sa-resultats-ia__spinner']} /> : <CheckCircle size={16} />}
                      {t('common.confirm')}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setSelectedResultat(null)} className={styles['sa-resultats-ia__btn-close']}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminResultatsIAPage;
