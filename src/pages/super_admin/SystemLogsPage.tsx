/**
 * ==============================================
 * RETROUVONSLES - Super Admin System Logs Page
 * Journaux système avec connexion Supabase
 * ==============================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { FileText, Clock, User, Filter, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import styles from './SystemLogsPage.module.css';

interface JournalActivite {
  id: string;
  id_utilisateur?: string;
  type_action: string;
  action_detaillee?: string;
  description: string;
  donnees_avant?: Record<string, any>; // JSONB
  donnees_apres?: Record<string, any>; // JSONB
  ip_utilisateur?: string; // INET
  user_agent?: string;
  localisation_action?: string;
  date_action: string;
  id_dossier?: string;
  id_signalement?: string;
  id_alerte?: string;
  utilisateur?: { nom: string; email: string };
  dossier?: { numero_dossier: string };
  signalement?: { numero_signalement?: string };
  alerte?: { numero_alerte?: string; titre: string };
}

type TypeAction = 'connexion' | 'deconnexion' | 'creation' | 'modification' | 'suppression' | 'consultation' | 'signalement' | 'alerte' | 'autre';

const typeActionOptions: TypeAction[] = ['connexion', 'deconnexion', 'creation', 'modification', 'suppression', 'consultation', 'signalement', 'alerte', 'autre'];

const ITEMS_PER_PAGE = 20;

export const SuperAdminSystemLogsPage: React.FC = () => {
  const { t } = useI18n();

  const [logs, setLogs] = useState<JournalActivite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<JournalActivite | null>(null);
  
  // Filtres
  const [filterType, setFilterType] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Compter le total
      let countQuery = (supabase as any).from('journal_activite').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_action', filterType);
      if (filterDateFrom) countQuery = countQuery.gte('date_action', filterDateFrom);
      if (filterDateTo) countQuery = countQuery.lte('date_action', `${filterDateTo}T23:59:59`);
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les logs avec pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('journal_activite')
        .select('*')
        .order('date_action', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_action', filterType);
      if (filterDateFrom) query = query.gte('date_action', filterDateFrom);
      if (filterDateTo) query = query.lte('date_action', `${filterDateTo}T23:59:59`);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Les données sont déjà enrichies par Supabase avec les relations
      setLogs(data || []);
    } catch (err: any) {
      console.error('Erreur chargement logs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      connexion: 'success',
      deconnexion: 'info',
      creation: 'primary',
      modification: 'warning',
      suppression: 'danger',
      consultation: 'info',
      signalement: 'warning',
      alerte: 'danger',
      autre: 'default',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      connexion: 'Connexion',
      deconnexion: 'Déconnexion',
      creation: 'Création',
      modification: 'Modification',
      suppression: 'Suppression',
      consultation: 'Consultation',
      signalement: 'Signalement',
      alerte: 'Alerte',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const resetFilters = () => {
    setFilterType('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger tous les logs avec les filtres actuels (sans pagination)
      let query = (supabase as any)
        .from('journal_activite')
        .select('*')
        .order('date_action', { ascending: false });

      if (filterType) query = query.eq('type_action', filterType);
      if (filterDateFrom) query = query.gte('date_action', filterDateFrom);
      if (filterDateTo) query = query.lte('date_action', `${filterDateTo}T23:59:59`);

      const { data: allLogs, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec les utilisateurs
      const enrichedLogs = await Promise.all(
        (allLogs || []).map(async (log: JournalActivite) => {
          if (log.id_utilisateur) {
            const { data: user } = await (supabase as any)
              .from('utilisateur')
              .select('nom, email')
              .eq('id', log.id_utilisateur)
              .single();
            return { ...log, utilisateur: user };
          }
          return log;
        })
      );

      // Créer le CSV
      const headers = ['Date', 'Type', 'Utilisateur', 'Email', 'Description', 'IP'];
      const rows = enrichedLogs.map(log => [
        new Date(log.date_action).toLocaleString('fr-FR'),
        log.type_action,
        log.utilisateur?.nom || '-',
        log.utilisateur?.email || '-',
        log.description || '-',
        log.ip_utilisateur || '-',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminLayout title={t('super_admin.systemLogsTitle')} activeNav="system-logs">
      <div className={styles['sa-system-logs']}>
        {/* Filtres */}
        <div className={styles['sa-system-logs__filters']}>
          <div className={styles['sa-system-logs__filter-group']}>
            <label><Filter size={16} /> Type d'action</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous</option>
              {typeActionOptions.map((type) => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div className={styles['sa-system-logs__filter-group']}>
            <label><Clock size={16} /> Du</label>
            <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className={styles['sa-system-logs__filter-group']}>
            <label><Clock size={16} /> Au</label>
            <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className={styles['sa-system-logs__filter-btn']} onClick={resetFilters}>
            <RefreshCw size={16} />
            Réinitialiser
          </button>
          <button className={styles['sa-system-logs__export-btn']} onClick={exportToCSV} disabled={isLoading}>
            <Download size={16} />
            Exporter CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className={styles['sa-system-logs__stats']}>
          <span>{totalCount} entrées au total</span>
          <span>Page {currentPage} sur {totalPages || 1}</span>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-system-logs__loading']}>
            <Loader2 size={32} className={styles['sa-system-logs__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-system-logs__table-wrapper']}>
            {logs.length === 0 ? (
              <div className={styles['sa-system-logs__empty']}>
                <FileText size={48} />
                <p>Aucune entrée dans le journal</p>
              </div>
            ) : (
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th><Clock size={16} /> {t('common.timestamp')}</th>
                    <th><FileText size={16} /> Type</th>
                    <th>Description</th>
                    <th><User size={16} /> Utilisateur</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className={styles['sa-system-logs__timestamp']}>
                        {new Date(log.date_action).toLocaleString('fr-FR')}
                      </td>
                      <td>
                        <span className={`${styles['sa-system-logs__badge']} ${styles[`sa-system-logs__badge--${getTypeColor(log.type_action)}`]}`}>
                          {getTypeLabel(log.type_action)}
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>
                        {log.utilisateur ? (
                          <span>{log.utilisateur.nom}<br /><small>{log.utilisateur.email}</small></span>
                        ) : (
                          <span className={styles['sa-system-logs__system']}>Système</span>
                        )}
                      </td>
                      <td className={styles['sa-system-logs__ip']}>{log.ip_utilisateur || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles['sa-system-logs__pagination']}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            <div className={styles['sa-system-logs__page-numbers']}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? styles['sa-system-logs__page-active'] : ''}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal View Log Details */}
        {selectedLog && (
          <div className={styles['sa-system-logs__modal-overlay']} onClick={() => setSelectedLog(null)}>
            <div className={styles['sa-system-logs__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-logs__modal-header']}>
                <h2>Détails du journal</h2>
                <button onClick={() => setSelectedLog(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-system-logs__modal-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div><label>ID:</label><span>{selectedLog.id}</span></div>
                  <div><label>Date:</label><span>{new Date(selectedLog.date_action).toLocaleString('fr-FR')}</span></div>
                  <div><label>Type action:</label><span>{selectedLog.type_action}</span></div>
                  {selectedLog.action_detaillee && (
                    <div><label>Action détaillée:</label><span>{selectedLog.action_detaillee}</span></div>
                  )}
                  <div><label>Utilisateur:</label><span>{selectedLog.utilisateur ? `${selectedLog.utilisateur.nom} (${selectedLog.utilisateur.email})` : 'Système'}</span></div>
                  <div><label>IP:</label><span>{selectedLog.ip_utilisateur || '-'}</span></div>
                  {selectedLog.user_agent && (
                    <div style={{ gridColumn: '1 / -1' }}><label>User Agent:</label><span style={{ fontSize: '0.875rem' }}>{selectedLog.user_agent}</span></div>
                  )}
                  {selectedLog.localisation_action && (
                    <div><label>Localisation:</label><span>{selectedLog.localisation_action}</span></div>
                  )}
                  {selectedLog.dossier && (
                    <div><label>Dossier:</label><span>{selectedLog.dossier.numero_dossier}</span></div>
                  )}
                  {selectedLog.signalement && (
                    <div><label>Signalement:</label><span>{selectedLog.signalement.numero_signalement || '-'}</span></div>
                  )}
                  {selectedLog.alerte && (
                    <div><label>Alerte:</label><span>{selectedLog.alerte.numero_alerte || selectedLog.alerte.titre}</span></div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Description:</label>
                  <p style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>{selectedLog.description || '-'}</p>
                </div>
                {selectedLog.donnees_avant && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Données avant:</label>
                    <pre style={{ fontSize: '0.875rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(selectedLog.donnees_avant, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.donnees_apres && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Données après:</label>
                    <pre style={{ fontSize: '0.875rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(selectedLog.donnees_apres, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className={styles['sa-system-logs__modal-footer']}>
                <button onClick={() => setSelectedLog(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemLogsPage;
