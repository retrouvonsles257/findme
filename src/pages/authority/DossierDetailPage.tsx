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
import { uploadFileToCloudinary } from '../../services/cloudinary';
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
  Users,
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
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './DossierDetailPage.module.css';

export interface DossierDetailPageProps {
  /** Ne pas envelopper dans AuthorityLayout (pour usage dans espace admin) */
  noLayout?: boolean;
  /** URL du bouton Retour (ex: /admin/dossiers) */
  backTo?: string;
  /** Préfixe des routes pour éditer / alertes / IA (ex: /admin ou /authority) */
  basePath?: string;
}

const DEFAULT_BASE_PATH = '/authority';

export const DossierDetailPage: React.FC<DossierDetailPageProps> = ({
  noLayout = false,
  backTo,
  basePath = DEFAULT_BASE_PATH,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const { t, language } = useI18n();
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const bp = basePath || DEFAULT_BASE_PATH;

  /** Formate une date (string, Date ou timestamp) en chaîne affichable. Évite "Objects are not valid as a React child". */
  const safeFormatDate = (value: string | Date | number | null | undefined, options?: { dateStyle?: boolean }): string => {
    if (value == null) return '—';
    const d = value instanceof Date ? value : new Date(value as string | number);
    if (Number.isNaN(d.getTime())) return '—';
    return options?.dateStyle !== false
      ? d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
      : d.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US');
  };

  // Fonction pour traduire le statut
  const getStatusLabel = (statut: string) => {
    if (statut === 'en_cours') return t('authority.dossiers.status.en_cours');
    if (statut === 'suspendu') return t('authority.dossiers.status.suspendu');
    if (statut === 'retrouve_vivant') return t('authority.dossiers.status.retrouve_vivant');
    if (statut === 'retrouve_decede') return t('authority.dossiers.status.retrouve_decede');
    if (statut === 'classe_sans_suite') return t('authority.dossiers.status.classe_sans_suite');
    if (statut === 'transfere') return t('authority.dossiers.status.transfere');
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
  const [activeTab, setActiveTab] = useState<
    'info' | 'signalements' | 'localisations' | 'documents' | 'filiation' | 'historique' | 'photos' | 'ia'
  >('info');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Documents (table: document)
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadProgress, setDocumentUploadProgress] = useState<number>(0);
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [newDocumentType, setNewDocumentType] = useState<string>('rapport_police');
  const [newDocumentDescription, setNewDocumentDescription] = useState<string>('');
  const [newDocumentConfidential, setNewDocumentConfidential] = useState<boolean>(true);

  // Filiation (table: lien_filiation)
  const [filiations, setFiliations] = useState<any[]>([]);
  const [loadingFiliations, setLoadingFiliations] = useState(false);
  const [showAddFiliation, setShowAddFiliation] = useState(false);
  const [filiationSubmitting, setFiliationSubmitting] = useState(false);
  const [filiationError, setFiliationError] = useState<string>('');
  const [filiationSuccess, setFiliationSuccess] = useState<string>('');
  const [personnesOptions, setPersonnesOptions] = useState<any[]>([]);
  const [loadingPersonnesOptions, setLoadingPersonnesOptions] = useState(false);
  const [filiationForm, setFiliationForm] = useState({
    type_lien: 'pere_biologique',
    id_personne_relative: '',
    precision_lien: '',
    commentaire: '',
    confidentiel: true,
    visible_public: false,
    statut_verification: 'en_verification',
    type_preuve: 'aucune',
    nature_filiation: 'biologique',
  });

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

  // Charger les documents du dossier
  useEffect(() => {
    const loadDocuments = async () => {
      if (!id) return;
      setLoadingDocuments(true);
      try {
        const { data, error: docError } = await (supabase as any)
          .from('document')
          .select('*')
          .eq('id_dossier', id)
          .order('date_upload', { ascending: false });

        if (docError) throw docError;
        setDocuments(data || []);
      } catch {
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    if (activeTab === 'documents') {
      loadDocuments();
    }
  }, [id, activeTab]);

  // Charger la filiation de la personne du dossier + options de personnes
  useEffect(() => {
    const loadFiliation = async () => {
      const personneId = dossier?.id_personne as string | undefined;
      if (!personneId) return;

      setLoadingFiliations(true);
      setFiliationError('');
      try {
        const { data, error: filError } = await (supabase as any)
          .from('lien_filiation')
          .select(
            `
            *,
            personne_source:personne!lien_filiation_id_personne_source_fkey(id, nom, prenom),
            personne_cible:personne!lien_filiation_id_personne_cible_fkey(id, nom, prenom)
          `
          )
          .or(`id_personne_source.eq.${personneId},id_personne_cible.eq.${personneId}`)
          .order('created_at', { ascending: false });

        if (filError) throw filError;
        setFiliations(data || []);
      } catch (err: any) {
        setFiliations([]);
        setFiliationError(err?.message || t('authority.filiation.messages.loadError'));
      } finally {
        setLoadingFiliations(false);
      }
    };

    const loadPersonnesOptions = async () => {
      setLoadingPersonnesOptions(true);
      try {
        const { data } = await (supabase as any)
          .from('personne')
          .select('id, nom, prenom, created_at')
          .order('created_at', { ascending: false })
          .limit(50);
        setPersonnesOptions(data || []);
      } catch {
        setPersonnesOptions([]);
      } finally {
        setLoadingPersonnesOptions(false);
      }
    };

    if (activeTab === 'filiation') {
      loadFiliation();
      loadPersonnesOptions();
    }
  }, [activeTab, dossier?.id_personne, t]);

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

  const handleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewDocumentFile(file);
  };

  const handleUploadDocument = async () => {
    if (!id || !newDocumentFile) return;
    setDocumentUploading(true);
    setDocumentUploadProgress(0);
    try {
      const upload = await uploadFileToCloudinary(
        newDocumentFile,
        {
          type: 'document',
          resourceType: 'auto',
          tags: ['document', `dossier:${id}`],
          context: { dossier_id: id, type_document: newDocumentType },
        },
        (p) => setDocumentUploadProgress(Math.round(p.percentage))
      );

      if (!upload.success || !(upload.secureUrl || upload.url)) {
        throw new Error(upload.error || 'Upload failed');
      }

      const user = (await supabase.auth.getUser()).data.user;
      const url = upload.secureUrl || upload.url;
      const nowIso = new Date().toISOString();

      const { error: insertError } = await (supabase as any).from('document').insert({
        nom_fichier: newDocumentFile.name,
        type_document: newDocumentType,
        url_fichier: url,
        taille_octets: newDocumentFile.size,
        format_fichier: newDocumentFile.type || null,
        description: newDocumentDescription || null,
        confidentiel: newDocumentConfidential,
        date_upload: nowIso,
        uploade_par: user?.id,
        id_dossier: id,
      });

      if (insertError) throw insertError;

      // Refresh documents list
      const { data: refreshed } = await (supabase as any)
        .from('document')
        .select('*')
        .eq('id_dossier', id)
        .order('date_upload', { ascending: false });

      setDocuments(refreshed || []);
      setNewDocumentFile(null);
      setNewDocumentDescription('');
      setNewDocumentType('rapport_police');
      setNewDocumentConfidential(true);
      setDocumentUploadProgress(0);
    } catch (err) {
      console.error('[DossierDetail] Document upload error:', err);
    } finally {
      setDocumentUploading(false);
    }
  };

  const getFiliationTypeLabel = (type: string) => {
    const key = `authority.filiation.types.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  const computeFiliationSourceAndCible = (
    typeLien: string,
    missingPersonId: string,
    relativePersonId: string
  ): { id_personne_source: string; id_personne_cible: string } => {
    // Pour certains types (parents/tuteur), la "personne relative" est la source et la personne disparue la cible.
    const relativeIsSource = new Set<string>([
      'pere_biologique',
      'mere_biologique',
      'pere_adoptif',
      'mere_adoptive',
      'grand_pere_paternel',
      'grand_mere_paternelle',
      'grand_pere_maternel',
      'grand_mere_maternelle',
      'oncle_paternel',
      'tante_paternelle',
      'oncle_maternel',
      'tante_maternel',
      'tuteur_legal',
    ]);

    if (relativeIsSource.has(typeLien)) {
      return { id_personne_source: relativePersonId, id_personne_cible: missingPersonId };
    }

    // Par défaut (fratrie, conjoint, enfants...), on met la personne disparue comme source.
    return { id_personne_source: missingPersonId, id_personne_cible: relativePersonId };
  };

  const reloadFiliations = async () => {
    const personneId = dossier?.id_personne as string | undefined;
    if (!personneId) return;
    const { data } = await (supabase as any)
      .from('lien_filiation')
      .select(
        `
        *,
        personne_source:personne!lien_filiation_id_personne_source_fkey(id, nom, prenom),
        personne_cible:personne!lien_filiation_id_personne_cible_fkey(id, nom, prenom)
      `
      )
      .or(`id_personne_source.eq.${personneId},id_personne_cible.eq.${personneId}`)
      .order('created_at', { ascending: false });
    setFiliations(data || []);
  };

  const handleCreateFiliation = async () => {
    const missingPersonId = dossier?.id_personne as string | undefined;
    if (!id || !missingPersonId) {
      setFiliationError(t('authority.filiation.messages.missingPerson'));
      return;
    }
    if (!filiationForm.id_personne_relative) {
      setFiliationError(t('authority.filiation.messages.selectRelative'));
      return;
    }

    setFiliationSubmitting(true);
    setFiliationError('');
    setFiliationSuccess('');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { id_personne_source, id_personne_cible } = computeFiliationSourceAndCible(
        filiationForm.type_lien,
        missingPersonId,
        filiationForm.id_personne_relative
      );

      const nowIso = new Date().toISOString();
      const { error: insertError } = await (supabase as any).from('lien_filiation').insert({
        type_lien: filiationForm.type_lien,
        id_personne_source,
        id_personne_cible,
        precision_lien: filiationForm.precision_lien || null,
        nature_filiation: filiationForm.nature_filiation,
        statut_verification: filiationForm.statut_verification,
        type_preuve: filiationForm.type_preuve,
        commentaire: filiationForm.commentaire || null,
        confidentiel: filiationForm.confidentiel,
        visible_public: filiationForm.visible_public,
        cree_par: user?.id,
        modifie_par: user?.id,
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (insertError) throw insertError;

      await reloadFiliations();
      setShowAddFiliation(false);
      setFiliationForm((prev) => ({ ...prev, id_personne_relative: '', precision_lien: '', commentaire: '' }));
      setFiliationSuccess(t('authority.filiation.messages.created'));
      setTimeout(() => setFiliationSuccess(''), 2500);
    } catch (err: any) {
      setFiliationError(err?.message || t('authority.filiation.messages.createError'));
    } finally {
      setFiliationSubmitting(false);
    }
  };

  const handleDeleteFiliation = async (filiationId: string) => {
    if (!window.confirm(t('authority.filiation.messages.confirmDelete'))) return;
    try {
      const { error: delError } = await (supabase as any).from('lien_filiation').delete().eq('id', filiationId);
      if (delError) throw delError;
      await reloadFiliations();
    } catch (err: any) {
      setFiliationError(err?.message || t('authority.filiation.messages.deleteError'));
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

  const content = (
    <div className={styles.container}>
        {isLoading ? (
          <div className={styles.skeletonWrap}>
            <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
          </div>
        ) : error ? (
          <div className={styles.errorBanner} role="alert">
            <h3>{t('authority.dossierDetail.error')}</h3>
            <p>{error}</p>
            <button type="button" className={styles.retryBtn} onClick={() => id && fetchDossier(id)}>{t('authority.commonActions.view')}</button>
          </div>
        ) : dossier ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <button className={styles.backButton} onClick={() => (backTo != null ? navigate(backTo) : navigate(-1))}>
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
              {(['info', 'photos', 'signalements', 'localisations', 'documents', 'filiation', 'historique', 'ia'] as const).map(
                (tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'info' && <><Info size={16} /> {t('authority.dossierDetail.tabs.info')}</>}
                  {tab === 'photos' && <><Camera size={16} /> {t('authority.dossierDetail.tabs.photos')}</>}
                  {tab === 'signalements' && <><AlertCircle size={16} /> {t('authority.dossierDetail.tabs.reports')}</>}
                  {tab === 'localisations' && <><MapPin size={16} /> {t('authority.dossierDetail.tabs.locations')}</>}
                  {tab === 'documents' && <><FileText size={16} /> {t('authority.dossierDetail.tabs.documents')}</>}
                  {tab === 'filiation' && <><Users size={16} /> {t('authority.dossierDetail.tabs.filiation')}</>}
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
                        <p>{safeFormatDate(dossier.date_disparition)}</p>
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
                            <p>{safeFormatDate((dossier as any).personne.date_naissance)}</p>
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
                    <button className={styles.btn} onClick={() => navigate(`${bp}/dossiers/${id}/edit`)}>
                      <Edit size={16} /> {t('authority.commonActions.edit')}
                    </button>
                    <button 
                      className={styles.btn}
                      onClick={() => navigate(`${bp}/alertes/new?dossierId=${id}`)}
                    >
                      <Bell size={16} /> {t('authority.dossierDetail.createAlert')}
                    </button>
                    <button 
                      className={styles.btn}
                      onClick={() => navigate(`${bp}/ia-analysis?dossierId=${id}`)}
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
                            alt={photo.titre || t('authority.dossierDetail.title')} 
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
                              backgroundColor: sig.etat === 'valide' ? '#0ea5e9' : sig.etat === 'invalide' ? '#dc3545' : '#ffc107'
                            }}>
                              {sig.etat}
                            </span>
                          </div>
                          <p><strong>{t('authority.dossierDetail.fields.location')}:</strong> {sig.lieu_observation || t('authority.dossierDetail.fields.notProvided')}</p>
                          <p><strong>{t('authority.dossierDetail.fields.date')}:</strong> {safeFormatDate(sig.date_observation)}</p>
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

              {activeTab === 'documents' && (
                <div className={styles.tabContent}>
                  <h3><FileText size={20} /> {t('authority.dossierDetail.tabs.documents')}</h3>

                  <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6 }}>
                          {t('authority.documents.type')}
                        </label>
                        <select
                          value={newDocumentType}
                          onChange={(e) => setNewDocumentType(e.target.value)}
                          disabled={documentUploading}
                          style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd' }}
                        >
                          <option value="plainte_officielle">{t('authority.documents.types.plainte_officielle')}</option>
                          <option value="rapport_police">{t('authority.documents.types.rapport_police')}</option>
                          <option value="temoignage_ecrit">{t('authority.documents.types.temoignage_ecrit')}</option>
                          <option value="certificat_medical">{t('authority.documents.types.certificat_medical')}</option>
                          <option value="piece_identite">{t('authority.documents.types.piece_identite')}</option>
                          <option value="acte_naissance">{t('authority.documents.types.acte_naissance')}</option>
                          <option value="photo_document">{t('authority.documents.types.photo_document')}</option>
                          <option value="carte_geographique">{t('authority.documents.types.carte_geographique')}</option>
                          <option value="autre">{t('authority.documents.types.autre')}</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6 }}>
                          {t('authority.documents.file')}
                        </label>
                        <input
                          type="file"
                          onChange={handleDocumentFileSelect}
                          disabled={documentUploading}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>
                        {t('authority.documents.description')}
                      </label>
                      <textarea
                        value={newDocumentDescription}
                        onChange={(e) => setNewDocumentDescription(e.target.value)}
                        placeholder={t('authority.documents.descriptionPlaceholder')}
                        rows={3}
                        disabled={documentUploading}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd' }}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={newDocumentConfidential}
                        onChange={(e) => setNewDocumentConfidential(e.target.checked)}
                        disabled={documentUploading}
                      />
                      {t('authority.documents.confidential')}
                    </label>

                    <button
                      className={styles.btn}
                      onClick={handleUploadDocument}
                      disabled={!newDocumentFile || documentUploading}
                      style={{ justifyContent: 'center' }}
                    >
                      {documentUploading ? (
                        <>
                          <Loader2 size={16} className={styles.spinning} /> {t('authority.documents.uploading')}
                          {documentUploadProgress ? ` (${documentUploadProgress}%)` : ''}
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> {t('authority.documents.upload')}
                        </>
                      )}
                    </button>
                  </div>

                  {loadingDocuments ? (
                    <div className={styles.loading}>{t('authority.dossierDetail.loading')}</div>
                  ) : documents.length > 0 ? (
                    <div className={styles.itemsList}>
                      {documents.map((doc: any) => (
                        <div key={doc.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{doc.nom_fichier}</h4>
                            <span className={styles.badge} style={{ backgroundColor: doc.confidentiel ? '#64748b' : '#198754' }}>
                              {doc.confidentiel ? t('authority.documents.badges.confidential') : t('authority.documents.badges.public')}
                            </span>
                          </div>
                          <p><strong>{t('authority.documents.type')}:</strong> {t(`authority.documents.types.${doc.type_document}`)}</p>
                          {doc.description && <p><strong>{t('authority.documents.description')}:</strong> {doc.description}</p>}
                          <p><strong>{t('authority.documents.dateUpload')}:</strong> {doc.date_upload ? safeFormatDate(doc.date_upload, { dateStyle: false }) : '-'}</p>
                          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <button className={styles.btn} onClick={() => window.open(doc.url_fichier, '_blank')}>
                              <Eye size={16} /> {t('authority.documents.open')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>
                      <FileText size={48} />
                      <p>{t('authority.documents.empty')}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'filiation' && (
                <div className={styles.tabContent}>
                  <h3><Users size={20} /> {t('authority.dossierDetail.tabs.filiation')}</h3>

                  {filiationError && (
                    <div className={styles.error} style={{ marginTop: 12 }}>
                      <p>{filiationError}</p>
                    </div>
                  )}
                  {filiationSuccess && (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#ecfdf5', color: '#065f46' }}>
                      {filiationSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <p style={{ margin: 0, color: '#64748b' }}>{t('authority.filiation.subtitle')}</p>
                    <button className={styles.btn} onClick={() => setShowAddFiliation((s) => !s)}>
                      <Users size={16} /> {t('authority.filiation.add')}
                    </button>
                  </div>

                  {showAddFiliation && (
                    <div style={{ marginTop: 12, padding: 14, border: '1px solid #e2e8f0', borderRadius: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6 }}>{t('authority.filiation.form.type')}</label>
                          <select
                            value={filiationForm.type_lien}
                            onChange={(e) => setFiliationForm((p) => ({ ...p, type_lien: e.target.value }))}
                            disabled={filiationSubmitting}
                            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                          >
                            <option value="pere_biologique">{t('authority.filiation.types.pere_biologique')}</option>
                            <option value="mere_biologique">{t('authority.filiation.types.mere_biologique')}</option>
                            <option value="frere_biologique">{t('authority.filiation.types.frere_biologique')}</option>
                            <option value="soeur_biologique">{t('authority.filiation.types.soeur_biologique')}</option>
                            <option value="conjoint">{t('authority.filiation.types.conjoint')}</option>
                            <option value="enfant_biologique">{t('authority.filiation.types.enfant_biologique')}</option>
                            <option value="tuteur_legal">{t('authority.filiation.types.tuteur_legal')}</option>
                            <option value="autre">{t('authority.filiation.types.autre')}</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: 6 }}>{t('authority.filiation.form.relative')}</label>
                          <select
                            value={filiationForm.id_personne_relative}
                            onChange={(e) => setFiliationForm((p) => ({ ...p, id_personne_relative: e.target.value }))}
                            disabled={filiationSubmitting || loadingPersonnesOptions}
                            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                          >
                            <option value="">{t('authority.filiation.form.selectRelative')}</option>
                            {personnesOptions.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {`${p.prenom || ''} ${p.nom || ''}`.trim() || p.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>{t('authority.filiation.form.precision')}</label>
                        <input
                          type="text"
                          value={filiationForm.precision_lien}
                          onChange={(e) => setFiliationForm((p) => ({ ...p, precision_lien: e.target.value }))}
                          disabled={filiationSubmitting}
                          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                        />
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>{t('authority.filiation.form.comment')}</label>
                        <textarea
                          value={filiationForm.commentaire}
                          onChange={(e) => setFiliationForm((p) => ({ ...p, commentaire: e.target.value }))}
                          rows={3}
                          disabled={filiationSubmitting}
                          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={filiationForm.confidentiel}
                            onChange={(e) => setFiliationForm((p) => ({ ...p, confidentiel: e.target.checked }))}
                            disabled={filiationSubmitting}
                          />
                          {t('authority.filiation.form.confidential')}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={filiationForm.visible_public}
                            onChange={(e) => setFiliationForm((p) => ({ ...p, visible_public: e.target.checked }))}
                            disabled={filiationSubmitting}
                          />
                          {t('authority.filiation.form.public')}
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                        <button className={styles.btn} onClick={() => setShowAddFiliation(false)} disabled={filiationSubmitting}>
                          {t('authority.filiation.form.cancel')}
                        </button>
                        <button
                          className={styles.btn}
                          onClick={handleCreateFiliation}
                          disabled={filiationSubmitting}
                          style={{ background: '#0ea5e9', color: 'white' }}
                        >
                          {filiationSubmitting ? (
                            <>
                              <Loader2 size={16} className={styles.spinning} /> {t('authority.filiation.form.saving')}
                            </>
                          ) : (
                            t('authority.filiation.form.save')
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingFiliations ? (
                    <div className={styles.loading}>{t('authority.dossierDetail.loading')}</div>
                  ) : filiations.length > 0 ? (
                    <div className={styles.itemsList} style={{ marginTop: 12 }}>
                      {filiations.map((fil: any) => {
                        const missingId = dossier?.id_personne as string | undefined;
                        const missingIsSource = Boolean(missingId) && fil.id_personne_source === missingId;
                        const other = missingIsSource ? fil.personne_cible : fil.personne_source;
                        const otherName =
                          other ? `${other.prenom || ''} ${other.nom || ''}`.trim() : t('authority.filiation.unknownPerson');
                        const rel = getFiliationTypeLabel(fil.type_lien);
                        const relationLine = missingIsSource
                          ? t('authority.filiation.labels.missingIs').replace('{{relation}}', rel)
                          : t('authority.filiation.labels.relativeIs').replace('{{relation}}', rel);

                        return (
                          <div key={fil.id} className={styles.itemCard}>
                            <div className={styles.itemHeader}>
                              <h4>{otherName}</h4>
                              <span className={styles.badge} style={{ backgroundColor: '#64748b' }}>
                                {fil.statut_verification || '—'}
                              </span>
                            </div>
                            <p>{relationLine}</p>
                            {fil.precision_lien && <p><strong>{t('authority.filiation.fields.precision')}:</strong> {fil.precision_lien}</p>}
                            {fil.commentaire && <p><strong>{t('authority.filiation.fields.comment')}:</strong> {fil.commentaire}</p>}
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                              <button className={styles.btn} onClick={() => handleDeleteFiliation(fil.id)}>
                                {t('authority.filiation.delete')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.empty} style={{ marginTop: 12 }}>
                      <Users size={48} />
                      <p>{t('authority.filiation.empty')}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'localisations' && (
                <div className={styles.tabContent}>
                  <h3><MapPin size={20} /> {t('authority.dossierDetail.tabs.locations')}</h3>
                  {localisations.length > 0 ? (
                    <div className={styles.itemsList}>
                      {localisations.map((loc: any) => (
                        <div key={loc.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{t('authority.dossierDetail.tabs.locations')}</h4>
                            <span className={styles.badge} style={{ backgroundColor: '#0ea5e9' }}>
                              {safeFormatDate(loc.date_localisation)}
                            </span>
                          </div>
                          <p>
                            <strong>{t('authority.dossierDetail.fields.location')}:</strong>{' '}
                            {loc.adresse || loc.point_interet || t('authority.dossierDetail.fields.notProvided')}
                          </p>
                          {(() => {
                            const lat = typeof loc.latitude === 'number' ? loc.latitude : Number(loc.latitude);
                            const lng = typeof loc.longitude === 'number' ? loc.longitude : Number(loc.longitude);
                            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                            return (
                              <p>
                                <strong>{t('authority.location.coordinates')}:</strong> {lat.toFixed(4)}, {lng.toFixed(4)}
                              </p>
                            );
                          })()}
                          {loc.description && (
                            <p>
                              <strong>{t('authority.location.description')}:</strong> {loc.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>{t('authority.dossierDetail.noLocations')}</div>
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
                            {safeFormatDate(entry.date_modification)}
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
                          {safeFormatDate(dossier?.created_at)}
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
                              <img src={photo.url_thumbnail || photo.url_cloudinary} alt="Aperçu" />
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
                                {safeFormatDate(result.date_analyse)}
                              </span>
                            </div>
                            <div className={styles.iaResultBody}>
                              <div className={styles.iaResultScore}>
                                <span className={styles.scoreLabel}>{t('authority.iaAnalysis.results.reliability')}</span>
                                <span className={styles.scoreValue} style={{
                                  color: result.score_confiance >= 70 ? '#0ea5e9' : 
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
                              onClick={() => navigate(`${bp}/ia-analysis?resultId=${result.id}`)}
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
  );

  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default DossierDetailPage;
