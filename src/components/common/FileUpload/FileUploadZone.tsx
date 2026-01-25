import React, { useRef } from 'react';
import styles from './FileUpload.module.css';

export interface FileUploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  disabled = false,
  accept = '*',
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled && e.dataTransfer.files) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <>
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload zone"
        data-testid="upload-zone"
      >
        <div className={styles.uploadZoneContent}>
          <div className={styles.uploadIcon}>📁</div>
          <p className={styles.uploadText}>Drag and drop files here</p>
          <p className={styles.uploadSubtext}>or click to select</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
        data-testid="zone-file-input"
      />
    </>
  );
};
