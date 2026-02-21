/**
 * =====================================================
 * RETROUVONSLES - Super Admin Dons Page
 * Gestion des dons avec CRUD complet
 * Connecté à Supabase table: don
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminTableSkeleton } from '../admin/skeletons';
import { 
  DollarSign, Calendar, User, Search, AlertCircle, 
  Eye, ChevronLeft, ChevronRight, TrendingUp, CreditCard, Filter, Download, Heart
} from 'lucide-react';
import styles from './DonsPage.module.css';

interface Don {
  id: string;
  montant: number;
  devise: string;
  type_don: string;
  donateur_anonyme: boolean;
  nom_donateur?: string;
  email_donateur?: string;
  telephone_donateur?: string;
  organisation_donatrice?: string;
  message_donateur?: string;
  methode_paiement: string;
  statut_paiement: string;
  reference_transaction?: string;
  id_transaction_externe?: string;
  date_don: string;
  date_traitement?: string;
  remerciement_envoye?: boolean;
  date_remerciement?: string;
  recu_fiscal_genere?: boolean;
  numero_recu?: string;
}

// Types de statut de paiement (modèle officiel): 'en_attente' | 'reussi' | 'echoue' | 'rembourse' | 'annule'
// Types de mode de paiement (modèle officiel): 'carte_bancaire' | 'mobile_money' | 'virement' | 'paypal' | 'autre'

const ITEMS_PER_PAGE = 15;

export const SuperAdminDonsPage: React.FC = () => {
  const { t } = useI18n();

  const [dons, setDons] = useState<Don[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, average: 0 });
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal view
  const [selectedDon, setSelectedDon] = useState<Don | null>(null);

  const loadDons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stats globales
      const [totalResult, completedResult, pendingResult, sumResult] = await Promise.all([
        (supabase as any).from('don').select('id', { count: 'exact', head: true }),
        (supabase as any).from('don').select('id', { count: 'exact', head: true }).eq('statut_paiement', 'reussi'),
        (supabase as any).from('don').select('id', { count: 'exact', head: true }).eq('statut_paiement', 'en_attente'),
        (supabase as any).from('don').select('montant').eq('statut_paiement', 'reussi'),
      ]);

      const completedDons = sumResult.data || [];
      const totalAmount = completedDons.reduce((sum: number, d: any) => sum + (d.montant || 0), 0);
      const avgAmount = completedDons.length > 0 ? totalAmount / completedDons.length : 0;

      setStats({
        total: totalResult.count || 0,
        completed: completedResult.count || 0,
        pending: pendingResult.count || 0,
        average: avgAmount,
      });

      // Compter avec filtres
      let countQuery = (supabase as any).from('don').select('id', { count: 'exact', head: true });
      if (filterStatut) countQuery = countQuery.eq('statut_paiement', filterStatut);
      if (filterMode) countQuery = countQuery.eq('methode_paiement', filterMode);
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les dons avec pagination - RÉCUPÉRER TOUS LES CHAMPS
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('don')
        .select('*')
        .order('date_don', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterStatut) query = query.eq('statut_paiement', filterStatut);
      if (filterMode) query = query.eq('methode_paiement', filterMode);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Filtrer par recherche (côté client) - les données donateur sont directement dans la table don
      let filtered = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = (data || []).filter((don: Don) =>
          (don.nom_donateur || '').toLowerCase().includes(term) ||
          (don.email_donateur || '').toLowerCase().includes(term) ||
          (don.reference_transaction || '').toLowerCase().includes(term)
        );
      }

      setDons(filtered);
    } catch (err: any) {
      console.error('Erreur chargement dons:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatut, filterMode, searchTerm]);

  useEffect(() => {
    loadDons();
  }, [loadDons]);

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger tous les dons avec filtres
      let query = (supabase as any)
        .from('don')
        .select('*')
        .order('date_don', { ascending: false });

      if (filterStatut) query = query.eq('statut_paiement', filterStatut);
      if (filterMode) query = query.eq('methode_paiement', filterMode);

      const { data: allDons, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Filtrer par recherche si nécessaire
      let filtered = allDons || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter((don: Don) =>
          (don.nom_donateur || '').toLowerCase().includes(term) ||
          (don.email_donateur || '').toLowerCase().includes(term) ||
          (don.reference_transaction || '').toLowerCase().includes(term)
        );
      }

      // Créer le CSV
      const headers = ['Date', 'Montant', 'Devise', 'Donateur', 'Email', 'Type', 'Méthode', 'Statut', 'Référence'];
      const rows = filtered.map((don: Don) => [
        new Date(don.date_don).toLocaleDateString('fr-FR'),
        don.montant.toString(),
        don.devise,
        don.donateur_anonyme ? t('super_admin.donsAnonymous') : (don.nom_donateur || '-'),
        don.donateur_anonyme ? '-' : (don.email_donateur || '-'),
        don.type_don,
        don.methode_paiement,
        getStatutLabel(don.statut_paiement),
        don.reference_transaction || '-',
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
      link.setAttribute('download', `dons_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError(t('super_admin.donsExportError', { message: err.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      reussi: 'success',
      echoue: 'danger',
      rembourse: 'info',
      annule: 'default',
    };
    return colors[statut] || 'default';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      reussi: 'Réussi',
      echoue: 'Échoué',
      rembourse: 'Remboursé',
      annule: 'Annulé',
    };
    return labels[statut] || statut;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      carte_bancaire: t('super_admin.donsModeCarteBancaire'),
      mobile_money: t('super_admin.donsModeMobileMoney'),
      virement: t('super_admin.donsModeVirement'),
      paypal: t('super_admin.donsModePaypal'),
      autre: t('super_admin.donsModeAutre'),
    };
    return labels[mode] || mode;
  };

  const formatMontant = (montant: number, devise: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise || 'XAF',
    }).format(montant);
  };

  return (
    <SuperAdminLayout title={t('super_admin.donsTitle')} activeNav="dons">
      <div className={styles['sa-dons']}>
        {/* Lien vers la page publique Faire un don (tout le monde peut faire un don) */}
        <div className={styles['sa-dons__action-bar']}>
          <Link
            to="/super-admin/dons/faire-un-don"
            className={styles['sa-dons__make-donation-link']}
          >
            <Heart size={20} />
            {t('super_admin.donsMakeDonation') || 'Faire un don'}
          </Link>
        </div>

        {/* Stats Cards */}
        <div className={styles['sa-dons__stats']}>
          <div className={styles['sa-dons__stat-card']}>
            <DollarSign size={24} />
            <div>
              <span className={styles['sa-dons__stat-value']}>{stats.total}</span>
              <span className={styles['sa-dons__stat-label']}>{t('super_admin.donsTotal')}</span>
            </div>
          </div>
          <div className={styles['sa-dons__stat-card']}>
            <TrendingUp size={24} />
            <div>
              <span className={styles['sa-dons__stat-value']}>{stats.completed}</span>
              <span className={styles['sa-dons__stat-label']}>{t('super_admin.donsCompleted')}</span>
            </div>
          </div>
          <div className={styles['sa-dons__stat-card']}>
            <CreditCard size={24} />
            <div>
              <span className={styles['sa-dons__stat-value']}>{stats.pending}</span>
              <span className={styles['sa-dons__stat-label']}>{t('super_admin.donsPending')}</span>
            </div>
          </div>
          <div className={styles['sa-dons__stat-card']}>
            <DollarSign size={24} />
            <div>
              <span className={styles['sa-dons__stat-value']}>{formatMontant(stats.average, 'XAF')}</span>
              <span className={styles['sa-dons__stat-label']}>{t('super_admin.donsAverage')}</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-dons__filters']}>
          <div className={styles['sa-dons__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder={t('super_admin.donsSearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={exportToCSV} 
            disabled={isLoading}
            className={styles['sa-dons__export-btn']}
          >
            <Download size={18} />
            {t('super_admin.systemLogsExportCsv')}
          </button>
          <div className={styles['sa-dons__filter-group']}>
            <Filter size={16} />
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
              <option value="">{t('super_admin.donsFilterAllStatuses')}</option>
              <option value="en_attente">{t('super_admin.donsStatutEnAttente')}</option>
              <option value="reussi">{t('super_admin.donsStatutReussi')}</option>
              <option value="echoue">{t('super_admin.donsStatutEchoue')}</option>
              <option value="rembourse">{t('super_admin.donsStatutRembourse')}</option>
              <option value="annule">{t('super_admin.donsStatutAnnule')}</option>
            </select>
          </div>
          <div className={styles['sa-dons__filter-group']}>
            <CreditCard size={16} />
            <select value={filterMode} onChange={(e) => { setFilterMode(e.target.value); setCurrentPage(1); }}>
              <option value="">{t('super_admin.donsFilterAllModes')}</option>
              <option value="carte_bancaire">{t('super_admin.donsModeCarteBancaire')}</option>
              <option value="mobile_money">{t('super_admin.donsModeMobileMoney')}</option>
              <option value="virement">{t('super_admin.donsModeVirement')}</option>
              <option value="paypal">{t('super_admin.donsModePaypal')}</option>
              <option value="autre">{t('super_admin.donsModeAutre')}</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-dons__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-dons__skeletonWrap']}>
            <AdminTableSkeleton columns={7} rows={8} />
          </div>
        ) : (
          <div className={styles['sa-dons__table-wrapper']}>
            {dons.length === 0 ? (
              <div className={styles['sa-dons__empty']}>
                <DollarSign size={48} />
                <p>{t('super_admin.donsNoData')}</p>
              </div>
            ) : (
              <table className={styles['sa-dons__table']}>
                <thead>
                  <tr>
                    <th><Calendar size={16} /> {t('super_admin.donsTableDate')}</th>
                    <th><User size={16} /> {t('super_admin.donsTableDonateur')}</th>
                    <th><DollarSign size={16} /> {t('super_admin.donsTableMontant')}</th>
                    <th>{t('super_admin.donsTableMode')}</th>
                    <th>{t('super_admin.donsTableStatut')}</th>
                    <th>{t('super_admin.donsTableDossier')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dons.map((don) => (
                    <tr key={don.id}>
                      <td>{new Date(don.date_don).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {don.donateur_anonyme ? (
                          <span className={styles['sa-dons__anonymous']}>{t('super_admin.donsAnonymous')}</span>
                        ) : don.nom_donateur ? (
                          <span>{don.nom_donateur}</span>
                        ) : '-'}
                      </td>
                      <td className={styles['sa-dons__montant']}>{formatMontant(don.montant, don.devise)}</td>
                      <td>{getModeLabel(don.methode_paiement)}</td>
                      <td>
                        <span className={`${styles['sa-dons__badge']} ${styles[`sa-dons__badge--${getStatutColor(don.statut_paiement)}`]}`}>
                          {getStatutLabel(don.statut_paiement)}
                        </span>
                      </td>
                      <td>{don.type_don}</td>
                      <td>
                        <button onClick={() => setSelectedDon(don)} className={styles['sa-dons__btn-view']}>
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
          <div className={styles['sa-dons__pagination']}>
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
        {selectedDon && (
          <div className={styles['sa-dons__modal-overlay']} onClick={() => setSelectedDon(null)}>
            <div className={styles['sa-dons__modal']} onClick={(e) => e.stopPropagation()}>
              <h2>{t('super_admin.donsDetailsTitle')}</h2>
              <div className={styles['sa-dons__details']}>
                <p><strong>{t('super_admin.donsDetailDate')}:</strong> {new Date(selectedDon.date_don).toLocaleString('fr-FR')}</p>
                <p><strong>{t('super_admin.donsDetailMontant')}:</strong> {formatMontant(selectedDon.montant, selectedDon.devise)}</p>
                <p><strong>{t('super_admin.donsDetailMode')}:</strong> {getModeLabel(selectedDon.methode_paiement)}</p>
                <p><strong>{t('super_admin.donsDetailStatut')}:</strong> {getStatutLabel(selectedDon.statut_paiement)}</p>
                <p><strong>{t('super_admin.donsDetailType')}:</strong> {selectedDon.type_don}</p>
                <p><strong>{t('super_admin.donsDetailReference')}:</strong> {selectedDon.reference_transaction || '-'}</p>
                <p><strong>{t('super_admin.donsDetailDonateur')}:</strong> {selectedDon.donateur_anonyme ? t('super_admin.donsAnonymous') : selectedDon.nom_donateur ? `${selectedDon.nom_donateur} (${selectedDon.email_donateur || ''})` : '-'}</p>
                {selectedDon.message_donateur && (
                  <p><strong>{t('super_admin.donsDetailMessage')}:</strong> {selectedDon.message_donateur}</p>
                )}
              </div>
              <button onClick={() => setSelectedDon(null)}>{t('common.close')}</button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDonsPage;
