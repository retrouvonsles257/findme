/**
 * =====================================================
 * RETROUVONSLES - Identity Verification Page
 * Vérification des identités des citoyens pour passage
 * du niveau 0 (citoyen_standard) au niveau 1 (citoyen_verifie)
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useI18n } from '../../hooks';
import { ModerationLayout } from './ModerationLayout';
import {
  getDemandesVerificationIdentite,
  getDemandesVerificationIdentiteStats,
  traiterDemandeVerificationIdentite,
  type StatutDemandeVerification,
} from '../../features/admin-organisation/services';
import {
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  User,
  CreditCard,
  Download,
  MessageSquare,
} from 'lucide-react';
import { AdminListSkeleton } from '../admin/skeletons';
import styles from './IdentityVerificationPage.module.css';

// Types
interface VerificationRequest {
  id: string;
  id_utilisateur: string;
  type_document: 'cni' | 'passeport' | 'autre';
  numero_document?: string;
  url_document: string;
  url_selfie?: string;
  date_soumission: string;
  statut: 'en_attente' | 'en_cours' | 'approuve' | 'rejete' | 'complement_demande';
  raison_rejet?: string;
  verifie_par?: string;
  date_verification?: string;
  notes?: string;
  utilisateur?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    date_naissance?: string;
    ville?: string;
    region?: string;
    pays?: string;
    created_at: string;
    score_fiabilite: number;
    nombre_signalements_valides: number;
  };
}

interface VerificationFilters {
  status: 'all' | 'en_attente' | 'en_cours' | 'approuve' | 'rejete' | 'complement_demande';
  documentType: 'all' | 'cni' | 'passeport' | 'autre';
  dateRange: 'all' | '7days' | '30days';
  search: string;
}

export interface IdentityVerificationPageProps {
  noLayout?: boolean;
  /** Quand fourni (contexte admin org), charge les demandes de cette org + globales. Sinon demandes globales uniquement. */
  organisationId?: string | null;
}

export const IdentityVerificationPage: React.FC<IdentityVerificationPageProps> = ({ noLayout = false, organisationId = null }) => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);

  // State
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<VerificationFilters>({
    status: 'en_attente',
    documentType: 'all',
    dateRange: 'all',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    approuves: 0,
    rejetes: 0,
    complement_demande: 0,
  });
  const pageSize = 12;

  const [decisionData, setDecisionData] = useState({
    decision: 'approuve' as 'approuve' | 'rejete' | 'complement_demande',
    raison_rejet: '',
    notes: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const mapApiStatutToUi = (s: string): VerificationRequest['statut'] => {
    if (s === 'refuse') return 'rejete';
    if (s === 'complement_demande') return 'complement_demande';
    return s as VerificationRequest['statut'];
  };

  const mapUiStatutToApi = (s: string): StatutDemandeVerification | undefined => {
    if (s === 'all') return undefined;
    if (s === 'rejete') return 'refuse';
    if (s === 'complement_demande') return 'complement_demande';
    return s as StatutDemandeVerification;
  };

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiStatut = mapUiStatutToApi(filters.status);
      const { data, count } = await getDemandesVerificationIdentite(organisationId ?? null, {
        statut: apiStatut ?? 'all',
        typeDocument: filters.documentType,
        dateRange: filters.dateRange,
        page: currentPage,
        pageSize,
      });

      const transformed: VerificationRequest[] = data.map((d) => ({
        id: d.id,
        id_utilisateur: d.id_utilisateur,
        type_document: (d.type_document as 'cni' | 'passeport' | 'autre') || 'cni',
        url_document: d.url_document || '',
        url_selfie: d.url_selfie || undefined,
        date_soumission: d.created_at,
        statut: mapApiStatutToUi(d.statut),
        raison_rejet: d.statut === 'refuse' ? d.commentaire_moderateur || undefined : undefined,
        date_verification: d.traite_le || undefined,
        notes: d.commentaire_moderateur || undefined,
        utilisateur: d.utilisateur
          ? {
              id: d.id_utilisateur,
              nom: d.utilisateur.nom,
              prenom: d.utilisateur.prenom,
              email: d.utilisateur.email,
              telephone: d.utilisateur.telephone ?? undefined,
              date_naissance: d.utilisateur.date_naissance ?? undefined,
              ville: d.utilisateur.ville ?? undefined,
              region: d.utilisateur.region ?? undefined,
              pays: d.utilisateur.pays ?? undefined,
              created_at: d.utilisateur.created_at,
              score_fiabilite: d.utilisateur.score_fiabilite ?? 100,
              nombre_signalements_valides: d.utilisateur.nombre_signalements_valides ?? 0,
            }
          : undefined,
      }));

      setRequests(transformed);
      setTotalRequests(count);

      const statsData = await getDemandesVerificationIdentiteStats(organisationId ?? null);
      setStats({
        total: statsData.total,
        enAttente: statsData.enAttente,
        approuves: statsData.approuves,
        rejetes: statsData.refuse,
        complement_demande: statsData.complement_demande,
      });
    } catch (err) {
      console.error('Error loading verification requests:', err);
      setErrorMessage(t('moderator.errorLoadingRequests'));
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, organisationId]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await getDemandesVerificationIdentiteStats(organisationId ?? null);
      setStats({
        total: statsData.total,
        enAttente: statsData.enAttente,
        approuves: statsData.approuves,
        rejetes: statsData.refuse,
        complement_demande: statsData.complement_demande,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [organisationId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleVerification = async () => {
    if (!selectedRequest || !currentUser?.id) return;
    setIsProcessing(true);
    setErrorMessage('');

    const action: StatutDemandeVerification =
      decisionData.decision === 'approuve'
        ? 'approuve'
        : decisionData.decision === 'rejete'
          ? 'refuse'
          : 'complement_demande';

    const commentaire =
      decisionData.decision === 'rejete'
        ? decisionData.raison_rejet || decisionData.notes
        : decisionData.notes || null;

    try {
      await traiterDemandeVerificationIdentite(
        selectedRequest.id,
        action,
        commentaire,
        currentUser.id
      );

      setSuccessMessage(
        action === 'approuve'
          ? t('moderator.identityVerifiedSuccess')
          : action === 'refuse'
            ? t('moderator.requestRejected')
            : t('moderator.complementRequested')
      );

      setSelectedRequest(null);
      setDecisionData({
        decision: 'approuve',
        raison_rejet: '',
        notes: '',
      });
      loadRequests();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Error processing verification:', err);
      setErrorMessage(err.message || t('moderator.errorProcessing'));
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string }> = {
      en_attente: { label: t('moderator.identityStatusPending'), color: '#f59e0b' },
      en_cours: { label: t('moderator.identityStatusInProgress'), color: '#3b82f6' },
      approuve: { label: t('moderator.identityStatusApproved'), color: '#10b981' },
      rejete: { label: t('moderator.identityStatusRejected'), color: '#ef4444' },
      complement_demande: { label: t('moderator.identityStatusComplement'), color: '#8b5cf6' },
    };
    return info[status] || { label: status, color: '#6b7280' };
  };

  const totalPages = Math.ceil(totalRequests / pageSize);

  const content = (
    <div className={styles['identity-verification']}>
        {/* Header */}
        <section className={styles['identity-verification__header']}>
          <div className={styles['identity-verification__header-content']}>
            <h1 className={styles['identity-verification__title']}>
              <UserCheck size={28} />
              {t('moderator.identityTitle')}
            </h1>
            <p className={styles['identity-verification__subtitle']}>
              {t('moderator.identitySubtitle')}
            </p>
          </div>

          {/* Toolbar */}
          <div className={styles['identity-verification__toolbar']}>
            <div className={styles['identity-verification__search-wrapper']}>
              <Search size={20} className={styles['identity-verification__search-icon']} />
              <input
                type="text"
                placeholder={t('moderator.searchPlaceholderIdentity')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={styles['identity-verification__search-input']}
              />
            </div>
            <button
              className={styles['identity-verification__toolbar-btn']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              {t('moderator.filters')}
            </button>
            <button
              className={styles['identity-verification__toolbar-btn']}
              onClick={loadRequests}
            >
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className={styles['identity-verification__filters']}>
              <div className={styles['identity-verification__filter-group']}>
                <label>{t('moderator.status')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">{t('moderator.iaTypeAll')}</option>
                  <option value="en_attente">{t('moderator.identityStatusPending')}</option>
                  <option value="en_cours">{t('moderator.identityStatusInProgress')}</option>
                  <option value="approuve">{t('moderator.identityStatusApproved')}</option>
                  <option value="rejete">{t('moderator.identityStatusRejected')}</option>
                  <option value="complement_demande">{t('moderator.identityStatusComplement')}</option>
                </select>
              </div>

              <div className={styles['identity-verification__filter-group']}>
                <label>{t('moderator.identityDocumentTypeLabel')}</label>
                <select
                  value={filters.documentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value as any }))}
                >
                  <option value="all">{t('moderator.iaTypeAll')}</option>
                  <option value="cni">{t('moderator.typeCni')}</option>
                  <option value="passeport">{t('moderator.passport')}</option>
                  <option value="autre">{t('common.other')}</option>
                </select>
              </div>

              <div className={styles['identity-verification__filter-group']}>
                <label>{t('moderator.period')}</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                >
                  <option value="all">{t('moderator.identityPeriodAll')}</option>
                  <option value="7days">{t('moderator.iaPeriod7')}</option>
                  <option value="30days">{t('moderator.iaPeriod30')}</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Messages */}
        {successMessage && (
          <div className={styles['identity-verification__success']}>
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className={styles['identity-verification__errorBanner']} role="alert">
            <AlertTriangle size={20} />
            {errorMessage}
          </div>
        )}

        {/* Stats */}
        <div className={styles['identity-verification__stats']}>
          <div className={styles['identity-verification__stat']}>
            <User size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.total}</span>
              <span className={styles['identity-verification__stat-label']}>{t('moderator.identityTotalLabel')}</span>
            </div>
          </div>
          <div className={styles['identity-verification__stat']}>
            <Clock size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.enAttente}</span>
              <span className={styles['identity-verification__stat-label']}>{t('moderator.identityStatusPending')}</span>
            </div>
          </div>
          <div className={styles['identity-verification__stat']}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.approuves}</span>
              <span className={styles['identity-verification__stat-label']}>{t('moderator.identityVerifiedLabel')}</span>
            </div>
          </div>
          <div className={styles['identity-verification__stat']}>
            <XCircle size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.rejetes}</span>
              <span className={styles['identity-verification__stat-label']}>{t('moderator.identityRejectedLabel')}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles['identity-verification__skeletonWrap']}>
            <AdminListSkeleton cardCount={6} showFilters={false} />
          </div>
        ) : (
          <>
            {/* Grille des demandes */}
            <div className={styles['identity-verification__grid']}>
              {requests.length > 0 ? (
                requests.map((request) => {
                  const statusInfo = getStatusInfo(request.statut);
                  const user = request.utilisateur;

                  return (
                    <div
                      key={request.id}
                      className={styles['identity-verification__card']}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className={styles['identity-verification__card-header']}>
                        <div className={styles['identity-verification__avatar']}>
                          {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                        </div>
                        <span
                          className={styles['identity-verification__status']}
                          style={{ backgroundColor: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className={styles['identity-verification__card-body']}>
                        <h4 className={styles['identity-verification__name']}>
                          {user?.prenom} {user?.nom}
                        </h4>
                        <p className={styles['identity-verification__email']}>
                          <Mail size={14} />
                          {user?.email}
                        </p>
                        {user?.telephone && (
                          <p className={styles['identity-verification__phone']}>
                            <Phone size={14} />
                            {user.telephone}
                          </p>
                        )}
                        {user?.ville && (
                          <p className={styles['identity-verification__location']}>
                            <MapPin size={14} />
                            {user.ville}, {user.region}
                          </p>
                        )}
                        <p className={styles['identity-verification__date']}>
                          <Calendar size={14} />
                          {t('moderator.registeredOn')} {new Date(user?.created_at || '').toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div className={styles['identity-verification__card-footer']}>
                        <div className={styles['identity-verification__doc-type']}>
                          <CreditCard size={16} />
                          <span>
                            {request.type_document === 'cni' ? t('moderator.typeCni') : 
                             request.type_document === 'passeport' ? t('moderator.passport') : t('common.other')}
                          </span>
                        </div>
                        <button className={styles['identity-verification__view-btn']}>
                          <Eye size={16} />
                          {t('moderator.examine')}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles['identity-verification__empty']}>
                  <UserCheck size={48} />
                  <p>{t('moderator.noVerificationRequests')}</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles['identity-verification__pagination']}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={20} />
                  {t('common.previous')}
                </button>
                <span>{t('moderator.pageOf').replace('{{current}}', String(currentPage)).replace('{{total}}', String(totalPages))}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  {t('common.next')}
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal de vérification */}
        {selectedRequest && (
          <div
            className={styles['identity-verification__modal']}
            onClick={() => setSelectedRequest(null)}
          >
            <div
              className={styles['identity-verification__modal-content']}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles['identity-verification__close-btn']}
                onClick={() => setSelectedRequest(null)}
              >
                <X size={24} />
              </button>

              <div className={styles['identity-verification__modal-header']}>
                <div className={styles['identity-verification__modal-avatar']}>
                  {selectedRequest.utilisateur?.prenom?.charAt(0)}
                  {selectedRequest.utilisateur?.nom?.charAt(0)}
                </div>
                <div>
                  <h3>
                    {selectedRequest.utilisateur?.prenom} {selectedRequest.utilisateur?.nom}
                  </h3>
                  <span
                    className={styles['identity-verification__modal-status']}
                    style={{ backgroundColor: getStatusInfo(selectedRequest.statut).color }}
                  >
                    {getStatusInfo(selectedRequest.statut).label}
                  </span>
                </div>
              </div>

              <div className={styles['identity-verification__modal-body']}>
                {/* Informations utilisateur */}
                <div className={styles['identity-verification__info-section']}>
                  <h4>{t('moderator.accountInfo')}</h4>
                  <div className={styles['identity-verification__info-grid']}>
                    <div className={styles['identity-verification__info-row']}>
                      <label>{t('common.email')}</label>
                      <span>{selectedRequest.utilisateur?.email}</span>
                    </div>
                    {selectedRequest.utilisateur?.telephone && (
                      <div className={styles['identity-verification__info-row']}>
                        <label>{t('common.phone')}</label>
                        <span>{selectedRequest.utilisateur.telephone}</span>
                      </div>
                    )}
                    {selectedRequest.utilisateur?.date_naissance && (
                      <div className={styles['identity-verification__info-row']}>
                        <label>{t('moderator.dateOfBirth')}</label>
                        <span>{new Date(selectedRequest.utilisateur.date_naissance).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {selectedRequest.utilisateur?.ville && (
                      <div className={styles['identity-verification__info-row']}>
                        <label>{t('common.location')}</label>
                        <span>
                          {selectedRequest.utilisateur.ville}, {selectedRequest.utilisateur.region}, {selectedRequest.utilisateur.pays}
                        </span>
                      </div>
                    )}
                    <div className={styles['identity-verification__info-row']}>
                      <label>{t('moderator.registrationDate')}</label>
                      <span>{new Date(selectedRequest.utilisateur?.created_at || '').toLocaleString('fr-FR')}</span>
                    </div>
                    <div className={styles['identity-verification__info-row']}>
                      <label>{t('moderator.reliabilityScore')}</label>
                      <span>{selectedRequest.utilisateur?.score_fiabilite || 100}%</span>
                    </div>
                    <div className={styles['identity-verification__info-row']}>
                      <label>{t('moderator.validatedReportsCount')}</label>
                      <span>{selectedRequest.utilisateur?.nombre_signalements_valides || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Document */}
                <div className={styles['identity-verification__doc-section']}>
                  <h4>
                    <FileText size={18} />
                    {t('moderator.identityDocumentTitle')}
                  </h4>
                  <div className={styles['identity-verification__doc-type-badge']}>
                    <CreditCard size={16} />
                    {selectedRequest.type_document === 'cni' ? t('moderator.nationalIdCard') : 
                     selectedRequest.type_document === 'passeport' ? t('moderator.passport') : t('moderator.otherDocument')}
                  </div>
                  
                  {selectedRequest.url_document ? (
                    <div className={styles['identity-verification__doc-preview']}>
                      <img 
                        src={selectedRequest.url_document} 
                        alt={t('moderator.identityDocumentTitle')}
                        className={styles['identity-verification__doc-image']}
                      />
                      <a 
                        href={selectedRequest.url_document} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles['identity-verification__doc-download']}
                      >
                        <Download size={16} />
                        {t('moderator.viewFullScreen')}
                      </a>
                    </div>
                  ) : (
                    <div className={styles['identity-verification__no-doc']}>
                      <AlertTriangle size={24} />
                      <p>{t('moderator.noDocumentSubmitted')}</p>
                    </div>
                  )}
                </div>

                {/* Formulaire de décision (si en attente) */}
                {selectedRequest.statut === 'en_attente' && (
                  <div className={styles['identity-verification__decision-section']}>
                    <h4>
                      <Shield size={18} />
                      {t('moderator.verificationDecision')}
                    </h4>

                    <div className={styles['identity-verification__decision-buttons']}>
                      <button
                        className={`${styles['identity-verification__decision-btn']} ${
                          decisionData.decision === 'approuve'
                            ? styles['identity-verification__decision-btn--active-approve']
                            : ''
                        }`}
                        onClick={() => setDecisionData(prev => ({ ...prev, decision: 'approuve' }))}
                      >
                        <CheckCircle size={20} />
                        {t('moderator.approve')}
                      </button>
                      <button
                        className={`${styles['identity-verification__decision-btn']} ${
                          decisionData.decision === 'rejete'
                            ? styles['identity-verification__decision-btn--active-reject']
                            : ''
                        }`}
                        onClick={() => setDecisionData(prev => ({ ...prev, decision: 'rejete' }))}
                      >
                        <XCircle size={20} />
                        {t('moderator.reject')}
                      </button>
                      <button
                        className={`${styles['identity-verification__decision-btn']} ${
                          decisionData.decision === 'complement_demande' ? styles['identity-verification__decision-btn--active-complement'] : ''
                        }`}
                        onClick={() => setDecisionData(prev => ({ ...prev, decision: 'complement_demande' }))}
                      >
                        <MessageSquare size={20} />
                        {t('moderator.requestComplement')}
                      </button>
                    </div>

                    {decisionData.decision === 'rejete' && (
                      <div className={styles['identity-verification__form-group']}>
                        <label>{t('moderator.rejectReasonLabel')}</label>
                        <select
                          value={decisionData.raison_rejet}
                          onChange={(e) => setDecisionData(prev => ({ ...prev, raison_rejet: e.target.value }))}
                        >
                          <option value="">{t('moderator.selectReason')}</option>
                          <option value="document_illisible">{t('moderator.reasonIllegible')}</option>
                          <option value="document_expire">{t('moderator.reasonExpired')}</option>
                          <option value="document_falsifie">{t('moderator.reasonFake')}</option>
                          <option value="informations_incoherentes">{t('moderator.reasonInconsistent')}</option>
                          <option value="photo_non_conforme">{t('moderator.reasonPhotoNonCompliant')}</option>
                          <option value="autre">{t('common.other')}</option>
                        </select>
                      </div>
                    )}

                    <div className={styles['identity-verification__form-group']}>
                      <label>{t('moderator.notesOptional')}</label>
                      <textarea
                        value={decisionData.notes}
                        onChange={(e) => setDecisionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={t('moderator.notesPlaceholderInternal')}
                        rows={3}
                      />
                    </div>

                    <button
                      className={styles['identity-verification__submit-btn']}
                      onClick={handleVerification}
                      disabled={
                        isProcessing ||
                        (decisionData.decision === 'rejete' && !decisionData.raison_rejet)
                      }
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={18} className={styles['identity-verification__spinner']} />
                          {t('moderator.processing')}
                        </>
                      ) : (
                        <>
                          <Shield size={18} />
                          {t('moderator.confirmDecision')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Si déjà traité */}
                {selectedRequest.statut !== 'en_attente' && (
                  <div className={styles['identity-verification__already-processed']}>
                    <p>
                      Cette demande a été{' '}
                      {selectedRequest.statut === 'approuve'
                        ? t('moderator.alreadyProcessedApproved')
                        : selectedRequest.statut === 'rejete'
                          ? t('moderator.alreadyProcessedRejected')
                          : t('moderator.alreadyProcessedComplement')}
                      {selectedRequest.date_verification && (
                        <> le {new Date(selectedRequest.date_verification).toLocaleString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (noLayout) return content;
  return (
    <ModerationLayout title={t('moderator.identityPageTitle')} activeNav="identity">
      {content}
    </ModerationLayout>
  );
};

export default IdentityVerificationPage;
