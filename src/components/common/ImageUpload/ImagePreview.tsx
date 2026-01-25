import React from 'react';
import styles from './ImageUpload.module.css';

export interface ImagePreviewProps {
  preview: string;
  onEdit: () => void;
  onRemove: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ preview, onEdit, onRemove }) => {
  return (
    <div className={styles.previewContainer}>
      <img src={preview} alt="Preview" className={styles.previewImage} data-testid="image-preview" />
      <div className={styles.previewActions}>
        <button className={styles.editButton} onClick={onEdit} type="button">
          ✏️ Edit
        </button>
        <button className={styles.removeButton} onClick={onRemove} type="button">
          🗑️ Remove
        </button>
      </div>
    </div>
  );
};
