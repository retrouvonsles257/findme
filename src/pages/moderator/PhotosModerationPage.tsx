/**
 * =====================================================
 * RETROUVONSLES - Photos Moderation Page
 * Modération des photos avec appels API réels
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { ModerationLayout } from './ModerationLayout';
import { supabase } from '../../config';
import {
  CheckCircle,
  XCircle,
  X,
  Image,
  Filter,
  RefreshCw,
  ZoomIn,
  AlertTriangle,
  Star,
  Tag,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search,
  Square,
  Trash2,
  Save,
  Eraser,
} from 'lucide-react';
import styles from './PhotosModerationPage.module.css';

// Helper to bypass Supabase typing issues
const db = () => supabase as any;

// Types
interface Photo {
  id: string;
  url_cloudinary: string;
  url_thumbnail?: string;
  public_id_cloudinary?: string;
  type_photo: 'portrait' | 'corps_entier' | 'signalement' | 'lieu_disparition' | 'objet_personnel' | 'document' | 'autre';
  titre?: string;
  description?: string;
  date_prise?: string;
  lieu_prise?: string;
  qualite_image: 'excellente' | 'bonne' | 'moyenne' | 'faible';
  est_principale: boolean;
  visible_public: boolean;
  approuvee: boolean;
  moderee_par?: string;
  date_moderation?: string;
  uploadee_par?: string;
  id_personne?: string;
  id_signalement?: string;
  created_at: string;
  caracteristiques_detectees?: {
    zones_floutees?: Array<{x: number; y: number; width: number; height: number}>;
    date_floutage?: string;
    floute_par?: string;
    [key: string]: any;
  };
  // Relations
  signalement?: any;
  personne?: any;
  uploadeur?: any;
}

interface PhotoFilters {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  type: 'all' | 'portrait' | 'corps_entier' | 'signalement' | 'lieu_disparition' | 'objet_personnel' | 'document' | 'autre';
  quality: 'all' | 'excellente' | 'bonne' | 'moyenne' | 'faible';
  search: string;
}

export const PhotosModerationPage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);

  // State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PhotoFilters>({
    status: 'pending',
    type: 'all',
    quality: 'all',
    search: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const pageSize = 12;

  // Modération state
  const [moderationData, setModerationData] = useState({
    qualite_image: 'moyenne' as Photo['qualite_image'],
    type_photo: 'portrait' as Photo['type_photo'],
    visible_public: true,
    notes: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // État pour le floutage/masquage d'éléments sensibles
  const [showBlurEditor, setShowBlurEditor] = useState(false);
  const [blurRegions, setBlurRegions] = useState<Array<{x: number; y: number; width: number; height: number}>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{x: number; y: number} | null>(null);
  const [currentRegion, setCurrentRegion] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  // Charger les photos
  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('photo')
        .select(`
          *,
          signalement:id_signalement(id, description, lieu_observation),
          personne:id_personne(id, nom, prenom),
          uploadeur:uploadee_par(id, nom, prenom)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filtres
      if (filters.status === 'pending') {
        query = query.eq('approuvee', false).is('moderee_par', null);
      } else if (filters.status === 'approved') {
        query = query.eq('approuvee', true);
      } else if (filters.status === 'rejected') {
        query = query.eq('approuvee', false).not('moderee_par', 'is', null);
      }

      if (filters.type !== 'all') {
        query = query.eq('type_photo', filters.type);
      }

      if (filters.quality !== 'all') {
        query = query.eq('qualite_image', filters.quality);
      }

      // Pagination
      const start = (currentPage - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      // Filtrer par recherche localement si besoin
      let filteredData = data || [];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(
          (p: Photo) =>
            (p.titre || '').toLowerCase().includes(searchLower) ||
            (p.description || '').toLowerCase().includes(searchLower) ||
            (p.lieu_prise || '').toLowerCase().includes(searchLower) ||
            (p.signalement?.lieu_observation || '').toLowerCase().includes(searchLower)
        );
      }

      setPhotos(filteredData);
      setTotalPhotos(count || 0);
    } catch (err) {
      console.error('Error loading photos:', err);
      setErrorMessage('Erreur lors du chargement des photos');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Approuver une photo
  const handleApprove = async (photo: Photo) => {
    setProcessingId(photo.id);
    try {
      const { error } = await db()
        .from('photo')
        .update({
          approuvee: true,
          visible_public: moderationData.visible_public,
          qualite_image: moderationData.qualite_image,
          type_photo: moderationData.type_photo,
          moderee_par: currentUser?.id,
          date_moderation: new Date().toISOString(),
        })
        .eq('id', photo.id);

      if (error) throw error;

      // Enregistrer dans le journal d'activité
      await db().from('journal_activite').insert({
        type_action: 'upload_photo',
        action_detaillee: 'Photo approuvée par modérateur',
        description: `Photo ${photo.id} approuvée. Qualité: ${moderationData.qualite_image}, Type: ${moderationData.type_photo}, Visible: ${moderationData.visible_public}`,
        id_utilisateur: currentUser?.id,
        id_signalement: photo.id_signalement || null,
      });

      setSuccessMessage(t('moderator.photoApproved'));
      setSelectedPhoto(null);
      loadPhotos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error approving photo:', err);
      setErrorMessage(err.message || 'Erreur lors de l\'approbation');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  // Rejeter une photo
  const handleReject = async (photo: Photo) => {
    setProcessingId(photo.id);
    try {
      const { error } = await db()
        .from('photo')
        .update({
          approuvee: false,
          visible_public: false,
          moderee_par: currentUser?.id,
          date_moderation: new Date().toISOString(),
        })
        .eq('id', photo.id);

      if (error) throw error;

      // Enregistrer dans le journal d'activité
      await db().from('journal_activite').insert({
        type_action: 'upload_photo',
        action_detaillee: 'Photo rejetée par modérateur',
        description: `Photo ${photo.id} rejetée. Raison: ${moderationData.notes || 'Non spécifiée'}`,
        id_utilisateur: currentUser?.id,
        id_signalement: photo.id_signalement || null,
      });

      setSuccessMessage(t('moderator.photoRejected'));
      setSelectedPhoto(null);
      loadPhotos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error rejecting photo:', err);
      setErrorMessage(err.message || 'Erreur lors du rejet');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  // Mise à jour rapide (approve/reject depuis la grille)
  const quickAction = async (photo: Photo, action: 'approve' | 'reject') => {
    setProcessingId(photo.id);
    try {
      const { error } = await db()
        .from('photo')
        .update({
          approuvee: action === 'approve',
          visible_public: action === 'approve',
          moderee_par: currentUser?.id,
          date_moderation: new Date().toISOString(),
        })
        .eq('id', photo.id);

      if (error) throw error;

      setSuccessMessage(action === 'approve' ? t('moderator.photoApproved') : t('moderator.photoRejected'));
      loadPhotos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error:', err);
      setErrorMessage(err.message || 'Erreur');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  // Couleur de qualité
  const getQualityColor = (quality: string) => {
    const colors: Record<string, string> = {
      excellente: '#059669',
      bonne: '#10b981',
      moyenne: '#f59e0b',
      faible: '#ef4444',
    };
    return colors[quality] || '#6b7280';
  };

  // ====== Fonctions de floutage/masquage ======
  
  // Initialiser l'éditeur de floutage
  const initBlurEditor = (photo: Photo) => {
    // Charger les régions existantes si présentes
    const existingRegions = photo.caracteristiques_detectees?.zones_floutees || [];
    setBlurRegions(existingRegions);
    setShowBlurEditor(true);
  };

  // Gérer le début du dessin d'une zone
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef) return;
    
    const rect = imageRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRegion({ x, y, width: 0, height: 0 });
  };

  // Gérer le mouvement de la souris pendant le dessin
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !imageRef) return;
    
    const rect = imageRef.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const width = currentX - drawStart.x;
    const height = currentY - drawStart.y;
    
    setCurrentRegion({
      x: width > 0 ? drawStart.x : currentX,
      y: height > 0 ? drawStart.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  // Gérer la fin du dessin
  const handleMouseUp = () => {
    if (currentRegion && currentRegion.width > 2 && currentRegion.height > 2) {
      setBlurRegions(prev => [...prev, currentRegion]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRegion(null);
  };

  // Supprimer une zone de floutage
  const removeBlurRegion = (index: number) => {
    setBlurRegions(prev => prev.filter((_, i) => i !== index));
  };

  // Effacer toutes les zones
  const clearAllBlurRegions = () => {
    setBlurRegions([]);
  };

  // Sauvegarder les zones de floutage
  const saveBlurRegions = async () => {
    if (!selectedPhoto) return;
    
    setProcessingId(selectedPhoto.id);
    try {
      // Récupérer les caractéristiques existantes
      const existingData = selectedPhoto.caracteristiques_detectees || {};
      
      const { error } = await db()
        .from('photo')
        .update({
          caracteristiques_detectees: {
            ...existingData,
            zones_floutees: blurRegions,
            date_floutage: new Date().toISOString(),
            floute_par: currentUser?.id,
          },
        })
        .eq('id', selectedPhoto.id);

      if (error) throw error;

      // Enregistrer dans le journal d'activité
      await db().from('journal_activite').insert({
        type_action: 'upload_photo',
        action_detaillee: 'Zones sensibles floutées sur photo',
        description: `Photo ${selectedPhoto.id}: ${blurRegions.length} zone(s) de floutage appliquée(s)`,
        id_utilisateur: currentUser?.id,
        id_signalement: selectedPhoto.id_signalement || null,
      });

      setSuccessMessage('Zones de floutage enregistrées avec succès');
      setShowBlurEditor(false);
      loadPhotos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving blur regions:', err);
      setErrorMessage(err.message || 'Erreur lors de la sauvegarde');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };


  // Badge de statut
  const getStatusBadge = (photo: Photo) => {
    if (photo.approuvee) {
      return { label: 'Approuvée', color: '#10b981' };
    }
    if (photo.moderee_par) {
      return { label: 'Rejetée', color: '#ef4444' };
    }
    return { label: 'En attente', color: '#f59e0b' };
  };

  const totalPages = Math.ceil(totalPhotos / pageSize);

  return (
    <ModerationLayout title={t('moderator.photoModeration')} activeNav="photos">
      <div className={styles['photos-moderation']}>
        {/* Header */}
        <section className={styles['photos-moderation__header']}>
          <div className={styles['photos-moderation__header-content']}>
            <h1 className={styles['photos-moderation__title']}>
              {t('moderator.photosTitle')}
            </h1>
            <p className={styles['photos-moderation__subtitle']}>
              {t('moderator.photosSubtitle')}
            </p>
          </div>

          {/* Barre d'outils */}
          <div className={styles['photos-moderation__toolbar']}>
            <div className={styles['photos-moderation__search-wrapper']}>
              <Search size={20} className={styles['photos-moderation__search-icon']} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={styles['photos-moderation__search-input']}
              />
            </div>

            <button
              className={styles['photos-moderation__toolbar-btn']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              Filtres
            </button>

            <button
              className={styles['photos-moderation__toolbar-btn']}
              onClick={loadPhotos}
            >
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className={styles['photos-moderation__filters']}>
              <div className={styles['photos-moderation__filter-group']}>
                <label>Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvées</option>
                  <option value="rejected">Rejetées</option>
                </select>
              </div>

              <div className={styles['photos-moderation__filter-group']}>
                <label>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="all">Tous</option>
                  <option value="portrait">Portrait</option>
                  <option value="corps_entier">Corps entier</option>
                  <option value="signalement">Signalement</option>
                  <option value="lieu_disparition">Lieu</option>
                  <option value="objet_personnel">Objet personnel</option>
                  <option value="document">Document</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className={styles['photos-moderation__filter-group']}>
                <label>Qualité</label>
                <select
                  value={filters.quality}
                  onChange={(e) => setFilters(prev => ({ ...prev, quality: e.target.value as any }))}
                >
                  <option value="all">Toutes</option>
                  <option value="excellente">Excellente</option>
                  <option value="bonne">Bonne</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="faible">Faible</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Messages */}
        {successMessage && (
          <div className={styles['photos-moderation__success']}>
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className={styles['photos-moderation__error']}>
            <AlertTriangle size={20} />
            {errorMessage}
          </div>
        )}

        {/* Stats rapides */}
        <div className={styles['photos-moderation__stats']}>
          <span>{totalPhotos} photo(s) trouvée(s)</span>
          <span>Page {currentPage} / {totalPages || 1}</span>
        </div>

        {isLoading ? (
          <div className={styles['photos-moderation__loading']}>
            <RefreshCw size={32} className={styles['photos-moderation__spinner']} />
            {t('common.loading')}...
          </div>
        ) : (
          <>
            {/* Grille de photos */}
            <div className={styles['photos-moderation__grid']}>
              {photos.length > 0 ? (
                photos.map((photo) => {
                  const statusBadge = getStatusBadge(photo);
                  const isProcessing = processingId === photo.id;

                  return (
                    <div key={photo.id} className={styles['photos-moderation__card']}>
                      {/* Photo */}
                      <div className={styles['photos-moderation__photo-container']}>
                        <img
                          src={photo.url_thumbnail || photo.url_cloudinary}
                          alt={photo.titre || 'Photo'}
                          className={styles['photos-moderation__photo']}
                          onClick={() => {
                            setSelectedPhoto(photo);
                            setModerationData({
                              qualite_image: photo.qualite_image || 'moyenne',
                              type_photo: photo.type_photo || 'portrait',
                              visible_public: photo.visible_public,
                              notes: '',
                            });
                          }}
                        />
                        <button
                          className={styles['photos-moderation__zoom-btn']}
                          onClick={() => {
                            setSelectedPhoto(photo);
                            setModerationData({
                              qualite_image: photo.qualite_image || 'moyenne',
                              type_photo: photo.type_photo || 'portrait',
                              visible_public: photo.visible_public,
                              notes: '',
                            });
                          }}
                        >
                          <ZoomIn size={18} />
                        </button>
                        <span
                          className={styles['photos-moderation__status-badge']}
                          style={{ backgroundColor: statusBadge.color }}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Info */}
                      <div className={styles['photos-moderation__card-content']}>
                        <div className={styles['photos-moderation__card-meta']}>
                          <span
                            className={styles['photos-moderation__quality-badge']}
                            style={{ color: getQualityColor(photo.qualite_image) }}
                          >
                            <Star size={12} />
                            {photo.qualite_image}
                          </span>
                          <span className={styles['photos-moderation__type-badge']}>
                            <Tag size={12} />
                            {photo.type_photo}
                          </span>
                        </div>
                        {photo.signalement && (
                          <p className={styles['photos-moderation__location']}>
                            📍 {photo.signalement.lieu_observation}
                          </p>
                        )}
                        <p className={styles['photos-moderation__date']}>
                          {new Date(photo.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      {/* Actions rapides */}
                      {!photo.moderee_par && (
                        <div className={styles['photos-moderation__actions']}>
                          <button
                            className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--approve']}`}
                            onClick={() => quickAction(photo, 'approve')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <RefreshCw size={16} className={styles['photos-moderation__spinner']} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Approuver
                          </button>
                          <button
                            className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--reject']}`}
                            onClick={() => quickAction(photo, 'reject')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <RefreshCw size={16} className={styles['photos-moderation__spinner']} />
                            ) : (
                              <XCircle size={16} />
                            )}
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles['photos-moderation__empty']}>
                  <Image size={48} />
                  <p>Aucune photo trouvée</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles['photos-moderation__pagination']}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={20} />
                  Précédent
                </button>
                <span>Page {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Suivant
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal détail photo */}
        {selectedPhoto && (
          <div
            className={styles['photos-moderation__modal']}
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className={styles['photos-moderation__modal-content']}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles['photos-moderation__close-btn']}
                onClick={() => setSelectedPhoto(null)}
              >
                <X size={24} />
              </button>

              <div className={styles['photos-moderation__modal-grid']}>
                {/* Image avec éditeur de floutage */}
                <div className={styles['photos-moderation__modal-image-section']}>
                  {showBlurEditor ? (
                    <div className={styles['photos-moderation__blur-editor']}>
                      <div className={styles['photos-moderation__blur-toolbar']}>
                        <span>
                          <Square size={16} />
                          Dessinez des rectangles sur les zones à flouter
                        </span>
                        <div className={styles['photos-moderation__blur-actions']}>
                          <button
                            className={styles['photos-moderation__blur-btn']}
                            onClick={clearAllBlurRegions}
                            title="Effacer tout"
                          >
                            <Eraser size={16} />
                          </button>
                          <button
                            className={`${styles['photos-moderation__blur-btn']} ${styles['photos-moderation__blur-btn--cancel']}`}
                            onClick={() => setShowBlurEditor(false)}
                          >
                            <X size={16} />
                            Annuler
                          </button>
                          <button
                            className={`${styles['photos-moderation__blur-btn']} ${styles['photos-moderation__blur-btn--save']}`}
                            onClick={saveBlurRegions}
                            disabled={processingId === selectedPhoto.id}
                          >
                            {processingId === selectedPhoto.id ? (
                              <RefreshCw size={16} className={styles['photos-moderation__spinner']} />
                            ) : (
                              <Save size={16} />
                            )}
                            Enregistrer ({blurRegions.length})
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        className={styles['photos-moderation__blur-canvas']}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <img
                          ref={setImageRef}
                          src={selectedPhoto.url_cloudinary}
                          alt="Édition"
                          className={styles['photos-moderation__modal-photo']}
                          draggable={false}
                        />
                        
                        {/* Zones de floutage existantes */}
                        {blurRegions.map((region, index) => (
                          <div
                            key={index}
                            className={styles['photos-moderation__blur-region']}
                            style={{
                              left: `${region.x}%`,
                              top: `${region.y}%`,
                              width: `${region.width}%`,
                              height: `${region.height}%`,
                            }}
                          >
                            <button
                              className={styles['photos-moderation__blur-region-delete']}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBlurRegion(index);
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                            <span className={styles['photos-moderation__blur-region-label']}>
                              Zone {index + 1}
                            </span>
                          </div>
                        ))}
                        
                        {/* Zone en cours de dessin */}
                        {currentRegion && (
                          <div
                            className={`${styles['photos-moderation__blur-region']} ${styles['photos-moderation__blur-region--drawing']}`}
                            style={{
                              left: `${currentRegion.x}%`,
                              top: `${currentRegion.y}%`,
                              width: `${currentRegion.width}%`,
                              height: `${currentRegion.height}%`,
                            }}
                          />
                        )}
                      </div>
                      
                      {blurRegions.length > 0 && (
                        <div className={styles['photos-moderation__blur-list']}>
                          <strong>{blurRegions.length} zone(s) de floutage:</strong>
                          <ul>
                            {blurRegions.map((region, index) => (
                              <li key={index}>
                                Zone {index + 1}: {Math.round(region.width)}% x {Math.round(region.height)}%
                                <button onClick={() => removeBlurRegion(index)}>
                                  <Trash2 size={12} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <img
                        src={selectedPhoto.url_cloudinary}
                        alt="Détail"
                        className={styles['photos-moderation__modal-photo']}
                      />
                      
                      {/* Afficher les zones floutées existantes en overlay */}
                      {selectedPhoto.caracteristiques_detectees?.zones_floutees && selectedPhoto.caracteristiques_detectees.zones_floutees.length > 0 && (
                        <div className={styles['photos-moderation__blur-overlay']}>
                          {selectedPhoto.caracteristiques_detectees.zones_floutees.map((region: any, index: number) => (
                            <div
                              key={index}
                              className={styles['photos-moderation__blur-preview']}
                              style={{
                                left: `${region.x}%`,
                                top: `${region.y}%`,
                                width: `${region.width}%`,
                                height: `${region.height}%`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Informations et actions */}
                <div className={styles['photos-moderation__modal-info-section']}>
                  <h3>Détails de la photo</h3>

                  <div className={styles['photos-moderation__modal-details']}>
                    <div className={styles['photos-moderation__detail-row']}>
                      <label>ID</label>
                      <span>{selectedPhoto.id.substring(0, 8)}...</span>
                    </div>
                    {selectedPhoto.titre && (
                      <div className={styles['photos-moderation__detail-row']}>
                        <label>Titre</label>
                        <span>{selectedPhoto.titre}</span>
                      </div>
                    )}
                    {selectedPhoto.description && (
                      <div className={styles['photos-moderation__detail-row']}>
                        <label>Description</label>
                        <span>{selectedPhoto.description}</span>
                      </div>
                    )}
                    {selectedPhoto.lieu_prise && (
                      <div className={styles['photos-moderation__detail-row']}>
                        <label>Lieu</label>
                        <span>{selectedPhoto.lieu_prise}</span>
                      </div>
                    )}
                    {selectedPhoto.signalement && (
                      <div className={styles['photos-moderation__detail-row']}>
                        <label>Signalement</label>
                        <span>{selectedPhoto.signalement.lieu_observation}</span>
                      </div>
                    )}
                    {selectedPhoto.uploadeur && (
                      <div className={styles['photos-moderation__detail-row']}>
                        <label>Uploadé par</label>
                        <span>{selectedPhoto.uploadeur.prenom} {selectedPhoto.uploadeur.nom}</span>
                      </div>
                    )}
                    <div className={styles['photos-moderation__detail-row']}>
                      <label>Date</label>
                      <span>{new Date(selectedPhoto.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Bouton pour flouter des éléments sensibles */}
                  {!showBlurEditor && (
                    <div className={styles['photos-moderation__blur-trigger']}>
                      <button
                        className={styles['photos-moderation__blur-trigger-btn']}
                        onClick={() => initBlurEditor(selectedPhoto)}
                      >
                        <Square size={16} />
                        Flouter des éléments sensibles
                      </button>
                      {selectedPhoto.caracteristiques_detectees?.zones_floutees && selectedPhoto.caracteristiques_detectees.zones_floutees.length > 0 && (
                        <span className={styles['photos-moderation__blur-count']}>
                          {selectedPhoto.caracteristiques_detectees.zones_floutees.length} zone(s) floutée(s)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Formulaire de modération */}
                  {!selectedPhoto.moderee_par && !showBlurEditor && (
                    <div className={styles['photos-moderation__modal-form']}>
                      <h4>Modération</h4>

                      <div className={styles['photos-moderation__form-group']}>
                        <label>
                          <Star size={14} />
                          Qualité de l'image
                        </label>
                        <select
                          value={moderationData.qualite_image}
                          onChange={(e) => setModerationData(prev => ({ ...prev, qualite_image: e.target.value as any }))}
                        >
                          <option value="excellente">Excellente</option>
                          <option value="bonne">Bonne</option>
                          <option value="moyenne">Moyenne</option>
                          <option value="faible">Faible</option>
                        </select>
                      </div>

                      <div className={styles['photos-moderation__form-group']}>
                        <label>
                          <Tag size={14} />
                          Type de photo
                        </label>
                        <select
                          value={moderationData.type_photo}
                          onChange={(e) => setModerationData(prev => ({ ...prev, type_photo: e.target.value as any }))}
                        >
                          <option value="portrait">Portrait</option>
                          <option value="corps_entier">Corps entier</option>
                          <option value="signalement">Signalement</option>
                          <option value="lieu_disparition">Lieu de disparition</option>
                          <option value="objet_personnel">Objet personnel</option>
                          <option value="document">Document</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>

                      <div className={styles['photos-moderation__form-group']}>
                        <label className={styles['photos-moderation__checkbox-label']}>
                          <input
                            type="checkbox"
                            checked={moderationData.visible_public}
                            onChange={(e) => setModerationData(prev => ({ ...prev, visible_public: e.target.checked }))}
                          />
                          {moderationData.visible_public ? <Eye size={14} /> : <EyeOff size={14} />}
                          Visible publiquement
                        </label>
                      </div>

                      <div className={styles['photos-moderation__form-group']}>
                        <label>Notes (optionnel)</label>
                        <textarea
                          value={moderationData.notes}
                          onChange={(e) => setModerationData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes de modération..."
                          rows={3}
                        />
                      </div>

                      <div className={styles['photos-moderation__modal-actions']}>
                        <button
                          className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--approve']}`}
                          onClick={() => handleApprove(selectedPhoto)}
                          disabled={processingId === selectedPhoto.id}
                        >
                          {processingId === selectedPhoto.id ? (
                            <RefreshCw size={18} className={styles['photos-moderation__spinner']} />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                          Approuver
                        </button>
                        <button
                          className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--reject']}`}
                          onClick={() => handleReject(selectedPhoto)}
                          disabled={processingId === selectedPhoto.id}
                        >
                          {processingId === selectedPhoto.id ? (
                            <RefreshCw size={18} className={styles['photos-moderation__spinner']} />
                          ) : (
                            <XCircle size={18} />
                          )}
                          Rejeter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo déjà modérée */}
                  {selectedPhoto.moderee_par && !showBlurEditor && (
                    <div className={styles['photos-moderation__already-moderated']}>
                      <p>
                        Cette photo a déjà été {selectedPhoto.approuvee ? 'approuvée' : 'rejetée'} le{' '}
                        {selectedPhoto.date_moderation
                          ? new Date(selectedPhoto.date_moderation).toLocaleString('fr-FR')
                          : 'date inconnue'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModerationLayout>
  );
};

export default PhotosModerationPage;
