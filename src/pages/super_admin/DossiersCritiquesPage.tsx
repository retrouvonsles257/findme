/**
 * =====================================================
 * RETROUVONSLES - Super Admin Dossiers Critiques Page
 * Vue des dossiers avec niveau d'urgence critique
 * Connecté à Supabase table: dossier_disparition
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  AlertTriangle, User, Calendar, MapPin, Clock, Eye, Edit2,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Filter, Download, X, LayoutList, Tag
} from 'lucide-react';
import styles from './DossiersCritiquesPage.module.css';

interface DossierCritique {
  id: string;
  titre: string;
  nom_personne: string;
  prenom_personne?: string;
  date_disparition: string;
  lieu_disparition?: string;
  niveau_urgence: string;
  statut: string;
  age_moment_disparition?: number;
  description?: string;
  created_at: string;
  id_declarant?: string;
  declarant?: { nom: string; email: string };
  _signalements?: number;
}

const ITEMS_PER_PAGE = 10;

export const SuperAdminDossiersCritiquesPage: React.FC = () => {
  const navigate = useNavigate();
  useI18n(); // For future i18n support

  const [dossiers, setDossiers] = useState<DossierCritique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterUrgence, setFilterUrgence] = useState<string>('critique');

  // Modal view
  const [selectedDossier, setSelectedDossier] = useState<DossierCritique | null>(null);

  const loadDossiers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Compter avec filtres
      let countQuery = (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true });
      if (filterUrgence) countQuery = countQuery.eq('niveau_urgence', filterUrgence);
      if (filterStatut) countQuery = countQuery.eq('statut_dossier', filterStatut);
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les dossiers avec pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('dossier_disparition')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterUrgence) query = query.eq('niveau_urgence', filterUrgence);
      if (filterStatut) query = query.eq('statut', filterStatut);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec déclarant, personne et nombre de signalements - RÉCUPÉRER TOUS LES CHAMPS
      const enrichedDossiers = await Promise.all(
        (data || []).map(async (dossier: any) => {
          let declarant, personne;
          
          // Récupérer le créateur (id_utilisateur_createur)
          if (dossier.id_utilisateur_createur) {
            const { data: d } = await (supabase as any)
              .from('utilisateur')
              .select('nom, email')
              .eq('id', dossier.id_utilisateur_createur)
              .single();
            declarant = d;
          }
          
          // Récupérer la personne disparue
          if (dossier.id_personne) {
            const { data: p } = await (supabase as any)
              .from('personne')
              .select('nom, prenom, date_naissance, age_estime_min, age_estime_max')
              .eq('id', dossier.id_personne)
              .single();
            personne = p;
          }
          
          const { count: signalementsCount } = await (supabase as any)
            .from('signalement')
            .select('id', { count: 'exact', head: true })
            .eq('id_dossier', dossier.id);

          // Normaliser le champ de statut pour l'UI (statut_dossier → statut)
          const statut = dossier.statut_dossier || 'en_cours';
          
          // Calculer l'âge si disponible
          let age_moment_disparition: number | undefined;
          if (personne?.date_naissance && dossier.date_disparition) {
            const birthDate = new Date(personne.date_naissance);
            const disappearanceDate = new Date(dossier.date_disparition);
            age_moment_disparition = Math.floor((disappearanceDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
          } else if (personne?.age_estime_min && personne?.age_estime_max) {
            age_moment_disparition = Math.floor((personne.age_estime_min + personne.age_estime_max) / 2);
          }

          return {
            ...dossier,
            statut, // Map statut_dossier from DB to 'statut' property for UI consistency
            declarant,
            personne,
            nom_personne: personne?.nom || '',
            prenom_personne: personne?.prenom || '',
            age_moment_disparition,
            titre: dossier.circonstances?.substring(0, 100) || 'Disparition',
            description: dossier.circonstances,
            _signalements: signalementsCount || 0,
          };
        })
      );

      setDossiers(enrichedDossiers);
    } catch (err: any) {
      console.error('Erreur chargement dossiers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterUrgence, filterStatut]);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      let query = (supabase as any)
        .from('dossier_disparition')
        .select(`
          *,
          personne:personne(nom, prenom, date_naissance),
          createur:utilisateur!dossier_disparition_id_utilisateur_createur_fkey(nom, email)
        `)
        .eq('niveau_urgence', 'critique')
        .order('created_at', { ascending: false });

      if (filterStatut) query = query.eq('statut_dossier', filterStatut);
      if (filterUrgence) query = query.eq('niveau_urgence', filterUrgence);

      const { data: allDossiers, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec compteurs
      const enrichedDossiers = await Promise.all(
        (allDossiers || []).map(async (d: any) => {
          const { count } = await (supabase as any)
            .from('signalement')
            .select('id', { count: 'exact', head: true })
            .eq('id_dossier', d.id);
          return { ...d, nombre_signalements: count || 0 };
        })
      );

      const headers = [
        'ID', 'Numéro dossier', 'Titre', 'Nom personne', 'Prénom personne',
        'Date disparition', 'Lieu disparition', 'Ville', 'Région', 'Type disparition',
        'Statut dossier', 'Niveau urgence', 'Circonstances', 'Créateur', 'Date création'
      ];
      
      const rows = enrichedDossiers.map((d: any) => [
        d.id,
        d.numero_dossier,
        d.titre || '',
        d.personne?.nom || '',
        d.personne?.prenom || '',
        d.date_disparition ? new Date(d.date_disparition).toLocaleString('fr-FR') : '',
        d.lieu_disparition || '',
        d.ville_disparition || '',
        d.region_disparition || '',
        d.type_disparition,
        d.statut_dossier,
        d.niveau_urgence,
        d.circonstances ? d.circonstances.substring(0, 100) : '',
        d.createur ? `${d.createur.nom} (${d.createur.email})` : '',
        d.created_at ? new Date(d.created_at).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `dossiers_critiques_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgenceColor = (niveau: string) => {
    const colors: Record<string, string> = {
      critique: 'danger',
      elevee: 'warning',
      normale: 'info',
      basse: 'default',
    };
    return colors[niveau] || 'default';
  };

  const getUrgenceLabel = (niveau: string) => {
    const labels: Record<string, string> = {
      critique: 'CRITIQUE',
      elevee: 'Élevée',
      normale: 'Normale',
      basse: 'Basse',
    };
    return labels[niveau] || niveau;
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_cours: 'En cours',
      retrouve_vivant: 'Retrouvé vivant',
      retrouve_decede: 'Retrouvé décédé',
      suspendu: 'Suspendu',
      classe_sans_suite: 'Classé sans suite',
      transfere: 'Transféré',
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_cours: 'warning',
      retrouve_vivant: 'success',
      retrouve_decede: 'danger',
      suspendu: 'info',
      classe_sans_suite: 'default',
      transfere: 'info',
    };
    return colors[statut] || 'default';
  };

  const getDaysSince = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <SuperAdminLayout title="Dossiers Critiques" activeNav="dossiers-critiques">
      <div className={styles['sa-dossiers-critiques']}>
        {/* Stats */}
        <div className={styles['sa-dossiers-critiques__stats']}>
          <div className={`${styles['sa-dossiers-critiques__stat-card']} ${styles['sa-dossiers-critiques__stat-card--danger']}`}>
            <AlertTriangle size={24} />
            <div>
              <span className={styles['sa-dossiers-critiques__stat-value']}>{totalCount}</span>
              <span className={styles['sa-dossiers-critiques__stat-label']}>
                {filterUrgence === 'critique' ? 'Critiques' : 'Dossiers'}
              </span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-dossiers-critiques__filters']}>
          <div className={styles['sa-dossiers-critiques__filter-group']}>
            <Filter size={16} />
            <select value={filterUrgence} onChange={(e) => { setFilterUrgence(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous niveaux</option>
              <option value="critique">Critique</option>
              <option value="elevee">Élevée</option>
              <option value="normale">Normale</option>
              <option value="basse">Basse</option>
            </select>
          </div>
          <div className={styles['sa-dossiers-critiques__filter-group']}>
            <Tag size={16} />
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous statuts</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="clos">Clos</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
          <button type="button" onClick={exportToCSV} disabled={isLoading} className={styles['sa-dossiers-critiques__btn-export']}>
            <Download size={16} />
            Exporter CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-dossiers-critiques__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-dossiers-critiques__loading']}>
            <Loader2 size={32} className={styles['sa-dossiers-critiques__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-dossiers-critiques__list']}>
            {dossiers.length === 0 ? (
              <div className={styles['sa-dossiers-critiques__empty']}>
                <AlertTriangle size={48} />
                <p>Aucun dossier trouvé</p>
              </div>
            ) : (
              dossiers.map((dossier) => (
                <div key={dossier.id} className={`${styles['sa-dossiers-critiques__card']} ${dossier.niveau_urgence === 'critique' ? styles['sa-dossiers-critiques__card--critical'] : ''}`}>
                  <div className={styles['sa-dossiers-critiques__card-header']}>
                    <div className={styles['sa-dossiers-critiques__card-badges']}>
                      <span className={`${styles['sa-dossiers-critiques__badge']} ${styles[`sa-dossiers-critiques__badge--${getUrgenceColor(dossier.niveau_urgence)}`]}`}>
                        {dossier.niveau_urgence === 'critique' && <AlertTriangle size={12} />}
                        {getUrgenceLabel(dossier.niveau_urgence)}
                      </span>
                      <span className={`${styles['sa-dossiers-critiques__badge']} ${styles[`sa-dossiers-critiques__badge--${getStatutColor(dossier.statut)}`]}`}>
                        {getStatutLabel(dossier.statut)}
                      </span>
                    </div>
                    <div className={styles['sa-dossiers-critiques__days']}>
                      <Clock size={14} />
                      {getDaysSince(dossier.date_disparition)} jours
                    </div>
                  </div>
                  
                  <h3 className={styles['sa-dossiers-critiques__card-title']}>
                    <User size={18} />
                    {dossier.prenom_personne} {dossier.nom_personne}
                    {dossier.age_moment_disparition && <small>({dossier.age_moment_disparition} ans)</small>}
                  </h3>
                  
                  <p className={styles['sa-dossiers-critiques__card-subtitle']}>{dossier.titre}</p>
                  
                  <div className={styles['sa-dossiers-critiques__card-info']}>
                    <div className={styles['sa-dossiers-critiques__info-item']}>
                      <Calendar size={14} />
                      <span>Disparu(e) le {new Date(dossier.date_disparition).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {dossier.lieu_disparition && (
                      <div className={styles['sa-dossiers-critiques__info-item']}>
                        <MapPin size={14} />
                        <span>{dossier.lieu_disparition}</span>
                      </div>
                    )}
                    <div className={styles['sa-dossiers-critiques__info-item']}>
                      <AlertCircle size={14} />
                      <span>{dossier._signalements} signalement(s)</span>
                    </div>
                  </div>
                  
                  <div className={styles['sa-dossiers-critiques__card-actions']}>
                    <button type="button" onClick={() => navigate(`/super-admin/dossiers/${dossier.id}`)}>
                      <Eye size={16} />
                      Voir détail complet
                    </button>
                    <button type="button" onClick={() => setSelectedDossier(dossier)}>
                      <LayoutList size={16} />
                      Aperçu rapide
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles['sa-dossiers-critiques__pagination']}>
            <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal View */}
        {selectedDossier && (
          <div className={styles['sa-dossiers-critiques__modal-overlay']} onClick={() => setSelectedDossier(null)}>
            <div className={styles['sa-dossiers-critiques__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-dossiers-critiques__modal-header']}>
                <h2>{selectedDossier.prenom_personne || ''} {selectedDossier.nom_personne}</h2>
                <button type="button" onClick={() => setSelectedDossier(null)} className={styles['sa-dossiers-critiques__modal-close']} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
              <div className={styles['sa-dossiers-critiques__modal-body']}>
                <div className={styles['sa-dossiers-critiques__details']}>
                  <p><strong>Titre:</strong> {selectedDossier.titre || '—'}</p>
                  <p><strong>Niveau urgence:</strong> {getUrgenceLabel(selectedDossier.niveau_urgence)}</p>
                  <p><strong>Statut:</strong> {getStatutLabel(selectedDossier.statut)}</p>
                  <p><strong>Date disparition:</strong> {new Date(selectedDossier.date_disparition).toLocaleDateString('fr-FR')}</p>
                  {selectedDossier.lieu_disparition && <p><strong>Lieu:</strong> {selectedDossier.lieu_disparition}</p>}
                  {selectedDossier.age_moment_disparition != null && <p><strong>Âge:</strong> {selectedDossier.age_moment_disparition} ans</p>}
                  {selectedDossier.description && <p><strong>Description:</strong> {selectedDossier.description}</p>}
                  {selectedDossier.declarant && <p><strong>Déclarant:</strong> {selectedDossier.declarant.nom} ({selectedDossier.declarant.email})</p>}
                  <p><strong>Signalements:</strong> {selectedDossier._signalements ?? 0}</p>
                  <p><strong>Créé le:</strong> {new Date(selectedDossier.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className={styles['sa-dossiers-critiques__modal-actions']}>
                  <button type="button" className={styles['sa-dossiers-critiques__modal-btn-primary']} onClick={() => navigate(`/super-admin/dossiers/${selectedDossier.id}`)}>
                    <Eye size={16} /> Voir détail complet
                  </button>
                  <button type="button" className={styles['sa-dossiers-critiques__modal-btn-secondary']} onClick={() => { setSelectedDossier(null); navigate(`/super-admin/dossiers?edit=${selectedDossier.id}`); }}>
                    <Edit2 size={16} /> Modifier
                  </button>
                  <button type="button" className={styles['sa-dossiers-critiques__modal-btn-close']} onClick={() => setSelectedDossier(null)}>
                    <X size={16} /> Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDossiersCritiquesPage;
