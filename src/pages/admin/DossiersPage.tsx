/**
 * =====================================================
 * RETROUVONSLES - Admin Dossiers Management Page
 * Gestion des dossiers de personnes disparues
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole, StatutDossier, NiveauUrgence } from '../../@types/enums.types';

import styles from './DossiersPage.module.css';

interface Dossier {
  id: string;
  numero: string;
  nom_personne: string;
  date_disparition: string;
  statut: StatutDossier;
  urgence: NiveauUrgence;
  localisation: string;
  date_creation: string;
}

export const AdminOrganisationDossiersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgence, setFilterUrgence] = useState<string>('all');

  const filterDossiersFunc = useCallback(() => {
    let filtered = dossiers;

    if (searchTerm) {
      filtered = filtered.filter(
        d =>
          d.nom_personne.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.numero.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.statut === filterStatus);
    }

    if (filterUrgence !== 'all') {
      filtered = filtered.filter(d => d.urgence === filterUrgence);
    }

    setFilteredDossiers(filtered);
  }, [searchTerm, filterStatus, filterUrgence, dossiers]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadDossiers();
  }, [currentUser, navigate]);

  useEffect(() => {
    filterDossiersFunc();
  }, [searchTerm, filterStatus, filterUrgence, dossiers, filterDossiersFunc]);

  const loadDossiers = async () => {
    try {
      setLoading(true);
      const mockDossiers: Dossier[] = [
        {
          id: '1',
          numero: '#2024-001',
          nom_personne: 'Jean Dupont',
          date_disparition: '2024-01-10',
          statut: StatutDossier.EN_COURS,
          urgence: NiveauUrgence.URGENT,
          localisation: 'Dakar',
          date_creation: '2024-01-11',
        },
        {
          id: '2',
          numero: '#2024-002',
          nom_personne: 'Mariam Traoré',
          date_disparition: '2024-01-12',
          statut: StatutDossier.EN_COURS,
          urgence: NiveauUrgence.CRITIQUE,
          localisation: 'Thiès',
          date_creation: '2024-01-13',
        },
        {
          id: '3',
          numero: '#2024-003',
          nom_personne: 'Amara Diallo',
          date_disparition: '2023-12-20',
          statut: StatutDossier.RETROUVE_VIVANT,
          urgence: NiveauUrgence.NORMAL,
          localisation: 'Kaolack',
          date_creation: '2023-12-21',
        },
      ];
      setDossiers(mockDossiers);
      setFilteredDossiers(mockDossiers);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: '📊' },
    {
      label: t('admin.dossiers'),
      href: '/admin/dossiers',
      icon: '📁',
      isActive: true,
    },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: '📋' },
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
      <div className={styles.dossiers}>
        {/* Header */}
        <div className={styles.dossiers__header}>
          <div>
            <h1 className={styles.dossiers__title}>
              <Folder className={styles.dossiers__titleIcon} />
              {t('admin.dossiers')}
            </h1>
            <p className={styles.dossiers__subtitle}>
              {t('admin.manageMissingPersonFiles')}
            </p>
          </div>
          <button
            className={styles.dossiers__btnCreate}
            onClick={() => navigate('/admin/dossiers/new')}
          >
            <Plus className={styles.dossiers__btnIcon} />
            {t('admin.newDossier')}
          </button>
        </div>

        {/* Filters */}
        <div className={styles.dossiers__filterCard}>
          <div className={styles.dossiers__filters}>
            <div className={styles.dossiers__searchWrapper}>
              <Search className={styles.dossiers__searchIcon} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.dossiers__searchInput}
              />
            </div>
            <div className={styles.dossiers__filterWrapper}>
              <Filter className={styles.dossiers__filterIcon} />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={styles.dossiers__filterSelect}
              >
                <option value="all">{t('admin.allStatus')}</option>
                <option value={StatutDossier.EN_COURS}>{t('admin.inProgress')}</option>
                <option value={StatutDossier.RETROUVE_VIVANT}>
                  {t('admin.foundAlive')}
                </option>
                <option value={StatutDossier.RETROUVE_DECEDE}>
                  {t('admin.foundDeceased')}
                </option>
              </select>
            </div>
            <div className={styles.dossiers__filterWrapper}>
              <Filter className={styles.dossiers__filterIcon} />
              <select
                value={filterUrgence}
                onChange={e => setFilterUrgence(e.target.value)}
                className={styles.dossiers__filterSelect}
              >
                <option value="all">{t('admin.allUrgency')}</option>
                <option value={NiveauUrgence.CRITIQUE}>{t('admin.critical')}</option>
                <option value={NiveauUrgence.URGENT}>{t('admin.urgent')}</option>
                <option value={NiveauUrgence.NORMAL}>{t('admin.normal')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dossiers List */}
        <div className={styles.dossiers__contentCard}>
          <div className={styles.dossiers__contentHeader}>
            <h2 className={styles.dossiers__contentTitle}>
              {t('admin.totalDossiers')}: <strong>{filteredDossiers.length}</strong>
            </h2>
          </div>

          {loading ? (
            <div className={styles.dossiers__loading}>{t('common.loading')}</div>
          ) : filteredDossiers.length === 0 ? (
            <div className={styles.dossiers__empty}>
              <AlertCircle className={styles.dossiers__emptyIcon} />
              {t('admin.noDossiersFound')}
            </div>
          ) : (
            <div className={styles.dossiers__grid}>
              {filteredDossiers.map(dossier => (
                <div
                  key={dossier.id}
                  className={styles.dossiers__card}
                  onClick={() => navigate(`/admin/dossiers/${dossier.id}`)}
                >
                  <div className={styles.dossiers__cardHeader}>
                    <span className={styles.dossiers__cardNumber}>{dossier.numero}</span>
                    <div className={styles.dossiers__cardBadges}>
                      <span
                        className={`${styles.dossiers__badge} ${styles[`dossiers__badge--${dossier.statut}`]}`}
                      >
                        {t(`admin.status.${dossier.statut}`)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.dossiers__cardBody}>
                    <h3 className={styles.dossiers__cardTitle}>
                      {dossier.nom_personne}
                    </h3>

                    <div className={styles.dossiers__cardInfo}>
                      <div className={styles.dossiers__infoItem}>
                        <Calendar className={styles.dossiers__infoIcon} />
                        <span>{dossier.date_disparition}</span>
                      </div>
                      <div className={styles.dossiers__infoItem}>
                        <MapPin className={styles.dossiers__infoIcon} />
                        <span>{dossier.localisation}</span>
                      </div>
                    </div>

                    <div className={styles.dossiers__cardBadges}>
                      <span
                        className={`${styles.dossiers__badge} ${styles[`dossiers__badge--urgence-${dossier.urgence}`]}`}
                      >
                        {t(`admin.urgence.${dossier.urgence}`)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.dossiers__cardFooter}>
                    <button
                      className={styles.dossiers__btnView}
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/dossiers/${dossier.id}`);
                      }}
                    >
                      <Eye className={styles.dossiers__btnIcon} />
                      {t('common.view')}
                    </button>
                    <button
                      className={styles.dossiers__btnEdit}
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/dossiers/${dossier.id}/edit`);
                      }}
                    >
                      <Edit className={styles.dossiers__btnIcon} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganisationDossiersPage;