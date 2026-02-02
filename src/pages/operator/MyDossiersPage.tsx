/**
 * =====================================================
 * RETROUVONSLES - Operator My Dossiers Page
 * Gestion des dossiers créés par l'opérateur
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
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
  MapPin,
  Calendar,
  AlertTriangle,
  Plus
} from 'lucide-react';
import styles from './MyDossierPage.module.css';

export const OperatorMyDossiersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossiers, isLoading, fetchDossiers, setPageSize } = useDossiers();

  // Filtres
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [ownershipFilter, setOwnershipFilter] = useState<'mine' | 'organisation'>('mine');

  // Charger côté DB pour éviter les fuites si RLS est off
  useEffect(() => {
    // Cette page n'a pas (encore) de pagination propre, on prend une page plus large.
    setPageSize(200);
  }, [setPageSize]);

  useEffect(() => {
    if (!currentUser) return;
    if (ownershipFilter === 'mine') {
      fetchDossiers({ createur_id: currentUser.id });
    } else if (currentUser.organisation_id) {
      fetchDossiers({ organisation_id: currentUser.organisation_id });
    } else {
      fetchDossiers();
    }
  }, [currentUser, ownershipFilter, fetchDossiers]);

  const myDossiers = dossiers;

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
    <OperatorLayout title={t('operator.myDossiersTitle') || 'Gestion des Dossiers'}>
      <div className={styles['operator-my-dossiers__header']}>
        <p className={styles['operator-my-dossiers__subtitle']}>
          {t('operator.myDossiersSubtitle') || 'Gérez vos dossiers de disparition'} - Total: {myDossiers.length}
        </p>
        <button
          className={styles['operator-my-dossiers__create-btn']}
          onClick={() => navigate('/operator/create-dossier')}
        >
          <Plus size={18} />
          Nouveau dossier
        </button>
      </div>

      {/* Ownership Filter Toggle */}
      <div className={styles['operator-my-dossiers__ownership-toggle']}>
        <button
          className={`${styles['operator-my-dossiers__ownership-btn']} ${ownershipFilter === 'mine' ? styles['operator-my-dossiers__ownership-btn--active'] : ''}`}
          onClick={() => setOwnershipFilter('mine')}
        >
          Mes dossiers
        </button>
        <button
          className={`${styles['operator-my-dossiers__ownership-btn']} ${ownershipFilter === 'organisation' ? styles['operator-my-dossiers__ownership-btn--active'] : ''}`}
          onClick={() => setOwnershipFilter('organisation')}
        >
          Dossiers de mon organisation
        </button>
      </div>

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

        {/* Cards Grid */}
        <div className={styles['operator-my-dossiers__content']}>
          {isLoading ? (
            <div className={styles['operator-my-dossiers__loading-state']}>
              <Loader2 className={styles['operator-my-dossiers__spinner']} />
              <p className={styles['operator-my-dossiers__loading-text']}>{t('common.loading')}</p>
            </div>
          ) : filteredDossiers.length > 0 ? (
            <div className={styles['operator-my-dossiers__cards-grid']}>
              {filteredDossiers.map((dossier: any) => (
                <div key={dossier.id} className={styles['operator-my-dossiers__card']}>
                  <div className={styles['operator-my-dossiers__card-header']}>
                    <h4 className={styles['operator-my-dossiers__card-title']}>
                      {dossier.numero_dossier}
                    </h4>
                    <span
                      className={`${styles['operator-my-dossiers__status-badge']} ${
                        dossier.statut_dossier === 'en_cours'
                          ? styles['operator-my-dossiers__status-badge--encours']
                          : dossier.statut_dossier?.includes('retrouve')
                            ? styles['operator-my-dossiers__status-badge--retrouve']
                            : styles['operator-my-dossiers__status-badge--suspendu']
                      }`}
                    >
                      {getStatusIcon(dossier.statut_dossier)}
                      <span>{dossier.statut_dossier?.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                  
                  <div className={styles['operator-my-dossiers__card-meta']}>
                    <div className={styles['operator-my-dossiers__card-meta-item']}>
                      <MapPin size={14} />
                      <span>{dossier.lieu_disparition || dossier.ville_disparition || 'Non renseigné'}</span>
                    </div>
                    <div className={styles['operator-my-dossiers__card-meta-item']}>
                      <Calendar size={14} />
                      <span>
                        {dossier.date_disparition 
                          ? new Date(dossier.date_disparition).toLocaleDateString('fr-FR')
                          : 'Date inconnue'
                        }
                      </span>
                    </div>
                    <div className={styles['operator-my-dossiers__card-meta-item']}>
                      <AlertTriangle size={14} style={{ color: getUrgencyColor(dossier.niveau_urgence) }} />
                      <span style={{ color: getUrgencyColor(dossier.niveau_urgence), fontWeight: 500 }}>
                        {dossier.niveau_urgence?.charAt(0).toUpperCase() + dossier.niveau_urgence?.slice(1) || 'Normal'}
                      </span>
                    </div>
                  </div>
                  
                  {dossier.circonstances && (
                    <p className={styles['operator-my-dossiers__card-excerpt']}>
                      {dossier.circonstances.length > 100 
                        ? `${dossier.circonstances.substring(0, 100)}...` 
                        : dossier.circonstances
                      }
                    </p>
                  )}
                  
                  <div className={styles['operator-my-dossiers__card-footer']}>
                    <span className={styles['operator-my-dossiers__card-date']}>
                      Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <div className={styles['operator-my-dossiers__card-actions']}>
                      <button
                        className={styles['operator-my-dossiers__view-btn']}
                        onClick={() => handleViewDossier(dossier.id)}
                      >
                        <Eye size={16} />
                        Voir
                      </button>
                      {(dossier.id_utilisateur_createur === currentUser?.id ||
                        currentUser?.role === 'admin_organisation' ||
                        currentUser?.role === 'super_admin') && (
                        <button
                          className={styles['operator-my-dossiers__edit-btn']}
                          onClick={() => navigate(`/operator/edit-dossier/${dossier.id}`)}
                        >
                          <Edit3 size={16} />
                          Modifier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles['operator-my-dossiers__empty-state']}>
              <FolderOpen className={styles['operator-my-dossiers__empty-icon']} />
              <p className={styles['operator-my-dossiers__empty-text']}>
                {ownershipFilter === 'organisation' 
                  ? 'Aucun dossier dans votre organisation'
                  : 'Vous n\'avez pas encore créé de dossier'
                }
              </p>
              {ownershipFilter === 'mine' && (
                <button
                  className={styles['operator-my-dossiers__empty-action']}
                  onClick={() => navigate('/operator/create-dossier')}
                >
                  <Plus size={18} />
                  Créer mon premier dossier
                </button>
              )}
            </div>
          )}
        </div>
    </OperatorLayout>
  );
};

export default OperatorMyDossiersPage;