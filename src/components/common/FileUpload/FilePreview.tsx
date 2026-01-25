import React from 'react';
import styles from './FileUpload.module.css';

export interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className={styles.filePreview} data-testid={`file-preview-${file.name}`}>
      <div className={styles.fileInfo}>
        <span className={styles.fileIcon}>{getFileIcon(file.type)}</span>
        <div className={styles.fileDetails}>
          <p className={styles.fileName}>{file.name}</p>
          <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button
        className={styles.removeButton}
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        type="button"
      >
        ✕
      </button>
    </div>
  );
};
