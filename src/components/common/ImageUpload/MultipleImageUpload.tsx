import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import styles from './MultipleImageUpload.module.css';

export interface MultipleImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  acceptedTypes?: string[];
}

interface PreviewFile {
  file: File;
  preview: string;
  id: string;
}

export const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  onImagesSelected,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  className = '',
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}) => {
  const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const processFiles = (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    const validFiles: PreviewFile[] = [];
    const errors: string[] = [];

    // Check total count
    if (selectedFiles.length + fileArray.length > maxFiles) {
      setError(`Vous ne pouvez pas ajouter plus de ${maxFiles} images`);
      return;
    }

    fileArray.forEach((file) => {
      // Check type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: Type de fichier non accepté`);
        return;
      }

      // Check size
      if (file.size > maxSize) {
        errors.push(`${file.name}: Taille trop grande (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview: PreviewFile = {
          file,
          preview: e.target?.result as string,
          id: generateId(),
        };
        
        setSelectedFiles((prev) => {
          const updated = [...prev, preview];
          // Call the callback with all files
          onImagesSelected(updated.map(f => f.file));
          return updated;
        });
      };
      reader.readAsDataURL(file);
      validFiles.push({ file, preview: '', id: generateId() });
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFiles(files);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      onImagesSelected(updated.map(f => f.file));
      return updated;
    });
    setError(null);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setError(null);
    onImagesSelected([]);
  };

  return (
    <div className={`${styles.multiUploadContainer} ${className}`}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''} ${disabled ? styles.disabled : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          multiple
          style={{ display: 'none' }}
        />
        
        <Upload className={styles.uploadIcon} size={32} />
        <p className={styles.dropZoneText}>
          Glissez-déposez vos images ici ou cliquez pour sélectionner
        </p>
        <p className={styles.dropZoneHint}>
          {maxFiles - selectedFiles.length} image(s) restante(s) • Max {Math.round(maxSize / 1024 / 1024)}MB par image
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Previews */}
      {selectedFiles.length > 0 && (
        <div className={styles.previewsSection}>
          <div className={styles.previewsHeader}>
            <span className={styles.previewsCount}>
              <ImageIcon size={16} />
              {selectedFiles.length} image(s) sélectionnée(s)
            </span>
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={clearAll}
            >
              Tout supprimer
            </button>
          </div>
          
          <div className={styles.previewsGrid}>
            {selectedFiles.map((file) => (
              <div key={file.id} className={styles.previewItem}>
                {file.preview ? (
                  <img src={file.preview} alt={file.file.name} className={styles.previewImage} />
                ) : (
                  <div className={styles.previewPlaceholder}>
                    <ImageIcon size={24} />
                  </div>
                )}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <X size={14} />
                </button>
                <span className={styles.fileName}>{file.file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;
