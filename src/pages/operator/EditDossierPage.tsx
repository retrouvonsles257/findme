/**
 * =====================================================
 * RETROUVONSLES - Operator Edit Dossier Page
 * Édition d'un dossier pour l'opérateur
 * Formulaire avec pré-remplissage des données existantes
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useDossierUpdate } from '../../features/dossiers/hooks/useDossierUpdate';
import { OperatorLayout } from './OperatorLayout';
import { DossierPhotos } from '../../features/dossiers/components/DossierPhotos';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  FileEdit,
  ChevronDown,
  ChevronUp,
  Save,
  MapPin,
  Calendar,
  Phone,
  User
} from 'lucide-react';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './EditDossierPage.module.css';

interface EditDossierFormData {
  // Informations de disparition
  date_disparition: string;
  lieu_disparition: string;
  ville_disparition: string;
  region_disparition: string;
  pays_disparition: string;
  type_disparition: string;
  niveau_urgence: string;
  circonstances: string;
  
  // Contacts
  contact_famille_principale: string;
  telephone_contact: string;
  email_contact: string;
}

export const OperatorEditDossierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossier, isLoading: detailLoading, fetchDossier } = useDossierDetail();
  const { updateDossier, error, isUpdating } = useDossierUpdate();
  const [successMessage, setSuccessMessage] = useState('');
  const [showPhotos, setShowPhotos] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [accessDenied, setAccessDenied] = useState(false);
  
  // État du formulaire - initialisé vide, sera rempli quand le dossier est chargé
  const [formData, setFormData] = useState<EditDossierFormData>({
    date_disparition: '',
    lieu_disparition: '',
    ville_disparition: '',
    region_disparition: '',
    pays_disparition: 'Cameroun',
    type_disparition: 'inconnue',
    niveau_urgence: 'normal',
    circonstances: '',
    contact_famille_principale: '',
    telephone_contact: '',
    email_contact: '',
  });

  useEffect(() => {
    if (id) {
      fetchDossier(id);
    }
  }, [id, fetchDossier]);

  // Vérifier que l'opérateur est bien le créateur du dossier
  useEffect(() => {
    if (dossier && currentUser) {
      const isCreator = dossier.id_utilisateur_createur === currentUser.id;
      const isAdmin = currentUser.role === 'admin_organisation' || currentUser.role === 'super_admin';
      
      if (!isCreator && !isAdmin) {
        setAccessDenied(true);
        // Rediriger après un court délai pour montrer le message
        setTimeout(() => {
          navigate('/operator/my-dossiers');
        }, 3000);
      }
    }
  }, [dossier, currentUser, navigate]);

  // Pré-remplir le formulaire quand le dossier est chargé
  useEffect(() => {
    if (dossier) {
      setFormData({
        date_disparition: dossier.date_disparition?.split('T')[0] || '',
        lieu_disparition: dossier.lieu_disparition || '',
        ville_disparition: dossier.ville_disparition || '',
        region_disparition: dossier.region_disparition || '',
        pays_disparition: dossier.pays_disparition || 'Cameroun',
        type_disparition: dossier.type_disparition || 'inconnue',
        niveau_urgence: dossier.niveau_urgence || 'normal',
        circonstances: dossier.circonstances || '',
        contact_famille_principale: dossier.contact_famille_principale || '',
        telephone_contact: dossier.telephone_contact || '',
        email_contact: dossier.email_contact || '',
      });
    }
  }, [dossier]);

  const handleInputChange = (field: keyof EditDossierFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date_disparition) {
      newErrors.date_disparition = 'La date de disparition est requise';
    }
    if (!formData.lieu_disparition.trim()) {
      newErrors.lieu_disparition = 'Le lieu de disparition est requis';
    }
    if (!formData.circonstances.trim() || formData.circonstances.length < 10) {
      newErrors.circonstances = 'Les circonstances sont requises (min. 10 caractères)';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!id) return;

    try {
      const updatedData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      await updateDossier(id, updatedData as any);
      setSuccessMessage('Dossier mis à jour avec succès!');

      setTimeout(() => {
        navigate(`/operator/dossiers/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating dossier:', err);
    }
  };

  // Empêcher la soumission avec Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  return (
    <OperatorLayout title={t('operator.editDossierTitle') || 'Modifier le dossier'}>
      <div className={styles.operatorEditDossier}>
        {/* Header */}
        <div className={styles.operatorEditDossier__header}>
          <button 
            className={styles.operatorEditDossier__backButton} 
            onClick={() => navigate(`/operator/dossiers/${id}`)}
            type="button"
          >
            <ArrowLeft size={18} />
            <span>Retour aux détails</span>
          </button>
          
          {dossier && (
            <div className={styles.operatorEditDossier__headerInfo}>
              <FileEdit className={styles.operatorEditDossier__headerIcon} />
              <div>
                <h2 className={styles.operatorEditDossier__title}>
                  Modifier: {dossier.numero_dossier}
                </h2>
                <p className={styles.operatorEditDossier__subtitle}>
                  Modifiez les informations du dossier de disparition
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {accessDenied && (
          <div className={styles.operatorEditDossier__errorMessage}>
            <AlertCircle size={20} />
            <span>Accès refusé: Vous ne pouvez modifier que les dossiers que vous avez créés. Redirection...</span>
          </div>
        )}

        {error && (
          <div className={styles.operatorEditDossier__errorMessage}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className={styles.operatorEditDossier__successMessage}>
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Contenu principal */}
        <div className={styles.operatorEditDossier__content}>
          {detailLoading ? (
            <div className={styles.operatorEditDossier__skeletonWrap}>
              <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
            </div>
          ) : accessDenied ? (
            <div className={styles.operatorEditDossier__notFound}>
              <AlertCircle className={styles.operatorEditDossier__notFoundIcon} />
              <p>Vous n'avez pas la permission de modifier ce dossier.</p>
              <p>Seul le créateur du dossier peut le modifier.</p>
            </div>
          ) : dossier ? (
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className={styles.operatorEditDossier__form}>
              {/* Section: Informations de disparition */}
              <div className={styles.operatorEditDossier__section}>
                <div className={styles.operatorEditDossier__sectionHeader}>
                  <MapPin className={styles.operatorEditDossier__sectionIcon} />
                  <h3 className={styles.operatorEditDossier__sectionTitle}>Informations de disparition</h3>
                </div>
                
                <div className={styles.operatorEditDossier__fields}>
                  <div className={styles.operatorEditDossier__fieldRow}>
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>
                        <Calendar size={16} />
                        Date de disparition *
                      </label>
                      <input
                        type="date"
                        className={`${styles.operatorEditDossier__input} ${formErrors.date_disparition ? styles['operatorEditDossier__input--error'] : ''}`}
                        value={formData.date_disparition}
                        onChange={(e) => handleInputChange('date_disparition', e.target.value)}
                      />
                      {formErrors.date_disparition && (
                        <span className={styles.operatorEditDossier__fieldError}>{formErrors.date_disparition}</span>
                      )}
                    </div>
                    
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>Niveau d'urgence</label>
                      <select
                        className={styles.operatorEditDossier__select}
                        value={formData.niveau_urgence}
                        onChange={(e) => handleInputChange('niveau_urgence', e.target.value)}
                      >
                        <option value="faible">Faible</option>
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                        <option value="critique">Critique</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.operatorEditDossier__fieldGroup}>
                    <label className={styles.operatorEditDossier__label}>
                      <MapPin size={16} />
                      Lieu de disparition *
                    </label>
                    <input
                      type="text"
                      className={`${styles.operatorEditDossier__input} ${formErrors.lieu_disparition ? styles['operatorEditDossier__input--error'] : ''}`}
                      value={formData.lieu_disparition}
                      onChange={(e) => handleInputChange('lieu_disparition', e.target.value)}
                      placeholder="Adresse ou lieu précis"
                    />
                    {formErrors.lieu_disparition && (
                      <span className={styles.operatorEditDossier__fieldError}>{formErrors.lieu_disparition}</span>
                    )}
                  </div>
                  
                  <div className={styles.operatorEditDossier__fieldRow}>
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>Ville</label>
                      <input
                        type="text"
                        className={styles.operatorEditDossier__input}
                        value={formData.ville_disparition}
                        onChange={(e) => handleInputChange('ville_disparition', e.target.value)}
                        placeholder="Ex: Yaoundé"
                      />
                    </div>
                    
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>Région</label>
                      <input
                        type="text"
                        className={styles.operatorEditDossier__input}
                        value={formData.region_disparition}
                        onChange={(e) => handleInputChange('region_disparition', e.target.value)}
                        placeholder="Ex: Centre"
                      />
                    </div>
                    
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>Pays</label>
                      <input
                        type="text"
                        className={styles.operatorEditDossier__input}
                        value={formData.pays_disparition}
                        onChange={(e) => handleInputChange('pays_disparition', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.operatorEditDossier__fieldGroup}>
                    <label className={styles.operatorEditDossier__label}>Type de disparition</label>
                    <select
                      className={styles.operatorEditDossier__select}
                      value={formData.type_disparition}
                      onChange={(e) => handleInputChange('type_disparition', e.target.value)}
                    >
                      <option value="inconnue">Inconnue</option>
                      <option value="fugue">Fugue</option>
                      <option value="enlevement_presume">Enlèvement présumé</option>
                      <option value="accident">Accident</option>
                      <option value="disparition_volontaire">Disparition volontaire</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  
                  <div className={styles.operatorEditDossier__fieldGroup}>
                    <label className={styles.operatorEditDossier__label}>Circonstances *</label>
                    <textarea
                      className={`${styles.operatorEditDossier__textarea} ${formErrors.circonstances ? styles['operatorEditDossier__textarea--error'] : ''}`}
                      value={formData.circonstances}
                      onChange={(e) => handleInputChange('circonstances', e.target.value)}
                      placeholder="Décrivez les circonstances de la disparition..."
                      rows={5}
                    />
                    {formErrors.circonstances && (
                      <span className={styles.operatorEditDossier__fieldError}>{formErrors.circonstances}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Contacts */}
              <div className={styles.operatorEditDossier__section}>
                <div className={styles.operatorEditDossier__sectionHeader}>
                  <Phone className={styles.operatorEditDossier__sectionIcon} />
                  <h3 className={styles.operatorEditDossier__sectionTitle}>Informations de contact</h3>
                </div>
                
                <div className={styles.operatorEditDossier__fields}>
                  <div className={styles.operatorEditDossier__fieldGroup}>
                    <label className={styles.operatorEditDossier__label}>
                      <User size={16} />
                      Nom du contact principal
                    </label>
                    <input
                      type="text"
                      className={styles.operatorEditDossier__input}
                      value={formData.contact_famille_principale}
                      onChange={(e) => handleInputChange('contact_famille_principale', e.target.value)}
                      placeholder="Nom complet du contact"
                    />
                  </div>
                  
                  <div className={styles.operatorEditDossier__fieldRow}>
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>
                        <Phone size={16} />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        className={styles.operatorEditDossier__input}
                        value={formData.telephone_contact}
                        onChange={(e) => handleInputChange('telephone_contact', e.target.value)}
                        placeholder="+237 6XX XXX XXX"
                      />
                    </div>
                    
                    <div className={styles.operatorEditDossier__fieldGroup}>
                      <label className={styles.operatorEditDossier__label}>Email</label>
                      <input
                        type="email"
                        className={styles.operatorEditDossier__input}
                        value={formData.email_contact}
                        onChange={(e) => handleInputChange('email_contact', e.target.value)}
                        placeholder="email@exemple.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Note: Les options de visibilité sont gérées par les modérateurs/admins */}

              {/* Actions */}
              <div className={styles.operatorEditDossier__actions}>
                <button
                  type="button"
                  className={styles.operatorEditDossier__cancelButton}
                  onClick={() => navigate(`/operator/dossiers/${id}`)}
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  className={styles.operatorEditDossier__submitButton}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className={styles.operatorEditDossier__buttonSpinner} />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.operatorEditDossier__notFound}>
              <FileEdit className={styles.operatorEditDossier__notFoundIcon} />
              <p>Dossier non trouvé</p>
            </div>
          )}

          {/* Section Photos */}
          {dossier && (
            <div className={styles.operatorEditDossier__photosSection}>
              <button
                type="button"
                className={styles.operatorEditDossier__photosToggle}
                onClick={() => setShowPhotos(!showPhotos)}
              >
                <span>Gérer les photos du dossier</span>
                {showPhotos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showPhotos && id && (
                <div className={styles.operatorEditDossier__photosContent}>
                  <DossierPhotos 
                    dossierId={id} 
                    personneId={dossier.id_personne || undefined}
                    canUpload={true}
                    canDelete={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default OperatorEditDossierPage;
