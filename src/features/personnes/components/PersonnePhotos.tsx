/**
 * =====================================================
 * RETROUVONSLES - PersonnePhotos Component
 * Photo gallery with deletion functionality
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { usePersonneDetail } from '../hooks/usePersonneDetail';
import styles from './PersonnePhotos.module.css';

export interface PersonnePhotosProps {
  personneId: string;
  onPhotoAdded?: () => void;
}

/**
 * PersonnePhotos component
 */
export const PersonnePhotos: React.FC<PersonnePhotosProps> = ({ personneId, onPhotoAdded }) => {
  const { photos, isLoading, error, fetchPhotos, deletePhoto } = usePersonneDetail();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos(personneId);
  }, [personneId, fetchPhotos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      // Upload logic would go here
      // For now, just reset the state
      setSelectedFile(null);
      await fetchPhotos(personneId);
      onPhotoAdded?.();
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      await deletePhoto(photoId);
      await fetchPhotos(personneId);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading photos...</div>;

  return (
    <div className={styles.container}>
      <h2>Photos</h2>

      <div className={styles.uploadSection}>
        <div className={styles.uploadGroup}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className={styles.fileInput}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={styles.uploadButton}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.gallery}>
        {photos.length === 0 ? (
          <div className={styles.empty}>No photos available</div>
        ) : (
          <div className={styles.photoGrid}>
            {photos.map((photo) => (
              <div key={photo.id} className={styles.photoItem}>
                <img src={photo.url} alt={photo.type_photo} className={styles.photoImage} />
                <div className={styles.photoInfo}>
                  <p className={styles.photoType}>{photo.type_photo}</p>
                  <p className={styles.photoQuality}>Quality: {photo.qualite_image}</p>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(photo.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
