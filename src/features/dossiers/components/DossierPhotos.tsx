/**
 * =====================================================
 * RETROUVONSLES - Dossier Photos Component
 * Galerie de photos avec upload fonctionnel pour un dossier
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { ImageUpload, MultipleImageUpload } from '../../../components/common/ImageUpload';
import { cloudinaryService } from '../../../services/cloudinary/cloudinaryService';
import { supabase } from '../../../config';
import { logActivity } from '../../../services/audit/auditService';
import { TypeAction } from '../../../@types/enums.types';
import { 
  Camera, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ImagePlus,
  Trash2,
  Eye,
  Download,
  Images
} from 'lucide-react';
import styles from './DossierPhotos.module.css';

interface Photo {
  id: string;
  url: string;
  type_photo?: string;
  description?: string;
  qualite_image?: string;
  approuvee?: boolean;
  visible_public?: boolean;
  created_at: string;
}

interface DossierPhotosProps {
  dossierId: string;
  personneId?: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export const DossierPhotos: React.FC<DossierPhotosProps> = ({
  dossierId,
  personneId,
  canUpload = true,
  canDelete = false,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState('portrait');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('multiple');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);

  // Charger les photos
  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      try {
        // Modèle SQL: photo est reliée à personne ou signalement (pas de id_dossier).
        // On privilégie donc id_personne. Si seulement dossierId est fourni, on résout id_personne via dossier_disparition.
        let resolvedPersonneId = personneId;
        if (!resolvedPersonneId && dossierId) {
          const { data: dossierData } = await (supabase as any)
            .from('dossier_disparition')
            .select('id_personne')
            .eq('id', dossierId)
            .maybeSingle();
          resolvedPersonneId = dossierData?.id_personne || undefined;
        }

        if (!resolvedPersonneId) {
          setPhotos([]);
          return;
        }

        const { data, error: fetchError } = await (supabase as any)
          .from('photo')
          .select('*')
          .eq('id_personne', resolvedPersonneId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching photos:', fetchError);
          setPhotos([]);
          return;
        }

        const normalized = (data || []).map((p: any) => ({
          id: p.id,
          url: p.url_cloudinary || p.url || '',
          type_photo: p.type_photo,
          description: p.description,
          qualite_image: p.qualite_image,
          approuvee: p.approuvee,
          visible_public: p.visible_public,
          created_at: p.created_at,
        }));
        setPhotos(normalized);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (dossierId || personneId) {
      fetchPhotos();
    }
  }, [dossierId, personneId]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const uploadSinglePhoto = async (file: File): Promise<Photo | null> => {
    // Upload vers Cloudinary
    const uploadResult = await cloudinaryService.uploadFile(
      file,
      'personPhoto',
      {}
    );

    if (!uploadResult.success || !uploadResult.secureUrl) {
      throw new Error(`Échec de l'upload: ${file.name}`);
    }

    // Récupérer l'utilisateur courant (traçabilité / RLS)
    let uid: string | null = null;
    try {
      const { data } = await (supabase as any).auth.getUser();
      uid = data?.user?.id || null;
    } catch {
      uid = null;
    }

    // Résoudre id_personne si besoin
    let resolvedPersonneId = personneId;
    if (!resolvedPersonneId && dossierId) {
      const { data: dossierData } = await (supabase as any)
        .from('dossier_disparition')
        .select('id_personne')
        .eq('id', dossierId)
        .maybeSingle();
      resolvedPersonneId = dossierData?.id_personne || undefined;
    }

    if (!resolvedPersonneId) {
      throw new Error('Impossible de déterminer la personne associée au dossier');
    }

    // Enregistrer dans la base de données (table photo)
    const photoData = {
      url_cloudinary: uploadResult.secureUrl,
      type_photo: photoType,
      description: description || null,
      qualite_image: 'moyenne',
      approuvee: false,
      visible_public: false,
      uploadee_par: uid,
      id_personne: resolvedPersonneId,
      id_signalement: null,
    };

    const { data: newPhoto, error: insertError } = await (supabase
      .from('photo') as any)
      .insert(photoData)
      .select()
      .single();

    if (insertError) throw insertError;

    await logActivity({
      type_action: TypeAction.UPLOAD_PHOTO,
      description: 'Upload photo (galerie dossier)',
      action_detaillee: 'upload_photo_gallery',
      id_utilisateur: uid,
      id_dossier: dossierId || null,
      donnees_apres: { id_photo: newPhoto.id, id_personne: resolvedPersonneId },
    });

    return {
      id: newPhoto.id,
      url: newPhoto.url_cloudinary || uploadResult.secureUrl,
      type_photo: newPhoto.type_photo,
      description: newPhoto.description,
      qualite_image: newPhoto.qualite_image,
      approuvee: newPhoto.approuvee,
      visible_public: newPhoto.visible_public,
      created_at: newPhoto.created_at,
    };
  };

  const handleUpload = async () => {
    // Single file upload
    if (uploadMode === 'single') {
      if (!selectedFile) {
        setError('Veuillez sélectionner une photo');
        return;
      }

      setIsUploading(true);
      setError('');
      setUploadProgress(0);

      try {
        const newPhoto = await uploadSinglePhoto(selectedFile);
        if (newPhoto) {
          setPhotos(prev => [newPhoto, ...prev]);
        }

        setSuccess('Photo uploadée avec succès!');
        setSelectedFile(null);
        setPreviewUrl(null);
        setDescription('');
        setShowUploadForm(false);
        
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de l\'upload');
        console.error('Upload error:', err);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      // Multiple files upload
      if (selectedFiles.length === 0) {
        setError('Veuillez sélectionner au moins une photo');
        return;
      }

      setIsUploading(true);
      setError('');
      setUploadedCount(0);
      setTotalToUpload(selectedFiles.length);

      const uploadedPhotos: Photo[] = [];
      const errors: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          const newPhoto = await uploadSinglePhoto(file);
          if (newPhoto) {
            uploadedPhotos.push(newPhoto);
          }
          setUploadedCount(i + 1);
        } catch (err: any) {
          errors.push(`${file.name}: ${err.message}`);
        }
      }

      if (uploadedPhotos.length > 0) {
        setPhotos(prev => [...uploadedPhotos, ...prev]);
      }

      if (errors.length > 0) {
        setError(`Erreurs: ${errors.join(', ')}`);
      } else {
        setSuccess(`${uploadedPhotos.length} photo(s) uploadée(s) avec succès!`);
        setTimeout(() => setSuccess(''), 3000);
      }

      setSelectedFiles([]);
      setDescription('');
      setShowUploadForm(false);
      setIsUploading(false);
      setUploadedCount(0);
      setTotalToUpload(0);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('photo')
        .delete()
        .eq('id', photoId);

      if (deleteError) {
        // Essayer avec personne_photos
        await supabase
          .from('personne_photos')
          .delete()
          .eq('id', photoId);
      }

      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSuccess('Photo supprimée');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const cancelUpload = () => {
    setShowUploadForm(false);
    setSelectedFile(null);
    setSelectedFiles([]);
    setPreviewUrl(null);
    setDescription('');
  };

  return (
    <div className={styles.dossierPhotos}>
      {/* Header */}
      <div className={styles.dossierPhotos__header}>
        <div className={styles.dossierPhotos__headerLeft}>
          <Camera className={styles.dossierPhotos__headerIcon} />
          <div>
            <h3 className={styles.dossierPhotos__title}>Photos et médias</h3>
            <p className={styles.dossierPhotos__subtitle}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} associée{photos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {canUpload && (
          <button
            className={styles.dossierPhotos__addBtn}
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <ImagePlus size={18} />
            Ajouter
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.dossierPhotos__error}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}
      
      {success && (
        <div className={styles.dossierPhotos__success}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className={styles.dossierPhotos__uploadForm}>
          <div className={styles.dossierPhotos__formHeader}>
            <h4 className={styles.dossierPhotos__formTitle}>Ajouter des photos</h4>
            
            {/* Mode Toggle */}
            <div className={styles.dossierPhotos__modeToggle}>
              <button
                type="button"
                className={`${styles.dossierPhotos__modeBtn} ${uploadMode === 'single' ? styles['dossierPhotos__modeBtn--active'] : ''}`}
                onClick={() => setUploadMode('single')}
              >
                <ImagePlus size={16} />
                Une photo
              </button>
              <button
                type="button"
                className={`${styles.dossierPhotos__modeBtn} ${uploadMode === 'multiple' ? styles['dossierPhotos__modeBtn--active'] : ''}`}
                onClick={() => setUploadMode('multiple')}
              >
                <Images size={16} />
                Plusieurs photos
              </button>
            </div>
          </div>
          
          {uploadMode === 'single' ? (
            // Single Upload Mode
            previewUrl ? (
              <div className={styles.dossierPhotos__previewContainer}>
                <img src={previewUrl} alt="Preview" className={styles.dossierPhotos__preview} />
                <button
                  className={styles.dossierPhotos__removePreview}
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <ImageUpload onImageSelected={handleFileSelected} maxSize={10 * 1024 * 1024} />
            )
          ) : (
            // Multiple Upload Mode
            <MultipleImageUpload 
              onImagesSelected={handleMultipleFilesSelected} 
              maxFiles={10} 
              maxSize={10 * 1024 * 1024}
            />
          )}
          
          <div className={styles.dossierPhotos__formRow}>
            <div className={styles.dossierPhotos__formField}>
              <label>Type de photo</label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
                disabled={isUploading}
              >
                <option value="portrait">Portrait</option>
                <option value="profil">Profil</option>
                <option value="plein_pied">Plein pied</option>
                <option value="lieu">Lieu</option>
                <option value="objet">Objet</option>
                <option value="document">Document</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          
          <div className={styles.dossierPhotos__formField}>
            <label>Description (optionnelle)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les photos..."
              rows={2}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className={styles.dossierPhotos__progressContainer}>
              {uploadMode === 'multiple' && totalToUpload > 0 ? (
                <>
                  <div 
                    className={styles.dossierPhotos__progressBar} 
                    style={{ width: `${(uploadedCount / totalToUpload) * 100}%` }} 
                  />
                  <span>{uploadedCount} / {totalToUpload} photos</span>
                </>
              ) : (
                <>
                  <div 
                    className={styles.dossierPhotos__progressBar} 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                  <span>{uploadProgress}%</span>
                </>
              )}
            </div>
          )}
          
          <div className={styles.dossierPhotos__formActions}>
            <button
              className={styles.dossierPhotos__cancelBtn}
              onClick={cancelUpload}
              disabled={isUploading}
            >
              Annuler
            </button>
            <button
              className={styles.dossierPhotos__submitBtn}
              onClick={handleUpload}
              disabled={isUploading || (uploadMode === 'single' ? !selectedFile : selectedFiles.length === 0)}
            >
              {isUploading ? (
                <>
                  <Loader2 className={styles.dossierPhotos__spinner} />
                  Upload en cours...
                </>
              ) : (
                <>
                  Uploader {uploadMode === 'multiple' && selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Gallery */}
      {isLoading ? (
        <div className={styles.dossierPhotos__loading}>
          <Loader2 className={styles.dossierPhotos__spinner} />
          <p>Chargement des photos...</p>
        </div>
      ) : photos.length > 0 ? (
        <div className={styles.dossierPhotos__gallery}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.dossierPhotos__photoCard}>
              <img
                src={photo.url}
                alt={photo.description || 'Photo'}
                className={styles.dossierPhotos__photoImg}
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className={styles.dossierPhotos__photoOverlay}>
                <button
                  className={styles.dossierPhotos__photoBtn}
                  onClick={() => setSelectedPhoto(photo)}
                  title="Voir"
                >
                  <Eye size={16} />
                </button>
                <a
                  href={photo.url}
                  download
                  className={styles.dossierPhotos__photoBtn}
                  title="Télécharger"
                >
                  <Download size={16} />
                </a>
                {canDelete && (
                  <button
                    className={`${styles.dossierPhotos__photoBtn} ${styles['dossierPhotos__photoBtn--danger']}`}
                    onClick={() => handleDelete(photo.id)}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className={styles.dossierPhotos__photoInfo}>
                <span className={styles.dossierPhotos__photoType}>
                  {photo.type_photo || 'Photo'}
                </span>
                {photo.approuvee && (
                  <CheckCircle2 size={14} className={styles.dossierPhotos__approvedIcon} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.dossierPhotos__empty}>
          <Camera className={styles.dossierPhotos__emptyIcon} />
          <p className={styles.dossierPhotos__emptyText}>Aucune photo pour ce dossier</p>
          {canUpload && (
            <button
              className={styles.dossierPhotos__emptyBtn}
              onClick={() => setShowUploadForm(true)}
            >
              <ImagePlus size={18} />
              Ajouter une photo
            </button>
          )}
        </div>
      )}

      {/* Modal de visualisation */}
      {selectedPhoto && (
        <div className={styles.dossierPhotos__modal} onClick={() => setSelectedPhoto(null)}>
          <div className={styles.dossierPhotos__modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.dossierPhotos__modalClose}
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.description || 'Photo'}
              className={styles.dossierPhotos__modalImg}
            />
            {selectedPhoto.description && (
              <p className={styles.dossierPhotos__modalDescription}>
                {selectedPhoto.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DossierPhotos;
