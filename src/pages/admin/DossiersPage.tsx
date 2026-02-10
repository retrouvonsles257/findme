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
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole, StatutDossier, NiveauUrgence } from '../../@types/enums.types';
import { getAdminOrganisationDossiers } from '../../features/admin-organisation/services';

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
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgence, setFilterUrgence] = useState<string>('all');

  const loadDossiers = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      const rows = await getAdminOrganisationDossiers(orgId, {
        search: searchTerm || undefined,
        statut: filterStatus !== 'all' ? filterStatus : undefined,
        urgence: filterUrgence !== 'all' ? filterUrgence : undefined,
      });
      const mapped: Dossier[] = rows.map((r) => ({
        id: r.id,
        numero: r.numero_dossier || `${t('admin.dossierNumberPrefix')}${r.id.slice(0, 8)}`,
        nom_personne:
          (r.personne as any)?.nom_complet ||
          [((r.personne as any)?.nom ?? ''), ((r.personne as any)?.prenom ?? '')].filter(Boolean).join(' ').trim() ||
          t('common.notAvailable'),
        date_disparition: r.date_disparition ? r.date_disparition.split('T')[0] : '',
        statut: (r.statut_dossier as StatutDossier) || StatutDossier.EN_COURS,
        urgence: (r.niveau_urgence as NiveauUrgence) || NiveauUrgence.NORMAL,
        localisation: r.ville_disparition || r.lieu_disparition || t('common.notAvailable'),
        date_creation: r.created_at ? r.created_at.split('T')[0] : '',
      }));
      setFilteredDossiers(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
      setFilteredDossiers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id, searchTerm, filterStatus, filterUrgence, t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadDossiers();
  }, [currentUser, navigate, loadDossiers]);

  return (
    <AdminOrganisationLayout title={t('admin.dossiers')} activeNav="dossiers">
      <div className={styles.dossiers}>
        <div className={styles.dossiers__header}>
          <div>
            <h2 className={styles.dossiers__title}>
              <span className={styles.dossiers__titleIconWrap} aria-hidden>
                <Folder className={styles.dossiers__titleIcon} size={28} />
              </span>
              {t('admin.dossiers')}
            </h2>
            <p className={styles.dossiers__subtitle}>
              {t('admin.manageMissingPersonFiles')}
            </p>
          </div>
          <button
            type="button"
            className={styles.dossiers__btnCreate}
            onClick={() => navigate('/admin/dossiers/new')}
            title={t('admin.newDossier')}
            aria-label={t('admin.newDossier')}
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
              {t('admin.totalDossiers')}{t('common.colon')} <strong>{filteredDossiers.length}</strong>
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
                        {t(`admin.status.${dossier.statut}`, t('common.unknown'))}
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
                        {t(`admin.urgence.${dossier.urgence}`, t('common.unknown'))}
                      </span>
                    </div>
                  </div>

                  <div className={styles.dossiers__cardFooter}>
                    <button
                      type="button"
                      className={styles.dossiers__btnView}
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/dossiers/${dossier.id}`);
                      }}
                      title={t('common.view')}
                      aria-label={t('common.view')}
                    >
                      <Eye className={styles.dossiers__btnIcon} />
                      {t('common.view')}
                    </button>
                    <button
                      type="button"
                      className={styles.dossiers__btnEdit}
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/dossiers/${dossier.id}/edit`);
                      }}
                      title={t('admin.edit')}
                      aria-label={t('admin.edit')}
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
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDossiersPage;