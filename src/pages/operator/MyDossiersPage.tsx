/**
 * =====================================================
 * RETROUVONSLES - Operator My Dossiers Page
 * Gestion des dossiers créés par l'opérateur
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../hooks';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { OperatorLayout } from './OperatorLayout';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import styles from './MyDossierPage.module.css';

export const OperatorMyDossiersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossiers, isLoading } = useDossiers();

  // Filtres
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Filtrer les dossiers créés par cet opérateur
  const myDossiers = dossiers.filter(
    (d: any) => d.id_utilisateur_createur === currentUser?.id || d.enregistre_par === currentUser?.id
  );

  // Appliquer les filtres
  let filteredDossiers = [...myDossiers];

  if (statusFilter !== 'all') {
    filteredDossiers = filteredDossiers.filter(
      (d: any) => d.statut_dossier === statusFilter
    );
  }

  if (searchQuery) {
    filteredDossiers = filteredDossiers.filter(
      (d: any) =>
        d.numero_dossier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.lieu_disparition && d.lieu_disparition.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Trier
  if (sortBy === 'recent') {
    filteredDossiers.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else if (sortBy === 'urgent') {
    const urgencyOrder: any = { critique: 0, urgent: 1, normal: 2, basse: 3 };
    filteredDossiers.sort((a: any, b: any) => {
      return (urgencyOrder[a.niveau_urgence] || 99) - (urgencyOrder[b.niveau_urgence] || 99);
    });
  }

  const handleViewDossier = (dossierId: string) => {
    navigate(`/operator/dossiers/${dossierId}`);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'en_cours') return <Clock size={14} />;
    if (status.includes('retrouve')) return <CheckCircle2 size={14} />;
    return <XCircle size={14} />;
  };

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'critique': return '#dc2626';
      case 'urgent': return '#ea580c';
      case 'normal': return '#10b981';
      case 'basse': return '#1d4ed8';
      default: return '#64748b';
    }
  };

  return (
    <OperatorLayout title={t('operator.myDossiersTitle')}>
      <p className={styles['operator-my-dossiers__subtitle']}>
        {t('operator.myDossiersSubtitle')} - Total: {myDossiers.length}
      </p>

      {/* Controls */}
      <div className={styles['operator-my-dossiers__controls']}>
        <div className={styles['operator-my-dossiers__filter-group']}>
          <Filter className={styles['operator-my-dossiers__filter-icon']} size={18} />
          <select
            className={styles['operator-my-dossiers__select']}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('operator.filters.allStatus')}</option>
            <option value="en_cours">{t('operator.filters.inProgress')}</option>
            <option value="retrouve_vivant">{t('operator.filters.foundAlive')}</option>
            <option value="retrouve_decede">{t('operator.filters.foundDeceased')}</option>
            <option value="suspendu">{t('operator.filters.suspended')}</option>
            </select>
          </div>

          <div className={styles['operator-my-dossiers__filter-group']}>
            <select
              className={styles['operator-my-dossiers__select']}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">{t('operator.sortBy')}: {t('operator.recent')}</option>
              <option value="urgent">{t('operator.sortBy')}: {t('operator.urgent')}</option>
            </select>
          </div>

          <div className={styles['operator-my-dossiers__search-group']}>
            <Search className={styles['operator-my-dossiers__search-icon']} size={18} />
            <input
              className={styles['operator-my-dossiers__search-input']}
              type="text"
              placeholder={t('operator.filters.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles['operator-my-dossiers__table-wrapper']}>
          {isLoading ? (
            <div className={styles['operator-my-dossiers__loading-state']}>
              <Loader2 className={styles['operator-my-dossiers__spinner']} />
              <p className={styles['operator-my-dossiers__loading-text']}>{t('common.loading')}</p>
            </div>
          ) : filteredDossiers.length > 0 ? (
            <table className={styles['operator-my-dossiers__table']}>
              <thead className={styles['operator-my-dossiers__table-head']}>
                <tr>
                  <th className={styles['operator-my-dossiers__table-header']}>
                    <FileText size={16} />
                    {t('operator.tableHeaders.fileNumber')}
                  </th>
                  <th className={styles['operator-my-dossiers__table-header']}>
                    <MapPin size={16} />
                    {t('operator.tableHeaders.location')}
                  </th>
                  <th className={styles['operator-my-dossiers__table-header']}>{t('operator.tableHeaders.status')}</th>
                  <th className={styles['operator-my-dossiers__table-header']}>
                    <AlertTriangle size={16} />
                    {t('operator.tableHeaders.urgency')}
                  </th>
                  <th className={styles['operator-my-dossiers__table-header']}>
                    <Calendar size={16} />
                    {t('operator.tableHeaders.createdDate')}
                  </th>
                  <th className={styles['operator-my-dossiers__table-header']}>{t('operator.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody className={styles['operator-my-dossiers__table-body']}>
                {filteredDossiers.map((dossier: any) => (
                  <tr key={dossier.id} className={styles['operator-my-dossiers__table-row']}>
                    <td className={styles['operator-my-dossiers__table-cell']}>
                      <span
                        className={styles['operator-my-dossiers__dossier-number']}
                        onClick={() => handleViewDossier(dossier.id)}
                      >
                        {dossier.numero_dossier}
                      </span>
                    </td>
                    <td className={styles['operator-my-dossiers__table-cell']}>
                      {dossier.lieu_disparition || t('common.notSpecified')}
                    </td>
                    <td className={styles['operator-my-dossiers__table-cell']}>
                      <span
                        className={`${styles['operator-my-dossiers__status-badge']} ${
                          dossier.statut_dossier === 'en_cours'
                            ? styles['operator-my-dossiers__status-badge--encours']
                            : dossier.statut_dossier.includes('retrouve')
                              ? styles['operator-my-dossiers__status-badge--retrouve']
                              : styles['operator-my-dossiers__status-badge--suspendu']
                        }`}
                      >
                        {getStatusIcon(dossier.statut_dossier)}
                        <span>{dossier.statut_dossier}</span>
                      </span>
                    </td>
                    <td className={styles['operator-my-dossiers__table-cell']}>
                      <span
                        className={styles['operator-my-dossiers__urgence-badge']}
                        style={{ color: getUrgencyColor(dossier.niveau_urgence) }}
                      >
                        {dossier.niveau_urgence}
                      </span>
                    </td>
                    <td className={styles['operator-my-dossiers__table-cell']}>
                      {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={styles['operator-my-dossiers__table-cell']}>
                      <div className={styles['operator-my-dossiers__actions']}>
                        <button
                          className={styles['operator-my-dossiers__action-btn']}
                          onClick={() => handleViewDossier(dossier.id)}
                          title={t('operator.viewFile')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className={styles['operator-my-dossiers__action-btn']}
                          onClick={() => navigate(`/operator/edit-dossier/${dossier.id}`)}
                          title={t('operator.editFile')}
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles['operator-my-dossiers__empty-state']}>
              <FolderOpen className={styles['operator-my-dossiers__empty-icon']} />
              <p className={styles['operator-my-dossiers__empty-text']}>
                {t('operator.noDossiersFound')}
              </p>
            </div>
          )}
        </div>
    </OperatorLayout>
  );
};

export default OperatorMyDossiersPage;