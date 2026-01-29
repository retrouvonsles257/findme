/**
 * =====================================================
 * RETROUVONSLES - Super Admin Liens Filiation Page
 * Gestion des liens de filiation
 * Connecté à Supabase table: lien_filiation
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Users, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Download, X, Eye, CheckCircle
} from 'lucide-react';
import styles from './SystemLogsPage.module.css';

interface LienFiliation {
  id: string;
  type_lien: string;
  id_personne_source: string;
  id_personne_cible: string;
  nature_filiation: string;
  statut_verification: string;
  type_preuve: string;
  score_compatibilite_physique?: number;
  ligne_directe: boolean;
  visible_public: boolean;
  created_at: string;
  updated_at?: string;
  personne_source?: { nom: string; prenom?: string };
  personne_cible?: { nom: string; prenom?: string };
}

const ITEMS_PER_PAGE = 20;

export const SuperAdminLiensFiliationPage: React.FC = () => {
  useI18n();

  const [liens, setLiens] = useState<LienFiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLien, setSelectedLien] = useState<LienFiliation | null>(null);
  
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');

  const loadLiens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let countQuery = (supabase as any).from('lien_filiation').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_lien', filterType);
      if (filterStatut) countQuery = countQuery.eq('statut_verification', filterStatut);
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('lien_filiation')
        .select(`
          *,
          personne_source:personne!lien_filiation_id_personne_source_fkey(nom, prenom),
          personne_cible:personne!lien_filiation_id_personne_cible_fkey(nom, prenom)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_lien', filterType);
      if (filterStatut) query = query.eq('statut_verification', filterStatut);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setLiens(data || []);
    } catch (err: any) {
      console.error('Erreur chargement liens:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterStatut]);

  useEffect(() => {
    loadLiens();
  }, [loadLiens]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pere_biologique: 'Père biologique',
      mere_biologique: 'Mère biologique',
      enfant_biologique: 'Enfant biologique',
      frere_biologique: 'Frère biologique',
      soeur_biologique: 'Sœur biologique',
    };
    return labels[type] || type;
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type lien', 'Personne source', 'Personne cible', 'Nature', 'Statut vérification', 'Type preuve', 'Score compatibilité', 'Ligne directe', 'Visible public', 'Date création'];
    const rows = liens.map(l => [
      l.id,
      getTypeLabel(l.type_lien),
      l.personne_source ? `${l.personne_source.prenom || ''} ${l.personne_source.nom}`.trim() : '-',
      l.personne_cible ? `${l.personne_cible.prenom || ''} ${l.personne_cible.nom}`.trim() : '-',
      l.nature_filiation,
      l.statut_verification,
      l.type_preuve,
      l.score_compatibilite_physique ? l.score_compatibilite_physique.toString() : '-',
      l.ligne_directe ? 'Oui' : 'Non',
      l.visible_public ? 'Oui' : 'Non',
      new Date(l.created_at).toLocaleString('fr-FR'),
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `liens_filiation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SuperAdminLayout title="Liens de Filiation" activeNav="liens-filiation">
      <div className={styles['sa-system-logs']}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Gestion des Liens de Filiation</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Consultez et gérez tous les liens de filiation</p>
        </div>

        <div className={styles['sa-system-logs__filters']}>
          <div className={styles['sa-system-logs__filter-group']}>
            <Filter size={16} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous types</option>
              <option value="pere_biologique">Père biologique</option>
              <option value="mere_biologique">Mère biologique</option>
              <option value="enfant_biologique">Enfant biologique</option>
              <option value="frere_biologique">Frère biologique</option>
              <option value="soeur_biologique">Sœur biologique</option>
              <option value="conjoint">Conjoint</option>
            </select>
          </div>
          <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous statuts</option>
            <option value="confirme_officiellement">Confirmé officiellement</option>
            <option value="confirme_genetiquement">Confirmé génétiquement</option>
            <option value="declare_famille">Déclaré famille</option>
            <option value="suppose_ia">Supposé IA</option>
            <option value="en_verification">En vérification</option>
            <option value="conteste">Contesté</option>
            <option value="invalide">Invalide</option>
          </select>
          <button onClick={exportToCSV} className={styles['sa-system-logs__export-btn']}>
            <Download size={16} />
            Exporter CSV
          </button>
        </div>

        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {isLoading ? (
          <div className={styles['sa-system-logs__loading']}>
            <Loader2 size={32} className={styles['sa-system-logs__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-system-logs__table-wrapper']}>
            {liens.length === 0 ? (
              <div className={styles['sa-system-logs__empty']}>
                <Users size={48} />
                <p>Aucun lien trouvé</p>
              </div>
            ) : (
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Personne source</th>
                    <th>Personne cible</th>
                    <th>Nature</th>
                    <th>Statut</th>
                    <th>Score</th>
                    <th>Ligne directe</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liens.map((lien) => (
                    <tr key={lien.id}>
                      <td>{getTypeLabel(lien.type_lien)}</td>
                      <td>{lien.personne_source ? `${lien.personne_source.prenom || ''} ${lien.personne_source.nom}`.trim() : '-'}</td>
                      <td>{lien.personne_cible ? `${lien.personne_cible.prenom || ''} ${lien.personne_cible.nom}`.trim() : '-'}</td>
                      <td>{lien.nature_filiation}</td>
                      <td>
                        <span className={`${styles['sa-system-logs__badge']} ${
                          lien.statut_verification === 'confirme_officiellement' || lien.statut_verification === 'confirme_genetiquement' 
                            ? styles['sa-system-logs__badge--success']
                            : lien.statut_verification === 'en_verification'
                            ? styles['sa-system-logs__badge--warning']
                            : styles['sa-system-logs__badge--danger']
                        }`}>
                          {lien.statut_verification}
                        </span>
                      </td>
                      <td>{lien.score_compatibilite_physique ? `${lien.score_compatibilite_physique}%` : '-'}</td>
                      <td>{lien.ligne_directe ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : '-'}</td>
                      <td>
                        <button onClick={() => setSelectedLien(lien)} title="Voir">
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

        {totalPages > 1 && (
          <div className={styles['sa-system-logs__pagination']}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}

        {selectedLien && (
          <div className={styles['sa-system-logs__modal-overlay']} onClick={() => setSelectedLien(null)}>
            <div className={styles['sa-system-logs__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-logs__modal-header']}>
                <h2>Détails du lien de filiation</h2>
                <button onClick={() => setSelectedLien(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-system-logs__modal-body']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><strong>Type:</strong> {getTypeLabel(selectedLien.type_lien)}</div>
                  <div><strong>Personne source:</strong> {selectedLien.personne_source ? `${selectedLien.personne_source.prenom || ''} ${selectedLien.personne_source.nom}`.trim() : '-'}</div>
                  <div><strong>Personne cible:</strong> {selectedLien.personne_cible ? `${selectedLien.personne_cible.prenom || ''} ${selectedLien.personne_cible.nom}`.trim() : '-'}</div>
                  <div><strong>Nature:</strong> {selectedLien.nature_filiation}</div>
                  <div><strong>Statut vérification:</strong> {selectedLien.statut_verification}</div>
                  <div><strong>Type preuve:</strong> {selectedLien.type_preuve}</div>
                  {selectedLien.score_compatibilite_physique && (
                    <div><strong>Score compatibilité:</strong> {selectedLien.score_compatibilite_physique}%</div>
                  )}
                  <div><strong>Ligne directe:</strong> {selectedLien.ligne_directe ? 'Oui' : 'Non'}</div>
                  <div><strong>Visible public:</strong> {selectedLien.visible_public ? 'Oui' : 'Non'}</div>
                  <div><strong>Date création:</strong> {new Date(selectedLien.created_at).toLocaleString('fr-FR')}</div>
                </div>
              </div>
              <div className={styles['sa-system-logs__modal-footer']}>
                <button onClick={() => setSelectedLien(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminLiensFiliationPage;
