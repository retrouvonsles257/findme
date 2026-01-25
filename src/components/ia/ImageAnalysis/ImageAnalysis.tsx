import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { AnalysisResults, AnalysisResult } from './AnalysisResults';
import styles from './ImageAnalysis.module.css';

export interface ImageAnalysisProps {
  onAnalyze?: (file: File) => void;
  isLoading?: boolean;
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ onAnalyze, isLoading = false }) => {
  const [imageFile, setImageFile] = useState<File>();
  const [imagePreview, setImagePreview] = useState<string>();
  const [results, setResults] = useState<AnalysisResult[]>([]);

  const handleUpload = (file: File) => {
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (onAnalyze) {
      onAnalyze(file);
    }

    // Simulate analysis results
    setTimeout(() => {
      setResults([
        { label: 'Person Detected', confidence: 0.95, description: 'High confidence human detection' },
        { label: 'Face Visible', confidence: 0.92, description: 'Clear facial features detected' },
        { label: 'Outdoor Scene', confidence: 0.87, description: 'Likely outdoor environment' },
      ]);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <h2>Image Analysis</h2>

      <div className={styles.uploader}>
        <ImageUploader onUpload={handleUpload} />
      </div>

      {imagePreview && (
        <div className={styles.preview}>
          <h3>Uploaded Image</h3>
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
          />
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.results}>
          <h3>Analysis Results</h3>
          <AnalysisResults results={results} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};
