/**
 * =====================================================
 * RETROUVONSLES - Super Admin Documents Page
 * Gestion des documents joints
 * Connecté à Supabase table: document
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  FileText, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Download, X, Eye, Lock, FileDown
} from 'lucide-react';
import styles from './SystemLogsPage.module.css';

interface Document {
  id: string;
  nom_fichier: string;
  type_document: string;
  url_fichier: string;
  taille_octets?: number;
  format_fichier?: string;
  description?: string;
  confidentiel: boolean;
  date_upload: string;
  id_dossier?: string;
  id_signalement?: string;
  dossier?: { numero_dossier: string };
  signalement?: { numero_signalement?: string };
  uploader?: { nom: string; email: string };
}

const ITEMS_PER_PAGE = 20;

export const SuperAdminDocumentsPage: React.FC = () => {
  useI18n(); // i18n init only, t not used

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const [filterType, setFilterType] = useState<string>('');
  const [filterConfidentiel, setFilterConfidentiel] = useState<string>('');

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let countQuery = (supabase as any).from('document').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_document', filterType);
      if (filterConfidentiel !== '') countQuery = countQuery.eq('confidentiel', filterConfidentiel === 'true');
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('document')
        .select(`
          *,
          dossier:dossier_disparition(numero_dossier),
          signalement:signalement(numero_signalement),
          uploader:utilisateur!document_uploade_par_fkey(nom, email)
        `)
        .order('date_upload', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_document', filterType);
      if (filterConfidentiel !== '') query = query.eq('confidentiel', filterConfidentiel === 'true');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setDocuments(data || []);
    } catch (err: any) {
      console.error('Erreur chargement documents:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterConfidentiel]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Nom fichier', 'Type', 'Format', 'Taille', 'Confidentiel', 'Dossier', 'Signalement', 'Uploadé par', 'Date upload'];
    const rows = documents.map(d => [
      d.id,
      d.nom_fichier,
      d.type_document,
      d.format_fichier || '-',
      formatFileSize(d.taille_octets),
      d.confidentiel ? 'Oui' : 'Non',
      d.dossier?.numero_dossier || '-',
      d.signalement?.numero_signalement || '-',
      d.uploader?.email || '-',
      new Date(d.date_upload).toLocaleString('fr-FR'),
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `documents_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SuperAdminLayout title="Gestion Documents" activeNav="documents">
      <div className={styles['sa-system-logs']}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Gestion des Documents</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Consultez et gérez tous les documents joints</p>
        </div>

        <div className={styles['sa-system-logs__filters']}>
          <div className={styles['sa-system-logs__filter-group']}>
            <Filter size={16} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous types</option>
              <option value="plainte_officielle">Plainte officielle</option>
              <option value="rapport_police">Rapport police</option>
              <option value="temoignage_ecrit">Témoignage écrit</option>
              <option value="certificat_medical">Certificat médical</option>
              <option value="piece_identite">Pièce identité</option>
              <option value="acte_naissance">Acte naissance</option>
              <option value="photo_document">Photo document</option>
              <option value="carte_geographique">Carte géographique</option>
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
            {documents.length === 0 ? (
              <div className={styles['sa-system-logs__empty']}>
                <FileText size={48} />
                <p>Aucun document trouvé</p>
              </div>
            ) : (
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Nom fichier</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Taille</th>
                    <th>Confidentiel</th>
                    <th>Dossier</th>
                    <th>Uploadé par</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.nom_fichier}</td>
                      <td>{doc.type_document}</td>
                      <td>{doc.format_fichier || '-'}</td>
                      <td>{formatFileSize(doc.taille_octets)}</td>
                      <td>{doc.confidentiel ? <Lock size={16} style={{ color: '#ef4444' }} /> : '-'}</td>
                      <td>{doc.dossier?.numero_dossier || '-'}</td>
                      <td>{doc.uploader?.email || '-'}</td>
                      <td>{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <button onClick={() => setSelectedDocument(doc)} title="Voir">
                          <Eye size={16} />
                        </button>
                        <a href={doc.url_fichier} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem' }} title="Télécharger">
                          <FileDown size={16} />
                        </a>
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

        {selectedDocument && (
          <div className={styles['sa-system-logs__modal-overlay']} onClick={() => setSelectedDocument(null)}>
            <div className={styles['sa-system-logs__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-logs__modal-header']}>
                <h2>Détails du document</h2>
                <button onClick={() => setSelectedDocument(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-system-logs__modal-body']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><strong>Nom fichier:</strong> {selectedDocument.nom_fichier}</div>
                  <div><strong>Type:</strong> {selectedDocument.type_document}</div>
                  <div><strong>Format:</strong> {selectedDocument.format_fichier || '-'}</div>
                  <div><strong>Taille:</strong> {formatFileSize(selectedDocument.taille_octets)}</div>
                  {selectedDocument.description && <div><strong>Description:</strong> {selectedDocument.description}</div>}
                  <div><strong>Confidentiel:</strong> {selectedDocument.confidentiel ? 'Oui' : 'Non'}</div>
                  <div><strong>Date upload:</strong> {new Date(selectedDocument.date_upload).toLocaleString('fr-FR')}</div>
                  {selectedDocument.dossier && (
                    <div><strong>Dossier:</strong> {selectedDocument.dossier.numero_dossier}</div>
                  )}
                  {selectedDocument.signalement && (
                    <div><strong>Signalement:</strong> {selectedDocument.signalement.numero_signalement}</div>
                  )}
                  {selectedDocument.uploader && (
                    <div><strong>Uploadé par:</strong> {selectedDocument.uploader.nom} ({selectedDocument.uploader.email})</div>
                  )}
                </div>
              </div>
              <div className={styles['sa-system-logs__modal-footer']}>
                <a href={selectedDocument.url_fichier} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', background: '#667eea', color: 'white', borderRadius: '0.375rem', textDecoration: 'none' }}>
                  <FileDown size={16} />
                  Télécharger
                </a>
                <button onClick={() => setSelectedDocument(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDocumentsPage;
