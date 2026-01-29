/**
 * =====================================================
 * RETROUVONSLES - Super Admin Commentaires Page
 * Gestion des commentaires confidentiels
 * Connecté à Supabase table: commentaire
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  MessageSquare, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Download, X, Eye, Lock
} from 'lucide-react';
import styles from './SystemLogsPage.module.css';

interface Commentaire {
  id: string;
  contenu: string;
  type_commentaire: string;
  confidentiel: boolean;
  modifie: boolean;
  id_dossier?: string;
  id_utilisateur?: string;
  id_commentaire_parent?: string;
  created_at: string;
  updated_at?: string;
  dossier?: { numero_dossier: string };
  utilisateur?: { nom: string; email: string };
  parent?: { contenu: string };
}

const ITEMS_PER_PAGE = 20;

export const SuperAdminCommentairesPage: React.FC = () => {
  useI18n();

  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommentaire, setSelectedCommentaire] = useState<Commentaire | null>(null);
  
  const [filterType, setFilterType] = useState<string>('');
  const [filterConfidentiel, setFilterConfidentiel] = useState<string>('');

  const loadCommentaires = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let countQuery = (supabase as any).from('commentaire').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_commentaire', filterType);
      if (filterConfidentiel !== '') countQuery = countQuery.eq('confidentiel', filterConfidentiel === 'true');
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('commentaire')
        .select(`
          *,
          dossier:dossier_disparition(numero_dossier),
          utilisateur:utilisateur(nom, email),
          parent:commentaire!commentaire_id_commentaire_parent_fkey(contenu)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_commentaire', filterType);
      if (filterConfidentiel !== '') query = query.eq('confidentiel', filterConfidentiel === 'true');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setCommentaires(data || []);
    } catch (err: any) {
      console.error('Erreur chargement commentaires:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterConfidentiel]);

  useEffect(() => {
    loadCommentaires();
  }, [loadCommentaires]);

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Contenu', 'Confidentiel', 'Modifié', 'Dossier', 'Utilisateur', 'Date création'];
    const rows = commentaires.map(c => [
      c.id,
      c.type_commentaire,
      c.contenu.substring(0, 100),
      c.confidentiel ? 'Oui' : 'Non',
      c.modifie ? 'Oui' : 'Non',
      c.dossier?.numero_dossier || '-',
      c.utilisateur?.email || '-',
      new Date(c.created_at).toLocaleString('fr-FR'),
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commentaires_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SuperAdminLayout title="Commentaires Confidentiels" activeNav="commentaires">
      <div className={styles['sa-system-logs']}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Commentaires Confidentiels</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Consultez tous les commentaires confidentiels</p>
        </div>

        <div className={styles['sa-system-logs__filters']}>
          <div className={styles['sa-system-logs__filter-group']}>
            <Filter size={16} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous types</option>
              <option value="note_enquete">Note enquête</option>
              <option value="coordination">Coordination</option>
              <option value="info_complementaire">Info complémentaire</option>
              <option value="mise_a_jour">Mise à jour</option>
              <option value="question">Question</option>
              <option value="reponse">Réponse</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <select value={filterConfidentiel} onChange={(e) => { setFilterConfidentiel(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous</option>
            <option value="true">Confidentiels</option>
            <option value="false">Publics</option>
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
            {commentaires.length === 0 ? (
              <div className={styles['sa-system-logs__empty']}>
                <MessageSquare size={48} />
                <p>Aucun commentaire trouvé</p>
              </div>
            ) : (
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Contenu</th>
                    <th>Confidentiel</th>
                    <th>Dossier</th>
                    <th>Utilisateur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commentaires.map((commentaire) => (
                    <tr key={commentaire.id}>
                      <td>{new Date(commentaire.created_at).toLocaleString('fr-FR')}</td>
                      <td>{commentaire.type_commentaire}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {commentaire.contenu}
                      </td>
                      <td>{commentaire.confidentiel ? <Lock size={16} style={{ color: '#ef4444' }} /> : '-'}</td>
                      <td>{commentaire.dossier?.numero_dossier || '-'}</td>
                      <td>{commentaire.utilisateur?.email || '-'}</td>
                      <td>
                        <button onClick={() => setSelectedCommentaire(commentaire)} title="Voir">
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

        {selectedCommentaire && (
          <div className={styles['sa-system-logs__modal-overlay']} onClick={() => setSelectedCommentaire(null)}>
            <div className={styles['sa-system-logs__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-logs__modal-header']}>
                <h2>Détails du commentaire</h2>
                <button onClick={() => setSelectedCommentaire(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-system-logs__modal-body']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><strong>Type:</strong> {selectedCommentaire.type_commentaire}</div>
                  <div><strong>Contenu:</strong> <p>{selectedCommentaire.contenu}</p></div>
                  <div><strong>Confidentiel:</strong> {selectedCommentaire.confidentiel ? 'Oui' : 'Non'}</div>
                  <div><strong>Modifié:</strong> {selectedCommentaire.modifie ? 'Oui' : 'Non'}</div>
                  <div><strong>Date création:</strong> {new Date(selectedCommentaire.created_at).toLocaleString('fr-FR')}</div>
                  {selectedCommentaire.updated_at && (
                    <div><strong>Date modification:</strong> {new Date(selectedCommentaire.updated_at).toLocaleString('fr-FR')}</div>
                  )}
                  {selectedCommentaire.dossier && (
                    <div><strong>Dossier:</strong> {selectedCommentaire.dossier.numero_dossier}</div>
                  )}
                  {selectedCommentaire.utilisateur && (
                    <div><strong>Utilisateur:</strong> {selectedCommentaire.utilisateur.nom} ({selectedCommentaire.utilisateur.email})</div>
                  )}
                  {selectedCommentaire.parent && (
                    <div><strong>Réponse à:</strong> {selectedCommentaire.parent.contenu.substring(0, 100)}...</div>
                  )}
                </div>
              </div>
              <div className={styles['sa-system-logs__modal-footer']}>
                <button onClick={() => setSelectedCommentaire(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminCommentairesPage;
