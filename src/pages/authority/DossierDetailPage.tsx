/**
 * =====================================================
 * RETROUVONSLES - Dossier Detail Page
 * Vue détaillée d'un dossier de disparition
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { useHistoriqueDossier } from '../../features/dossiers/hooks/useHistoriqueDossier';
import { AuthorityLayout } from '../../components/layout';
import { supabase } from '../../config';
import { useI18n } from '../../hooks';
import { 
  Brain, 
  Camera, 
  Image as ImageIcon, 
  ArrowLeft, 
  Edit, 
  Bell, 
  Info, 
  MapPin, 
  Clock, 
  FileText,
  AlertCircle,
  Phone,
  Mail,
  User,
  BarChart3,
  History,
  Zap,
  Loader2,
  CheckCircle,
  Eye,
  Upload
} from 'lucide-react';
import { analyzeFacialImage, getResultatsIA, ResultatIA } from '../../features/ia-analysis/services/iaAPI';
import { isHuggingFaceConfigured } from '../../services/huggingFaceService';
import styles from './DossierDetailPage.module.css';

export const DossierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Corrigé : utiliser 'id' au lieu de 'dossierId'
  const navigate = useNavigate();
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const { t, language } = useI18n();
  const { signalements, fetchSignalements } = useSignalementsForDossier();

  // Fonction pour traduire le statut
  const getStatusLabel = (statut: string) => {
    if (statut === 'en_cours') return t('authority.dossiers.status.en_cours');
    if (statut === 'suspendu') return t('authority.dossiers.status.suspendu');
    if (statut === 'retrouve_vivant') return t('authority.dossiers.status.retrouve_vivant');
    if (statut === 'retrouve_decede') return t('authority.dossiers.status.retrouve_decede');
    if (statut === 'cloture') return t('authority.editDossier.form.statusClosed');
    return statut;
  };

  // Fonction pour traduire le niveau d'urgence
  const getUrgencyLabel = (urgence: string) => {
    if (urgence === 'critique') return t('authority.dossiers.urgency.critique');
    if (urgence === 'urgent') return t('authority.dossiers.urgency.urgent');
    if (urgence === 'normal') return t('authority.dossiers.urgency.normal');
    if (urgence === 'faible') return t('authority.dossiers.urgency.faible');
    return urgence;
  };

  // Fonction pour traduire le type de disparition
  const getDisappearanceTypeLabel = (type: string) => {
    if (!type) return t('authority.dossierDetail.fields.notProvided');
    // Les types de disparition peuvent être : 'inconnue', 'volontaire', 'involontaire', etc.
    const typeKey = `authority.dossiers.disappearanceType.${type}`;
    const translated = t(typeKey);
    // Si la traduction retourne la clé elle-même, retourner le type original
    return translated !== typeKey ? translated : type;
  };
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();
  const { historique, fetchHistorique } = useHistoriqueDossier();
  const [activeTab, setActiveTab] = useState<'info' | 'signalements' | 'localisations' | 'historique' | 'photos' | 'ia'>('info');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  
  // États pour l'analyse IA
  const [iaResults, setIaResults] = useState<ResultatIA[]>([]);
  const [loadingIa, setLoadingIa] = useState(false);
  const [iaAnalyzing, setIaAnalyzing] = useState(false);
  const [selectedIaImage, setSelectedIaImage] = useState<File | null>(null);
  const [iaImagePreview, setIaImagePreview] = useState<string | null>(null);

  // Charger les photos de la personne
  useEffect(() => {
    const loadPhotos = async () => {
      if (!dossier?.id_personne) return;
      
      setLoadingPhotos(true);
      try {
        const { data, error } = await (supabase as any)
          .from('photo')
          .select('*')
          .eq('id_personne', dossier.id_personne)
          .order('est_principale', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPhotos(data || []);
      } catch (err) {
        // Erreur silencieuse - les photos sont optionnelles
      } finally {
        setLoadingPhotos(false);
      }
    };

    if (dossier?.id_personne) {
      loadPhotos();
    }
  }, [dossier?.id_personne]);

  // Charger les résultats IA pour ce dossier
  useEffect(() => {
    const loadIaResults = async () => {
      if (!id) return;
      setLoadingIa(true);
      try {
        const results = await getResultatsIA(undefined, id);
        setIaResults(results);
      } catch (err) {
        console.error('[DossierDetail] Erreur chargement résultats IA:', err);
      } finally {
        setLoadingIa(false);
      }
    };
    
    if (activeTab === 'ia') {
      loadIaResults();
    }
  }, [id, activeTab]);

  // Gérer la sélection d'image pour l'analyse IA
  const handleIaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedIaImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setIaImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lancer l'analyse IA
  const handleStartIaAnalysis = async () => {
    if (!selectedIaImage || !id) return;
    setIaAnalyzing(true);
    try {
      const result = await analyzeFacialImage(selectedIaImage, id);
      setIaResults(prev => [result, ...prev]);
      setSelectedIaImage(null);
      setIaImagePreview(null);
    } catch (err) {
      console.error('[DossierDetail] Erreur analyse IA:', err);
    } finally {
      setIaAnalyzing(false);
    }
  };

  // Analyser une photo existante du dossier
  const handleAnalyzeExistingPhoto = async (photoUrl: string) => {
    if (!id) return;
    setIaAnalyzing(true);
    try {
      // Convertir l'URL en File
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
      
      const result = await analyzeFacialImage(file, id);
      setIaResults(prev => [result, ...prev]);
    } catch (err) {
      console.error('[DossierDetail] Erreur analyse photo existante:', err);
    } finally {
      setIaAnalyzing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDossier(id).catch(() => {});
      fetchSignalements(id).catch(() => {});
      fetchLocalisations(id).catch(() => {});
      fetchHistorique(id).catch(() => {});
    }
  }, [id, fetchDossier, fetchSignalements, fetchLocalisations, fetchHistorique]);

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loading}>{t('authority.dossierDetail.loading')}</div>
        ) : error ? (
          <div className={styles.error}>
            <h3>{t('authority.dossierDetail.error')}</h3>
            <p>{error}</p>
            <button onClick={() => id && fetchDossier(id)}>{t('authority.commonActions.view')}</button>
          </div>
        ) : dossier ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <button className={styles.backButton} onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} /> {t('authority.commonActions.back')}
                </button>
                <div className={styles.titleSection}>
                  <h1>{dossier.numero_dossier}</h1>
                  <p className={styles.subtitle}>{t('authority.dossierDetail.title')}</p>
                </div>
              </div>
              <div className={styles.headerRight}>
                <span
                  className={styles.statusBadge}
                  style={{
                    backgroundColor:
                      dossier.statut_dossier === 'en_cours'
                        ? '#ffc107'
                        : dossier.statut_dossier.includes('retrouve')
                          ? '#4caf50'
                          : '#999',
                  }}
                >
                  {getStatusLabel(dossier.statut_dossier)}
                </span>
                <span
                  className={styles.urgenceBadge}
                  style={{
                    backgroundColor:
                      dossier.niveau_urgence === 'critique'
                        ? '#ff6b6b'
                        : dossier.niveau_urgence === 'urgent'
                          ? '#ffa500'
                          : '#4caf50',
                  }}
                >
                  {getUrgencyLabel(dossier.niveau_urgence)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {(['info', 'photos', 'signalements', 'localisations', 'historique', 'ia'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'info' && <><Info size={16} /> {t('authority.dossierDetail.tabs.info')}</>}
                  {tab === 'photos' && <><Camera size={16} /> {t('authority.dossierDetail.tabs.photos')}</>}
                  {tab === 'signalements' && <><AlertCircle size={16} /> {t('authority.dossierDetail.tabs.reports')}</>}
                  {tab === 'localisations' && <><MapPin size={16} /> {t('authority.dossierDetail.tabs.locations')}</>}
                  {tab === 'historique' && <><History size={16} /> {t('authority.dossierDetail.tabs.history')}</>}
                  {tab === 'ia' && <><Brain size={16} /> {t('authority.dossierDetail.tabs.ia')}</>}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
              {activeTab === 'info' && (
                <div className={styles.infoSection}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoBlock}>
                      <h3><FileText size={18} /> {t('authority.dossierDetail.sections.disappearance')}</h3>
                      <div className={styles.infoItem}>
                        <label><Clock size={14} /> {t('authority.dossierDetail.fields.date')}:</label>
                        <p>{new Date(dossier.date_disparition).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><MapPin size={14} /> {t('authority.dossierDetail.fields.location')}:</label>
                        <p>{dossier.lieu_disparition || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><FileText size={14} /> {t('authority.dossierDetail.fields.circumstances')}:</label>
                        <p>{dossier.circonstances || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><Info size={14} /> {t('authority.dossierDetail.fields.type')}:</label>
                        <p>{getDisappearanceTypeLabel(dossier.type_disparition)}</p>
                      </div>
                    </div>

                    {(dossier as any)?.personne && (
                      <div className={styles.infoBlock}>
                        <h3><User size={18} /> {t('authority.dossierDetail.sections.person')}</h3>
                        <div className={styles.infoItem}>
                          <label><User size={14} /> {t('authority.dossierDetail.fields.fullName')}:</label>
                          <p>{(dossier as any).personne.nom_complet || `${(dossier as any).personne.prenom || ''} ${(dossier as any).personne.nom || ''}`.trim() || t('authority.dossierDetail.fields.notProvided')}</p>
                        </div>
                        {(dossier as any).personne.date_naissance && (
                          <div className={styles.infoItem}>
                            <label><Clock size={14} /> {t('authority.dossierDetail.fields.birthDate')}:</label>
                            <p>{new Date((dossier as any).personne.date_naissance).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                          </div>
                        )}
                        {(dossier as any).personne.sexe && (
                          <div className={styles.infoItem}>
                            <label><User size={14} /> {t('authority.dossierDetail.fields.gender')}:</label>
                            <p>{(dossier as any).personne.sexe}</p>
                          </div>
                        )}
                        {(dossier as any).personne.description_physique && (
                          <div className={styles.infoItem}>
                            <label><FileText size={14} /> {t('authority.dossierDetail.fields.physicalDescription')}:</label>
                            <p>{(dossier as any).personne.description_physique}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={styles.infoBlock}>
                      <h3><User size={18} /> {t('authority.dossierDetail.sections.contact')}</h3>
                      <div className={styles.infoItem}>
                        <label><User size={14} /> {t('authority.dossierDetail.fields.investigator')}:</label>
                        <p>{dossier.enqueteur_responsable || t('authority.dossierDetail.fields.notAssigned')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><User size={14} /> {t('authority.dossierDetail.fields.familyContact')}:</label>
                        <p>{dossier.contact_famille_principale || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><Phone size={14} /> {t('authority.dossierDetail.fields.phone')}:</label>
                        <p>{dossier.telephone_contact || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><Mail size={14} /> {t('authority.dossierDetail.fields.email')}:</label>
                        <p>{dossier.email_contact || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                    </div>

                    <div className={styles.infoBlock}>
                      <h3><BarChart3 size={18} /> {t('authority.dossierDetail.sections.stats')}</h3>
                      <div className={styles.statGrid}>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>{t('authority.dossierDetail.stats.reports')}</span>
                          <span className={styles.statValue}>
                            {dossier.nombre_signalements || 0}
                          </span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>{t('authority.dossierDetail.stats.alerts')}</span>
                          <span className={styles.statValue}>
                            {dossier.nombre_alertes_diffusees || 0}
                          </span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>{t('authority.dossierDetail.stats.views')}</span>
                          <span className={styles.statValue}>
                            {dossier.nombre_vues_fiche || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.btn} onClick={() => navigate(`/authority/dossiers/${id}/edit`)}>
                      <Edit size={16} /> {t('authority.commonActions.edit')}
                    </button>
                    <button 
                      className={styles.btn}
                      onClick={() => navigate(`/authority/alertes/new?dossierId=${id}`)}
                    >
                      <Bell size={16} /> {t('authority.dossierDetail.createAlert')}
                    </button>
                    <button 
                      className={styles.btn}
                      onClick={() => navigate(`/authority/ia-analysis?dossierId=${id}`)}
                    >
                      <Brain size={16} /> {t('authority.dossierDetail.iaAnalysis')}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div className={styles.tabContent}>
                  <h3><Camera size={20} /> {t('authority.dossierDetail.tabs.photos')}</h3>
                  {loadingPhotos ? (
                    <div className={styles.loading}>{t('authority.header.loading')}</div>
                  ) : photos.length > 0 ? (
                    <div className={styles.photosGrid}>
                      {photos.map((photo) => (
                        <div key={photo.id} className={styles.photoCard}>
                          <img 
                            src={photo.url_thumbnail || photo.url_cloudinary} 
                            alt={photo.titre || 'Photo'} 
                            onClick={() => window.open(photo.url_cloudinary, '_blank')}
                          />
                          {photo.est_principale && (
                            <span className={styles.mainPhotoBadge}>{t('authority.dossierDetail.tabs.photos')}</span>
                          )}
                          {photo.titre && (
                            <p className={styles.photoTitle}>{photo.titre}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>
                      <ImageIcon size={48} />
                      <p>{t('authority.dossierDetail.noPhotos')}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'signalements' && (
                <div className={styles.tabContent}>
                  <h3><AlertCircle size={20} /> {t('authority.dossierDetail.tabs.reports')}</h3>
                  {signalements.length > 0 ? (
                    <div className={styles.itemsList}>
                      {signalements.map((sig: any) => (
                        <div key={sig.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{sig.description || t('authority.dossierDetail.tabs.reports')}</h4>
                            <span className={styles.badge} style={{
                              backgroundColor: sig.etat === 'valide' ? '#28a745' : sig.etat === 'invalide' ? '#dc3545' : '#ffc107'
                            }}>
                              {sig.etat}
                            </span>
                          </div>
                          <p><strong>{t('authority.dossierDetail.fields.location')}:</strong> {sig.lieu_observation || t('authority.dossierDetail.fields.notProvided')}</p>
                          <p><strong>{t('authority.dossierDetail.fields.date')}:</strong> {new Date(sig.date_observation).toLocaleDateString()}</p>
                          {(sig.nom_temoin || (sig.utilisateur && (sig.utilisateur.nom || sig.utilisateur.prenom))) && (
                            <p><strong>{t('authority.dossierDetail.fields.author')}:</strong> {
                              sig.nom_temoin || 
                              (sig.utilisateur ? `${sig.utilisateur.prenom || ''} ${sig.utilisateur.nom || ''}`.trim() : '') ||
                              t('authority.dossierDetail.anonymousReport')
                            }</p>
                          )}
                          {sig.temoin_anonyme && <p><em style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('authority.dossierDetail.anonymousReport')}</em></p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>{t('authority.dossierDetail.noReports')}</div>
                  )}
                </div>
              )}

              {activeTab === 'localisations' && (
                <div className={styles.tabContent}>
                  <h3><MapPin size={20} /> Localisations Enregistrées</h3>
                  {localisations.length > 0 ? (
                    <div className={styles.itemsList}>
                      {localisations.map((loc: any) => (
                        <div key={loc.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>Localisation</h4>
                            <span className={styles.badge} style={{ backgroundColor: '#007bff' }}>
                              {new Date(loc.date_localisation).toLocaleDateString()}
                            </span>
                          </div>
                          <p><strong>Lieu:</strong> {loc.lieu_localisation || 'Non renseigné'}</p>
                          {loc.latitude && loc.longitude && (
                            <p><strong>Coordonnées:</strong> {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
                          )}
                          {loc.rayon_recherche && <p><strong>Rayon recherche:</strong> {loc.rayon_recherche} km</p>}
                          {loc.description && <p><strong>Description:</strong> {loc.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucune localisation enregistrée</div>
                  )}
                </div>
              )}

              {activeTab === 'historique' && (
                <div className={styles.tabContent}>
                  <h3><History size={20} /> {t('authority.dossierDetail.tabs.history')}</h3>
                  {historique.length > 0 ? (
                    <div className={styles.timeline}>
                      {historique.map((entry: any) => (
                        <div key={entry.id} className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date(entry.date_modification).toLocaleDateString()}
                          </div>
                          <div className={styles.timelineContent}>
                            <p><strong>{entry.action}</strong></p>
                            <p>{entry.description}</p>
                            {entry.modified_by && <small>{t('authority.dossierDetail.fields.author')}: {entry.modified_by}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.timeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDate}>
                          {new Date(dossier?.created_at || new Date()).toLocaleDateString()}
                        </div>
                        <div className={styles.timelineContent}>
                          <p>{t('authority.dossiers.title')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Analyse IA */}
              {activeTab === 'ia' && (
                <div className={styles.tabContent}>
                  <h3><Brain size={20} /> {t('authority.dossierDetail.tabs.ia')}</h3>
                  
                  {/* Section Upload pour analyse */}
                  <div className={styles.iaUploadSection}>
                    <h4>{t('authority.dossierDetail.ia.newAnalysis')}</h4>
                    
                    {!isHuggingFaceConfigured() && (
                      <div className={styles.iaWarning}>
                        <AlertCircle size={18} />
                        <span>{t('authority.iaAnalysis.serviceNotConfigured')}</span>
                      </div>
                    )}
                    
                    <div className={styles.iaUploadBox}>
                      <label className={styles.uploadLabel}>
                        <Upload size={32} />
                        <span>{t('authority.iaAnalysis.facialRecognition.uploadText')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIaFileSelect}
                          className={styles.fileInput}
                        />
                      </label>
                      
                      {iaImagePreview && (
                        <div className={styles.iaPreview}>
                          <img src={iaImagePreview} alt="Aperçu" />
                          <button
                            className={styles.iaAnalyzeBtn}
                            onClick={handleStartIaAnalysis}
                            disabled={iaAnalyzing}
                          >
                            {iaAnalyzing ? (
                              <><Loader2 size={18} className={styles.spinning} /> {t('authority.iaAnalysis.facialRecognition.analyzing')}</>
                            ) : (
                              <><Zap size={18} /> {t('authority.iaAnalysis.facialRecognition.startAnalysis')}</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Analyser une photo existante */}
                    {photos.length > 0 && (
                      <div className={styles.existingPhotosAnalysis}>
                        <h5>{t('authority.dossierDetail.ia.analyzeExisting')}</h5>
                        <div className={styles.existingPhotosGrid}>
                          {photos.slice(0, 4).map((photo) => (
                            <div key={photo.id} className={styles.existingPhotoCard}>
                              <img src={photo.url_thumbnail || photo.url_cloudinary} alt="Photo" />
                              <button
                                className={styles.analyzePhotoBtn}
                                onClick={() => handleAnalyzeExistingPhoto(photo.url_cloudinary)}
                                disabled={iaAnalyzing}
                              >
                                {iaAnalyzing ? <Loader2 size={14} className={styles.spinning} /> : <Brain size={14} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Résultats IA */}
                  <div className={styles.iaResultsSection}>
                    <h4>{t('authority.dossierDetail.ia.results')}</h4>
                    {loadingIa ? (
                      <div className={styles.loading}><Loader2 size={24} className={styles.spinning} /></div>
                    ) : iaResults.length > 0 ? (
                      <div className={styles.iaResultsList}>
                        {iaResults.map((result) => (
                          <div key={result.id} className={styles.iaResultCard}>
                            <div className={styles.iaResultHeader}>
                              <span className={styles.iaResultType}>{result.type_analyse}</span>
                              <span className={styles.iaResultDate}>
                                {new Date(result.date_analyse).toLocaleDateString()}
                              </span>
                            </div>
                            <div className={styles.iaResultBody}>
                              <div className={styles.iaResultScore}>
                                <span className={styles.scoreLabel}>{t('authority.iaAnalysis.results.reliability')}</span>
                                <span className={styles.scoreValue} style={{
                                  color: result.score_confiance >= 70 ? '#22c55e' : 
                                         result.score_confiance >= 40 ? '#f59e0b' : '#ef4444'
                                }}>
                                  {result.score_confiance.toFixed(0)}%
                                </span>
                              </div>
                              <div className={styles.iaResultStatus}>
                                {result.donnees_interpretees?.face_detected ? (
                                  <span className={styles.faceDetected}>
                                    <CheckCircle size={14} /> {t('authority.iaAnalysis.facialRecognition.detected')}
                                  </span>
                                ) : (
                                  <span className={styles.faceNotDetected}>
                                    <AlertCircle size={14} /> {t('authority.iaAnalysis.facialRecognition.notDetected')}
                                  </span>
                                )}
                              </div>
                              <div className={styles.iaResultStatus}>
                                <span style={{ fontSize: 12, opacity: 0.8 }}>
                                  {(((result.correspondances_trouvees as any)?.similar_cases?.length) || 0)} {t('authority.iaAnalysis.similarities.matches')}
                                </span>
                              </div>
                            </div>
                            <button
                              className={styles.viewResultBtn}
                              onClick={() => navigate(`/authority/ia-analysis?resultId=${result.id}`)}
                            >
                              <Eye size={14} /> {t('authority.iaAnalysis.actions.viewDetails')}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.empty}>
                        <Brain size={48} />
                        <p>{t('authority.dossierDetail.ia.noResults')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.notFound}>{t('authority.dossierDetail.notFound')}</div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default DossierDetailPage;
