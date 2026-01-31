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
        // Récupérer les photos de la table photo liées au dossier ou à la personne
        let query = supabase.from('photo').select('*');
        
        if (dossierId) {
          query = query.eq('id_dossier', dossierId);
        } else if (personneId) {
          query = query.eq('id_personne', personneId);
        }
        
        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        
        if (fetchError) {
          console.error('Error fetching photos:', fetchError);
          // Fallback: essayer avec les photos de personne
          if (personneId) {
            const { data: personnePhotos } = await supabase
              .from('personne_photos')
              .select('*')
              .eq('personne_id', personneId)
              .order('created_at', { ascending: false });
            
            setPhotos(personnePhotos || []);
          }
        } else {
          setPhotos(data || []);
        }
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

    // Enregistrer dans la base de données
    const photoData = {
      url: uploadResult.secureUrl,
      type_photo: photoType,
      description: description || null,
      qualite_image: 'moyenne',
      approuvee: false,
      visible_public: false,
      id_dossier: dossierId || null,
      id_personne: personneId || null,
    };

    const { data: newPhoto, error: insertError } = await (supabase
      .from('photo') as any)
      .insert(photoData)
      .select()
      .single();

    if (insertError && personneId) {
      // Essayer avec personne_photos si photo échoue
      const { data: personnePhoto, error: personneError } = await (supabase
        .from('personne_photos') as any)
        .insert({
          personne_id: personneId,
          url: uploadResult.secureUrl,
          type_photo: photoType,
          qualite_image: 'moyenne',
        })
        .select()
        .single();
      
      if (personneError) throw personneError;
      return personnePhoto;
    }

    return newPhoto;
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
