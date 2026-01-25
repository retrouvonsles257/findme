/**
 * =====================================================
 * RETROUVONSLES - Operator Create Dossier Page
 * Création d'un nouveau dossier de disparition
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../hooks';
import { useDossierCreate } from '../../features/dossiers/hooks/useDossierCreate';
import { OperatorLayout } from './OperatorLayout';
import { 
  FolderPlus,
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  FileText,
  Info,
  User,
  MapPin,
  FileEdit
} from 'lucide-react';
import styles from './CreateDossierPage.module.css';

export const CreateDossierPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { isSubmitting, submitForm } = useDossierCreate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    physicalDescription: '',
    lastSeenLocation: '',
    dateLastSeen: '',
    circumstances: ''
  });

  useEffect(() => {
    if (currentUser && !['operateur_saisie', 'admin_organisation'].includes(currentUser.role)) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdDossier = await submitForm();

      if (createdDossier) {
        setSuccessMessage(t('operator.successMessage'));
        setTimeout(() => {
          navigate(`/operator/dossiers/${createdDossier.id}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error creating dossier:', err);
      setErrorMessage(err.message || t('common.error'));
    }
  };

  const handleCancel = () => {
    navigate('/operator/dashboard');
  };

  return (
    <OperatorLayout title={t('operator.createDossierTitle')}>
      <div className={styles.createDossier__container}>
        {/* Info Banner */}
        <div className={styles.createDossier__infoBanner}>
          <div className={styles.createDossier__infoBannerIcon}>
            <Info />
          </div>
          <div className={styles.createDossier__infoBannerContent}>
            <h3 className={styles.createDossier__infoBannerTitle}>
              {t('operator.createDossierTitle') || "Créer un nouveau dossier"}
            </h3>
            <p className={styles.createDossier__infoBannerText}>
              {t('operator.createDossierSubtitle') || "Remplissez le formulaire pour créer un nouveau dossier de disparition"}
            </p>
          </div>
          <div className={styles.createDossier__infoBannerDecoration}>
            <FolderPlus />
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className={styles.createDossier__errorMessage}>
            <AlertCircle className={styles.createDossier__messageIcon} />
            <div className={styles.createDossier__messageContent}>
              <strong className={styles.createDossier__messageTitle}>Erreur</strong>
              <span className={styles.createDossier__messageText}>{errorMessage}</span>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className={styles.createDossier__successMessage}>
            <CheckCircle2 className={styles.createDossier__messageIcon} />
            <div className={styles.createDossier__messageContent}>
              <strong className={styles.createDossier__messageTitle}>Succès</strong>
              <span className={styles.createDossier__messageText}>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className={styles.createDossier__formWrapper}>
          {isSubmitting ? (
            <div className={styles.createDossier__loadingState}>
              <div className={styles.createDossier__loadingContent}>
                <Loader2 className={styles.createDossier__spinner} />
                <p className={styles.createDossier__loadingText}>
                  {t('operator.creating') || "Création en cours"}
                </p>
                <p className={styles.createDossier__loadingSubtext}>
                  Veuillez patienter...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateDossier}>
              {/* Form Header */}
              <div className={styles.createDossier__formHeader}>
                <div className={styles.createDossier__formHeaderLeft}>
                  <FileText className={styles.createDossier__formHeaderIcon} />
                  <div className={styles.createDossier__formHeaderContent}>
                    <h3 className={styles.createDossier__formMainTitle}>
                      Create Missing Person Dossier
                    </h3>
                    <p className={styles.createDossier__formSubtitle}>
                      Tous les champs marqués d'un astérisque (*) sont obligatoires
                    </p>
                  </div>
                </div>
                <div className={styles.createDossier__formHeaderRight}>
                  <span className={styles.createDossier__formBadge}>FORMULAIRE</span>
                </div>
              </div>

              {/* Form Sections */}
              <div className={styles.createDossier__formSections}>
                {/* Missing Person Information Section */}
                <div className={styles.createDossier__formSection}>
                  <div className={styles.createDossier__sectionHeader}>
                    <div className={styles.createDossier__sectionHeaderContent}>
                      <h4 className={styles.createDossier__sectionTitle}>
                        Missing Person Information
                      </h4>
                      <p className={styles.createDossier__sectionDescription}>
                        Informations sur la personne disparue
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.createDossier__formFields}>
                    {/* Full Name */}
                    <div className={styles.createDossier__fieldGroup}>
                      <label className={styles.createDossier__fieldLabel}>
                        Full Name
                        <span className={styles.createDossier__fieldLabelRequired}>*</span>
                      </label>
                      <input
                        type="text"
                        className={styles.createDossier__fieldInput}
                        placeholder="Enter person's full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                      />
                    </div>

                    {/* Age & Physical Description - Row Layout */}
                    <div className={styles.createDossier__fieldRow}>
                      <div className={styles.createDossier__fieldGroup}>
                        <label className={styles.createDossier__fieldLabel}>
                          Age
                          <span className={styles.createDossier__fieldLabelRequired}>*</span>
                        </label>
                        <input
                          type="text"
                          className={styles.createDossier__fieldInput}
                          placeholder="Enter age"
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.createDossier__fieldGroup}>
                        <label className={styles.createDossier__fieldLabel}>
                          Physical Description
                        </label>
                        <textarea
                          className={styles.createDossier__fieldTextarea}
                          placeholder="Describe physical characteristics (height, hair color, clothing, etc.)"
                          value={formData.physicalDescription}
                          onChange={(e) => handleInputChange('physicalDescription', e.target.value)}
                        />
                        <small className={styles.createDossier__fieldHelp}>
                          Describe physical characteristics (height, hair color, clothing, etc.)
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Seen Information Section */}
                <div className={styles.createDossier__formSection}>
                  <div className={styles.createDossier__sectionHeader}>
                    <div className={styles.createDossier__sectionHeaderContent}>
                      <h4 className={styles.createDossier__sectionTitle}>
                        Last Seen Location
                      </h4>
                      <p className={styles.createDossier__sectionDescription}>
                        Dernier lieu où la personne a été vue
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.createDossier__formFields}>
                    {/* Location */}
                    <div className={styles.createDossier__fieldGroup}>
                      <label className={styles.createDossier__fieldLabel}>
                        Location
                        <span className={styles.createDossier__fieldLabelRequired}>*</span>
                      </label>
                      <input
                        type="text"
                        className={styles.createDossier__fieldInput}
                        placeholder="Enter location address or description"
                        value={formData.lastSeenLocation}
                        onChange={(e) => handleInputChange('lastSeenLocation', e.target.value)}
                        required
                      />
                    </div>

                    {/* Date Last Seen */}
                    <div className={styles.createDossier__fieldGroup}>
                      <label className={styles.createDossier__fieldLabel}>
                        Date Last Seen
                        <span className={styles.createDossier__fieldLabelRequired}>*</span>
                      </label>
                      <input
                        type="date"
                        className={styles.createDossier__fieldInput}
                        placeholder="mm / dd / yyyy"
                        value={formData.dateLastSeen}
                        onChange={(e) => handleInputChange('dateLastSeen', e.target.value)}
                        required
                      />
                      <small className={styles.createDossier__fieldHelp}>
                        Format: mm / dd / yyyy
                      </small>
                    </div>
                  </div>
                </div>

                {/* Circumstances Section */}
                <div className={styles.createDossier__formSection}>
                  <div className={styles.createDossier__sectionHeader}>
                    <div className={styles.createDossier__sectionHeaderContent}>
                      <h4 className={styles.createDossier__sectionTitle}>
                        Circumstances
                      </h4>
                      <p className={styles.createDossier__sectionDescription}>
                        Circonstances de la disparition
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.createDossier__formFields}>
                    <div className={styles.createDossier__fieldGroup}>
                      <textarea
                        className={styles.createDossier__fieldTextarea}
                        placeholder="Describe the circumstances of the disappearance"
                        value={formData.circumstances}
                        onChange={(e) => handleInputChange('circumstances', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className={styles.createDossier__formActions}>
                <button 
                  type="button" 
                  className={styles.createDossier__cancelButton}
                  onClick={handleCancel}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={styles.createDossier__submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                      Création en cours...
                    </>
                  ) : (
                    'Créer le dossier'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default CreateDossierPage;