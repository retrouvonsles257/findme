/**
 * =====================================================
 * RETROUVONSLES - Operator Data Entry Page
 * Saisie de données pour les dossiers et signalements
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../hooks';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { OperatorLayout } from './OperatorLayout';
import { SignalementForm } from '../../components/forms';
import { 
  FileInput, 
  AlertCircle, 
  Search, 
  CheckCircle2, 
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  FolderOpen
} from 'lucide-react';
import styles from './DataEntryPage.module.css';

type TabType = 'signalement' | 'recherche';

export const DataEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossiers, isLoading: dossiersLoading } = useDossiers();
  const [activeTab, setActiveTab] = useState<TabType>('signalement');
  const [selectedDossierId, setSelectedDossierId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentUser && !['operateur_saisie', 'admin_organisation'].includes(currentUser.role)) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  const myDossiers = dossiers.filter(
    (d: any) => d.id_utilisateur_createur === currentUser?.id || d.enregistre_par === currentUser?.id
  );

  const handleSignalementSubmit = async (formData: any) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      if (!selectedDossierId) {
        setErrorMessage('Veuillez sélectionner un dossier');
        return;
      }

      setSuccessMessage('Signalement enregistré avec succès!');
      setTimeout(() => {
        setSelectedDossierId('');
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'enregistrement');
      console.error('Error creating signalement:', err);
    }
  };

  const tabs = [
    { key: 'signalement', label: 'Nouveau Signalement', icon: FileInput },
    { key: 'recherche', label: 'Recherche Dossier', icon: Search }
  ];

  return (
    <OperatorLayout title={t('operator.dataEntryTitle')}>
      <p className={styles['operator-data-entry__subtitle']}>
        {t('operator.dataEntrySubtitle')}
      </p>

        {/* Messages */}
        {errorMessage && (
          <div className={styles['operator-data-entry__error-message']}>
            <XCircle className={styles['operator-data-entry__message-icon']} />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className={styles['operator-data-entry__success-message']}>
            <CheckCircle2 className={styles['operator-data-entry__message-icon']} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className={styles['operator-data-entry__tabs']}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                className={`${styles['operator-data-entry__tab']} ${activeTab === tab.key ? styles['operator-data-entry__tab--active'] : ''}`}
                onClick={() => setActiveTab(tab.key as TabType)}
              >
                <IconComponent size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className={styles['operator-data-entry__content']}>
          {dossiersLoading ? (
            <div className={styles['operator-data-entry__loading-state']}>
              <Loader2 className={styles['operator-data-entry__spinner']} />
              <p className={styles['operator-data-entry__loading-text']}>Chargement des dossiers...</p>
            </div>
          ) : activeTab === 'signalement' ? (
            <div className={styles['operator-data-entry__form-section']}>
              {/* Dossier Selection */}
              <div className={styles['operator-data-entry__select-card']}>
                <label className={styles['operator-data-entry__label']}>
                  <FolderOpen size={18} />
                  Sélectionner un Dossier
                  <span className={styles['operator-data-entry__required']}>*</span>
                </label>
                <select
                  className={styles['operator-data-entry__select']}
                  value={selectedDossierId}
                  onChange={(e) => setSelectedDossierId(e.target.value)}
                >
                  <option value="">-- Choisir un dossier --</option>
                  {myDossiers.map((dossier: any) => (
                    <option key={dossier.id} value={dossier.id}>
                      {dossier.numero_dossier} - {dossier.lieu_disparition || 'Non renseigné'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Signalement Form */}
              {selectedDossierId ? (
                <SignalementForm
                  onSubmit={handleSignalementSubmit}
                  isLoading={false}
                />
              ) : (
                <div className={styles['operator-data-entry__empty-state']}>
                  <AlertCircle className={styles['operator-data-entry__empty-icon']} />
                  <p className={styles['operator-data-entry__empty-text']}>
                    Sélectionnez un dossier pour commencer la saisie d'un signalement
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles['operator-data-entry__form-section']}>
              <div className={styles['operator-data-entry__search-card']}>
                <label className={styles['operator-data-entry__label']}>
                  <Search size={18} />
                  Rechercher un Dossier
                </label>
                <input
                  type="text"
                  className={styles['operator-data-entry__input']}
                  placeholder="Entrez le numéro de dossier ou le lieu..."
                />
              </div>

              {/* Dossiers List */}
              <div className={styles['operator-data-entry__dossiers-list']}>
                <h3 className={styles['operator-data-entry__section-title']}>Mes Dossiers</h3>
                {myDossiers.length > 0 ? (
                  <div className={styles['operator-data-entry__dossiers-grid']}>
                    {myDossiers.map((dossier: any) => (
                      <div
                        key={dossier.id}
                        className={styles['operator-data-entry__dossier-card']}
                        onClick={() => navigate(`/operator/dossiers/${dossier.id}`)}
                      >
                        <h4 className={styles['operator-data-entry__dossier-title']}>{dossier.numero_dossier}</h4>
                        <div className={styles['operator-data-entry__dossier-meta']}>
                          <div className={styles['operator-data-entry__dossier-meta-item']}>
                            <MapPin size={14} />
                            <span>{dossier.lieu_disparition || 'Non renseigné'}</span>
                          </div>
                          <div className={styles['operator-data-entry__dossier-meta-item']}>
                            <Calendar size={14} />
                            <span>{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles['operator-data-entry__empty-state']}>
                    <FolderOpen className={styles['operator-data-entry__empty-icon']} />
                    <p className={styles['operator-data-entry__empty-text']}>Aucun dossier créé</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </OperatorLayout>
  );
};

export default DataEntryPage;