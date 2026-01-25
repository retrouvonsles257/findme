import React, { useState, useRef } from 'react';
import styles from './FileUpload.module.css';
import { FileUploadZone } from './FileUploadZone';
import { FilePreview } from './FilePreview';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  disabled = false,
  className = '',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList): File[] => {
    const validated: File[] = [];
    const newErrors: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        newErrors.push(`${file.name} is too large`);
        return;
      }

      if (uploadedFiles.length + validated.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      validated.push(file);
    });

    setErrors(newErrors);
    return validated;
  };

  const handleFilesSelected = (files: FileList) => {
    const validated = validateFiles(files);
    const combined = multiple ? [...uploadedFiles, ...validated] : validated;
    setUploadedFiles(combined);
    onFilesSelected(combined);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <div className={`${styles.fileUploadContainer} ${className}`}>
      <FileUploadZone
        onFilesSelected={handleFilesSelected}
        disabled={disabled}
        accept={accept}
        multiple={multiple}
      />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
        data-testid="file-input"
      />

      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, index) => (
            <div key={index} className={styles.error}>
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className={styles.fileList}>
          <h4>Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <FilePreview key={index} file={file} onRemove={() => removeFile(index)} />
          ))}
        </div>
      )}
    </div>
  );
};
