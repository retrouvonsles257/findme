/**
 * =====================================================
 * RETROUVONSLES - Signalements Validation Page
 * Validation et modération des signalements
 * Version complète avec toutes les fonctionnalités
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../../../hooks';
import { useAppSelector } from '../../../store/types';
import { selectUser } from '../../../features/auth/store/authSelectors';
import { useSignalements } from '../../../features/signalements/hooks/useSignalements';
import { useSignalementValidation } from '../../../features/signalements/hooks/useSignalementValidation';
import { ModerationLayout } from './ModerationLayout';
import { supabase } from '../../../config';
import {
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  Copy,
  User,
  Shield,
  Clock,
  Smartphone,
  Globe,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Image,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdminListSkeleton } from 'components/skeletons';
import styles from './SignalementValidationPage.module.css';

// Helper to bypass Supabase typing issues
const db = () => supabase as any;

// Types pour les filtres étendus
interface ExtendedFilters {
  status: 'all' | 'en_attente' | 'en_verification' | 'valide' | 'invalide' | 'spam' | 'doublonne';
  // Aligné avec l'ENUM SQL priorite_traitement: ('haute'|'moyenne'|'basse')
  priority: 'all' | 'basse' | 'moyenne' | 'haute';
  dateRange: 'all' | '7days' | '30days' | '90days';
  search: string;
}

export interface SignalementsValidationPageProps {
  noLayout?: boolean;
}

export const SignalementsValidationPage: React.FC<SignalementsValidationPageProps> = ({ noLayout = false }) => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);

  // Hooks pour les signalements
  const { 
    signalements, 
    isLoading, 
    pagination,
    stats,
    fetchSignalements,
    searchSignalements,
    updateSignalement,
    fetchStats,
  } = useSignalements();

  const { validateSignalement, isLoading: isValidating, reset } = useSignalementValidation();

  // State local
  const [filters, setFilters] = useState<ExtendedFilters>({
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSignalement, setSelectedSignalement] = useState<any>(null);
  const [signalerInfo, setSignalerInfo] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // État du formulaire de validation
  const [validationData, setValidationData] = useState({
    decision: 'approuve' as 'approuve' | 'rejete' | 'besoin_clarification',
    statut_final: 'valide' as 'valide' | 'invalide' | 'spam' | 'doublonne',
    raison: '',
    score_confiance: 0.8,
    avis: '',
    priorite: 'moyenne' as 'basse' | 'moyenne' | 'haute',
    transferer_autorites: false,
    autorite_destinataire: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // État pour la prévisualisation du dossier associé
  const [dossierInfo, setDossierInfo] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [showDossierPreview, setShowDossierPreview] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    fetchSignalements(undefined, currentPage);
    fetchStats();
  }, [currentPage, fetchSignalements, fetchStats]);

  // Charger les informations du signaleur quand on sélectionne un signalement
  useEffect(() => {
    if (selectedSignalement?.id_utilisateur) {
      loadSignalerInfo(selectedSignalement.id_utilisateur);
    } else {
      setSignalerInfo(null);
    }

    // Charger aussi le dossier associé
    if (selectedSignalement?.id_dossier) {
      loadDossierInfo(selectedSignalement.id_dossier);
    } else {
      setDossierInfo(null);
      setShowDossierPreview(false);
    }
  }, [selectedSignalement]);

  // Charger les infos du signaleur
  const loadSignalerInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id, nom, prenom, email, score_fiabilite, nombre_signalements_valides, nombre_signalements_invalides, created_at')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setSignalerInfo(data);
      }
    } catch (err) {
      console.error('Error loading signaler info:', err);
    }
  };

  // Charger les infos du dossier associé
  const loadDossierInfo = async (dossierId: string) => {
    setLoadingDossier(true);
    try {
      // Charger le dossier réel (schéma: dossier_disparition -> id_personne)
      const { data: dossier, error } = await db()
        .from('dossier_disparition')
        .select(
          `
          id,
          numero_dossier,
          statut_dossier,
          date_disparition,
          lieu_disparition,
          ville_disparition,
          region_disparition,
          circonstances,
          type_disparition,
          niveau_urgence,
          id_personne,
          created_at,
          personne:id_personne(
            id,
            nom,
            prenom,
            date_naissance,
            sexe,
            nationalite,
            taille_cm,
            poids_kg,
            couleur_yeux,
            couleur_cheveux,
            description_physique,
            signes_distinctifs,
            derniers_vetements_portes
          )
        `
        )
        .eq('id', dossierId)
        .single();

      if (!error && dossier) {
        const personneId = (dossier as any).id_personne as string | null | undefined;

        // Charger quelques photos (portraits) de la personne disparue
        const { data: photos } = personneId
          ? await db()
              .from('photo')
              .select('id, url_cloudinary, url_thumbnail, type_photo, approuvee')
              .eq('id_personne', personneId)
              .eq('type_photo', 'portrait')
              .eq('approuvee', true)
              .order('created_at', { ascending: false })
              .limit(4)
          : { data: [] };

        setDossierInfo({
          ...(dossier as any),
          photos: photos || [],
        });
      }
    } catch (err) {
      console.error('Error loading dossier info:', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  // Recherche avec debounce
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    if (searchTerm.length >= 3) {
      searchSignalements({ search: searchTerm });
    } else if (searchTerm.length === 0) {
      fetchSignalements(undefined, 1);
    }
  }, [searchSignalements, fetchSignalements]);

  // Filtrer les signalements localement
  const filteredSignalements = signalements.filter((sig) => {
    // Filtre par statut
    if (filters.status !== 'all') {
      const statut = sig.statut_validation || sig.etat;
      if (filters.status === 'en_attente' && statut !== 'en_attente' && sig.etat !== 'nouveau') return false;
      if (filters.status === 'en_verification' && statut !== 'en_verification' && sig.etat !== 'en_cours') return false;
      if (filters.status === 'valide' && statut !== 'valide' && sig.etat !== 'valide') return false;
      if (filters.status === 'invalide' && statut !== 'invalide' && sig.etat !== 'rejete') return false;
      if (filters.status === 'spam' && statut !== 'spam') return false;
      if (filters.status === 'doublonne' && statut !== 'doublonne') return false;
    }

    // Filtre par priorité
    if (filters.priority !== 'all' && sig.priorite_traitement !== filters.priority) {
      return false;
    }

    // Filtre par date
    if (filters.dateRange !== 'all') {
      const sigDate = new Date(sig.date_observation);
      const now = new Date();
      const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
      const cutoff = new Date(now.setDate(now.getDate() - days));
      if (sigDate < cutoff) return false;
    }

    // Filtre par recherche
    if (filters.search && filters.search.length > 0) {
      const searchLower = filters.search.toLowerCase();
      return (
        (sig.description || '').toLowerCase().includes(searchLower) ||
        (sig.lieu_observation || '').toLowerCase().includes(searchLower) ||
        (sig.ville_observation || '').toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Gérer la validation
  const handleValidate = async () => {
    if (!selectedSignalement) return;
    setErrorMessage('');

    try {
      // Appeler le service de validation
      await validateSignalement(selectedSignalement.id, currentUser?.id || '', {
        decision: validationData.decision,
        raison: validationData.raison,
        score_confiance: validationData.score_confiance,
        avis: validationData.avis,
      });

      // Mettre à jour le signalement avec les infos supplémentaires
      const updatePayload: any = {
        priorite_traitement: validationData.priorite,
      };

      // Si spam ou doublon, utiliser le statut final
      if (validationData.decision === 'rejete' && (validationData.statut_final === 'spam' || validationData.statut_final === 'doublonne')) {
        updatePayload.statut_validation = validationData.statut_final;
        updatePayload.visible_detail_public = false;
      }

      // Si transfert aux autorités
      if (validationData.transferer_autorites && validationData.autorite_destinataire) {
        updatePayload.transmis_autorites = true;
        updatePayload.date_transmission = new Date().toISOString();
        updatePayload.autorite_destinataire = validationData.autorite_destinataire;
      }

      await updateSignalement(selectedSignalement.id, updatePayload);

      // Enregistrer la note de modération si présente (via journal_activite car commentaire requiert un dossier)
      if (validationData.avis && validationData.avis.trim().length > 0) {
        await db().from('journal_activite').insert({
          type_action: 'validation_signalement',
          action_detaillee: 'Note de modération ajoutée',
          description: validationData.avis,
          id_utilisateur: currentUser?.id,
          id_signalement: selectedSignalement.id,
        });
      }

      // Messages de succès
      const successMsg = validationData.decision === 'approuve' 
        ? t('moderation.approvedSuccess')
        : validationData.statut_final === 'spam'
          ? t('moderation.markedAsSpam')
          : validationData.statut_final === 'doublonne'
            ? t('moderation.markedAsDuplicate')
            : t('moderation.rejectedSuccess');

      setSuccessMessage(successMsg);

      // Reset
      setSelectedSignalement(null);
      resetValidationForm();
      reset();

      // Rafraîchir la liste
      fetchSignalements(undefined, currentPage);
      fetchStats();

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Validation error:', err);
      setErrorMessage(err.message || t('moderation.errorOccurred'));
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Réinitialiser le formulaire
  const resetValidationForm = () => {
    setValidationData({
      decision: 'approuve',
      statut_final: 'valide',
      raison: '',
      score_confiance: 0.8,
      avis: '',
      priorite: 'moyenne',
      transferer_autorites: false,
      autorite_destinataire: '',
    });
  };

  // Pagination
  const totalPages = Math.ceil((pagination.total || filteredSignalements.length) / (pagination.pageSize || 20));

  // Obtenir le badge de statut
  const getStatusBadge = (sig: any) => {
    const statut = sig.statut_validation || sig.etat;
    const badges: Record<string, { label: string; color: string }> = {
      en_attente: { label: t('moderation.pendingLabel'), color: '#f59e0b' },
      nouveau: { label: t('moderation.nouveau'), color: '#38bdf8' },
      en_verification: { label: t('moderation.enCours'), color: '#8b5cf6' },
      en_cours: { label: t('moderation.enCours'), color: '#8b5cf6' },
      valide: { label: t('moderation.valides'), color: '#0284c7' },
      invalide: { label: t('moderation.rejected'), color: '#ef4444' },
      rejete: { label: t('moderation.rejected'), color: '#ef4444' },
      spam: { label: t('moderation.spam'), color: '#dc2626' },
      doublonne: { label: t('moderation.duplicates'), color: '#6b7280' },
    };
    return badges[statut] || { label: statut, color: '#6b7280' };
  };

  // Score de fiabilité couleur
  const getFiabiliteColor = (score: number) => {
    if (score >= 80) return '#0284c7';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const content = (
      <div className={styles.validation}>
        {/* Header avec recherche et filtres */}
        <section className={styles['validation__header']}>
          <div className={styles['validation__header-content']}>
            <h1 className={styles['validation__title']}>
              {t('moderation.validationTitle')}
            </h1>
            <p className={styles['validation__subtitle']}>
              {t('moderation.validationSubtitle')}
            </p>
          </div>

          {/* Barre de recherche */}
          <div className={styles['validation__search-bar']}>
            <div className={styles['validation__search-input-wrapper']}>
              <Search size={20} className={styles['validation__search-icon']} />
              <input
                type="text"
                placeholder={t('moderation.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles['validation__search-input']}
              />
            </div>
            <button
              className={styles['validation__filter-toggle']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              {t('common.filters')}
            </button>
            <button
              className={styles['validation__refresh-btn']}
              onClick={() => {
                fetchSignalements(undefined, currentPage);
                fetchStats();
              }}
              title={t('moderation.refresh')}
            >
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className={styles['validation__filters-panel']}>
              <div className={styles['validation__filter-group']}>
                <label>{t('moderation.status')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">{t('moderation.allStatuses')}</option>
                  <option value="en_attente">{t('moderation.pending')}</option>
                  <option value="en_verification">{t('moderation.inProgress')}</option>
                  <option value="valide">{t('moderation.validated')}</option>
                  <option value="invalide">{t('moderation.rejected')}</option>
                  <option value="spam">{t('moderation.spam')}</option>
                  <option value="doublonne">{t('moderation.duplicates')}</option>
                </select>
              </div>

              <div className={styles['validation__filter-group']}>
                <label>{t('moderation.priority')}</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="all">{t('moderation.allPriorities')}</option>
                  <option value="haute">{t('moderation.priorityHigh')}</option>
                  <option value="moyenne">{t('moderation.priorityMedium')}</option>
                  <option value="basse">{t('moderation.priorityLow')}</option>
                </select>
              </div>

              <div className={styles['validation__filter-group']}>
                <label>{t('moderation.period')}</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                >
                  <option value="all">{t('moderation.allPeriods')}</option>
                  <option value="7days">{t('moderation.last7Days')}</option>
                  <option value="30days">{t('moderation.lastMonth')}</option>
                  <option value="90days">{t('moderation.days90')}</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Messages */}
        {successMessage && (
          <div className={styles['validation__success']}>
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className={styles['validation__error']}>
            <AlertTriangle size={20} />
            {errorMessage}
          </div>
        )}

        {/* Stats rapides */}
        {stats && (
          <div className={styles['validation__quick-stats']}>
            <div className={styles['validation__stat']}>
              <span className={styles['validation__stat-value']}>{stats.parEtat?.nouveau || 0}</span>
              <span className={styles['validation__stat-label']}>{t('moderation.pendingLabel')}</span>
            </div>
            <div className={styles['validation__stat']}>
              <span className={styles['validation__stat-value']}>{stats.parEtat?.en_cours || 0}</span>
              <span className={styles['validation__stat-label']}>{t('moderation.enCours')}</span>
            </div>
            <div className={styles['validation__stat']}>
              <span className={styles['validation__stat-value']}>{stats.parEtat?.valide || 0}</span>
              <span className={styles['validation__stat-label']}>{t('moderation.valides')}</span>
            </div>
            <div className={styles['validation__stat']}>
              <span className={styles['validation__stat-value']}>{stats.derniers7jours || 0}</span>
              <span className={styles['validation__stat-label']}>{t('moderation.thisWeek')}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={styles['validation__skeletonWrap']}>
            <AdminListSkeleton cardCount={6} showFilters={true} />
          </div>
        ) : (
          <div className={styles['validation__content']}>
            {/* Left Panel - Liste */}
            <div className={styles['validation__list-panel']}>
              <div className={styles['validation__list-header']}>
                <span>{t('moderation.reportCount').replace('{{count}}', String(filteredSignalements.length))}</span>
              </div>

              {/* Liste des signalements */}
              <div className={styles['validation__list']}>
                {filteredSignalements.length > 0 ? (
                  filteredSignalements.map((sig) => {
                    const statusBadge = getStatusBadge(sig);
                    return (
                      <div
                        key={sig.id}
                        className={`${styles['validation__item']} ${
                          selectedSignalement?.id === sig.id
                            ? styles['validation__item--selected']
                            : ''
                        }`}
                        onClick={() => setSelectedSignalement(sig)}
                      >
                        <div className={styles['validation__item-header']}>
                          <h4 className={styles['validation__item-title']}>
                            <MapPin size={16} />
                            {sig.lieu_observation || sig.ville_observation || t('moderation.placeUnspecified')}
                          </h4>
                          <span 
                            className={styles['validation__badge']}
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className={styles['validation__item-description']}>
                          {sig.description?.substring(0, 100)}...
                        </p>
                        <div className={styles['validation__item-footer']}>
                          <span>
                            <Calendar size={14} />
                            {new Date(sig.date_observation).toLocaleDateString('fr-FR')}
                          </span>
                          <span>
                            Score: {Math.round((sig.score_correspondance || sig.score_pertinence || 0) * 100)}%
                          </span>
                          {sig.priorite_traitement && (
                            <span className={styles[`validation__priority--${sig.priorite_traitement}`]}>
                              {sig.priorite_traitement}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles['validation__empty']}>
                    {t('moderation.noReports')}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles['validation__pagination']}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span>{t('moderation.pageOf').replace('{{current}}', String(currentPage)).replace('{{total}}', String(totalPages))}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel - Détail et Validation */}
            <div className={styles['validation__detail-panel']}>
              {selectedSignalement ? (
                <>
                  {/* Informations du signaleur */}
                  {signalerInfo && (
                    <div className={styles['validation__signaler-info']}>
                      <h3>
                        <User size={18} />
                        {t('moderation.signalerInfo')}
                      </h3>
                      <div className={styles['validation__signaler-grid']}>
                        <div className={styles['validation__signaler-item']}>
                          <span className={styles['validation__signaler-label']}>{t('common.name')}</span>
                          <span className={styles['validation__signaler-value']}>
                            {signalerInfo.prenom} {signalerInfo.nom}
                          </span>
                        </div>
                        <div className={styles['validation__signaler-item']}>
                          <span className={styles['validation__signaler-label']}>
                            <Shield size={14} /> {t('moderation.reliabilityScore')}
                          </span>
                          <span 
                            className={styles['validation__signaler-value']}
                            style={{ color: getFiabiliteColor(signalerInfo.score_fiabilite || 0) }}
                          >
                            {Math.round(signalerInfo.score_fiabilite || 0)}%
                          </span>
                        </div>
                        <div className={styles['validation__signaler-item']}>
                          <span className={styles['validation__signaler-label']}>{t('moderation.reportsValidated')}</span>
                          <span className={styles['validation__signaler-value']}>
                            {signalerInfo.nombre_signalements_valides || 0}
                          </span>
                        </div>
                        <div className={styles['validation__signaler-item']}>
                          <span className={styles['validation__signaler-label']}>{t('moderation.reportsRejected')}</span>
                          <span className={styles['validation__signaler-value']}>
                            {signalerInfo.nombre_signalements_invalides || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Métadonnées du signalement */}
                  <div className={styles['validation__metadata']}>
                    <h3>
                      <Globe size={18} />
                      {t('moderation.metadata')}
                    </h3>
                    <div className={styles['validation__metadata-grid']}>
                      <div className={styles['validation__meta-item']}>
                        <Smartphone size={14} />
                        <span>{t('moderation.source')}: {selectedSignalement.source_signalement || 'application_web'}</span>
                      </div>
                      {selectedSignalement.ip_signalement && (
                        <div className={styles['validation__meta-item']}>
                          <Globe size={14} />
                          <span>IP: {selectedSignalement.ip_signalement}</span>
                        </div>
                      )}
                      <div className={styles['validation__meta-item']}>
                        <Clock size={14} />
                        <span>{t('moderation.createdAt')}: {new Date(selectedSignalement.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                      {selectedSignalement.temoin_anonyme && (
                        <div className={styles['validation__meta-item']}>
                          <User size={14} />
                          <span>{t('moderation.anonymousWitness')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prévisualisation du dossier associé */}
                  {selectedSignalement.id_dossier && (
                    <div className={styles['validation__dossier-preview']}>
                      <div 
                        className={styles['validation__dossier-header']}
                        onClick={() => setShowDossierPreview(!showDossierPreview)}
                      >
                        <h3>
                          <FileText size={18} />
                          {t('moderation.associatedDossier')}
                        </h3>
                        <button type="button" className={styles['validation__dossier-toggle']}>
                          {showDossierPreview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          {showDossierPreview ? t('common.hide') : t('moderation.viewDossier')}
                        </button>
                      </div>

                      {showDossierPreview && (
                        loadingDossier ? (
                          <div className={styles['validation__dossier-loading']}>
                            <RefreshCw size={20} className={styles['validation__spinner']} />
                            {t('moderation.loadingDossier')}
                          </div>
                        ) : dossierInfo ? (
                          <div className={styles['validation__dossier-content']}>
                            {/* Info de la personne disparue */}
                            <div className={styles['validation__dossier-person']}>
                              <div className={styles['validation__dossier-photos']}>
                                {dossierInfo.photos && dossierInfo.photos.length > 0 ? (
                                  dossierInfo.photos.slice(0, 2).map((photo: any) => (
                                    <img 
                                      key={photo.id}
                                      src={photo.url_thumbnail || photo.url_cloudinary}
                                      alt="Personne disparue"
                                      className={styles['validation__dossier-photo']}
                                    />
                                  ))
                                ) : (
                                  <div className={styles['validation__dossier-no-photo']}>
                                    <Image size={24} />
                                    <span>{t('moderation.noPhoto')}</span>
                                  </div>
                                )}
                              </div>

                              <div className={styles['validation__dossier-info']}>
                                <h4>
                                  {dossierInfo.personne?.prenom} {dossierInfo.personne?.nom}
                                </h4>
                                <p className={styles['validation__dossier-number']}>
                                  {t('moderation.dossierNumber')}: {dossierInfo.numero_dossier}
                                </p>
                                <div className={styles['validation__dossier-details']}>
                                  {dossierInfo.personne?.date_naissance && (
                                    <span>
                                      <Calendar size={12} />
                                      {new Date(dossierInfo.personne.date_naissance).toLocaleDateString('fr-FR')}
                                    </span>
                                  )}
                                  {dossierInfo.personne?.sexe && (
                                    <span>
                                      <User size={12} />
                                      {dossierInfo.personne.sexe === 'masculin'
                                        ? t('common.male')
                                        : dossierInfo.personne.sexe === 'feminin'
                                          ? t('common.female')
                                          : t('moderation.unspecified')}
                                    </span>
                                  )}
                                  {dossierInfo.personne?.taille_cm && (
                                    <span>{dossierInfo.personne.taille_cm} cm</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Infos disparition */}
                            <div className={styles['validation__dossier-disappearance']}>
                              <div className={styles['validation__dossier-row']}>
                                <label>{t('moderation.dateDisappearance')}</label>
                                <span>
                                  {dossierInfo.date_disparition 
                                    ? new Date(dossierInfo.date_disparition).toLocaleDateString('fr-FR')
                                    : t('moderation.unspecified')}
                                </span>
                              </div>
                              <div className={styles['validation__dossier-row']}>
                                <label>{t('moderation.placeDisappearance')}</label>
                                <span>
                                  {dossierInfo.lieu_disparition || dossierInfo.ville_disparition || t('moderation.placeUnspecified')}
                                </span>
                              </div>
                              {dossierInfo.circonstances && (
                                <div className={styles['validation__dossier-row']}>
                                  <label>{t('moderation.circumstances')}</label>
                                  <span>{dossierInfo.circonstances.substring(0, 150)}...</span>
                                </div>
                              )}
                              {dossierInfo.personne?.derniers_vetements_portes && (
                                <div className={styles['validation__dossier-row']}>
                                  <label>{t('moderation.clothing')}</label>
                                  <span>{dossierInfo.personne.derniers_vetements_portes}</span>
                                </div>
                              )}
                              {dossierInfo.personne?.signes_distinctifs && (
                                <div className={styles['validation__dossier-row']}>
                                  <label>{t('moderation.distinctiveSigns')}</label>
                                  <span>{dossierInfo.personne.signes_distinctifs}</span>
                                </div>
                              )}
                            </div>

                            {/* Statut */}
                            <div className={styles['validation__dossier-status']}>
                              <span 
                                className={styles['validation__dossier-badge']}
                                data-status={dossierInfo.statut_dossier}
                              >
                                {dossierInfo.statut_dossier === 'en_cours'
                                  ? t('moderation.statusInProgress')
                                  : dossierInfo.statut_dossier === 'retrouve_vivant'
                                    ? t('moderation.foundAlive')
                                    : dossierInfo.statut_dossier === 'retrouve_decede'
                                      ? t('moderation.foundDeceased')
                                      : dossierInfo.statut_dossier === 'suspendu'
                                        ? t('moderation.suspended')
                                        : dossierInfo.statut_dossier === 'classe_sans_suite'
                                          ? t('moderation.closedNoAction')
                                          : dossierInfo.statut_dossier}
                              </span>
                              {dossierInfo.niveau_urgence && (
                                <span 
                                  className={styles['validation__dossier-urgency']}
                                  data-urgency={dossierInfo.niveau_urgence}
                                >
                                  {t('moderation.urgency')}: {dossierInfo.niveau_urgence}
                                </span>
                              )}
                            </div>

                            {/* Cohérence */}
                            <div className={styles['validation__dossier-coherence']}>
                              <AlertTriangle size={16} />
                              <p>
                                {t('moderation.checkCoherence')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className={styles['validation__dossier-error']}>
                            {t('moderation.dossierLoadError')}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Détails du signalement */}
                  <div className={styles['validation__detail-section']}>
                    <h2>{t('moderation.reportDetails')}</h2>

                    <div className={styles['validation__detail-grid']}>
                      <div className={styles['validation__detail-row']}>
                        <label>{t('moderation.location')}</label>
                        <span>{selectedSignalement.lieu_observation}</span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label>{t('moderation.cityRegion')}</label>
                        <span>
                          {selectedSignalement.ville_observation}
                          {selectedSignalement.region_observation && `, ${selectedSignalement.region_observation}`}
                        </span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label>{t('common.date')}</label>
                        <span>
                          {new Date(selectedSignalement.date_observation).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label>{t('moderation.certaintyLevel')}</label>
                        <span>{selectedSignalement.niveau_certitude || t('moderation.unspecified')}</span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label>{t('moderation.relevanceScore')}</label>
                        <span>
                          {(() => {
                            const raw = selectedSignalement.score_pertinence ?? selectedSignalement.score_correspondance ?? 0;
                            const percent = typeof raw === 'number' && raw > 1 ? raw : raw * 100;
                            return `${Math.round(percent)}%`;
                          })()}
                        </span>
                      </div>
                      {selectedSignalement.contexte_observation && (
                        <div className={styles['validation__detail-row']}>
                          <label>{t('moderation.context')}</label>
                          <span>{selectedSignalement.contexte_observation}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles['validation__description-section']}>
                      <label>{t('common.description')}</label>
                      <p>{selectedSignalement.description}</p>
                    </div>

                    {selectedSignalement.photo_url && (
                      <div className={styles['validation__photo-section']}>
                        <label>{t('common.photo')}</label>
                        <img
                          src={selectedSignalement.photo_url}
                          alt="Signalement"
                          className={styles['validation__photo']}
                        />
                      </div>
                    )}
                  </div>

                  {/* Formulaire de validation */}
                  <div className={styles['validation__form-section']}>
                    <h3>
                      <MessageSquare size={18} />
                      {t('moderation.decision')}
                    </h3>

                    {/* Décision principale */}
                    <div className={styles['validation__form-group']}>
                      <label>{t('moderation.decision')}</label>
                      <div className={styles['validation__decision-buttons']}>
                        <button
                          className={`${styles['validation__decision-btn']} ${
                            validationData.decision === 'approuve' ? styles['validation__decision-btn--active-approve'] : ''
                          }`}
                          onClick={() => setValidationData(prev => ({ ...prev, decision: 'approuve', statut_final: 'valide' }))}
                        >
                          <CheckCircle size={18} />
                          {t('moderation.approve')}
                        </button>
                        <button
                          className={`${styles['validation__decision-btn']} ${
                            validationData.decision === 'rejete' ? styles['validation__decision-btn--active-reject'] : ''
                          }`}
                          onClick={() => setValidationData(prev => ({ ...prev, decision: 'rejete', statut_final: 'invalide' }))}
                        >
                          <XCircle size={18} />
                          {t('moderation.reject')}
                        </button>
                        <button
                          className={`${styles['validation__decision-btn']} ${
                            validationData.decision === 'besoin_clarification' ? styles['validation__decision-btn--active-pending'] : ''
                          }`}
                          onClick={() => setValidationData(prev => ({ ...prev, decision: 'besoin_clarification' }))}
                        >
                          <AlertTriangle size={18} />
                          {t('moderation.needsClarification')}
                        </button>
                      </div>
                    </div>

                    {/* Options de rejet (spam/doublon) */}
                    {validationData.decision === 'rejete' && (
                      <div className={styles['validation__form-group']}>
                        <label>{t('moderation.rejectType')}</label>
                        <div className={styles['validation__reject-options']}>
                          <label className={styles['validation__radio-label']}>
                            <input
                              type="radio"
                              name="statut_final"
                              checked={validationData.statut_final === 'invalide'}
                              onChange={() => setValidationData(prev => ({ ...prev, statut_final: 'invalide' }))}
                            />
                            <XCircle size={16} />
                            {t('moderation.notRelevant')}
                          </label>
                          <label className={styles['validation__radio-label']}>
                            <input
                              type="radio"
                              name="statut_final"
                              checked={validationData.statut_final === 'spam'}
                              onChange={() => setValidationData(prev => ({ ...prev, statut_final: 'spam' }))}
                            />
                            <Flag size={16} />
                            {t('moderation.spam')}
                          </label>
                          <label className={styles['validation__radio-label']}>
                            <input
                              type="radio"
                              name="statut_final"
                              checked={validationData.statut_final === 'doublonne'}
                              onChange={() => setValidationData(prev => ({ ...prev, statut_final: 'doublonne' }))}
                            />
                            <Copy size={16} />
                            {t('moderation.duplicates')}
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Priorité */}
                    <div className={styles['validation__form-group']}>
                      <label>{t('moderation.priorityLabel')}</label>
                      <select
                        value={validationData.priorite}
                        onChange={(e) => setValidationData(prev => ({ ...prev, priorite: e.target.value as any }))}
                        className={styles['validation__select']}
                      >
                        <option value="basse">{t('moderation.priorityLow')}</option>
                        <option value="moyenne">{t('moderation.priorityMedium')}</option>
                        <option value="haute">{t('moderation.priorityHigh')}</option>
                      </select>
                    </div>

                    {/* Score de confiance */}
                    <div className={styles['validation__form-group']}>
                      <label>{t('moderation.confidence')}: {Math.round(validationData.score_confiance * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={validationData.score_confiance}
                        onChange={(e) => setValidationData(prev => ({ ...prev, score_confiance: parseFloat(e.target.value) }))}
                        className={styles['validation__slider']}
                      />
                    </div>

                    {/* Raison */}
                    <div className={styles['validation__form-group']}>
                      <label>{t('moderation.reason')}</label>
                      <input
                        type="text"
                        value={validationData.raison}
                        onChange={(e) => setValidationData(prev => ({ ...prev, raison: e.target.value }))}
                        placeholder={t('moderation.reasonPlaceholder')}
                        className={styles['validation__input']}
                      />
                    </div>

                    {/* Notes de modération */}
                    <div className={styles['validation__form-group']}>
                      <label>{t('moderation.notes')} (confidentielles)</label>
                      <textarea
                        value={validationData.avis}
                        onChange={(e) => setValidationData(prev => ({ ...prev, avis: e.target.value }))}
                        placeholder={t('moderation.notesPlaceholder')}
                        className={styles['validation__textarea']}
                        rows={3}
                      />
                    </div>

                    {/* Transfert aux autorités */}
                    {validationData.decision === 'approuve' && (
                      <div className={styles['validation__form-group']}>
                        <label className={styles['validation__checkbox-label']}>
                          <input
                            type="checkbox"
                            checked={validationData.transferer_autorites}
                            onChange={(e) => setValidationData(prev => ({ ...prev, transferer_autorites: e.target.checked }))}
                          />
                          <Send size={16} />
                          Transférer aux autorités compétentes
                        </label>

                        {validationData.transferer_autorites && (
                          <select
                            value={validationData.autorite_destinataire}
                            onChange={(e) => setValidationData(prev => ({ ...prev, autorite_destinataire: e.target.value }))}
                            className={styles['validation__select']}
                            style={{ marginTop: '8px' }}
                          >
                            <option value="">{t('moderation.selectAuthority')}</option>
                            <option value="police_nationale">{t('moderation.authorityPolice')}</option>
                            <option value="gendarmerie">{t('moderation.authorityGendarmerie')}</option>
                            <option value="protection_civile">{t('moderation.authorityProtectionCivile')}</option>
                            <option value="croix_rouge">{t('moderation.authorityCroixRouge')}</option>
                          </select>
                        )}
                      </div>
                    )}

                    {/* Bouton de soumission */}
                    <button
                      className={styles['validation__submit-button']}
                      onClick={handleValidate}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw size={18} className={styles['validation__spinner']} />
                          {t('common.loading')}
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={18} />
                          {t('moderation.submit')}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles['validation__no-selection']}>
                  <MessageSquare size={48} />
                  <p>{t('moderation.selectReportPrompt')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );

  if (noLayout) return content;

  return (
    <ModerationLayout title={t('moderation.validationTitle')} activeNav="validation">
      {content}
    </ModerationLayout>
  );
};

export default SignalementsValidationPage;
