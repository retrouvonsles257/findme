/**
 * =====================================================
 * RETROUVONSLES - Operator Dossier Detail Page
 * Vue détaillée d'un dossier pour l'opérateur
 * Avec onglet Filiation fonctionnel
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { logActivity } from '../../services/audit/auditService';
import { NomRole, TypeAction } from '../../@types/enums.types';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import * as filiationAPI from '../../features/filiation/services/filiationAPI';
import * as personneAPI from '../../features/personnes/services/personneAPI';
import { OperatorLayout } from './OperatorLayout';
import { 
  FileText, 
  ArrowLeft, 
  Edit3, 
  Loader2,
  Info,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  User,
  Plus,
  Save,
  Image,
  X,
  ZoomIn,
  ChevronUp,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './DossierDetailPage.module.css';
import { supabase } from '../../config';
import { MapTilerView } from '../../components/maps/MapTilerView';

type TabType = 'info' | 'signalements' | 'localisations' | 'filiation' | 'photos';

interface PhotoData {
  id: string;
  url_cloudinary: string;
  url_thumbnail?: string;
  type_photo: string;
  titre?: string;
  description?: string;
  est_principale: boolean;
  visible_public: boolean;
  created_at: string;
}

interface FiliationFormData {
  type_lien: string;
  id_personne_source: string;
  id_personne_cible: string;
  precision_lien: string;
  commentaire: string;
}

const initialFiliationForm: FiliationFormData = {
  type_lien: 'pere_biologique',
  id_personne_source: '',
  id_personne_cible: '',
  precision_lien: '',
  commentaire: '',
};

export const OperatorDossierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossier, isLoading, fetchDossier } = useDossierDetail();
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  
  // Filiation state
  const [filiations, setFiliations] = useState<any[]>([]);
  const [filiationLoading, setFiliationLoading] = useState(false);
  const [showFiliationForm, setShowFiliationForm] = useState(false);
  const [filiationFormData, setFiliationFormData] = useState<FiliationFormData>(initialFiliationForm);
  const [filiationSubmitting, setFiliationSubmitting] = useState(false);
  const [filiationError, setFiliationError] = useState('');
  const [filiationSuccess, setFiliationSuccess] = useState('');
  const [personnes, setPersonnes] = useState<any[]>([]);
  
  // New person modal state (for creating family members)
  const [showNewPersonModal, setShowNewPersonModal] = useState(false);
  const [newPersonData, setNewPersonData] = useState({ nom: '', prenom: '', sexe: 'non_precise' });
  const [newPersonSubmitting, setNewPersonSubmitting] = useState(false);
  
  // Selected filiation for expanded view
  const [selectedFiliation, setSelectedFiliation] = useState<string | null>(null);
  
  // Photos state
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchDossier(id);
      fetchSignalements(id);
      fetchLocalisations(id);
    }
  }, [id, fetchDossier, fetchSignalements, fetchLocalisations]);

  // Fetch filiations when tab is active
  useEffect(() => {
    const loadFiliations = async () => {
      if (activeTab === 'filiation' && dossier?.id_personne) {
        setFiliationLoading(true);
        try {
          const data = await filiationAPI.getFiliationLiensByPersonne(dossier.id_personne);
          setFiliations(data);
        } catch (error) {
          console.error('Error fetching filiations:', error);
        } finally {
          setFiliationLoading(false);
        }
      }
    };
    loadFiliations();
  }, [activeTab, dossier?.id_personne]);

  // Fetch personnes for filiation form
  useEffect(() => {
    const loadPersonnes = async () => {
      if (showFiliationForm) {
        try {
          const result = await personneAPI.getPersonnes({}, 1, 100);
          setPersonnes(result.data);
        } catch (error) {
          console.error('Error fetching personnes:', error);
        }
      }
    };
    loadPersonnes();
  }, [showFiliationForm]);

  // Charger les photos de la personne (comme authority)
  useEffect(() => {
    const loadPhotos = async () => {
      if (!dossier?.id_personne) return;
      
      setPhotosLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('photo')
          .select('*')
          .eq('id_personne', dossier.id_personne)
          .order('est_principale', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPhotos(data || []);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };

    if (dossier?.id_personne) {
      loadPhotos();
    }
  }, [dossier?.id_personne]);

  const handleFiliationInputChange = (field: keyof FiliationFormData, value: string) => {
    setFiliationFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFiliationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dossier?.id_personne) {
      setFiliationError('Ce dossier n\'a pas de personne associée');
      return;
    }
    
    setFiliationSubmitting(true);
    setFiliationError('');
    
    try {
      const filiationData = {
        type_lien: filiationFormData.type_lien as any,
        id_personne_source: dossier.id_personne,
        id_personne_cible: filiationFormData.id_personne_cible,
        precision_lien: filiationFormData.precision_lien || undefined,
        nature_filiation: 'biologique' as const,
        statut_verification: 'declare_famille' as const,
        type_preuve: 'temoignages' as const,
        commentaire: filiationFormData.commentaire || undefined,
        // Traçabilité / RLS
        cree_par: currentUser?.id,
        modifie_par: currentUser?.id,
        // Par défaut: confidentiel et non public
        visible_public: false,
        confidentiel: true,
      };
      
      await filiationAPI.createFiliationLien(filiationData as any);

      await logActivity({
        type_action: TypeAction.AUTRE,
        description: 'Création lien filiation (opérateur)',
        action_detaillee: 'creation_filiation',
        id_utilisateur: currentUser?.id || null,
        id_dossier: dossier.id,
        donnees_apres: {
          id_personne_source: dossier.id_personne,
          id_personne_cible: filiationFormData.id_personne_cible,
          type_lien: filiationFormData.type_lien,
        },
      });
      
      setFiliationSuccess('Lien de filiation créé avec succès!');
      setFiliationFormData(initialFiliationForm);
      setShowFiliationForm(false);
      
      // Refresh filiations
      const data = await filiationAPI.getFiliationLiensByPersonne(dossier.id_personne);
      setFiliations(data);
      
      setTimeout(() => setFiliationSuccess(''), 3000);
    } catch (error: any) {
      setFiliationError(error.message || 'Erreur lors de la création du lien');
    } finally {
      setFiliationSubmitting(false);
    }
  };

  // Créer un nouveau membre de famille à la volée
  const handleCreateNewPerson = async () => {
    if (!newPersonData.nom.trim() || !newPersonData.prenom.trim()) {
      return;
    }
    
    setNewPersonSubmitting(true);
    try {
      const personneData = {
        nom: newPersonData.nom,
        prenom: newPersonData.prenom,
        nom_complet: `${newPersonData.prenom} ${newPersonData.nom}`.trim(),
        sexe: newPersonData.sexe as 'masculin' | 'feminin' | 'inconnu' | 'non_precise',
        statut_identite: 'identifie' as const,
        fiabilite_informations: 'probable' as const,
      };
      
      const createdPerson = await personneAPI.createPersonne(
        personneData as any,
        currentUser?.id || 'anonymous'
      );
      
      // Ajouter la nouvelle personne à la liste et la sélectionner
      setPersonnes(prev => [...prev, createdPerson]);
      setFiliationFormData(prev => ({ ...prev, id_personne_cible: createdPerson.id }));
      
      // Fermer le modal et réinitialiser
      setShowNewPersonModal(false);
      setNewPersonData({ nom: '', prenom: '', sexe: 'non_precise' });
      
    } catch (error: any) {
      console.error('Error creating person:', error);
      setFiliationError('Erreur lors de la création de la personne');
    } finally {
      setNewPersonSubmitting(false);
    }
  };

  // Supprimer un lien de filiation
  const handleDeleteFiliation = async (filiationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce lien de filiation ?')) {
      return;
    }
    
    try {
      await filiationAPI.deleteFiliationLien(filiationId);
      
      // Mettre à jour la liste localement
      setFiliations(prev => prev.filter((f: any) => f.id !== filiationId));
      setFiliationSuccess('Lien de filiation supprimé');
      setTimeout(() => setFiliationSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('Error deleting filiation:', error);
      setFiliationError('Erreur lors de la suppression du lien');
      setTimeout(() => setFiliationError(''), 3000);
    }
  };

  const getLienTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      pere_biologique: 'Père biologique',
      mere_biologique: 'Mère biologique',
      pere_adoptif: 'Père adoptif',
      mere_adoptive: 'Mère adoptive',
      frere_biologique: 'Frère biologique',
      soeur_biologique: 'Sœur biologique',
      demi_frere: 'Demi-frère',
      demi_soeur: 'Demi-sœur',
      enfant_biologique: 'Enfant biologique',
      enfant_adoptif: 'Enfant adoptif',
      epoux_epouse: 'Époux/Épouse',
      oncle_tante: 'Oncle/Tante',
      neveu_niece: 'Neveu/Nièce',
      cousin_cousine: 'Cousin/Cousine',
      grand_parent: 'Grand-parent',
      petit_enfant: 'Petit-enfant',
      tuteur_legal: 'Tuteur légal',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    if (status === 'en_cours') return '#ea580c';
    if (status.includes('retrouve')) return '#10b981';
    return '#64748b';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'en_cours') return <Clock size={18} />;
    if (status.includes('retrouve')) return <CheckCircle2 size={18} />;
    return <XCircle size={18} />;
  };

  const tabs = [
    { key: 'info', label: 'Informations', icon: Info },
    { key: 'photos', label: 'Photos', icon: Image },
    { key: 'signalements', label: 'Signalements', icon: AlertCircle },
    { key: 'localisations', label: 'Localisations', icon: MapPin },
    { key: 'filiation', label: 'Filiation', icon: Users }
  ];

  return (
    <OperatorLayout title={dossier?.numero_dossier || t('operator.dossierDetailTitle')}>
      {isLoading ? (
        <div className={styles['operator-dossier-detail__skeletonWrap']}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      ) : dossier ? (
        <>
          {/* Header */}
          <div className={styles['operator-dossier-detail__header']}>
            <div className={styles['operator-dossier-detail__header-top']}>
              <button 
                className={styles['operator-dossier-detail__back-button']} 
                onClick={() => navigate('/operator/my-dossiers')}
              >
                <ArrowLeft size={18} />
                <span>{t('operator.backToDossiers')}</span>
              </button>
            </div>

            <div className={styles.dossierDetail__headerMain}>
              <div className={styles.dossierDetail__headerLeft}>
                <div className={styles.dossierDetail__headerIcon}>
                  <FileText />
                </div>
                <div>
                  <h3 className={styles.dossierDetail__dossierNumber}>{dossier.numero_dossier}</h3>
                  <p className={styles.dossierDetail__subtitle}>Dossier de disparition</p>
                </div>
              </div>
              <div className={styles.dossierDetail__headerRight}>
                <div 
                  className={styles.dossierDetail__statusBadge}
                  style={{ backgroundColor: `${getStatusColor(dossier.statut_dossier)}15` }}
                >
                  {getStatusIcon(dossier.statut_dossier)}
                  <span style={{ color: getStatusColor(dossier.statut_dossier) }}>
                    {dossier.statut_dossier}
                  </span>
                </div>
                {(() => {
                  const isCreator = Boolean(currentUser?.id) && dossier.id_utilisateur_createur === currentUser?.id;
                  const isAdmin =
                    currentUser?.role === NomRole.ADMIN_SYSTEME;
                  return isCreator || isAdmin;
                })() && (
                  <button 
                    className={styles.dossierDetail__editBtn} 
                    onClick={() => navigate(`/operator/edit-dossier/${dossier.id}`)}
                  >
                    <Edit3 size={18} />
                    <span>Éditer</span>
                  </button>
                )}
              </div>
            </div>
          </div>

            {/* Tabs */}
            <div className={styles.dossierDetail__tabs}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    className={`${styles.dossierDetail__tab} ${activeTab === tab.key ? styles['dossierDetail__tab--active'] : ''}`}
                    onClick={() => setActiveTab(tab.key as any)}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className={styles.dossierDetail__content}>
              {activeTab === 'info' && (
                <div className={styles.dossierDetail__infoGrid}>
                  {/* Informations de Disparition */}
                  <div className={styles.dossierDetail__card}>
                    <div className={styles.dossierDetail__cardHeader}>
                      <Calendar className={styles.dossierDetail__cardIcon} />
                      <h3 className={styles.dossierDetail__cardTitle}>Informations de Disparition</h3>
                    </div>
                    <div className={styles.dossierDetail__cardBody}>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Date Disparition:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {new Date(dossier.date_disparition).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Lieu Disparition:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.lieu_disparition || 'Non renseigné'}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Circonstances:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.circonstances || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className={styles.dossierDetail__card}>
                    <div className={styles.dossierDetail__cardHeader}>
                      <Phone className={styles.dossierDetail__cardIcon} />
                      <h3 className={styles.dossierDetail__cardTitle}>Contacts</h3>
                    </div>
                    <div className={styles.dossierDetail__cardBody}>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Contact Famille:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.contact_famille_principale || 'Non renseigné'}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>
                          <Phone size={14} />
                          Téléphone:
                        </label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.telephone_contact || 'Non renseigné'}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>
                          <Mail size={14} />
                          Email:
                        </label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.email_contact || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Carte de localisation */}
                  {(dossier.latitude_disparition && dossier.longitude_disparition) && (
                    <div className={styles.dossierDetail__card + ' ' + styles.dossierDetail__cardFullWidth}>
                      <div className={styles.dossierDetail__cardHeader}>
                        <MapPin className={styles.dossierDetail__cardIcon} />
                        <h3 className={styles.dossierDetail__cardTitle}>Localisation sur la carte</h3>
                      </div>
                      <div className={styles.dossierDetail__mapContainer}>
                        <MapTilerView
                          height="300px"
                          center={[dossier.latitude_disparition, dossier.longitude_disparition]}
                          zoom={14}
                          markers={[{
                            id: dossier.id,
                            lat: dossier.latitude_disparition,
                            lng: dossier.longitude_disparition,
                            label: `Lieu de disparition - ${dossier.lieu_disparition || 'Non renseigné'}`,
                            type: 'missing'
                          }]}
                          showControls={true}
                          interactive={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className={styles.dossierDetail__card}>
                    <div className={styles.dossierDetail__cardHeader}>
                      <BarChart3 className={styles.dossierDetail__cardIcon} />
                      <h3 className={styles.dossierDetail__cardTitle}>Statistiques</h3>
                    </div>
                    <div className={styles.dossierDetail__statsGrid}>
                      <div className={styles.dossierDetail__statItem}>
                        <AlertCircle className={styles.dossierDetail__statIcon} />
                        <div>
                          <span className={styles.dossierDetail__statLabel}>Signalements</span>
                          <span className={styles.dossierDetail__statValue}>{signalements.length}</span>
                        </div>
                      </div>
                      <div className={styles.dossierDetail__statItem}>
                        <MapPin className={styles.dossierDetail__statIcon} />
                        <div>
                          <span className={styles.dossierDetail__statLabel}>Localisations</span>
                          <span className={styles.dossierDetail__statValue}>{localisations.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div className={styles.dossierDetail__tabContent}>
                  <div className={styles.dossierDetail__tabHeader}>
                    <Image className={styles.dossierDetail__tabHeaderIcon} />
                    <h3 className={styles.dossierDetail__tabTitle}>Photos du dossier</h3>
                  </div>
                  {photosLoading ? (
                    <div className={styles.dossierDetail__loadingState}>
                      <Loader2 className={styles.dossierDetail__spinner} />
                      <p>Chargement des photos...</p>
                    </div>
                  ) : photos.length > 0 ? (
                    <div className={styles.dossierDetail__photosGrid}>
                      {photos.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className={styles.dossierDetail__photoCard}
                          onClick={() => setSelectedPhotoIndex(index)}
                        >
                          <div className={styles.dossierDetail__photoImageWrapper}>
                            <img 
                              src={photo.url_thumbnail || photo.url_cloudinary} 
                              alt={photo.description || photo.titre || `Photo ${index + 1}`}
                              className={styles.dossierDetail__photoImage}
                              onClick={() => window.open(photo.url_cloudinary, '_blank')}
                            />
                            <div className={styles.dossierDetail__photoOverlay}>
                              <ZoomIn size={24} />
                            </div>
                          </div>
                          <div className={styles.dossierDetail__photoInfo}>
                            <span className={styles.dossierDetail__photoType}>
                              {photo.type_photo?.replace(/_/g, ' ') || 'Photo'}
                            </span>
                            <span className={`${styles.dossierDetail__photoStatus} ${photo.est_principale ? styles['dossierDetail__photoStatus--approved'] : ''}`}>
                              {photo.est_principale ? 'Principale' : 'Secondaire'}
                            </span>
                          </div>
                          {photo.description && (
                            <p className={styles.dossierDetail__photoDescription}>
                              {photo.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dossierDetail__emptyState}>
                      <Image className={styles.dossierDetail__emptyIcon} />
                      <p className={styles.dossierDetail__emptyText}>Aucune photo</p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal de visualisation photo */}
              {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
                <div className={styles.dossierDetail__photoModal} onClick={() => setSelectedPhotoIndex(null)}>
                  <button 
                    className={styles.dossierDetail__photoModalClose}
                    onClick={() => setSelectedPhotoIndex(null)}
                  >
                    <X size={24} />
                  </button>
                  <img 
                    src={photos[selectedPhotoIndex].url_cloudinary} 
                    alt={photos[selectedPhotoIndex].description || photos[selectedPhotoIndex].titre || 'Photo'}
                    className={styles.dossierDetail__photoModalImage}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(photos[selectedPhotoIndex].url_cloudinary, '_blank');
                    }}
                  />
                  <div className={styles.dossierDetail__photoModalInfo}>
                    <p>{photos[selectedPhotoIndex].description || 'Sans description'}</p>
                    <span className={styles.dossierDetail__photoModalDate}>
                      {new Date(photos[selectedPhotoIndex].created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'signalements' && (
                <div className={styles.dossierDetail__tabContent}>
                  <div className={styles.dossierDetail__tabHeader}>
                    <AlertCircle className={styles.dossierDetail__tabHeaderIcon} />
                    <h3 className={styles.dossierDetail__tabTitle}>Signalements Liés</h3>
                  </div>
                  {signalements.length > 0 ? (
                    <div className={styles.dossierDetail__itemsGrid}>
                      {signalements.map((sig: any) => (
                        <div key={sig.id} className={styles.dossierDetail__itemCard}>
                          <h4 className={styles.dossierDetail__itemTitle}>
                            {sig.description || 'Signalement sans titre'}
                          </h4>
                          <div className={styles.dossierDetail__itemMeta}>
                            <div className={styles.dossierDetail__itemMetaItem}>
                              <MapPin size={14} />
                              <span>{sig.lieu_observation || 'Non renseigné'}</span>
                            </div>
                            <div className={styles.dossierDetail__itemMetaItem}>
                              <Calendar size={14} />
                              <span>{new Date(sig.date_observation).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dossierDetail__emptyState}>
                      <AlertCircle className={styles.dossierDetail__emptyIcon} />
                      <p className={styles.dossierDetail__emptyText}>Aucun signalement</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'localisations' && (
                <div className={styles.dossierDetail__tabContent}>
                  <div className={styles.dossierDetail__tabHeader}>
                    <MapPin className={styles.dossierDetail__tabHeaderIcon} />
                    <h3 className={styles.dossierDetail__tabTitle}>Localisations Enregistrées</h3>
                  </div>
                  {localisations.length > 0 ? (
                    <div className={styles.dossierDetail__itemsGrid}>
                      {localisations.map((loc: any) => (
                        <div key={loc.id} className={styles.dossierDetail__itemCard}>
                          <h4 className={styles.dossierDetail__itemTitle}>
                            {loc.lieu_localisation || 'Localisation'}
                          </h4>
                          <div className={styles.dossierDetail__itemMeta}>
                            <div className={styles.dossierDetail__itemMetaItem}>
                              <Calendar size={14} />
                              <span>{new Date(loc.date_localisation).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dossierDetail__emptyState}>
                      <MapPin className={styles.dossierDetail__emptyIcon} />
                      <p className={styles.dossierDetail__emptyText}>Aucune localisation</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'filiation' && (
                <div className={styles.dossierDetail__tabContent}>
                  <div className={styles.dossierDetail__tabHeader}>
                    <Users className={styles.dossierDetail__tabHeaderIcon} />
                    <h3 className={styles.dossierDetail__tabTitle}>Liens de Filiation</h3>
                    <button
                      className={styles.dossierDetail__addBtn}
                      onClick={() => setShowFiliationForm(!showFiliationForm)}
                    >
                      <Plus size={18} />
                      Ajouter un lien
                    </button>
                  </div>

                  {/* Messages */}
                  {filiationError && (
                    <div className={styles.dossierDetail__errorMessage}>
                      <AlertCircle size={18} />
                      <span>{filiationError}</span>
                    </div>
                  )}
                  
                  {filiationSuccess && (
                    <div className={styles.dossierDetail__successMessage}>
                      <CheckCircle2 size={18} />
                      <span>{filiationSuccess}</span>
                    </div>
                  )}

                  {/* Formulaire de création de filiation */}
                  {showFiliationForm && (
                    <form onSubmit={handleFiliationSubmit} className={styles.dossierDetail__filiationForm}>
                      <h4 className={styles.dossierDetail__formSubtitle}>
                        Nouveau lien de filiation
                      </h4>
                      
                      <div className={styles.dossierDetail__formRow}>
                        <div className={styles.dossierDetail__formField}>
                          <label className={styles.dossierDetail__formLabel}>Type de lien *</label>
                          <select
                            className={styles.dossierDetail__formSelect}
                            value={filiationFormData.type_lien}
                            onChange={(e) => handleFiliationInputChange('type_lien', e.target.value)}
                            required
                          >
                            <optgroup label="Parents">
                              <option value="pere_biologique">Père biologique</option>
                              <option value="mere_biologique">Mère biologique</option>
                              <option value="pere_adoptif">Père adoptif</option>
                              <option value="mere_adoptive">Mère adoptive</option>
                            </optgroup>
                            <optgroup label="Enfants">
                              <option value="enfant_biologique">Enfant biologique</option>
                              <option value="enfant_adoptif">Enfant adoptif</option>
                            </optgroup>
                            <optgroup label="Fratrie">
                              <option value="frere_biologique">Frère biologique</option>
                              <option value="soeur_biologique">Sœur biologique</option>
                              <option value="demi_frere">Demi-frère</option>
                              <option value="demi_soeur">Demi-sœur</option>
                            </optgroup>
                            <optgroup label="Autres">
                              <option value="epoux_epouse">Époux/Épouse</option>
                              <option value="oncle_tante">Oncle/Tante</option>
                              <option value="neveu_niece">Neveu/Nièce</option>
                              <option value="cousin_cousine">Cousin/Cousine</option>
                              <option value="grand_parent">Grand-parent</option>
                              <option value="petit_enfant">Petit-enfant</option>
                              <option value="tuteur_legal">Tuteur légal</option>
                              <option value="autre">Autre</option>
                            </optgroup>
                          </select>
                        </div>
                        
                        <div className={styles.dossierDetail__formField}>
                          <label className={styles.dossierDetail__formLabel}>Personne liée *</label>
                          <div className={styles.dossierDetail__selectWithAction}>
                            <select
                              className={styles.dossierDetail__formSelect}
                              value={filiationFormData.id_personne_cible}
                              onChange={(e) => handleFiliationInputChange('id_personne_cible', e.target.value)}
                              required
                            >
                              <option value="">-- Sélectionner --</option>
                              {personnes.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.nom_complet || `${p.prenom} ${p.nom}`}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className={styles.dossierDetail__newPersonBtn}
                              onClick={() => setShowNewPersonModal(true)}
                              title="Créer un nouveau membre de famille"
                            >
                              <Plus size={18} />
                              Nouveau
                            </button>
                          </div>
                          <p className={styles.dossierDetail__fieldHint}>
                            Sélectionnez une personne existante ou créez-en une nouvelle
                          </p>
                        </div>
                      </div>
                      
                      <div className={styles.dossierDetail__formField}>
                        <label className={styles.dossierDetail__formLabel}>Précisions sur le lien</label>
                        <input
                          type="text"
                          className={styles.dossierDetail__formInput}
                          value={filiationFormData.precision_lien}
                          onChange={(e) => handleFiliationInputChange('precision_lien', e.target.value)}
                          placeholder="Ex: côté maternel, décédé, etc."
                        />
                      </div>
                      
                      <div className={styles.dossierDetail__formField}>
                        <label className={styles.dossierDetail__formLabel}>Commentaire</label>
                        <textarea
                          className={styles.dossierDetail__formTextarea}
                          value={filiationFormData.commentaire}
                          onChange={(e) => handleFiliationInputChange('commentaire', e.target.value)}
                          placeholder="Notes supplémentaires..."
                          rows={3}
                        />
                      </div>
                      
                      <div className={styles.dossierDetail__formActions}>
                        <button
                          type="button"
                          className={styles.dossierDetail__cancelBtn}
                          onClick={() => {
                            setShowFiliationForm(false);
                            setFiliationFormData(initialFiliationForm);
                          }}
                          disabled={filiationSubmitting}
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className={styles.dossierDetail__saveBtn}
                          disabled={filiationSubmitting}
                        >
                          {filiationSubmitting ? (
                            <>
                              <Loader2 className={styles.dossierDetail__spinnerSmall} />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Enregistrer
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Liste des filiations */}
                  {filiationLoading ? (
                    <div className={styles.dossierDetail__loadingState}>
                      <Loader2 className={styles['operator-dossier-detail__spinner']} />
                      <p>Chargement des liens de filiation...</p>
                    </div>
                  ) : filiations.length > 0 ? (
                    <div className={styles.dossierDetail__filiationList}>
                      {filiations.map((fil: any) => (
                        <div key={fil.id} className={styles.dossierDetail__filiationCard}>
                          <div className={styles.dossierDetail__filiationHeader}>
                            <div className={styles.dossierDetail__filiationBadge}>
                              {getLienTypeLabel(fil.type_lien)}
                            </div>
                            <div className={styles.dossierDetail__filiationActions}>
                              <button
                                className={styles.dossierDetail__filiationActionBtn}
                                onClick={() => setSelectedFiliation(selectedFiliation === fil.id ? null : fil.id)}
                                title={selectedFiliation === fil.id ? "Masquer les détails" : "Voir les détails"}
                              >
                                {selectedFiliation === fil.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <button
                                className={`${styles.dossierDetail__filiationActionBtn} ${styles['dossierDetail__filiationActionBtn--danger']}`}
                                onClick={() => handleDeleteFiliation(fil.id)}
                                title="Supprimer ce lien"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className={styles.dossierDetail__filiationMain}>
                            <div className={styles.dossierDetail__filiationPerson}>
                              <User size={18} />
                              <span>
                                {fil.personne_cible?.nom_complet || 
                                 fil.personne_source?.nom_complet || 
                                 'Personne inconnue'}
                              </span>
                            </div>
                            {fil.precision_lien && (
                              <p className={styles.dossierDetail__filiationPrecision}>
                                {fil.precision_lien}
                              </p>
                            )}
                          </div>
                          
                          {/* Détails expandables */}
                          {selectedFiliation === fil.id && (
                            <div className={styles.dossierDetail__filiationDetails}>
                              <div className={styles.dossierDetail__filiationDetailRow}>
                                <span className={styles.dossierDetail__filiationDetailLabel}>Nature</span>
                                <span className={styles.dossierDetail__filiationDetailValue}>
                                  {fil.nature_filiation === 'biologique' ? 'Biologique' : 
                                   fil.nature_filiation === 'adoptif' ? 'Adoptif' : 
                                   fil.nature_filiation === 'legal' ? 'Légal' : 
                                   fil.nature_filiation || 'Non précisé'}
                                </span>
                              </div>
                              <div className={styles.dossierDetail__filiationDetailRow}>
                                <span className={styles.dossierDetail__filiationDetailLabel}>Statut vérification</span>
                                <span className={`${styles.dossierDetail__filiationDetailValue} ${styles.dossierDetail__filiationStatus}`}>
                                  {fil.statut_verification === 'verifie_adn' ? '✓ Vérifié ADN' :
                                   fil.statut_verification === 'verifie_documents' ? '✓ Vérifié (documents)' :
                                   fil.statut_verification === 'declare_famille' ? '⏳ Déclaré par famille' :
                                   fil.statut_verification === 'presume' ? '? Présumé' :
                                   fil.statut_verification || 'Non vérifié'}
                                </span>
                              </div>
                              <div className={styles.dossierDetail__filiationDetailRow}>
                                <span className={styles.dossierDetail__filiationDetailLabel}>Type de preuve</span>
                                <span className={styles.dossierDetail__filiationDetailValue}>
                                  {fil.type_preuve === 'test_adn' ? 'Test ADN' :
                                   fil.type_preuve === 'documents_officiels' ? 'Documents officiels' :
                                   fil.type_preuve === 'temoignages' ? 'Témoignages' :
                                   fil.type_preuve === 'photos_anciennes' ? 'Photos anciennes' :
                                   fil.type_preuve || 'Non précisé'}
                                </span>
                              </div>
                              {fil.commentaire && (
                                <div className={styles.dossierDetail__filiationDetailRow}>
                                  <span className={styles.dossierDetail__filiationDetailLabel}>Commentaire</span>
                                  <span className={styles.dossierDetail__filiationDetailValue}>
                                    {fil.commentaire}
                                  </span>
                                </div>
                              )}
                              <div className={styles.dossierDetail__filiationDetailRow}>
                                <span className={styles.dossierDetail__filiationDetailLabel}>Créé le</span>
                                <span className={styles.dossierDetail__filiationDetailValue}>
                                  {fil.created_at ? new Date(fil.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  }) : 'Date inconnue'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dossierDetail__emptyState}>
                      <Users className={styles.dossierDetail__emptyIcon} />
                      <p className={styles.dossierDetail__emptyText}>Aucun lien de filiation enregistré</p>
                      <p className={styles.dossierDetail__emptySubtext}>
                        Cliquez sur "Ajouter un lien" pour créer un lien familial
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.dossierDetail__notFound}>
            <FileText className={styles.dossierDetail__notFoundIcon} />
            <p className={styles.dossierDetail__notFoundText}>Dossier non trouvé</p>
          </div>
        )}

        {/* Modal pour créer un nouveau membre de famille */}
        {showNewPersonModal && (
          <div className={styles.dossierDetail__modal} onClick={() => setShowNewPersonModal(false)}>
            <div className={styles.dossierDetail__modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dossierDetail__modalHeader}>
                <h3>Nouveau membre de famille</h3>
                <button
                  className={styles.dossierDetail__modalClose}
                  onClick={() => setShowNewPersonModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.dossierDetail__modalBody}>
                <p className={styles.dossierDetail__modalHint}>
                  Créez rapidement une fiche pour un membre de la famille afin de l'associer à ce dossier.
                </p>
                
                <div className={styles.dossierDetail__formField}>
                  <label className={styles.dossierDetail__formLabel}>Prénom *</label>
                  <input
                    type="text"
                    className={styles.dossierDetail__formInput}
                    value={newPersonData.prenom}
                    onChange={(e) => setNewPersonData(prev => ({ ...prev, prenom: e.target.value }))}
                    placeholder="Ex: Jean"
                    autoFocus
                  />
                </div>
                
                <div className={styles.dossierDetail__formField}>
                  <label className={styles.dossierDetail__formLabel}>Nom *</label>
                  <input
                    type="text"
                    className={styles.dossierDetail__formInput}
                    value={newPersonData.nom}
                    onChange={(e) => setNewPersonData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Ex: Dupont"
                  />
                </div>
                
                <div className={styles.dossierDetail__formField}>
                  <label className={styles.dossierDetail__formLabel}>Sexe</label>
                  <select
                    className={styles.dossierDetail__formSelect}
                    value={newPersonData.sexe}
                    onChange={(e) => setNewPersonData(prev => ({ ...prev, sexe: e.target.value }))}
                  >
                    <option value="non_precise">Non précisé</option>
                    <option value="masculin">Masculin</option>
                    <option value="feminin">Féminin</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.dossierDetail__modalFooter}>
                <button
                  type="button"
                  className={styles.dossierDetail__cancelBtn}
                  onClick={() => {
                    setShowNewPersonModal(false);
                    setNewPersonData({ nom: '', prenom: '', sexe: 'non_precise' });
                  }}
                  disabled={newPersonSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className={styles.dossierDetail__saveBtn}
                  onClick={handleCreateNewPerson}
                  disabled={newPersonSubmitting || !newPersonData.nom.trim() || !newPersonData.prenom.trim()}
                >
                  {newPersonSubmitting ? (
                    <>
                      <Loader2 className={styles.dossierDetail__spinnerSmall} />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Créer et sélectionner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </OperatorLayout>
  );
};

export default OperatorDossierDetailPage;