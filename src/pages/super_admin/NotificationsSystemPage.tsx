/**
 * =====================================================
 * RETROUVONSLES - Super Admin Notifications System Page
 * Gestion complète des notifications système
 * Connecté à Supabase table: notification
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Bell, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Download, X, Eye, CheckCircle, Mail, Smartphone, MessageSquare
} from 'lucide-react';
import styles from './SystemLogsPage.module.css';

interface Notification {
  id: string;
  type_notification: string;
  titre: string;
  message: string;
  message_court?: string;
  canal: string;
  priorite: string;
  lue: boolean;
  date_lecture?: string;
  url_action?: string;
  donnees_supplementaires?: Record<string, any>;
  statut_envoi: string;
  code_erreur?: string;
  tentatives_envoi: number;
  date_creation: string;
  date_envoi?: string;
  id_utilisateur?: string;
  id_dossier?: string;
  id_alerte?: string;
  utilisateur?: { nom: string; email: string };
  dossier?: { numero_dossier: string };
  alerte?: { numero_alerte?: string; titre: string };
}

const ITEMS_PER_PAGE = 20;

export const SuperAdminNotificationsSystemPage: React.FC = () => {
  useI18n();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  // Filtres
  const [filterType, setFilterType] = useState<string>('');
  const [filterCanal, setFilterCanal] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterLue, setFilterLue] = useState<string>('');

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Compter le total
      let countQuery = (supabase as any).from('notification').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_notification', filterType);
      if (filterCanal) countQuery = countQuery.eq('canal', filterCanal);
      if (filterStatut) countQuery = countQuery.eq('statut_envoi', filterStatut);
      if (filterLue !== '') countQuery = countQuery.eq('lue', filterLue === 'true');
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les notifications avec pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('notification')
        .select(`
          *,
          utilisateur:utilisateur(nom, email),
          dossier:dossier_disparition(numero_dossier),
          alerte:alerte(numero_alerte, titre)
        `)
        .order('date_creation', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_notification', filterType);
      if (filterCanal) query = query.eq('canal', filterCanal);
      if (filterStatut) query = query.eq('statut_envoi', filterStatut);
      if (filterLue !== '') query = query.eq('lue', filterLue === 'true');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err: any) {
      console.error('Erreur chargement notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterCanal, filterStatut, filterLue]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getCanalIcon = (canal: string) => {
    switch(canal) {
      case 'email': return <Mail size={16} />;
      case 'sms': return <Smartphone size={16} />;
      case 'push': return <Bell size={16} />;
      case 'in_app': return <MessageSquare size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getStatutColor = (statut: string) => {
    switch(statut) {
      case 'envoyee': return 'success';
      case 'echec': return 'danger';
      case 'en_attente': return 'warning';
      default: return 'default';
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Titre', 'Message', 'Canal', 'Priorité', 'Statut', 'Lue', 'Date création', 'Utilisateur', 'Dossier'];
    const rows = notifications.map(n => [
      n.id,
      n.type_notification,
      n.titre,
      n.message,
      n.canal,
      n.priorite,
      n.statut_envoi,
      n.lue ? 'Oui' : 'Non',
      new Date(n.date_creation).toLocaleString('fr-FR'),
      n.utilisateur?.email || '-',
      n.dossier?.numero_dossier || '-',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notifications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <SuperAdminLayout title="Notifications Système" activeNav="notifications-system">
      <div className={styles['sa-system-logs']}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Notifications Système</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Consultez toutes les notifications du système</p>
        </div>

        {/* Filtres */}
        <div className={styles['sa-system-logs__filters']}>
          <div className={styles['sa-system-logs__filter-group']}>
            <Filter size={16} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">Tous types</option>
              <option value="nouvelle_alerte">Nouvelle alerte</option>
              <option value="signalement_valide">Signalement validé</option>
              <option value="mise_a_jour_dossier">Mise à jour dossier</option>
              <option value="personne_retrouvee">Personne retrouvée</option>
              <option value="correspondance_ia">Correspondance IA</option>
              <option value="message_autorite">Message autorité</option>
              <option value="rappel">Rappel</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <select value={filterCanal} onChange={(e) => { setFilterCanal(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous canaux</option>
            <option value="push">Push</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="in_app">In-app</option>
          </select>
          <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="envoyee">Envoyée</option>
            <option value="echec">Échec</option>
            <option value="annulee">Annulée</option>
          </select>
          <select value={filterLue} onChange={(e) => { setFilterLue(e.target.value); setCurrentPage(1); }}>
            <option value="">Toutes</option>
            <option value="true">Lues</option>
            <option value="false">Non lues</option>
          </select>
          <button onClick={exportToCSV} className={styles['sa-system-logs__export-btn']}>
            <Download size={16} />
            Exporter CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-system-logs__loading']}>
            <Loader2 size={32} className={styles['sa-system-logs__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-system-logs__table-wrapper']}>
            {notifications.length === 0 ? (
              <div className={styles['sa-system-logs__empty']}>
                <Bell size={48} />
                <p>Aucune notification trouvée</p>
              </div>
            ) : (
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Titre</th>
                    <th>Canal</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Lue</th>
                    <th>Utilisateur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif.id}>
                      <td>{new Date(notif.date_creation).toLocaleString('fr-FR')}</td>
                      <td>{notif.type_notification}</td>
                      <td>{notif.titre}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getCanalIcon(notif.canal)}
                        {notif.canal}
                      </td>
                      <td>{notif.priorite}</td>
                      <td>
                        <span className={`${styles['sa-system-logs__badge']} ${styles[`sa-system-logs__badge--${getStatutColor(notif.statut_envoi)}`]}`}>
                          {notif.statut_envoi}
                        </span>
                      </td>
                      <td>{notif.lue ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <X size={16} style={{ color: '#94a3b8' }} />}</td>
                      <td>{notif.utilisateur?.email || '-'}</td>
                      <td>
                        <button onClick={() => setSelectedNotification(notif)} title="Voir détails">
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

        {/* Pagination */}
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

        {/* Modal View */}
        {selectedNotification && (
          <div className={styles['sa-system-logs__modal-overlay']} onClick={() => setSelectedNotification(null)}>
            <div className={styles['sa-system-logs__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-logs__modal-header']}>
                <h2>Détails de la notification</h2>
                <button onClick={() => setSelectedNotification(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-system-logs__modal-body']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><strong>Type:</strong> {selectedNotification.type_notification}</div>
                  <div><strong>Titre:</strong> {selectedNotification.titre}</div>
                  <div><strong>Message:</strong> {selectedNotification.message}</div>
                  {selectedNotification.message_court && (
                    <div><strong>Message court:</strong> {selectedNotification.message_court}</div>
                  )}
                  <div><strong>Canal:</strong> {selectedNotification.canal}</div>
                  <div><strong>Priorité:</strong> {selectedNotification.priorite}</div>
                  <div><strong>Statut:</strong> {selectedNotification.statut_envoi}</div>
                  <div><strong>Lue:</strong> {selectedNotification.lue ? 'Oui' : 'Non'}</div>
                  {selectedNotification.date_lecture && (
                    <div><strong>Date lecture:</strong> {new Date(selectedNotification.date_lecture).toLocaleString('fr-FR')}</div>
                  )}
                  <div><strong>Date création:</strong> {new Date(selectedNotification.date_creation).toLocaleString('fr-FR')}</div>
                  {selectedNotification.date_envoi && (
                    <div><strong>Date envoi:</strong> {new Date(selectedNotification.date_envoi).toLocaleString('fr-FR')}</div>
                  )}
                  {selectedNotification.utilisateur && (
                    <div><strong>Utilisateur:</strong> {selectedNotification.utilisateur.nom} ({selectedNotification.utilisateur.email})</div>
                  )}
                  {selectedNotification.dossier && (
                    <div><strong>Dossier:</strong> {selectedNotification.dossier.numero_dossier}</div>
                  )}
                  {selectedNotification.alerte && (
                    <div><strong>Alerte:</strong> {selectedNotification.alerte.numero_alerte || selectedNotification.alerte.titre}</div>
                  )}
                  {selectedNotification.code_erreur && (
                    <div><strong>Code erreur:</strong> {selectedNotification.code_erreur}</div>
                  )}
                  {selectedNotification.tentatives_envoi > 0 && (
                    <div><strong>Tentatives:</strong> {selectedNotification.tentatives_envoi}</div>
                  )}
                </div>
              </div>
              <div className={styles['sa-system-logs__modal-footer']}>
                <button onClick={() => setSelectedNotification(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminNotificationsSystemPage;
