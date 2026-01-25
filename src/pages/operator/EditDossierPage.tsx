/**
 * =====================================================
 * RETROUVONSLES - Operator Edit Dossier Page
 * Édition d'un dossier pour l'opérateur
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useDossierUpdate } from '../../features/dossiers/hooks/useDossierUpdate';
import { OperatorLayout } from './OperatorLayout';
import { DossierForm } from '../../components/forms';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  FileEdit
} from 'lucide-react';
import styles from './EditDossierPage.module.css';

export const OperatorEditDossierPage: React.FC = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { dossier, isLoading: detailLoading, fetchDossier } = useDossierDetail();
  const { updateDossier, error } = useDossierUpdate();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (dossierId) {
      fetchDossier(dossierId);
    }
  }, [dossierId, fetchDossier]);

  const handleUpdateDossier = async (formData: any) => {
    try {
      if (!dossierId) return;

      const updatedData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      await updateDossier(dossierId, updatedData);
      setSuccessMessage('Dossier mis à jour avec succès!');

      setTimeout(() => {
        navigate(`/operator/dossiers/${dossierId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating dossier:', err);
    }
  };

  return (
    <OperatorLayout title={t('operator.editDossierTitle')}>
      <div className={styles['operator-edit-dossier__header-top']}>
        <button 
          className={styles['operator-edit-dossier__back-button']} 
          onClick={() => navigate(`/operator/dossiers/${dossierId}`)}
        >
          <ArrowLeft size={18} />
          <span>{t('operator.backToDossiers')}</span>
        </button>
      </div>
      
      <p className={styles['operator-edit-dossier__subtitle']}>
        {dossier?.numero_dossier || t('common.loading')}
      </p>

        {/* Messages */}
        {error && (
          <div className={styles.editDossier__errorMessage}>
            <AlertCircle className={styles.editDossier__messageIcon} />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className={styles.editDossier__successMessage}>
            <CheckCircle2 className={styles.editDossier__messageIcon} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <div className={styles.editDossier__formWrapper}>
          {detailLoading ? (
            <div className={styles.editDossier__loadingState}>
              <Loader2 className={styles.editDossier__spinner} />
              <p className={styles.editDossier__loadingText}>Chargement du dossier...</p>
            </div>
          ) : dossier ? (
            <DossierForm onSubmit={handleUpdateDossier} />
          ) : (
            <div className={styles.editDossier__notFound}>
              <FileEdit className={styles.editDossier__notFoundIcon} />
              <p className={styles.editDossier__notFoundText}>Dossier non trouvé</p>
            </div>
          )}
        </div>
    </OperatorLayout>
  );
};

export default OperatorEditDossierPage;