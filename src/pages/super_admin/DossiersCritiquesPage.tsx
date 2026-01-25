/**
 * =====================================================
 * RETROUVONSLES - Super Admin Dossiers Critiques Page
 * Vue des dossiers avec niveau d'urgence critique
 * Connecté à Supabase table: dossier_disparition
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  AlertTriangle, User, Calendar, MapPin, Clock, Eye, 
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Filter
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
      if (filterStatut) countQuery = countQuery.eq('statut', filterStatut);
      
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

      // Enrichir avec déclarant et nombre de signalements
      const enrichedDossiers = await Promise.all(
        (data || []).map(async (dossier: DossierCritique) => {
          let declarant;
          if (dossier.id_declarant) {
            const { data: d } = await (supabase as any)
              .from('utilisateur')
              .select('nom, email')
              .eq('id', dossier.id_declarant)
              .single();
            declarant = d;
          }
          
          const { count: signalementsCount } = await (supabase as any)
            .from('signalement')
            .select('id', { count: 'exact', head: true })
            .eq('id_dossier', dossier.id);

          return { ...dossier, declarant, _signalements: signalementsCount || 0 };
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
      resolu: 'Résolu',
      clos: 'Clos',
      archive: 'Archivé',
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_cours: 'warning',
      resolu: 'success',
      clos: 'default',
      archive: 'info',
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
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous statuts</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="clos">Clos</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
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
                    <button onClick={() => setSelectedDossier(dossier)}>
                      <Eye size={16} />
                      Voir détails
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
        {selectedDossier && (
          <div className={styles['sa-dossiers-critiques__modal-overlay']} onClick={() => setSelectedDossier(null)}>
            <div className={styles['sa-dossiers-critiques__modal']} onClick={(e) => e.stopPropagation()}>
              <h2>{selectedDossier.prenom_personne} {selectedDossier.nom_personne}</h2>
              <div className={styles['sa-dossiers-critiques__details']}>
                <p><strong>Titre:</strong> {selectedDossier.titre}</p>
                <p><strong>Niveau urgence:</strong> {getUrgenceLabel(selectedDossier.niveau_urgence)}</p>
                <p><strong>Statut:</strong> {getStatutLabel(selectedDossier.statut)}</p>
                <p><strong>Date disparition:</strong> {new Date(selectedDossier.date_disparition).toLocaleDateString('fr-FR')}</p>
                {selectedDossier.lieu_disparition && <p><strong>Lieu:</strong> {selectedDossier.lieu_disparition}</p>}
                {selectedDossier.age_moment_disparition && <p><strong>Âge:</strong> {selectedDossier.age_moment_disparition} ans</p>}
                {selectedDossier.description && <p><strong>Description:</strong> {selectedDossier.description}</p>}
                {selectedDossier.declarant && <p><strong>Déclarant:</strong> {selectedDossier.declarant.nom} ({selectedDossier.declarant.email})</p>}
                <p><strong>Signalements:</strong> {selectedDossier._signalements}</p>
                <p><strong>Créé le:</strong> {new Date(selectedDossier.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <button onClick={() => setSelectedDossier(null)}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDossiersCritiquesPage;
