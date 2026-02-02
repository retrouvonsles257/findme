/**
 * =====================================================
 * RETROUVONSLES - IA Analysis Page (Version Complète)
 * 
 * Conforme à la documentation :
 * - Badge rouge >85% prioritaire
 * - Photos côte à côte (dossier vs signalement)
 * - Boutons d'action complets (Enquête, Alerte)
 * - Statistiques IA
 * - Configuration des seuils
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
  Bell,
  Shield,
  Settings,
  AlertTriangle,
  PieChart,
  Sliders,
} from 'lucide-react';
import { useFacialRecognition, useIAAnalysis, confirmIAResult, rejectIAResult, markNeedsVerification } from '../../features/ia-analysis';
import { ResultatIA, getResultatsIA } from '../../features/ia-analysis/services/iaAPI';
import { useAuth } from '../../features/auth';
import { useDispatch } from 'react-redux';
import { 
  fetchFacialRecognitionResults, 
  fetchImageComparisonResults, 
  fetchLocationPredictions, 
  fetchSimilaritiesResults 
} from '../../features/ia-analysis/store/iaSlice';
import { supabase } from '../../config';
import styles from './IAAnalysisPage.module.css';

type AnalysisTab = 'matching' | 'similarities' | 'predictions' | 'results' | 'statistics';

// Seuils par défaut
const DEFAULT_THRESHOLD = 70;
const PRIORITY_THRESHOLD = 85;

export const IAAnalysisPage: React.FC = () => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<AnalysisTab>('matching');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultatIA | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  
  // États pour les nouvelles fonctionnalités
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(DEFAULT_THRESHOLD);
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'priority'>('all');
  const [iaStatistics, setIaStatistics] = useState<{
    totalAnalyses: number;
    confirmedMatches: number;
    falsePositives: number;
    pendingValidation: number;
    averageProcessingTime: number;
    precisionRate: number;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Photos pour comparaison côte à côte
  const [dossierPhoto, setDossierPhoto] = useState<string | null>(null);
  const [signalementPhoto, setSignalementPhoto] = useState<string | null>(null);
  
  // Auth pour obtenir l'ID utilisateur
  const { user } = useAuth();
  
  // Hooks IA
  const { 
    results: facialResults, 
    currentAnalysis,
    isLoading: facialLoading, 
    error: facialError, 
    analyzeFacial,
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

  // Charger l'historique IA et les statistiques au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger tous les types de résultats IA
        await Promise.all([
          dispatch(fetchFacialRecognitionResults() as any).unwrap().catch(() => []),
          dispatch(fetchImageComparisonResults() as any).unwrap().catch(() => []),
          dispatch(fetchLocationPredictions() as any).unwrap().catch(() => []),
          dispatch(fetchSimilaritiesResults() as any).unwrap().catch(() => []),
        ]);
        
        // Charger les statistiques
        await loadStatistics();
      } catch (err) {
        // Erreur silencieuse
      }
    };
    loadData();
  }, [dispatch]);

  // Charger les statistiques IA
  const loadStatistics = async () => {
    try {
      const allResults = await getResultatsIA();
      
      const confirmed = allResults.filter(r => r.statut_validation === 'confirme').length;
      const falsePos = allResults.filter(r => r.faux_positif === true).length;
      const pending = allResults.filter(r => r.statut_validation === 'en_attente').length;
      const avgTime = allResults.length > 0 
        ? allResults.reduce((sum, r) => sum + (r.temps_traitement_ms || 0), 0) / allResults.length 
        : 0;
      
      // Calcul du taux de précision
      const validated = confirmed + falsePos;
      const precision = validated > 0 ? (confirmed / validated) * 100 : 0;
      
      setIaStatistics({
        totalAnalyses: allResults.length,
        confirmedMatches: confirmed,
        falsePositives: falsePos,
        pendingValidation: pending,
        averageProcessingTime: avgTime,
        precisionRate: precision,
      });
    } catch (err) {
      console.error('[IAPage] Erreur chargement statistiques:', err);
    }
  };

  // Charger les photos pour la comparaison côte à côte
  const loadComparisonPhotos = async (result: ResultatIA) => {
    try {
      // Schéma réel: photo est liée à personne (id_personne) ou signalement (id_signalement)

      // Photo du dossier (via dossier_disparition.id_personne)
      if (result.id_dossier) {
        const { data: dossier } = await (supabase as any)
          .from('dossier_disparition')
          .select('id_personne')
          .eq('id', result.id_dossier)
          .single();

        const personneId = dossier?.id_personne as string | undefined;
        if (personneId) {
          const { data: photos } = await (supabase as any)
            .from('photo')
            .select('url_cloudinary, url_thumbnail, est_principale, type_photo, approuvee, created_at')
            .eq('id_personne', personneId)
            .eq('approuvee', true)
            .order('est_principale', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1);

          const p = (photos || [])[0];
          if (p?.url_thumbnail || p?.url_cloudinary) {
            setDossierPhoto(p.url_thumbnail || p.url_cloudinary);
          }
        }
      }

      // Photo du signalement
      let signalementPhotoUrl: string | null = null;
      if (result.id_signalement) {
        const { data: photos } = await (supabase as any)
          .from('photo')
          .select('url_cloudinary, url_thumbnail, created_at')
          .eq('id_signalement', result.id_signalement)
          .order('created_at', { ascending: false })
          .limit(1);

        const p = (photos || [])[0];
        signalementPhotoUrl = (p?.url_thumbnail || p?.url_cloudinary) ?? null;
      }

      // Si pas de photo signalement, utiliser l'image analysée (si fournie par le moteur IA)
      if (!signalementPhotoUrl && (result as any).donnees_brutes?.image_url) {
        signalementPhotoUrl = (result as any).donnees_brutes.image_url as string;
      }

      if (signalementPhotoUrl) {
        setSignalementPhoto(signalementPhotoUrl);
      }
    } catch (err) {
      console.error('[IAPage] Erreur chargement photos:', err);
    }
  };

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
    console.log('[IAPage] ═══════════════════════════════════════════');
    console.log('[IAPage] DÉMARRAGE ANALYSE MANUELLE');
    console.log('[IAPage] Image sélectionnée:', selectedImage?.name, selectedImage?.size, 'bytes');
    console.log('[IAPage] ═══════════════════════════════════════════');
    
    if (!selectedImage) {
      alert(t('authority.iaAnalysis.messages.selectImage'));
      return;
    }

    setAnalysisStarted(true);

    try {
      console.log('[IAPage] Appel de analyzeFacial...');
      const result = await analyzeFacial(selectedImage);
      console.log('[IAPage] Résultat analyse:', result);
      console.log('[IAPage] Visage détecté:', result?.donnees_interpretees?.face_detected);
      console.log('[IAPage] Correspondances:', result?.correspondances_trouvees);
      
      setActiveTab('results');
      await loadStatistics(); // Refresh stats
      
      // Rafraîchir les résultats après l'analyse
      dispatch(fetchFacialRecognitionResults() as any);
      dispatch(fetchSimilaritiesResults() as any);
      
      console.log('[IAPage] Analyse terminée avec succès');
    } catch (err) {
      console.error('[IAPage] ERREUR ANALYSE:', err);
      alert('Erreur lors de l\'analyse: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }, [selectedImage, analyzeFacial, t, dispatch]);

  const handleViewDetails = async (result: ResultatIA) => {
    setSelectedResult(result);
    setDossierPhoto(null);
    setSignalementPhoto(null);
    await loadComparisonPhotos(result);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedResult(null);
    setValidationComment('');
    setDossierPhoto(null);
    setSignalementPhoto(null);
  };

  // Handlers de validation IA
  const handleConfirmResult = async () => {
    if (!selectedResult || !user?.id) return;
    setValidationLoading(true);
    try {
      await confirmIAResult(selectedResult.id, user.id, validationComment || undefined);
      
      // Actions automatiques après confirmation
      await executePostConfirmationActions(selectedResult);
      
      dispatch(fetchFacialRecognitionResults() as any);
      await loadStatistics();
      closeDetailModal();
    } catch (err) {
      console.error('[IAPage] Erreur confirmation:', err);
    } finally {
      setValidationLoading(false);
    }
  };

  const handleRejectResult = async () => {
    if (!selectedResult || !user?.id) return;
    setValidationLoading(true);
    try {
      await rejectIAResult(selectedResult.id, user.id, validationComment || undefined);
      dispatch(fetchFacialRecognitionResults() as any);
      await loadStatistics();
      closeDetailModal();
    } catch (err) {
      console.error('[IAPage] Erreur rejet:', err);
    } finally {
      setValidationLoading(false);
    }
  };

  const handleNeedsVerification = async () => {
    if (!selectedResult || !user?.id) return;
    setValidationLoading(true);
    try {
      await markNeedsVerification(selectedResult.id, user.id, validationComment || undefined);
      dispatch(fetchFacialRecognitionResults() as any);
      closeDetailModal();
    } catch (err) {
      console.error('[IAPage] Erreur vérification:', err);
    } finally {
      setValidationLoading(false);
    }
  };

  // Actions automatiques après confirmation
  const executePostConfirmationActions = async (result: ResultatIA) => {
    try {
      // 1. Enregistrer une localisation associée au dossier (si coordonnées disponibles)
      if (result.id_dossier && result.id_signalement) {
        const { data: signalement } = await (supabase as any)
          .from('signalement')
          .select('latitude_observation, longitude_observation, lieu_observation')
          .eq('id', result.id_signalement)
          .single();
        
        const lat = signalement?.latitude_observation as number | null | undefined;
        const lng = signalement?.longitude_observation as number | null | undefined;
        const lieu = (signalement?.lieu_observation as string | null | undefined) || null;

        if (typeof lat === 'number' && typeof lng === 'number') {
          await (supabase as any).from('localisation').insert({
            latitude: lat,
            longitude: lng,
            source_localisation: 'prediction_ia',
            fiabilite_source: 'moyenne',
            type_localisation: 'signalement',
            adresse: lieu,
            description: 'Localisation ajoutée suite à confirmation IA',
            date_localisation: new Date().toISOString(),
            id_dossier: result.id_dossier,
            id_signalement: result.id_signalement,
            enregistree_par: user?.id,
            created_at: new Date().toISOString(),
          });
        }

        // Mettre à jour la dernière activité du dossier
        await (supabase as any)
          .from('dossier_disparition')
          .update({
            derniere_activite: new Date().toISOString(),
          })
          .eq('id', result.id_dossier);
      }
      
      // 2. Enregistrer dans journal_activite
      await (supabase as any).from('journal_activite').insert({
        type_action: 'validation_ia',
        action_detaillee: 'Correspondance IA confirmée',
        description: `Correspondance confirmée avec score ${result.score_confiance.toFixed(0)}%`,
        id_utilisateur: user?.id,
        id_dossier: result.id_dossier,
        date_action: new Date().toISOString(),
      });
      
      console.log('[IAPage] Actions post-confirmation exécutées');
    } catch (err) {
      console.error('[IAPage] Erreur actions post-confirmation:', err);
    }
  };

  // Lancer une enquête
  const handleLaunchInvestigation = async () => {
    if (!selectedResult || !user?.id) return;
    setActionLoading(true);
    try {
      // Créer une entrée dans le journal comme action d'investigation
      await (supabase as any).from('journal_activite').insert({
        type_action: 'autre',
        action_detaillee: 'Enquête lancée suite à correspondance IA',
        description: `Investigation ouverte pour résultat IA #${selectedResult.id.substring(0, 8)}`,
        id_utilisateur: user.id,
        id_dossier: selectedResult.id_dossier,
        date_action: new Date().toISOString(),
      });
      
      // Mettre à jour le statut du résultat IA
      await (supabase as any)
        .from('resultat_ia')
        .update({ action_generee: 'autre' })
        .eq('id', selectedResult.id);
      
      alert(t('authority.iaAnalysis.actions.investigationLaunched'));
      closeDetailModal();
    } catch (err) {
      console.error('[IAPage] Erreur lancement enquête:', err);
      alert(t('authority.iaAnalysis.messages.errorOccurred'));
    } finally {
      setActionLoading(false);
    }
  };

  // Créer une alerte géolocalisée
  const handleCreateAlert = async () => {
    if (!selectedResult || !user?.id) return;
    setActionLoading(true);
    try {
      // Récupérer les coordonnées du signalement
      let latitude = null;
      let longitude = null;
      let lieu = 'Zone non spécifiée';
      
      if (selectedResult.id_signalement) {
        const { data: signalement } = await (supabase as any)
          .from('signalement')
          .select('latitude_observation, longitude_observation, lieu_observation')
          .eq('id', selectedResult.id_signalement)
          .single();
        
        if (signalement) {
          latitude = signalement.latitude_observation;
          longitude = signalement.longitude_observation;
          lieu = signalement.lieu_observation || lieu;
        }
      }
      
      // Créer l'alerte
      const { error } = await (supabase as any).from('alerte').insert({
        titre: `Alerte IA - Correspondance détectée`,
        description: `Une correspondance a été détectée avec un score de ${selectedResult.score_confiance.toFixed(0)}%. Zone: ${lieu}`,
        type_alerte: 'signalement_important',
        niveau_urgence: selectedResult.score_confiance >= PRIORITY_THRESHOLD ? 'critique' : 'eleve',
        statut_alerte: 'active',
        latitude_centre: latitude,
        longitude_centre: longitude,
        rayon_km: 5,
        id_dossier: selectedResult.id_dossier,
        id_createur: user.id,
        date_creation: new Date().toISOString(),
        date_expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
      });
      
      if (error) throw error;
      
      // Mettre à jour le statut du résultat IA
      await (supabase as any)
        .from('resultat_ia')
        .update({ action_generee: 'alerte_creee' })
        .eq('id', selectedResult.id);
      
      alert(t('authority.iaAnalysis.actions.alertCreated'));
      closeDetailModal();
    } catch (err) {
      console.error('[IAPage] Erreur création alerte:', err);
      alert(t('authority.iaAnalysis.messages.errorOccurred'));
    } finally {
      setActionLoading(false);
    }
  };

  // Sauvegarder les paramètres de seuil
  const handleSaveThreshold = () => {
    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem('ia_confidence_threshold', confidenceThreshold.toString());
    setShowConfigModal(false);
  };

  // Charger le seuil sauvegardé
  useEffect(() => {
    const savedThreshold = localStorage.getItem('ia_confidence_threshold');
    if (savedThreshold) {
      setConfidenceThreshold(parseInt(savedThreshold, 10));
    }
  }, []);

  // Filtrer les résultats selon le score
  const getFilteredResults = (results: ResultatIA[]) => {
    switch (filterScore) {
      case 'high':
        return results.filter(r => r.score_confiance >= DEFAULT_THRESHOLD);
      case 'priority':
        return results.filter(r => r.score_confiance >= PRIORITY_THRESHOLD);
      default:
        return results;
    }
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

  // Vérifier si un résultat est prioritaire
  const isPriorityResult = (score: number) => score >= PRIORITY_THRESHOLD;

  // Compter les résultats prioritaires en attente
  const pendingPriorityCount = facialResults.filter(
    r => r.statut_validation === 'en_attente' && r.score_confiance >= PRIORITY_THRESHOLD
  ).length;

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
          
          {/* Bouton Configuration */}
          <button 
            className={styles.configButton}
            onClick={() => setShowConfigModal(true)}
            title={t('authority.iaAnalysis.config.title')}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Alerte prioritaires */}
        {pendingPriorityCount > 0 && (
          <div className={styles.priorityAlert}>
            <AlertTriangle size={20} />
            <span>
              <strong>{pendingPriorityCount}</strong> {t('authority.iaAnalysis.priorityAlert')}
            </span>
            <button 
              className={styles.viewPriorityBtn}
              onClick={() => {
                setFilterScore('priority');
                setActiveTab('results');
              }}
            >
              {t('authority.iaAnalysis.viewPriority')}
            </button>
          </div>
        )}

        {/* Status Banner */}
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
            {pendingPriorityCount > 0 && (
              <span className={styles.priorityBadge}>{pendingPriorityCount}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'statistics' ? styles.active : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <PieChart size={18} />
            <span>{t('authority.iaAnalysis.tabs.statistics')}</span>
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
                      {isPriorityResult(currentAnalysis.score_confiance) && (
                        <span className={styles.priorityTag}>
                          <AlertTriangle size={14} />
                          {t('authority.iaAnalysis.priority')}
                        </span>
                      )}
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
                    <div key={result.id} className={`${styles.similarityCard} ${isPriorityResult(result.score_confiance) ? styles.priorityCard : ''}`}>
                      {isPriorityResult(result.score_confiance) && (
                        <div className={styles.priorityRibbon}>PRIORITÉ</div>
                      )}
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
                
                {/* Filtres */}
                <div className={styles.filterButtons}>
                  <button 
                    className={`${styles.filterBtn} ${filterScore === 'all' ? styles.activeFilter : ''}`}
                    onClick={() => setFilterScore('all')}
                  >
                    {t('authority.iaAnalysis.filters.all')}
                  </button>
                  <button 
                    className={`${styles.filterBtn} ${filterScore === 'high' ? styles.activeFilter : ''}`}
                    onClick={() => setFilterScore('high')}
                  >
                    {t('authority.iaAnalysis.filters.highScore')} (&ge;{DEFAULT_THRESHOLD}%)
                  </button>
                  <button 
                    className={`${styles.filterBtn} ${filterScore === 'priority' ? styles.activeFilter : ''}`}
                    onClick={() => setFilterScore('priority')}
                  >
                    <AlertTriangle size={14} />
                    {t('authority.iaAnalysis.filters.priority')} (&ge;{PRIORITY_THRESHOLD}%)
                  </button>
                </div>
              </div>

              {iaLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>{t('authority.iaAnalysis.loading')}</span>
                </div>
              ) : (
                <div className={styles.resultsContainer}>
                  {getFilteredResults(facialResults).length > 0 ? (
                    getFilteredResults(facialResults).map((result) => (
                      <div 
                        key={result.id} 
                        className={`${styles.resultCard} ${isPriorityResult(result.score_confiance) ? styles.priorityResultCard : ''}`}
                      >
                        {/* Badge prioritaire */}
                        {isPriorityResult(result.score_confiance) && (
                          <div className={styles.priorityBadgeCard}>
                            <AlertTriangle size={14} />
                            PRIORITÉ
                          </div>
                        )}
                        
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
                                {result.score_confiance.toFixed(0)}%
                              </span>
                            </div>
                            <div className={styles.metric}>
                              <User size={16} />
                              <span className={styles.metricLabel}>{t('authority.iaAnalysis.results.face')}:</span>
                              <span className={styles.metricValue}>
                                {result.donnees_interpretees?.face_detected ? t('authority.iaAnalysis.facialRecognition.detected') : t('authority.iaAnalysis.facialRecognition.notDetected')}
                              </span>
                            </div>
                            <div className={styles.metric}>
                              <Shield size={16} />
                              <span className={styles.metricLabel}>{t('authority.iaAnalysis.results.status')}:</span>
                              <span className={`${styles.metricValue} ${styles[`status_${result.statut_validation}`]}`}>
                                {result.statut_validation === 'en_attente' ? t('authority.iaAnalysis.modal.statusPending') :
                                 result.statut_validation === 'confirme' ? t('authority.iaAnalysis.modal.statusConfirmed') :
                                 result.statut_validation === 'infirme' ? t('authority.iaAnalysis.modal.statusRefuted') : 
                                 t('authority.iaAnalysis.modal.statusToVerify')}
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

                  {getFilteredResults(comparisonResults).length > 0 && getFilteredResults(comparisonResults).map((result) => (
                    <div 
                      key={result.id} 
                      className={`${styles.resultCard} ${isPriorityResult(result.score_confiance) ? styles.priorityResultCard : ''}`}
                    >
                      {isPriorityResult(result.score_confiance) && (
                        <div className={styles.priorityBadgeCard}>
                          <AlertTriangle size={14} />
                          PRIORITÉ
                        </div>
                      )}
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

          {/* Nouvel onglet Statistiques */}
          {activeTab === 'statistics' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PieChart size={24} className={styles.sectionIcon} />
                <div>
                  <h2>{t('authority.iaAnalysis.statistics.title')}</h2>
                  <p>{t('authority.iaAnalysis.statistics.description')}</p>
                </div>
                <button 
                  className={styles.refreshBtn}
                  onClick={loadStatistics}
                >
                  <Activity size={16} />
                  {t('authority.iaAnalysis.statistics.refresh')}
                </button>
              </div>

              {iaStatistics ? (
                <div className={styles.statisticsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
                      <BarChart2 size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{iaStatistics.totalAnalyses}</span>
                      <span className={styles.statLabel}>{t('authority.iaAnalysis.statistics.totalAnalyses')}</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      <CheckCircle size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{iaStatistics.confirmedMatches}</span>
                      <span className={styles.statLabel}>{t('authority.iaAnalysis.statistics.confirmedMatches')}</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                      <X size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{iaStatistics.falsePositives}</span>
                      <span className={styles.statLabel}>{t('authority.iaAnalysis.statistics.falsePositives')}</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      <Clock size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{iaStatistics.pendingValidation}</span>
                      <span className={styles.statLabel}>{t('authority.iaAnalysis.statistics.pendingValidation')}</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                      <Zap size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{(iaStatistics.averageProcessingTime / 1000).toFixed(1)}s</span>
                      <span className={styles.statLabel}>{t('authority.iaAnalysis.statistics.avgProcessingTime')}</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                      <TrendingUp size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{iaStatistics.precisionRate.toFixed(1)}%</span>
                      <span className={styles.statLabel}>{t('authority.iaAnalysis.statistics.precisionRate')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span>{t('authority.iaAnalysis.loading')}</span>
                </div>
              )}

              {/* Graphique de précision */}
              {iaStatistics && iaStatistics.totalAnalyses > 0 && (
                <div className={styles.precisionChart}>
                  <h3>{t('authority.iaAnalysis.statistics.precisionOverview')}</h3>
                  <div className={styles.chartContainer}>
                    <div className={styles.chartBar}>
                      <div 
                        className={styles.chartFill} 
                        style={{ 
                          width: `${(iaStatistics.confirmedMatches / iaStatistics.totalAnalyses) * 100}%`,
                          background: '#22c55e'
                        }}
                      />
                      <span>{t('authority.iaAnalysis.statistics.confirmed')}: {((iaStatistics.confirmedMatches / iaStatistics.totalAnalyses) * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.chartBar}>
                      <div 
                        className={styles.chartFill} 
                        style={{ 
                          width: `${(iaStatistics.falsePositives / iaStatistics.totalAnalyses) * 100}%`,
                          background: '#ef4444'
                        }}
                      />
                      <span>{t('authority.iaAnalysis.statistics.falsePos')}: {((iaStatistics.falsePositives / iaStatistics.totalAnalyses) * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.chartBar}>
                      <div 
                        className={styles.chartFill} 
                        style={{ 
                          width: `${(iaStatistics.pendingValidation / iaStatistics.totalAnalyses) * 100}%`,
                          background: '#f59e0b'
                        }}
                      />
                      <span>{t('authority.iaAnalysis.statistics.pending')}: {((iaStatistics.pendingValidation / iaStatistics.totalAnalyses) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de détails - Version améliorée */}
        {showDetailModal && selectedResult && (
          <div className={styles.modalOverlay} onClick={closeDetailModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>
                  {t('authority.iaAnalysis.modal.title')}
                  {isPriorityResult(selectedResult.score_confiance) && (
                    <span className={styles.modalPriorityBadge}>
                      <AlertTriangle size={16} />
                      PRIORITÉ
                    </span>
                  )}
                </h3>
                <button className={styles.closeModalBtn} onClick={closeDetailModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className={styles.modalContent}>
                {/* Comparaison photos côte à côte */}
                {(dossierPhoto || signalementPhoto) && (
                  <div className={styles.photoComparison}>
                    <h4><FileImage size={18} /> {t('authority.iaAnalysis.modal.photoComparison')}</h4>
                    <div className={styles.photosGrid}>
                      <div className={styles.photoBox}>
                        <span className={styles.photoLabel}>{t('authority.iaAnalysis.modal.dossierPhoto')}</span>
                        {dossierPhoto ? (
                          <img
                            src={dossierPhoto}
                            alt={t('authority.iaAnalysis.alt.dossierPreview')}
                            className={styles.comparisonPhoto}
                          />
                        ) : (
                          <div className={styles.noPhoto}>
                            <User size={48} />
                            <span>{t('authority.iaAnalysis.modal.noPhoto')}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.vsIndicator}>
                        <span>VS</span>
                        <div className={styles.scoreCircle} style={{ 
                          background: getConfidenceLabel(selectedResult.score_confiance).color 
                        }}>
                          {selectedResult.score_confiance.toFixed(0)}%
                        </div>
                      </div>
                      <div className={styles.photoBox}>
                        <span className={styles.photoLabel}>{t('authority.iaAnalysis.modal.signalementPhoto')}</span>
                        {signalementPhoto ? (
                          <img
                            src={signalementPhoto}
                            alt={t('authority.iaAnalysis.alt.signalementPreview')}
                            className={styles.comparisonPhoto}
                          />
                        ) : (
                          <div className={styles.noPhoto}>
                            <Camera size={48} />
                            <span>{t('authority.iaAnalysis.modal.noPhoto')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Facteurs clés */}
                {selectedResult.donnees_interpretees?.factors && (
                  <div className={styles.detailSection}>
                    <h4><Sliders size={18} /> {t('authority.iaAnalysis.modal.keyFactors')}</h4>
                    <div className={styles.factorsList}>
                      {Object.entries(selectedResult.donnees_interpretees.factors).map(([key, value]: [string, any]) => (
                        <div key={key} className={styles.factorItem}>
                          <span className={styles.factorLabel}>{key}</span>
                          <span className={styles.factorValue}>{typeof value === 'number' ? `${value.toFixed(0)}%` : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Résultats de la détection */}
                <div className={styles.detailSection}>
                  <h4><User size={18} /> {t('authority.iaAnalysis.modal.detectionResults')}</h4>
                  
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
                    
                    {(selectedResult.donnees_interpretees?.quality_score || selectedResult.donnees_interpretees?.quality_score === 0) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.imageQuality')}</span>
                        <span className={styles.detailValue}>
                          {selectedResult.donnees_interpretees.quality_score.toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {selectedResult.donnees_interpretees?.face_count !== undefined && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.faceCount')}</span>
                        <span className={styles.detailValue}>
                          {selectedResult.donnees_interpretees.face_count}
                        </span>
                      </div>
                    )}
                    
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
                        {selectedResult.donnees_interpretees.faces[0].emotions?.[0] && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>{t('authority.iaAnalysis.modal.facialExpression')}</span>
                            <span className={styles.detailValue}>
                              <Smile size={14} /> {selectedResult.donnees_interpretees.faces[0].emotions[0].label}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {!selectedResult.donnees_interpretees?.face_detected && (
                    <div className={styles.noDataMessage}>
                      <AlertCircle size={20} />
                      <p>{t('authority.iaAnalysis.modal.noFaceDetected')}</p>
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

                {/* Section de validation - uniquement pour résultats en attente */}
                {selectedResult.statut_validation === 'en_attente' && (
                  <div className={styles.detailSection}>
                    <h4><Activity size={18} /> {t('authority.iaAnalysis.modal.validation')}</h4>
                    
                    <div className={styles.validationComment}>
                      <label>{t('authority.iaAnalysis.modal.comment')}</label>
                      <textarea
                        value={validationComment}
                        onChange={(e) => setValidationComment(e.target.value)}
                        placeholder={t('authority.iaAnalysis.modal.commentPlaceholder')}
                        rows={3}
                        className={styles.commentTextarea}
                      />
                    </div>

                    <div className={styles.validationActions}>
                      <button
                        className={styles.confirmBtn}
                        onClick={handleConfirmResult}
                        disabled={validationLoading || actionLoading}
                      >
                        {validationLoading ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        <span>{t('authority.iaAnalysis.modal.confirm')}</span>
                      </button>
                      
                      <button
                        className={styles.rejectBtn}
                        onClick={handleRejectResult}
                        disabled={validationLoading || actionLoading}
                      >
                        {validationLoading ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <X size={16} />
                        )}
                        <span>{t('authority.iaAnalysis.modal.reject')}</span>
                      </button>
                      
                      <button
                        className={styles.verifyBtn}
                        onClick={handleNeedsVerification}
                        disabled={validationLoading || actionLoading}
                      >
                        {validationLoading ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        <span>{t('authority.iaAnalysis.modal.needsVerification')}</span>
                      </button>
                    </div>

                    {/* Boutons d'action supplémentaires */}
                    <div className={styles.additionalActions}>
                      <button
                        className={styles.investigateBtn}
                        onClick={handleLaunchInvestigation}
                        disabled={validationLoading || actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <Search size={16} />
                        )}
                        <span>{t('authority.iaAnalysis.modal.launchInvestigation')}</span>
                      </button>
                      
                      <button
                        className={styles.createAlertBtn}
                        onClick={handleCreateAlert}
                        disabled={validationLoading || actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <Bell size={16} />
                        )}
                        <span>{t('authority.iaAnalysis.modal.createAlert')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Afficher le statut de validation si déjà validé */}
                {selectedResult.statut_validation !== 'en_attente' && (
                  <div className={styles.detailSection}>
                    <h4><Activity size={18} /> {t('authority.iaAnalysis.modal.validationHistory')}</h4>
                    <div className={styles.validationHistory}>
                      <div className={styles.validationStatus}>
                        {selectedResult.statut_validation === 'confirme' && (
                          <span className={styles.statusConfirmed}><CheckCircle size={16} /> {t('authority.iaAnalysis.modal.statusConfirmed')}</span>
                        )}
                        {selectedResult.statut_validation === 'infirme' && (
                          <span className={styles.statusRejected}><X size={16} /> {t('authority.iaAnalysis.modal.statusRefuted')}</span>
                        )}
                        {selectedResult.statut_validation === 'necessite_verification' && (
                          <span className={styles.statusPending}><AlertCircle size={16} /> {t('authority.iaAnalysis.modal.statusToVerify')}</span>
                        )}
                      </div>
                      {selectedResult.date_validation && (
                        <p className={styles.validationDate}>
                          {t('authority.iaAnalysis.modal.validatedOn')} {formatDate(selectedResult.date_validation)}
                        </p>
                      )}
                      {selectedResult.commentaire_validation && (
                        <p className={styles.validationCommentText}>"{selectedResult.commentaire_validation}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de configuration des seuils */}
        {showConfigModal && (
          <div className={styles.modalOverlay} onClick={() => setShowConfigModal(false)}>
            <div className={styles.configModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3><Settings size={20} /> {t('authority.iaAnalysis.config.title')}</h3>
                <button className={styles.closeModalBtn} onClick={() => setShowConfigModal(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <div className={styles.configContent}>
                <div className={styles.configItem}>
                  <label>{t('authority.iaAnalysis.config.confidenceThreshold')}</label>
                  <p className={styles.configDescription}>{t('authority.iaAnalysis.config.confidenceDescription')}</p>
                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseInt(e.target.value, 10))}
                      className={styles.slider}
                    />
                    <span className={styles.sliderValue}>{confidenceThreshold}%</span>
                  </div>
                </div>

                <div className={styles.configInfo}>
                  <p><strong>{t('authority.iaAnalysis.config.currentSettings')}:</strong></p>
                  <ul>
                    <li>{t('authority.iaAnalysis.config.notificationThreshold')}: {DEFAULT_THRESHOLD}%</li>
                    <li>{t('authority.iaAnalysis.config.priorityThreshold')}: {PRIORITY_THRESHOLD}%</li>
                  </ul>
                </div>

                <button className={styles.saveConfigBtn} onClick={handleSaveThreshold}>
                  <CheckCircle size={16} />
                  {t('authority.iaAnalysis.config.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default IAAnalysisPage;
