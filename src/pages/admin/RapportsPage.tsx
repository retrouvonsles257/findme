/**
 * =====================================================
 * RETROUVONSLES - Admin Reports Management Page
 * Gestion des rapports de signalement
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';

import styles from './RapportsPage.module.css';

interface Rapport {
  id: string;
  numero: string;
  dossier: string;
  auteur: string;
  type: string;
  date: string;
  statut: 'approuve' | 'en_attente' | 'rejete';
  priorite: 'haute' | 'normale' | 'basse';
}

export const AdminOrganisationRapportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [filteredRapports, setFilteredRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filterRapportsFunc = useCallback(() => {
    let filtered = rapports;

    if (searchTerm) {
      filtered = filtered.filter(
        r =>
          r.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.dossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.auteur.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.statut === filterStatus);
    }

    setFilteredRapports(filtered);
  }, [searchTerm, filterStatus, rapports]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadRapports();
  }, [currentUser, navigate]);

  useEffect(() => {
    filterRapportsFunc();
  }, [searchTerm, filterStatus, rapports, filterRapportsFunc]);

  const loadRapports = async () => {
    try {
      setLoading(true);
      const mockRapports: Rapport[] = [
        {
          id: '1',
          numero: 'R-2024-001',
          dossier: 'Dossier #2024-001',
          auteur: 'Ahmed Diallo',
          type: 'Recherche initiale',
          date: '2024-01-11',
          statut: 'approuve',
          priorite: 'haute',
        },
        {
          id: '2',
          numero: 'R-2024-002',
          dossier: 'Dossier #2024-002',
          auteur: 'Mariam Sow',
          type: 'Suivi de recherche',
          date: '2024-01-12',
          statut: 'en_attente',
          priorite: 'haute',
        },
        {
          id: '3',
          numero: 'R-2024-003',
          dossier: 'Dossier #2024-003',
          auteur: 'Youssef Ahmed',
          type: 'Rapport de clôture',
          date: '2024-01-13',
          statut: 'approuve',
          priorite: 'normale',
        },
      ];
      setRapports(mockRapports);
      setFilteredRapports(mockRapports);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      approuve: {
        icon: CheckCircle,
        label: t('admin.approved'),
      },
      en_attente: {
        icon: Clock,
        label: t('admin.pending'),
      },
      rejete: {
        icon: XCircle,
        label: t('admin.rejected'),
      },
    };
    return configs[status as keyof typeof configs] || configs.approuve;
  };

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: '📊' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: '📁' },
    {
      label: t('admin.rapports'),
      href: '/admin/rapports',
      icon: '📋',
      isActive: true,
    },
    { label: t('admin.utilisateurs'), href: '/admin/utilisateurs', icon: '👥' },
    { label: t('admin.statistiques'), href: '/admin/statistiques', icon: '📈' },
    { label: t('admin.parametres'), href: '/admin/parametres', icon: '⚙️' },
  ];

  return (
    <DashboardLayout
      sidebar={
        <SidebarAdminOrganisation
          navigationItems={navigationItems}
          currentUser={currentUser}
        />
      }
      header={
        <HeaderAdminOrganisation
          currentUser={currentUser}
          onLogout={() => navigate('/auth/login')}
        />
      }
    >
      <div className={styles.rapports}>
        {/* Header */}
        <div className={styles.rapports__header}>
          <div>
            <h1 className={styles.rapports__title}>
              <FileText className={styles.rapports__titleIcon} />
              {t('admin.rapports')}
            </h1>
            <p className={styles.rapports__subtitle}>{t('admin.manageReports')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.rapports__filterCard}>
          <div className={styles.rapports__filters}>
            <div className={styles.rapports__searchWrapper}>
              <Search className={styles.rapports__searchIcon} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.rapports__searchInput}
              />
            </div>
            <div className={styles.rapports__filterWrapper}>
              <Filter className={styles.rapports__filterIcon} />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={styles.rapports__filterSelect}
              >
                <option value="all">{t('admin.allStatus')}</option>
                <option value="approuve">{t('admin.approved')}</option>
                <option value="en_attente">{t('admin.pending')}</option>
                <option value="rejete">{t('admin.rejected')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className={styles.rapports__contentCard}>
          <div className={styles.rapports__contentHeader}>
            <h2 className={styles.rapports__contentTitle}>
              {t('admin.totalReports')}: <strong>{filteredRapports.length}</strong>
            </h2>
          </div>

          {loading ? (
            <div className={styles.rapports__loading}>{t('common.loading')}</div>
          ) : filteredRapports.length === 0 ? (
            <div className={styles.rapports__empty}>
              <AlertCircle className={styles.rapports__emptyIcon} />
              {t('admin.noReportsFound')}
            </div>
          ) : (
            <div className={styles.rapports__tableContainer}>
              <table className={styles.rapports__table}>
                <thead className={styles.rapports__tableHeader}>
                  <tr>
                    <th>{t('admin.number')}</th>
                    <th>{t('admin.dossier')}</th>
                    <th>{t('admin.author')}</th>
                    <th>{t('admin.type')}</th>
                    <th>{t('common.date')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={styles.rapports__tableBody}>
                  {filteredRapports.map(rapport => {
                    const StatusIcon = getStatusConfig(rapport.statut).icon;
                    return (
                      <tr key={rapport.id}>
                        <td className={styles.rapports__numero}>{rapport.numero}</td>
                        <td>{rapport.dossier}</td>
                        <td>{rapport.auteur}</td>
                        <td>{rapport.type}</td>
                        <td>{rapport.date}</td>
                        <td>
                          <span className={`${styles.rapports__statusBadge} ${styles[`rapports__statusBadge--${rapport.statut}`]}`}>
                            <StatusIcon className={styles.rapports__statusIcon} />
                            {getStatusConfig(rapport.statut).label}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rapports__actions}>
                            <button 
                              className={`${styles.rapports__btn} ${styles['rapports__btn--view']}`}
                              onClick={() => navigate(`/admin/rapports/${rapport.id}`)}
                            >
                              <Eye className={styles.rapports__btnIcon} />
                              {t('common.view')}
                            </button>
                            {rapport.statut === 'en_attente' && (
                              <>
                                <button className={`${styles.rapports__btn} ${styles['rapports__btn--approve']}`}>
                                  <CheckCircle className={styles.rapports__btnIcon} />
                                </button>
                                <button className={`${styles.rapports__btn} ${styles['rapports__btn--reject']}`}>
                                  <XCircle className={styles.rapports__btnIcon} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganisationRapportsPage;