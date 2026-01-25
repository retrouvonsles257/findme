import React, { useState } from 'react';
import { FacialDetector } from './FacialDetector';
import { FaceComparison } from './FaceComparison';
import styles from './FacialRecognition.module.css';

export interface FacialRecognitionProps {
  onMatch?: (match: { similarity: number; personId?: string }) => void;
  isLoading?: boolean;
}

type TabType = 'detector' | 'comparison';

export const FacialRecognition: React.FC<FacialRecognitionProps> = ({
  onMatch,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('detector');
  const [sourceImage, setSourceImage] = useState<string>();
  const [targetImage, setTargetImage] = useState<string>();

  const handleDetection = (faces: any[]) => {
    console.log('Faces detected:', faces);
  };

  const handleComparison = (similarity: number) => {
    if (onMatch) {
      onMatch({ similarity });
    }
  };

  return (
    <div className={styles.container}>
      <h2>Facial Recognition</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'detector' ? styles.active : ''}`}
          onClick={() => setActiveTab('detector')}
        >
          Face Detection
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'comparison' ? styles.active : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Face Comparison
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'detector' && (
          <FacialDetector onDetect={handleDetection} isLoading={isLoading} />
        )}
        {activeTab === 'comparison' && (
          <FaceComparison
            sourceImage={sourceImage}
            targetImage={targetImage}
            onComparison={handleComparison}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
