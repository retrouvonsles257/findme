/**
 * =====================================================
 * RETROUVONSLES - FacialRecognitionPanel Component
 * Component for facial recognition analysis
 * Utilise VRAIE IA Hugging Face
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useFacialRecognition } from '../hooks/useFacialRecognition';
import type { FacialRecognitionPanelProps } from '../types';
import styles from './FacialRecognitionPanel.module.css';

export const FacialRecognitionPanel: React.FC<FacialRecognitionPanelProps> = ({
  className = '',
  onAnalysisComplete,
}) => {
  const { 
    results, 
    currentAnalysis, 
    analyzeFacial, 
    isLoading, 
    error,
    isHuggingFaceConfigured,
  } = useFacialRecognition();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dossierId, setDossierId] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner une image');
      return;
    }

    try {
      const result = await analyzeFacial(selectedFile, dossierId || undefined);

      if (onAnalysisComplete) {
        onAnalysisComplete(result as any);
      }

      // Reset form
      setSelectedFile(null);
      setImagePreview(null);
      setDossierId('');
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Reconnaissance Faciale IA</h3>
        {isHuggingFaceConfigured && (
          <span className={styles.aiBadge}>🤖 Hugging Face Actif</span>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Image à analyser *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
            className={styles.fileInput}
          />
          {imagePreview && (
            <div className={styles.preview}>
              <img src={imagePreview} alt="Aperçu" className={styles.previewImage} />
              <span className={styles.fileName}>{selectedFile?.name}</span>
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>ID Dossier (Optionnel)</label>
          <input
            type="text"
            placeholder="Entrez l'ID du dossier"
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Seuil de confiance: {confidenceThreshold}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <button 
          onClick={handleAnalyze} 
          disabled={isLoading || !selectedFile} 
          className={styles.btnAnalyze}
        >
          {isLoading ? 'Analyse en cours...' : `Analyser ${isHuggingFaceConfigured ? '(IA)' : '(Simulation)'}`}
        </button>
      </div>

      {currentAnalysis && (
        <div className={styles.result}>
          <h4>Résultat de l'analyse</h4>
          <div className={styles.resultContent}>
            <p>
              <strong>Confiance:</strong> {currentAnalysis.score_confiance.toFixed(2)}%
            </p>
            <p>
              <strong>Modèle:</strong> {currentAnalysis.modele_ia_utilise || 'N/A'}
            </p>
            <p>
              <strong>Temps:</strong> {currentAnalysis.temps_traitement_ms || 0}ms
            </p>
            {currentAnalysis.donnees_interpretees?.face_detected && (
              <>
                <p>
                  <strong>Visage détecté:</strong> Oui
            </p>
                {currentAnalysis.donnees_interpretees?.faces?.[0]?.age_estimate && (
              <p>
                    <strong>Âge estimé:</strong> {currentAnalysis.donnees_interpretees.faces[0].age_estimate}
                  </p>
                )}
                {currentAnalysis.donnees_interpretees?.faces?.[0]?.gender && (
                  <p>
                    <strong>Genre:</strong> {currentAnalysis.donnees_interpretees.faces[0].gender}
                  </p>
                )}
              </>
            )}
            {(currentAnalysis.correspondances_trouvees as any)?.potential_matches > 0 && (
              <p>
                <strong>Correspondances potentielles:</strong> {(currentAnalysis.correspondances_trouvees as any)?.potential_matches}
              </p>
            )}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.history}>
          <h4>Analyses récentes ({results.length})</h4>
          <ul className={styles.resultsList}>
            {results.slice(0, 5).map((result) => (
              <li key={result.id}>
                <span>{new Date(result.date_analyse).toLocaleDateString()}</span>
                <span className={styles.badge}>
                  {result.score_confiance.toFixed(0)}%
                </span>
                {result.modele_ia_utilise?.includes('Hugging Face') && (
                  <span className={styles.aiTag}>IA</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
