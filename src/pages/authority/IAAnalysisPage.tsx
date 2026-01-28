/**
 * =====================================================
 * RETROUVONSLES - IA Analysis Page
 * Analyse IA: reconnaissance faciale, similarités, prédictions
 * =====================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
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
  const { t, language } = useI18n();
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
      alert(t('authority.iaAnalysis.messages.selectImage'));
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
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fonction pour obtenir le label de confiance
  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return { label: t('authority.iaAnalysis.confidence.veryHigh'), color: '#22c55e' };
    if (score >= 60) return { label: t('authority.iaAnalysis.confidence.high'), color: '#84cc16' };
    if (score >= 40) return { label: t('authority.iaAnalysis.confidence.medium'), color: '#eab308' };
    if (score >= 20) return { label: t('authority.iaAnalysis.confidence.low'), color: '#f97316' };
    return { label: t('authority.iaAnalysis.confidence.veryLow'), color: '#ef4444' };
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
            <h1>{t('authority.iaAnalysis.title')}</h1>
            <p className={styles.subtitle}>
              {t('authority.iaAnalysis.subtitle')}
            </p>
          </div>
        </div>

        {/* Status Banner - simplifié */}
        {!isHuggingFaceConfigured && (
          <div className={styles.statusBannerWarning}>
            <AlertCircle size={18} />
            <span>{t('authority.iaAnalysis.serviceNotConfigured')}</span>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'matching' ? styles.active : ''}`}
            onClick={() => setActiveTab('matching')}
          >
            <Search size={18} />
            <span>{t('authority.iaAnalysis.tabs.facialRecognition')}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'similarities' ? styles.active : ''}`}
            onClick={() => setActiveTab('similarities')}
          >
            <Link2 size={18} />
            <span>{t('authority.iaAnalysis.tabs.similarities')}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'predictions' ? styles.active : ''}`}
            onClick={() => setActiveTab('predictions')}
          >
            <Target size={18} />
            <span>{t('authority.iaAnalysis.tabs.predictions')}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'results' ? styles.active : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <BarChart2 size={18} />
            <span>{t('authority.iaAnalysis.tabs.results')}</span>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'matching' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Camera size={24} className={styles.sectionIcon} />
                <div>
                  <h2>{t('authority.iaAnalysis.facialRecognition.title')}</h2>
                  <p>{t('authority.iaAnalysis.facialRecognition.description')}</p>
                </div>
              </div>

              <div className={styles.uploadSection}>
                <label className={styles.uploadBox}>
                  <div className={styles.uploadIconWrapper}>
                    <Upload size={48} />
                  </div>
                  <span className={styles.uploadText}>
                    {t('authority.iaAnalysis.facialRecognition.uploadText')}
                  </span>
                  <span className={styles.uploadHint}>
                    <FileImage size={14} /> {t('authority.iaAnalysis.facialRecognition.uploadHint')}
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
                    <span>{t('authority.iaAnalysis.messages.errorOccurred')}</span>
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
                      <span>{t('authority.iaAnalysis.facialRecognition.analyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span>{t('authority.iaAnalysis.facialRecognition.startAnalysis')}</span>
                    </>
                  )}
                </button>

                {/* Progress indicator */}
                {facialLoading && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressSteps}>
                      <div className={`${styles.progressStep} ${styles.active}`}>
                        <Activity size={16} />
                        <span>{t('authority.iaAnalysis.progress.detection')}</span>
                      </div>
                      <div className={`${styles.progressStep} ${analysisStarted ? styles.active : ''}`}>
                        <Users size={16} />
                        <span>{t('authority.iaAnalysis.progress.analysis')}</span>
                      </div>
                      <div className={`${styles.progressStep} ${analysisStarted ? styles.active : ''}`}>
                        <Eye size={16} />
                        <span>{t('authority.iaAnalysis.progress.processing')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current analysis result */}
                {currentAnalysis && !facialLoading && (
                  <div className={styles.currentResult}>
                    <div className={styles.resultHeader}>
                      <CheckCircle size={20} className={styles.successIcon} />
                      <h4>{t('authority.iaAnalysis.facialRecognition.analysisComplete')}</h4>
                    </div>
                    <div className={styles.resultSummary}>
                      <div className={styles.summaryItem}>
                        <TrendingUp size={18} />
                        <span>{t('authority.iaAnalysis.facialRecognition.reliability')}: {getConfidenceLabel(currentAnalysis.score_confiance).label}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <User size={18} />
                        <span>
                          {t('authority.iaAnalysis.facialRecognition.face')}: {currentAnalysis.donnees_interpretees?.face_detected ? t('authority.iaAnalysis.facialRecognition.detected') : t('authority.iaAnalysis.facialRecognition.notDetected')}
                        </span>
                      </div>
                      <div className={styles.summaryItem}>
                        <Clock size={18} />
                        <span>{t('authority.iaAnalysis.facialRecognition.duration')}: {((currentAnalysis.temps_traitement_ms || 0) / 1000).toFixed(1)}s</span>
                      </div>
                    </div>
                    <button 
                      className={styles.viewDetailsBtn}
                      onClick={() => handleViewDetails(currentAnalysis)}
                    >
                      <Eye size={16} />
                      <span>{t('authority.iaAnalysis.actions.viewDetails')}</span>
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
                  <h2>{t('authority.iaAnalysis.similarities.title')}</h2>
                  <p>{t('authority.iaAnalysis.similarities.description')}</p>
                </div>
              </div>

              {iaError && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={20} />
                  <span>{t('authority.iaAnalysis.messages.errorOccurred')}</span>
                </div>
              )}

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>{t('authority.iaAnalysis.loading')}</span>
                </div>
              ) : similaritiesResults.length > 0 ? (
                <div className={styles.similaritiesList}>
                  {similaritiesResults.map((result) => (
                    <div key={result.id} className={styles.similarityCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                          <Users size={18} />
                          <h4>{t('authority.iaAnalysis.similarities.analysisOf')} {formatDate(result.date_analyse)}</h4>
                        </div>
                        <span className={styles.badge}>
                          {(result.correspondances_trouvees as any)?.similar_cases?.length || 0} {t('authority.iaAnalysis.similarities.matches')}
                        </span>
                      </div>
                      <div className={styles.matchesList}>
                        {((result.correspondances_trouvees as any)?.similar_cases || []).slice(0, 3).map((match: any, idx: number) => (
                          <div key={idx} className={styles.matchItem}>
                            <span className={styles.matchId}>{t('authority.iaAnalysis.similarities.case')} #{idx + 1}</span>
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
                        <span>{t('authority.iaAnalysis.actions.viewDetails')}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Link2 size={48} className={styles.emptyIcon} />
                  <p>{t('authority.iaAnalysis.similarities.noAnalysis')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Target size={24} className={styles.sectionIcon} />
                <div>
                  <h2>{t('authority.iaAnalysis.predictions.title')}</h2>
                  <p>{t('authority.iaAnalysis.predictions.description')}</p>
                </div>
              </div>

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>{t('authority.iaAnalysis.predictions.calculating')}</span>
                </div>
              ) : locationPredictions.length > 0 ? (
                <div className={styles.predictionsList}>
                  {locationPredictions.map((prediction) => (
                    <div key={prediction.id} className={styles.predictionCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                          <MapPin size={18} />
                          <h4>{t('authority.iaAnalysis.predictions.predictionOf')} {formatDate(prediction.date_analyse)}</h4>
                        </div>
                        <span className={styles.badge}>
                          {(prediction.zones_predites as any)?.zones?.length || 0} {t('authority.iaAnalysis.predictions.zones')}
                        </span>
                      </div>
                      
                      <div className={styles.predictionMeta}>
                        <div className={styles.metaItem}>
                          <Percent size={16} />
                          <span>{t('authority.iaAnalysis.predictions.reliability')}: {getConfidenceLabel(prediction.score_confiance).label}</span>
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
                        <span>{t('authority.iaAnalysis.actions.viewDetails')}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Target size={48} className={styles.emptyIcon} />
                  <p>{t('authority.iaAnalysis.predictions.noPredictions')}</p>
                </div>
              )}
            </div>
          )}

              {activeTab === 'results' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BarChart2 size={24} className={styles.sectionIcon} />
                <div>
                  <h2>{t('authority.iaAnalysis.results.title')}</h2>
                  <p>{t('authority.iaAnalysis.results.description')}</p>
                </div>
              </div>

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>{t('authority.iaAnalysis.loading')}</span>
                </div>
              ) : (
                <div className={styles.resultsContainer}>
                  {facialResults.length > 0 ? (
                    facialResults.map((result) => (
                      <div key={result.id} className={styles.resultCard}>
                        <div className={styles.resultCardHeader}>
                          <Camera size={20} />
                          <h4>{t('authority.iaAnalysis.results.facialRecognition')}</h4>
                          <span className={styles.resultDate}>
                            {formatDate(result.date_analyse)}
                          </span>
                        </div>
                        <div className={styles.resultCardContent}>
                          <div className={styles.resultMetrics}>
                            <div className={styles.metric}>
                              <TrendingUp size={16} />
                              <span className={styles.metricLabel}>{t('authority.iaAnalysis.results.reliability')}:</span>
                              <span 
                                className={styles.metricValue}
                                style={{ color: getConfidenceLabel(result.score_confiance).color }}
                              >
                                {getConfidenceLabel(result.score_confiance).label}
                              </span>
                            </div>
                            <div className={styles.metric}>
                              <User size={16} />
                              <span className={styles.metricLabel}>{t('authority.iaAnalysis.results.face')}:</span>
                              <span className={styles.metricValue}>
                                {result.donnees_interpretees?.face_detected ? t('authority.iaAnalysis.facialRecognition.detected') : t('authority.iaAnalysis.facialRecognition.notDetected')}
                              </span>
                            </div>
                          </div>
                          <button 
                            className={styles.detailsBtn}
                            onClick={() => handleViewDetails(result)}
                          >
                            <Eye size={16} />
                            <span>{t('authority.iaAnalysis.actions.viewDetails')}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <BarChart2 size={48} className={styles.emptyIcon} />
                      <p>{t('authority.iaAnalysis.results.noAnalysis')}</p>
                      <span>{t('authority.iaAnalysis.results.startWithImage')}</span>
                    </div>
                  )}

                  {comparisonResults.length > 0 && comparisonResults.map((result) => (
                    <div key={result.id} className={styles.resultCard}>
                      <div className={styles.resultCardHeader}>
                        <FileImage size={20} />
                        <h4>{t('authority.iaAnalysis.results.imageComparison')}</h4>
                        <span className={styles.resultDate}>
                          {formatDate(result.date_analyse)}
                        </span>
                      </div>
                      <div className={styles.resultCardContent}>
                        <div className={styles.resultMetrics}>
                          <div className={styles.metric}>
                            <TrendingUp size={16} />
                            <span className={styles.metricLabel}>{t('authority.iaAnalysis.results.similarity')}:</span>
                            <span className={styles.metricValue}>
                              {result.score_confiance.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={result.donnees_interpretees?.is_match ? styles.matchSuccess : styles.matchFail}>
                          {result.donnees_interpretees?.is_match ? (
                            <>
                              <CheckCircle size={16} />
                              <span>{t('authority.iaAnalysis.results.matchFound')}</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={16} />
                              <span>{t('authority.iaAnalysis.results.noMatch')}</span>
                            </>
                          )}
                        </div>
                        <button 
                          className={styles.detailsBtn}
                          onClick={() => handleViewDetails(result)}
                        >
                          <Eye size={16} />
                          <span>{t('authority.iaAnalysis.actions.viewDetails')}</span>
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
                <h3>{t('authority.iaAnalysis.modal.title')}</h3>
                <button className={styles.closeModalBtn} onClick={closeDetailModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className={styles.modalContent}>
                {/* Informations générales */}
                <div className={styles.detailSection}>
                  <h4><Calendar size={18} /> {t('authority.iaAnalysis.modal.generalInfo')}</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.analysisDate')}</span>
                      <span className={styles.detailValue}>{formatDate(selectedResult.date_analyse)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.reliability')}</span>
                      <span 
                        className={styles.detailValue}
                        style={{ color: getConfidenceLabel(selectedResult.score_confiance).color }}
                      >
                        {getConfidenceLabel(selectedResult.score_confiance).label} ({selectedResult.score_confiance.toFixed(0)}%)
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.processingTime')}</span>
                      <span className={styles.detailValue}>
                        {((selectedResult.temps_traitement_ms || 0) / 1000).toFixed(2)} {t('authority.iaAnalysis.modal.seconds')}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.status')}</span>
                      <span className={`${styles.detailValue} ${styles.statusBadge}`}>
                        {selectedResult.statut_validation === 'en_attente' ? t('authority.iaAnalysis.modal.statusPending') :
                         selectedResult.statut_validation === 'confirme' ? t('authority.iaAnalysis.modal.statusConfirmed') :
                         selectedResult.statut_validation === 'infirme' ? t('authority.iaAnalysis.modal.statusRefuted') : t('authority.iaAnalysis.modal.statusToVerify')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Résultats de la détection */}
                <div className={styles.detailSection}>
                  <h4><User size={18} /> {t('authority.iaAnalysis.modal.detectionResults')}</h4>
                  
                  {/* Image analysée */}
                  {selectedResult.donnees_brutes?.image_name && (
                    <div className={styles.detailItem} style={{ marginBottom: '1rem' }}>
                      <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.analyzedImage')}</span>
                      <span className={styles.detailValue}>{selectedResult.donnees_brutes.image_name}</span>
                    </div>
                  )}

                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.faceDetected')}</span>
                      <span className={styles.detailValue}>
                        {selectedResult.donnees_interpretees?.face_detected ? (
                          <span className={styles.successText}><CheckCircle size={14} /> {t('authority.iaAnalysis.modal.yes')}</span>
                        ) : (
                          <span className={styles.errorText}><AlertCircle size={14} /> {t('authority.iaAnalysis.modal.no')}</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Qualité de l'image */}
                    {(selectedResult.donnees_interpretees?.quality_score || selectedResult.donnees_interpretees?.quality_score === 0) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.imageQuality')}</span>
                        <span className={styles.detailValue}>
                          {selectedResult.donnees_interpretees.quality_score.toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {/* Nombre de visages */}
                    {selectedResult.donnees_interpretees?.face_count !== undefined && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.faceCount')}</span>
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
                            <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.estimatedAge')}</span>
                            <span className={styles.detailValue}>
                              {selectedResult.donnees_interpretees.faces[0].age_estimate}
                            </span>
                          </div>
                        )}
                        {selectedResult.donnees_interpretees.faces[0].gender && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.gender')}</span>
                            <span className={styles.detailValue}>
                              {selectedResult.donnees_interpretees.faces[0].gender === 'Male' ? t('authority.iaAnalysis.modal.genderMale') : 
                               selectedResult.donnees_interpretees.faces[0].gender === 'Female' ? t('authority.iaAnalysis.modal.genderFemale') : 
                               selectedResult.donnees_interpretees.faces[0].gender}
                            </span>
                          </div>
                        )}
                        {selectedResult.donnees_interpretees.faces[0].confidence && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.detectionConfidence')}</span>
                            <span className={styles.detailValue}>
                              {(selectedResult.donnees_interpretees.faces[0].confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {selectedResult.donnees_interpretees.faces[0].emotions?.[0] && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.facialExpression')}</span>
                            <span className={styles.detailValue}>
                              <Smile size={14} /> {
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'happy' ? t('authority.iaAnalysis.modal.emotionHappy') :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'sad' ? t('authority.iaAnalysis.modal.emotionSad') :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'angry' ? t('authority.iaAnalysis.modal.emotionAngry') :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'neutral' ? t('authority.iaAnalysis.modal.emotionNeutral') :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'surprise' ? t('authority.iaAnalysis.modal.emotionSurprise') :
                                selectedResult.donnees_interpretees.faces[0].emotions[0].label === 'fear' ? t('authority.iaAnalysis.modal.emotionFear') :
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
                      <p>{t('authority.iaAnalysis.modal.noFaceDetected')}</p>
                    </div>
                  )}

                  {/* Message d'erreur si présent */}
                  {selectedResult.donnees_interpretees?.error && (
                    <div className={styles.errorMessage}>
                      <AlertCircle size={20} />
                      <p>{t('authority.iaAnalysis.modal.analysisError')}: {selectedResult.donnees_interpretees.error_message || t('authority.iaAnalysis.modal.unknownError')}</p>
                    </div>
                  )}
                </div>

                {/* Correspondances trouvées */}
                {selectedResult.correspondances_trouvees && (
                  <div className={styles.detailSection}>
                    <h4><Users size={18} /> {t('authority.iaAnalysis.modal.matches')}</h4>
                    {(selectedResult.correspondances_trouvees as any)?.similar_cases?.length > 0 ? (
                      <div className={styles.matchesList}>
                        {((selectedResult.correspondances_trouvees as any)?.similar_cases || []).map((match: any, idx: number) => (
                          <div key={idx} className={styles.matchDetailItem}>
                            <span className={styles.matchNumber}>#{idx + 1}</span>
                            <div className={styles.matchInfo}>
                              <span>{t('authority.iaAnalysis.modal.potentialMatch')}</span>
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
                      <p className={styles.noMatches}>{t('authority.iaAnalysis.modal.noMatches')}</p>
                    )}
                  </div>
                )}

                {/* Zones prédites */}
                {(selectedResult.zones_predites as any)?.zones && (
                  <div className={styles.detailSection}>
                    <h4><MapPin size={18} /> {t('authority.iaAnalysis.modal.predictedZones')}</h4>
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
