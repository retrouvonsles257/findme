/**
 * =====================================================
 * RETROUVONSLES - Operator Photos En Attente Page
 * Consultation des photos non approuvées en attente
 * Note: L'opérateur peut VOIR mais ne peut PAS approuver
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { OperatorLayout } from './OperatorLayout';
import { 
  Image,
  Loader2,
  AlertCircle,
  Eye,
  X,
  Calendar,
  FileText,
  User,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './PhotosEnAttentePage.module.css';

interface PhotoEnAttente {
  id: string;
  url_cloudinary: string;
  url_thumbnail?: string;
  type_photo: string;
  titre?: string;
  description?: string;
  qualite_image: string;
  approuvee: boolean;
  id_personne?: string;
  id_signalement?: string;
  id_dossier?: string;
  created_at?: string;
  personne?: { nom: string; prenom?: string };
  signalement?: { 
    numero_signalement?: string;
    id_dossier?: string;
    dossier?: {
      id: string;
      numero_dossier: string;
      id_organisation_responsable?: string;
    };
  };
}

const ITEMS_PER_PAGE = 12;

export const PhotosEnAttentePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [photos, setPhotos] = useState<PhotoEnAttente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEnAttente | null>(null);

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch photos that are not approved yet
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      const { data, error: fetchError, count } = await (supabase as any)
        .from('photo')
        .select(`
          *,
          personne:id_personne(nom, prenom),
          signalement:id_signalement(
            numero_signalement,
            id_dossier,
            dossier:id_dossier(id, numero_dossier, id_organisation_responsable)
          )
        `, { count: 'exact' })
        .eq('approuvee', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      // Filter by organisation if user has one
      let filteredPhotos = data || [];
      if (currentUser?.organisation_id) {
        filteredPhotos = filteredPhotos.filter((p: any) => {
          // Check if photo is linked to a dossier in user's organisation
          const dossierOrg = p.signalement?.dossier?.id_organisation_responsable;
          return dossierOrg === currentUser.organisation_id || !dossierOrg;
        });
      }

      setPhotos(filteredPhotos);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error loading photos:', err);
      setError(err.message || 'Erreur lors du chargement des photos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentUser?.organisation_id]);

  useEffect(() => {
    if (currentUser && !['operateur_saisie', 'admin_organisation'].includes(currentUser.role)) {
      navigate('/auth/login');
      return;
    }
    loadPhotos();
  }, [currentUser, navigate, loadPhotos]);

  const getTypePhotoLabel = (type: string): string => {
    const labels: Record<string, string> = {
      portrait: 'Portrait',
      corps_entier: 'Corps entier',
      signalement: 'Signalement',
      lieu_disparition: 'Lieu',
      objet_personnel: 'Objet personnel',
      document: 'Document',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const getQualiteColor = (qualite: string): string => {
    switch (qualite) {
      case 'excellente': return '#10b981';
      case 'bonne': return '#22c55e';
      case 'moyenne': return '#eab308';
      case 'faible': return '#ef4444';
      default: return '#64748b';
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <OperatorLayout title={t('operator.pendingPhotos') || 'Photos en attente'}>
      <div className={styles.photosEnAttente}>
        {/* Info Banner */}
        <div className={styles.photosEnAttente__infoBanner}>
          <Info className={styles.photosEnAttente__infoBannerIcon} />
          <div className={styles.photosEnAttente__infoBannerContent}>
            <p>
              <strong>Note :</strong> En tant qu'opérateur, vous pouvez consulter les photos 
              en attente d'approbation. L'approbation ou le rejet des photos est effectué 
              par les modérateurs (niveau 3+).
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.photosEnAttente__controls}>
          <div className={styles.photosEnAttente__stats}>
            <Image size={20} />
            <span>{totalCount} photo{totalCount > 1 ? 's' : ''} en attente de validation</span>
          </div>
          
          <button
            className={styles.photosEnAttente__refreshBtn}
            onClick={loadPhotos}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? styles.photosEnAttente__spinning : ''} />
            Actualiser
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.photosEnAttente__errorMessage}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className={styles.photosEnAttente__content}>
          {isLoading ? (
            <div className={styles.photosEnAttente__loadingState}>
              <Loader2 className={styles.photosEnAttente__spinner} />
              <p>Chargement des photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <>
              <div className={styles.photosEnAttente__grid}>
                {photos.map((photo) => (
                  <div key={photo.id} className={styles.photosEnAttente__card}>
                    <div 
                      className={styles.photosEnAttente__imageWrapper}
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img 
                        src={photo.url_thumbnail || photo.url_cloudinary} 
                        alt={photo.titre || 'Photo en attente'}
                        className={styles.photosEnAttente__image}
                      />
                      <div className={styles.photosEnAttente__imageOverlay}>
                        <Eye size={24} />
                        <span>Voir</span>
                      </div>
                    </div>
                    
                    <div className={styles.photosEnAttente__cardBody}>
                      <div className={styles.photosEnAttente__badges}>
                        <span className={styles.photosEnAttente__typeBadge}>
                          {getTypePhotoLabel(photo.type_photo)}
                        </span>
                        <span 
                          className={styles.photosEnAttente__qualiteBadge}
                          style={{ 
                            backgroundColor: `${getQualiteColor(photo.qualite_image)}15`,
                            color: getQualiteColor(photo.qualite_image)
                          }}
                        >
                          {photo.qualite_image}
                        </span>
                      </div>
                      
                      <div className={styles.photosEnAttente__meta}>
                        {photo.personne && (
                          <div className={styles.photosEnAttente__metaItem}>
                            <User size={14} />
                            <span>
                              {photo.personne.prenom} {photo.personne.nom}
                            </span>
                          </div>
                        )}
                        
                        {photo.signalement?.dossier && (
                          <div className={styles.photosEnAttente__metaItem}>
                            <FileText size={14} />
                            <span>{photo.signalement.dossier.numero_dossier}</span>
                          </div>
                        )}
                        
                        {photo.created_at && (
                          <div className={styles.photosEnAttente__metaItem}>
                            <Calendar size={14} />
                            <span>
                              {new Date(photo.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.photosEnAttente__pagination}>
                  <button
                    className={styles.photosEnAttente__pageBtn}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                    Précédent
                  </button>
                  <span className={styles.photosEnAttente__pageInfo}>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    className={styles.photosEnAttente__pageBtn}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.photosEnAttente__emptyState}>
              <Image className={styles.photosEnAttente__emptyIcon} />
              <p className={styles.photosEnAttente__emptyText}>
                Aucune photo en attente de validation
              </p>
            </div>
          )}
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <div className={styles.photosEnAttente__modal} onClick={() => setSelectedPhoto(null)}>
            <div className={styles.photosEnAttente__modalContent} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.photosEnAttente__modalClose}
                onClick={() => setSelectedPhoto(null)}
              >
                <X size={24} />
              </button>
              
              <img 
                src={selectedPhoto.url_cloudinary} 
                alt={selectedPhoto.titre || 'Photo'}
                className={styles.photosEnAttente__modalImage}
              />
              
              <div className={styles.photosEnAttente__modalInfo}>
                <h3>{selectedPhoto.titre || 'Photo sans titre'}</h3>
                {selectedPhoto.description && (
                  <p>{selectedPhoto.description}</p>
                )}
                <div className={styles.photosEnAttente__modalMeta}>
                  <span>Type: {getTypePhotoLabel(selectedPhoto.type_photo)}</span>
                  <span>Qualité: {selectedPhoto.qualite_image}</span>
                  {selectedPhoto.personne && (
                    <span>Personne: {selectedPhoto.personne.prenom} {selectedPhoto.personne.nom}</span>
                  )}
                </div>
                
                {selectedPhoto.signalement?.dossier && (
                  <button
                    className={styles.photosEnAttente__modalBtn}
                    onClick={() => {
                      setSelectedPhoto(null);
                      navigate(`/operator/dossiers/${selectedPhoto.signalement?.dossier?.id}`);
                    }}
                  >
                    <FileText size={16} />
                    Voir le dossier ({selectedPhoto.signalement.dossier.numero_dossier})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
};

export default PhotosEnAttentePage;
