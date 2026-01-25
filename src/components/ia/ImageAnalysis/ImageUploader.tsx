import React, { useState } from 'react';

export interface ImageUploaderProps {
  onUpload?: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string>();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(undefined);

    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    if (onUpload) {
      onUpload(file);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        padding: '2rem',
        border: `2px dashed ${isDragActive ? '#2563eb' : '#d1d5db'}`,
        borderRadius: '8px',
        background: isDragActive ? '#eff6ff' : '#f9fafb',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        id="image-uploader"
      />
      <label htmlFor="image-uploader" style={{ cursor: 'pointer', display: 'block' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Drop image here or click to select</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
          Supported formats: JPG, PNG, GIF
        </p>
      </label>
      {error && <p style={{ margin: '1rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
    </div>
  );
};
