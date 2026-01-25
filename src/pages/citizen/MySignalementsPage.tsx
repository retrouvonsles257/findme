/**
 * =====================================================
 * RETROUVONSLES - Citizen My Signalements Page
 * Liste des signalements créés par le citoyen
 * Intégré avec Supabase API
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalements } from '../../features/signalements/hooks';
import { CitizenLayout } from './CitizenLayout';
import { Search, Plus, Eye, Trash2, Loader2, FileText, AlertCircle, MapPin, Calendar } from 'lucide-react';
import styles from './MySignalementsPage.module.css';

export const CitizenMySignalementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Hook pour récupérer les signalements
  const { 
    signalements, 
    isLoading, 
    error,
    fetchSignalements,
    deleteSignalement
  } = useSignalements();

  // Charger les signalements de l'utilisateur au montage
  useEffect(() => {
    if (userId) {
      fetchSignalements();
    }
  }, [userId, fetchSignalements]);

  // Filtrer les signalements de l'utilisateur
  const userSignalements = signalements.filter(
    (s: any) => s.utilisateur_id === userId || s.id_utilisateur === userId
  );

  // Mapper les statuts de la DB vers les statuts d'affichage
  const mapStatus = (etat: string): 'approved' | 'pending' | 'rejected' => {
    switch (etat) {
      case 'valide':
        return 'approved';
      case 'rejete':
      case 'invalide':
        return 'rejected';
      case 'en_cours':
      case 'nouveau':
      case 'en_attente':
      default:
        return 'pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
      case 'valide':
        return t('citizen.approved');
      case 'pending':
      case 'en_cours':
      case 'nouveau':
      case 'en_attente':
        return t('citizen.underReview');
      case 'rejected':
      case 'rejete':
      case 'invalide':
        return t('citizen.rejected');
      default:
        return status;
    }
  };

  // Filtrer par statut
  const filteredSignalements = filterStatus === 'all'
    ? userSignalements
    : userSignalements.filter((sig: any) => {
        const mappedStatus = mapStatus(sig.etat || sig.statut_validation);
        return mappedStatus === filterStatus;
      });

  // Recherche
  const searchedSignalements = filteredSignalements.filter((sig: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (sig.description || '').toLowerCase().includes(searchLower) ||
      (sig.lieu_observation || sig.lieu_observation || '').toLowerCase().includes(searchLower) ||
      (sig.numero_signalement || '').toLowerCase().includes(searchLower)
    );
  });

  // Supprimer un signalement
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSignalement(id);
      setDeleteConfirm(null);
      // Recharger la liste
      fetchSignalements();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  }, [deleteSignalement, fetchSignalements]);

  // Voir les détails d'un signalement
  const handleView = (id: string) => {
    navigate(`/citizen/signalement/${id}`);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <CitizenLayout activeNav="signalements">
      <div className={styles.signalements}>
        {/* Header avec bouton Nouveau */}
        <div className={styles['signalements__header']}>
          <div className={styles['signalements__search-box']}>
            <Search className={styles['signalements__search-icon']} size={18} />
            <input
              type="text"
              placeholder={t('citizen.searchReports')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles['signalements__search-input']}
            />
          </div>
          <button
            className={styles['signalements__new-button']}
            onClick={() => navigate('/citizen/new-signalement')}
          >
            <Plus size={18} />
            {t('citizen.newReport')}
          </button>
        </div>

        {/* Filtres */}
        <div className={styles['signalements__filters']}>
          <label className={styles['signalements__filter-label']}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles['signalements__filter-select']}
            >
              <option value="all">{t('common.allItems')} ({userSignalements.length})</option>
              <option value="approved">{t('citizen.approved')}</option>
              <option value="pending">{t('citizen.underReview')}</option>
              <option value="rejected">{t('citizen.rejected')}</option>
            </select>
          </label>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles['signalements__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className={styles['signalements__loading']}>
            <Loader2 size={32} className={styles['signalements__loading-spin']} />
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          /* Liste des signalements */
          <div className={styles['signalements__list-container']}>
            {searchedSignalements.length > 0 ? (
              <div className={styles['signalements__list']}>
                {searchedSignalements.map((sig: any) => {
                  const status = mapStatus(sig.etat || sig.statut_validation);
                  return (
                    <div key={sig.id} className={styles['signalements__card']}>
                      <div className={styles['signalements__card-header']}>
                        <div className={styles['signalements__card-title-wrapper']}>
                          <h3 className={styles['signalements__card-title']}>
                            {sig.numero_signalement || `#${sig.id.substring(0, 8)}`}
                          </h3>
                        </div>
                        <span
                          className={`${styles['signalements__status']} ${
                            styles[`signalements__status--${status}`]
                          }`}
                        >
                          {getStatusText(sig.etat || sig.statut_validation)}
                        </span>
                      </div>
                      
                      <div className={styles['signalements__card-meta']}>
                        <span className={styles['signalements__card-date']}>
                          <Calendar size={14} />
                          {formatDate(sig.date_observation || sig.date_observation || sig.created_at)}
                        </span>
                        {(sig.lieu_observation || sig.lieu_observation) && (
                          <span className={styles['signalements__card-location']}>
                            <MapPin size={14} />
                            {sig.lieu_observation || sig.lieu_observation}
                          </span>
                        )}
                      </div>
                      
                      <p className={styles['signalements__card-description']}>
                        {sig.description ? 
                          (sig.description.length > 150 ? 
                            `${sig.description.substring(0, 150)}...` : 
                            sig.description
                          ) : t('citizen.noDescription')
                        }
                      </p>
                      
                      <div className={styles['signalements__card-actions']}>
                        <button 
                          className={styles['signalements__view-button']}
                          onClick={() => handleView(sig.id)}
                        >
                          <Eye size={16} />
                          {t('citizen.view')}
                        </button>
                        
                        {deleteConfirm === sig.id ? (
                          <div className={styles['signalements__delete-confirm']}>
                            <span>{t('citizen.confirmDelete')}</span>
                            <button 
                              className={styles['signalements__confirm-yes']}
                              onClick={() => handleDelete(sig.id)}
                            >
                              {t('common.yes')}
                            </button>
                            <button 
                              className={styles['signalements__confirm-no']}
                              onClick={() => setDeleteConfirm(null)}
                            >
                              {t('common.no')}
                            </button>
                          </div>
                        ) : (
                          <button 
                            className={styles['signalements__delete-button']}
                            onClick={() => setDeleteConfirm(sig.id)}
                            title={t('citizen.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles['signalements__empty']}>
                <FileText size={48} className={styles['signalements__empty-icon']} />
                <p className={styles['signalements__empty-text']}>
                  {searchTerm || filterStatus !== 'all' 
                    ? t('citizen.noMatchingReports')
                    : t('citizen.noReports')
                  }
                </p>
                <button
                  className={styles['signalements__empty-button']}
                  onClick={() => navigate('/citizen/new-signalement')}
                >
                  <Plus size={18} />
                  {t('citizen.createFirstReport')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
};