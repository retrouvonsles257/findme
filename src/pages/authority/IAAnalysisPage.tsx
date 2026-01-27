/**
 * =====================================================
 * RETROUVONSLES - IA Analysis Page
 * Analyse IA: reconnaissance faciale, similarités, prédictions
 * =====================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AuthorityLayout } from '../../components/layout';
import {
  Brain,
  Search,
  Link2,
  Target,
  BarChart2,
  Upload,
  Camera,
  Zap,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  FileImage,
  Loader2,
  TrendingUp,
  Percent,
  X,
  User,
  Calendar,
  Activity,
  Smile,
} from 'lucide-react';
import { useFacialRecognition, useIAAnalysis } from '../../features/ia-analysis';
import { checkIAServiceStatus, ResultatIA } from '../../features/ia-analysis/services/iaAPI';
import { useDispatch } from 'react-redux';
import { 
  fetchFacialRecognitionResults, 
  fetchImageComparisonResults, 
  fetchLocationPredictions, 
  fetchSimilaritiesResults 
} from '../../features/ia-analysis/store/iaSlice';
import styles from './IAAnalysisPage.module.css';

type AnalysisTab = 'matching' | 'similarities' | 'predictions' | 'results';

export const IAAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('matching');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultatIA | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Vérifier le statut du service IA
  const [iaStatus, setIaStatus] = useState<{
    huggingFaceConfigured: boolean;
    modelsAvailable: Record<string, string>;
    version: string;
  } | null>(null);

  useEffect(() => {
    setIaStatus(checkIAServiceStatus());
  }, []);
  
  // Hooks IA
  const { 
    results: facialResults, 
    currentAnalysis,
    isLoading: facialLoading, 
    error: facialError, 
    analyzeFacial,
    getFacialHistory,
    isHuggingFaceConfigured,
  } = useFacialRecognition();
  
  const { 
    comparisonResults, 
    locationPredictions, 
    similaritiesResults, 
    isLoading: iaLoading, 
    error: iaError 
  } = useIAAnalysis();

  const dispatch = useDispatch();

  // Charger l'historique IA au démarrage
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Charger tous les types de résultats IA
        await Promise.all([
          dispatch(fetchFacialRecognitionResults() as any).unwrap().catch(() => []),
          dispatch(fetchImageComparisonResults() as any).unwrap().catch(() => []),
          dispatch(fetchLocationPredictions() as any).unwrap().catch(() => []),
          dispatch(fetchSimilaritiesResults() as any).unwrap().catch(() => []),
        ]);
      } catch (err) {
        // Erreur silencieuse
      }
    };
    loadHistory();
  }, [dispatch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setAnalysisStarted(false);
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedImage) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setAnalysisStarted(true);

    try {
      await analyzeFacial(selectedImage);
      setActiveTab('results');
    } catch (err) {
      // Erreur gérée par la notification
    }
  }, [selectedImage, analyzeFacial]);

  const handleViewDetails = (result: ResultatIA) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedResult(null);
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fonction pour obtenir le label de confiance
  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return { label: 'Très élevée', color: '#22c55e' };
    if (score >= 60) return { label: 'Élevée', color: '#84cc16' };
    if (score >= 40) return { label: 'Moyenne', color: '#eab308' };
    if (score >= 20) return { label: 'Faible', color: '#f97316' };
    return { label: 'Très faible', color: '#ef4444' };
  };

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Brain size={32} />
          </div>
          <div className={styles.headerContent}>
            <h1>Analyse IA Avancée</h1>
            <p className={styles.subtitle}>
              Reconnaissance faciale, détection de similarités et prédictions de localisation
            </p>
          </div>
        </div>

        {/* Status Banner - simplifié */}
        {!isHuggingFaceConfigured && (
          <div className={styles.statusBannerWarning}>
            <AlertCircle size={18} />
            <span>Service IA non configuré. Contactez l'administrateur.</span>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'matching' ? styles.active : ''}`}
            onClick={() => setActiveTab('matching')}
          >
            <Search size={18} />
            <span>Reconnaissance Faciale</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'similarities' ? styles.active : ''}`}
            onClick={() => setActiveTab('similarities')}
          >
            <Link2 size={18} />
            <span>Similarités</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'predictions' ? styles.active : ''}`}
            onClick={() => setActiveTab('predictions')}
          >
            <Target size={18} />
            <span>Prédictions</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'results' ? styles.active : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <BarChart2 size={18} />
            <span>Résultats</span>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'matching' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Camera size={24} className={styles.sectionIcon} />
                <div>
                  <h2>Reconnaissance Faciale</h2>
                  <p>Analysez des photos pour extraire les caractéristiques faciales</p>
                </div>
              </div>

              <div className={styles.uploadSection}>
                <label className={styles.uploadBox}>
                  <div className={styles.uploadIconWrapper}>
                    <Upload size={48} />
                  </div>
                  <span className={styles.uploadText}>
                    Cliquez pour sélectionner une image ou glissez-la ici
                  </span>
                  <span className={styles.uploadHint}>
                    <FileImage size={14} /> PNG, JPG, WEBP jusqu'à 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                  />
                </label>

                {imagePreview && (
                  <div className={styles.preview}>
                    <img src={imagePreview} alt="Aperçu" className={styles.previewImage} />
                    <div className={styles.previewInfo}>
                      <CheckCircle size={16} className={styles.successIcon} />
                      <span>{selectedImage?.name}</span>
                    </div>
                  </div>
                )}

                {facialError && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={20} />
                    <span>Une erreur est survenue. Veuillez réessayer.</span>
                  </div>
                )}

                <button
                  className={styles.analyzeButton}
                  onClick={handleStartAnalysis}
                  disabled={!selectedImage || facialLoading}
                >
                  {facialLoading ? (
                    <>
                      <Loader2 size={20} className={styles.spinner} />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span>Lancer l'Analyse</span>
                    </>
                  )}
                </button>

                {/* Progress indicator */}
                {facialLoading && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressSteps}>
                      <div className={`${styles.progressStep} ${styles.active}`}>
                        <Activity size={16} />
                        <span>Détection</span>
                      </div>
                      <div className={`${styles.progressStep} ${analysisStarted ? styles.active : ''}`}>
                        <Users size={16} />
                        <span>Analyse</span>
                      </div>
                      <div className={`${styles.progressStep} ${analysisStarted ? styles.active : ''}`}>
                        <Eye size={16} />
                        <span>Traitement</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current analysis result */}
                {currentAnalysis && !facialLoading && (
                  <div className={styles.currentResult}>
                    <div className={styles.resultHeader}>
                      <CheckCircle size={20} className={styles.successIcon} />
                      <h4>Analyse terminée</h4>
                    </div>
                    <div className={styles.resultSummary}>
                      <div className={styles.summaryItem}>
                        <TrendingUp size={18} />
                        <span>Fiabilité: {getConfidenceLabel(currentAnalysis.score_confiance).label}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <User size={18} />
                        <span>
                          Visage: {currentAnalysis.donnees_interpretees?.face_detected ? 'Détecté' : 'Non détecté'}
                        </span>
                      </div>
                      <div className={styles.summaryItem}>
                        <Clock size={18} />
                        <span>Durée: {((currentAnalysis.temps_traitement_ms || 0) / 1000).toFixed(1)}s</span>
                      </div>
                    </div>
                    <button 
                      className={styles.viewDetailsBtn}
                      onClick={() => handleViewDetails(currentAnalysis)}
                    >
                      <Eye size={16} />
                      <span>Voir les détails</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'similarities' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Link2 size={24} className={styles.sectionIcon} />
                <div>
                  <h2>Détection de Similarités</h2>
                  <p>Détectez les cas potentiellement liés entre eux</p>
                </div>
              </div>

              {iaError && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={20} />
                  <span>Une erreur est survenue</span>
                </div>
              )}

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>Chargement...</span>
                </div>
              ) : similaritiesResults.length > 0 ? (
                <div className={styles.similaritiesList}>
                  {similaritiesResults.map((result) => (
                    <div key={result.id} className={styles.similarityCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                          <Users size={18} />
                          <h4>Analyse du {formatDate(result.date_analyse)}</h4>
                        </div>
                        <span className={styles.badge}>
                          {(result.correspondances_trouvees as any)?.similar_cases?.length || 0} correspondances
                        </span>
                      </div>
                      <div className={styles.matchesList}>
                        {((result.correspondances_trouvees as any)?.similar_cases || []).slice(0, 3).map((match: any, idx: number) => (
                          <div key={idx} className={styles.matchItem}>
                            <span className={styles.matchId}>Cas #{idx + 1}</span>
                            <div className={styles.scoreBar}>
                              <div 
                                className={styles.scoreProgress}
                                style={{ width: `${match.similarity_score || 0}%` }}
                              />
                            </div>
                            <span className={styles.scoreBadge}>{match.similarity_score?.toFixed(0) || 0}%</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleViewDetails(result)}
                      >
                        <Eye size={16} />
                        <span>Voir Détails</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Link2 size={48} className={styles.emptyIcon} />
                  <p>Aucune analyse de similarité effectuée</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Target size={24} className={styles.sectionIcon} />
                <div>
                  <h2>Prédictions de Localisation</h2>
                  <p>Zones de recherche estimées</p>
                </div>
              </div>

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>Calcul des prédictions...</span>
                </div>
              ) : locationPredictions.length > 0 ? (
                <div className={styles.predictionsList}>
                  {locationPredictions.map((prediction) => (
                    <div key={prediction.id} className={styles.predictionCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                          <MapPin size={18} />
                          <h4>Prédiction du {formatDate(prediction.date_analyse)}</h4>
                        </div>
                        <span className={styles.badge}>
                          {(prediction.zones_predites as any)?.zones?.length || 0} zones
                        </span>
                      </div>
                      
                      <div className={styles.predictionMeta}>
                        <div className={styles.metaItem}>
                          <Percent size={16} />
                          <span>Fiabilité: {getConfidenceLabel(prediction.score_confiance).label}</span>
                        </div>
                      </div>

                      <div className={styles.zonesList}>
                        {((prediction.zones_predites as any)?.zones || []).map((zone: any, idx: number) => (
                          <div key={idx} className={styles.zoneItem}>
                            <MapPin size={14} className={styles.zoneIcon} />
                            <span className={styles.zoneName}>{zone.ville}, {zone.region}</span>
                            <span className={styles.zoneProbability}>{zone.probabilite?.toFixed(0) || 0}%</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleViewDetails(prediction)}
                      >
                        <Eye size={16} />
                        <span>Voir Détails</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Target size={48} className={styles.emptyIcon} />
                  <p>Aucune prédiction de localisation disponible</p>
                </div>
              )}
            </div>
          )}

              {activeTab === 'results' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BarChart2 size={24} className={styles.sectionIcon} />
                <div>
                  <h2>Historique des Analyses</h2>
                  <p>Toutes les analyses effectuées</p>
                </div>
              </div>

              {/* Debug info */}
              <div style={{ 
                padding: '1rem', 
                background: '#f3f4f6', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                <strong>Debug:</strong> Facial: {facialResults.length}, Comparison: {comparisonResults.length}, 
                Location: {locationPredictions.length}, Similarities: {similaritiesResults.length}
                {iaError && <span style={{ color: '#dc2626', marginLeft: '1rem' }}>Erreur: {iaError}</span>}
              </div>

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>Chargement...</span>
                </div>
              ) : (
                <div className={styles.resultsContainer}>
                  {facialResults.length > 0 ? (
                    facialResults.map((result) => (
                      <div key={result.id} className={styles.resultCard}>
                        <div className={styles.resultCardHeader}>
                          <Camera size={20} />
                          <h4>Reconnaissance Faciale</h4>
                          <span className={styles.resultDate}>
                            {formatDate(result.date_analyse)}
                          </span>
                        </div>
                        <div className={styles.resultCardContent}>
                          <div className={styles.resultMetrics}>
                            <div className={styles.metric}>
                              <TrendingUp size={16} />
                              <span className={styles.metricLabel}>Fiabilité:</span>
                              <span 
                                className={styles.metricValue}
                                style={{ color: getConfidenceLabel(result.score_confiance).color }}
                              >
                                {getConfidenceLabel(result.score_confiance).label}
                              </span>
                            </div>
                            <div className={styles.metric}>
                              <User size={16} />
                              <span className={styles.metricLabel}>Visage:</span>
                              <span className={styles.metricValue}>
                                {result.donnees_interpretees?.face_detected ? 'Détecté' : 'Non détecté'}
                              </span>
                            </div>
                          </div>
                          <button 
                            className={styles.detailsBtn}
                            onClick={() => handleViewDetails(result)}
                          >
                            <Eye size={16} />
                            <span>Voir Détails</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <BarChart2 size={48} className={styles.emptyIcon} />
                      <p>Aucune analyse effectuée</p>
                      <span>Commencez par analyser une image</span>
                    </div>
                  )}

                  {comparisonResults.length > 0 && comparisonResults.map((result) => (
                    <div key={result.id} className={styles.resultCard}>
                      <div className={styles.resultCardHeader}>
                        <FileImage size={20} />
                        <h4>Comparaison d'Images</h4>
                        <span className={styles.resultDate}>
                          {formatDate(result.date_analyse)}
                        </span>
                      </div>
                      <div className={styles.resultCardContent}>
                        <div className={styles.resultMetrics}>
                          <div className={styles.metric}>
                            <TrendingUp size={16} />
                            <span className={styles.metricLabel}>Similarité:</span>
                            <span className={styles.metricValue}>
                              {result.score_confiance.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={result.donnees_interpretees?.is_match ? styles.matchSuccess : styles.matchFail}>
                          {result.donnees_interpretees?.is_match ? (
                            <>
                              <CheckCircle size={16} />
                              <span>Correspondance trouvée</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={16} />
                              <span>Pas de correspondance</span>
                            </>
                          )}
                        </div>
                        <button 
                          className={styles.detailsBtn}
                          onClick={() => handleViewDetails(result)}
                        >
                          <Eye size={16} />
                          <span>Voir Détails</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de détails */}
        {showDetailModal && selectedResult && (
          <div className={styles.modalOverlay} onClick={closeDetailModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Détails de l'analyse</h3>
                <button className={styles.closeModalBtn} onClick={closeDetailModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className={styles.modalContent}>
                {/* Informations générales */}
                <div className={styles.detailSection}>
                  <h4><Calendar size={18} /> Informations générales</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Date d'analyse</span>
                      <span className={styles.detailValue}>{formatDate(selectedResult.date_analyse)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Fiabilité</span>
                      <span 
                        className={styles.detailValue}
                        style={{ color: getConfidenceLabel(selectedResult.score_confiance).color }}
                      >
                        {getConfidenceLabel(selectedResult.score_confiance).label} ({selectedResult.score_confiance.toFixed(0)}%)
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Durée de traitement</span>
                      <span className={styles.detailValue}>
                        {((selectedResult.temps_traitement_ms || 0) / 1000).toFixed(2)} secondes
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Statut</span>
                      <span className={`${styles.detailValue} ${styles.statusBadge}`}>
                        {selectedResult.statut_validation === 'en_attente' ? 'En attente de validation' :
                         selectedResult.statut_validation === 'confirme' ? 'Confirmé' :
                         selectedResult.statut_validation === 'infirme' ? 'Infirmé' : 'À vérifier'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Résultats de la détection */}
                <div className={styles.detailSection}>
                  <h4><User size={18} /> Résultats de la détection</h4>
                  
                  {/* Image analysée */}
                  {selectedResult.donnees_brutes?.image_name && (
                    <div className={styles.detailItem} style={{ marginBottom: '1rem' }}>
                      <span className={styles.detailLabel}>Image analysée</span>
                      <span className={styles.detailValue}>{selectedResult.donnees_brutes.image_name}</span>
                    </div>
                  )}

                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Visage détecté</span>
                      <span className={styles.detailValue}>
                        {selectedResult.donnees_interpretees?.face_detected ? (
                          <span className={styles.successText}><CheckCircle size={14} /> Oui</span>
                        ) : (
                          <span className={styles.errorText}><AlertCircle size={14} /> Non</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Qualité de l'image */}
                    {(selectedResult.donnees_interpretees?.quality_score || selectedResult.donnees_interpretees?.quality_score === 0) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Qualité de l'image</span>
                        <span className={styles.detailValue}>
                          {selectedResult.donnees_interpretees.quality_score.toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {/* Nombre de visages */}
                    {selectedResult.donnees_interpretees?.face_count !== undefined && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nombre de visages</span>
                        <span className={styles.detailValue}>
                          {selectedResult.donnees_interpretees.face_count}
                        </span>
                      </div>
                    )}
                    
                    {/* Détails du visage principal */}
                    {selectedResult.donnees_interpretees?.faces?.[0] && (
                      <>
                        {selectedResult.donnees_interpretees.faces[0].age_estimate && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Tranche d'âge estimée</span>
                            <span className={styles.detailValue}>
                              {selectedResult.donnees_interpretees.faces[0].age_estimate}
                            </span>
                          </div>
                        )}
                        {selectedResult.donnees_interpretees.faces[0].gender && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Genre</span>
                            <span className={styles.detailValue}>
                              {selectedResult.donnees_interpretees.faces[0].gender === 'Male' ? 'Masculin' : 
                               selectedResult.donnees_interpretees.faces[0].gender === 'Female' ? 'Féminin' : 
                               selectedResult.donnees_interpretees.faces[0].gender}
                            </span>
                          </div>
                        )}
                        {selectedResult.donnees_interpretees.faces[0].confidence && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Confiance détection</span>
                            <span className={styles.detailValue}>
                              {(selectedResult.donnees_interpretees.faces[0].confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {selectedResult.donnees_interpretees.faces[0].emotions?.[0] && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Expression faciale</span>
                            <span className={styles.detailValue}>
                              <Smile size={14} /> {
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'happy' ? 'Heureux' :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'sad' ? 'Triste' :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'angry' ? 'En colère' :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'neutral' ? 'Neutre' :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'surprise' ? 'Surpris' :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'fear' ? 'Apeuré' :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label
                              }
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message si aucun visage détecté */}
                  {!selectedResult.donnees_interpretees?.face_detected && (
                    <div className={styles.noDataMessage}>
                      <AlertCircle size={20} />
                      <p>Aucun visage n'a été détecté dans cette image. Essayez avec une photo plus claire ou de face.</p>
                    </div>
                  )}

                  {/* Message d'erreur si présent */}
                  {selectedResult.donnees_interpretees?.error && (
                    <div className={styles.errorMessage}>
                      <AlertCircle size={20} />
                      <p>Une erreur s'est produite lors de l'analyse : {selectedResult.donnees_interpretees.error_message || 'Erreur inconnue'}</p>
                    </div>
                  )}
                </div>

                {/* Correspondances trouvées */}
                {selectedResult.correspondances_trouvees && (
                  <div className={styles.detailSection}>
                    <h4><Users size={18} /> Correspondances</h4>
                    {(selectedResult.correspondances_trouvees as any)?.similar_cases?.length > 0 ? (
                      <div className={styles.matchesList}>
                        {((selectedResult.correspondances_trouvees as any)?.similar_cases || []).map((match: any, idx: number) => (
                          <div key={idx} className={styles.matchDetailItem}>
                            <span className={styles.matchNumber}>#{idx + 1}</span>
                            <div className={styles.matchInfo}>
                              <span>Correspondance potentielle</span>
                              <div className={styles.matchScore}>
                                <div 
                                  className={styles.matchScoreBar}
                                  style={{ width: `${match.similarity_score || 0}%` }}
                                />
                              </div>
                            </div>
                            <span className={styles.matchPercent}>{match.similarity_score?.toFixed(0) || 0}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noMatches}>Aucune correspondance trouvée</p>
                    )}
                  </div>
                )}

                {/* Zones prédites */}
                {(selectedResult.zones_predites as any)?.zones && (
                  <div className={styles.detailSection}>
                    <h4><MapPin size={18} /> Zones prédites</h4>
                    <div className={styles.zonesList}>
                      {((selectedResult.zones_predites as any)?.zones || []).map((zone: any, idx: number) => (
                        <div key={idx} className={styles.zoneDetailItem}>
                          <MapPin size={16} />
                          <span className={styles.zoneLocation}>{zone.ville}, {zone.region}</span>
                          <span className={styles.zoneProbabilityBadge}>{zone.probabilite?.toFixed(0) || 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default IAAnalysisPage;
