/**
 * =====================================================
 * RETROUVONSLES - IA Analysis Page
 * Analyse IA: reconnaissance faciale, similarités, prédictions
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import { useFacialRecognition, useIAAnalysis } from '../../features/ia-analysis';
import styles from './IAAnalysisPage.module.css';

type AnalysisTab = 'matching' | 'similarities' | 'predictions' | 'results';

export const IAAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('matching');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  // Utiliser les vrais hooks d'IA
  const { results: facialResults, isLoading: facialLoading, error: facialError, analyzeFacial } = useFacialRecognition();
  const { comparisonResults, locationPredictions, similaritiesResults, isLoading: iaLoading, error: iaError } = useIAAnalysis();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedImage) {
      alert('Veuillez sélectionner une image');
      return;
    }

    try {
      // Analyser l'image avec reconnaissance faciale
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      // Appel à l'API d'analyse faciale réelle
      await analyzeFacial({
        image_id: selectedImage.name,
        confidence_threshold: 70,
      });
      
      // Passer aux résultats après analyse
      setActiveTab('results');
    } catch (err) {
      console.error('Erreur lors de l\'analyse:', err);
      alert('Erreur lors de l\'analyse IA');
    }
  }, [selectedImage, analyzeFacial]);

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Analyse IA Avancée</h1>
          <p className={styles.subtitle}>
            Reconnaissance faciale, détection de similarités et prédictions
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['matching', 'similarities', 'predictions', 'results'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'matching' && '🔍 Reconnaissance Faciale'}
              {tab === 'similarities' && '🔗 Similarités'}
              {tab === 'predictions' && '🎯 Prédictions'}
              {tab === 'results' && '📊 Résultats'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'matching' && (
            <div className={styles.section}>
              <h2>Reconnaissance Faciale</h2>
              <p>Comparez des photos avec les fiches de personnes disparues</p>

              <div className={styles.uploadSection}>
                <label className={styles.uploadBox}>
                  <span className={styles.uploadIcon}>📸</span>
                  <span className={styles.uploadText}>
                    Cliquez pour sélectionner une image ou glissez-la ici
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                  />
                </label>

                {selectedImage && (
                  <div className={styles.preview}>
                    <p>Image sélectionnée: {selectedImage.name}</p>
                  </div>
                )}

                {facialError && (
                  <div style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    border: '1px solid #ef5350'
                  }}>
                    <strong>Erreur IA:</strong> {facialError}
                  </div>
                )}

                <button
                  className={styles.analyzeButton}
                  onClick={handleStartAnalysis}
                  disabled={!selectedImage || facialLoading}
                >
                  {facialLoading ? 'Analyse en cours...' : '🚀 Lancer l\'Analyse'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'similarities' && (
            <div className={styles.section}>
              <h2>Détection de Similarités</h2>
              <p>Détectez les cas potentiellement liés</p>

              {iaError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  border: '1px solid #ef5350'
                }}>
                  <strong>Erreur:</strong> {iaError}
                </div>
              )}

              {iaLoading ? (
                <div className={styles.loading}>Chargement des similarités...</div>
              ) : similaritiesResults.length > 0 ? (
              <div className={styles.similaritiesList}>
                {similaritiesResults.map((result) => (
                  <div key={result.id} className={styles.similarityItem}>
                    <div className={styles.itemHeader}>
                      <h4>Analyse: {result.source_person_id}</h4>
                      <span className={styles.badge}>{result.matches.length} correspondances</span>
                    </div>
                    <div className={styles.matchesList}>
                      {result.matches.map((match, idx) => (
                        <div key={idx} className={styles.match}>
                          <span>{match.name}</span>
                          <span className={styles.scoreBadge}>{match.similarity_score.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    <button className={styles.actionBtn}>Voir Détails</button>
                  </div>
                ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Aucune analyse de similarité effectuée
                </div>
              )}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className={styles.section}>
              <h2>Prédictions de Localisation</h2>
              <p>Zones de recherche estimées basées sur les données IA</p>

              {iaLoading ? (
                <div className={styles.loading}>Calcul des prédictions...</div>
              ) : locationPredictions.length > 0 ? (
              <div className={styles.predictionsList}>
                {locationPredictions.map((prediction) => (
                  <div key={prediction.id} className={styles.predictionItem}>
                    <div className={styles.predictionHeader}>
                      <h4>Dossier: {prediction.person_id}</h4>
                      <span className={styles.badge}>
                        {prediction.predicted_locations.length} zones
                      </span>
                    </div>
                    <p>Dernier lieu connu: {prediction.last_known_location.address}</p>
                    <div className={styles.predictionDetails}>
                      <span>📍 Type: {prediction.movement_pattern.type}</span>
                      <span>📈 Confiance: {prediction.movement_pattern.confidence.toFixed(0)}%</span>
                    </div>
                    <div className={styles.locationsList}>
                      {prediction.predicted_locations.map((loc, idx) => (
                        <div key={idx} className={styles.location}>
                          <span>📍 {loc.latitude}, {loc.longitude}</span>
                          <span className={styles.prob}>{loc.probability.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Aucune prédiction de localisation disponible
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className={styles.section}>
              <h2>Résultats d'Analyse</h2>

              {iaLoading ? (
                <div className={styles.loading}>Compilation des résultats...</div>
              ) : (
                <div className={styles.resultsContainer}>
                {facialResults.length > 0 ? (
                  facialResults.map((result) => (
                    <div key={result.id} className={styles.resultCard}>
                      <div className={styles.resultContent}>
                        <h4>Reconnaissance Faciale</h4>
                        <p>Dossier: {result.person_id}</p>
                        <div className={styles.matchScore}>
                          <span className={styles.scoreLabel}>Confiance Faciale:</span>
                          <span className={styles.scoreValue}>
                            {result.facial_features.confidence_facial.toFixed(0)}%
                          </span>
                        </div>
                        <div className={styles.matchScore}>
                          <span className={styles.scoreLabel}>Qualité du Visage:</span>
                          <span className={styles.scoreValue}>
                            {result.facial_features.face_quality.toFixed(0)}%
                          </span>
                        </div>
                        {result.best_match && (
                          <p className={styles.details}>
                            ✓ Meilleure correspondance: {result.best_match.person_id} ({result.best_match.similarity.toFixed(0)}%)
                          </p>
                        )}
                        <button className={styles.btn}>👁️ Voir Détails</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    Aucun résultat d'analyse disponible - effectuez d'abord une analyse
                  </div>
                )}

                {comparisonResults.length > 0 && comparisonResults.map((result) => (
                  <div key={result.id} className={styles.resultCard}>
                    <div className={styles.resultContent}>
                      <h4>Comparaison d'Images</h4>
                      <div className={styles.matchScore}>
                        <span className={styles.scoreLabel}>Similarité Structurelle:</span>
                        <span className={styles.scoreValue}>
                          {result.structural_similarity.toFixed(0)}%
                        </span>
                      </div>
                      <div className={styles.matchScore}>
                        <span className={styles.scoreLabel}>Correspondance Faciale:</span>
                        <span className={styles.scoreValue}>
                          {result.facial_match_confidence.toFixed(0)}%
                        </span>
                      </div>
                      <p className={styles.details}>
                        Score global: {((result.structural_similarity + result.facial_match_confidence) / 2).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IAAnalysisPage;
