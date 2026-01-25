import React, { useState, useRef } from 'react';
import { ImageCropper } from './ImageCropper';
import { ImagePreview } from './ImagePreview';
import styles from './ImageUpload.module.css';

export interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  maxSize?: number;
  aspectRatio?: number;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  maxSize = 5 * 1024 * 1024,
  aspectRatio,
  disabled = false,
  className = '',
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > maxSize) {
      setError(`Image is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleImageCropped = (croppedFile: File) => {
    setSelectedImage(croppedFile);
    onImageSelected(croppedFile);
    setShowCropper(false);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreview(null);
    setError(null);
    setShowCropper(false);
  };

  return (
    <div className={`${styles.imageUploadContainer} ${className}`}>
      {!preview && (
        <div className={`${styles.uploadArea} ${disabled ? styles.disabled : ''}`}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            disabled={disabled}
            style={{ display: 'none' }}
            data-testid="image-input"
          />
          <button
            className={styles.uploadButton}
            onClick={() => !disabled && inputRef.current?.click()}
            disabled={disabled}
            type="button"
          >
            📷 Select Image
          </button>
          <p className={styles.uploadHint}>Click to select an image</p>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {preview && !showCropper && (
        <ImagePreview
          preview={preview}
          onEdit={() => setShowCropper(true)}
          onRemove={handleClear}
        />
      )}

      {preview && showCropper && (
        <ImageCropper
          imageUrl={preview}
          aspectRatio={aspectRatio}
          onCrop={handleImageCropped}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
};
