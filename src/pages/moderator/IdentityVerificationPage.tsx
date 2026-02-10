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
      setErrorMessage('Erreur lors du chargement des demandes');
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
          ? 'Identité vérifiée avec succès !'
          : action === 'refuse'
            ? 'Demande rejetée'
            : 'Complément demandé'
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
      setErrorMessage(err.message || 'Erreur lors du traitement');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string }> = {
      en_attente: { label: 'En attente', color: '#f59e0b' },
      en_cours: { label: 'En cours', color: '#3b82f6' },
      approuve: { label: 'Approuvé', color: '#10b981' },
      rejete: { label: 'Rejeté', color: '#ef4444' },
      complement_demande: { label: 'Complément demandé', color: '#8b5cf6' },
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
              Vérification d'identité des citoyens
            </h1>
            <p className={styles['identity-verification__subtitle']}>
              Examinez les documents d'identité soumis par les citoyens pour valider leur passage 
              au niveau "Citoyen Vérifié" (badge de confiance).
            </p>
          </div>

          {/* Toolbar */}
          <div className={styles['identity-verification__toolbar']}>
            <div className={styles['identity-verification__search-wrapper']}>
              <Search size={20} className={styles['identity-verification__search-icon']} />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
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
              Filtres
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
                <label>Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">Tous</option>
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="approuve">Approuvés</option>
                  <option value="rejete">Rejetés</option>
                  <option value="complement_demande">Complément demandé</option>
                </select>
              </div>

              <div className={styles['identity-verification__filter-group']}>
                <label>Type de document</label>
                <select
                  value={filters.documentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value as any }))}
                >
                  <option value="all">Tous</option>
                  <option value="cni">CNI</option>
                  <option value="passeport">Passeport</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className={styles['identity-verification__filter-group']}>
                <label>Période</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                >
                  <option value="all">Toutes</option>
                  <option value="7days">7 derniers jours</option>
                  <option value="30days">30 derniers jours</option>
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
          <div className={styles['identity-verification__error']}>
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
              <span className={styles['identity-verification__stat-label']}>Total</span>
            </div>
          </div>
          <div className={styles['identity-verification__stat']}>
            <Clock size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.enAttente}</span>
              <span className={styles['identity-verification__stat-label']}>En attente</span>
            </div>
          </div>
          <div className={styles['identity-verification__stat']}>
            <CheckCircle size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.approuves}</span>
              <span className={styles['identity-verification__stat-label']}>Vérifiés</span>
            </div>
          </div>
          <div className={styles['identity-verification__stat']}>
            <XCircle size={24} />
            <div>
              <span className={styles['identity-verification__stat-value']}>{stats.rejetes}</span>
              <span className={styles['identity-verification__stat-label']}>Rejetés</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles['identity-verification__loading']}>
            <RefreshCw size={32} className={styles['identity-verification__spinner']} />
            Chargement des demandes...
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
                          Inscrit le {new Date(user?.created_at || '').toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div className={styles['identity-verification__card-footer']}>
                        <div className={styles['identity-verification__doc-type']}>
                          <CreditCard size={16} />
                          <span>
                            {request.type_document === 'cni' ? 'CNI' : 
                             request.type_document === 'passeport' ? 'Passeport' : 'Autre'}
                          </span>
                        </div>
                        <button className={styles['identity-verification__view-btn']}>
                          <Eye size={16} />
                          Examiner
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles['identity-verification__empty']}>
                  <UserCheck size={48} />
                  <p>Aucune demande de vérification trouvée</p>
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
                  Précédent
                </button>
                <span>Page {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Suivant
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
                  <h4>Informations du compte</h4>
                  <div className={styles['identity-verification__info-grid']}>
                    <div className={styles['identity-verification__info-row']}>
                      <label>Email</label>
                      <span>{selectedRequest.utilisateur?.email}</span>
                    </div>
                    {selectedRequest.utilisateur?.telephone && (
                      <div className={styles['identity-verification__info-row']}>
                        <label>Téléphone</label>
                        <span>{selectedRequest.utilisateur.telephone}</span>
                      </div>
                    )}
                    {selectedRequest.utilisateur?.date_naissance && (
                      <div className={styles['identity-verification__info-row']}>
                        <label>Date de naissance</label>
                        <span>{new Date(selectedRequest.utilisateur.date_naissance).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {selectedRequest.utilisateur?.ville && (
                      <div className={styles['identity-verification__info-row']}>
                        <label>Localisation</label>
                        <span>
                          {selectedRequest.utilisateur.ville}, {selectedRequest.utilisateur.region}, {selectedRequest.utilisateur.pays}
                        </span>
                      </div>
                    )}
                    <div className={styles['identity-verification__info-row']}>
                      <label>Date d'inscription</label>
                      <span>{new Date(selectedRequest.utilisateur?.created_at || '').toLocaleString('fr-FR')}</span>
                    </div>
                    <div className={styles['identity-verification__info-row']}>
                      <label>Score de fiabilité</label>
                      <span>{selectedRequest.utilisateur?.score_fiabilite || 100}%</span>
                    </div>
                    <div className={styles['identity-verification__info-row']}>
                      <label>Signalements validés</label>
                      <span>{selectedRequest.utilisateur?.nombre_signalements_valides || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Document */}
                <div className={styles['identity-verification__doc-section']}>
                  <h4>
                    <FileText size={18} />
                    Document d'identité
                  </h4>
                  <div className={styles['identity-verification__doc-type-badge']}>
                    <CreditCard size={16} />
                    {selectedRequest.type_document === 'cni' ? 'Carte Nationale d\'Identité' : 
                     selectedRequest.type_document === 'passeport' ? 'Passeport' : 'Autre document'}
                  </div>
                  
                  {selectedRequest.url_document ? (
                    <div className={styles['identity-verification__doc-preview']}>
                      <img 
                        src={selectedRequest.url_document} 
                        alt="Document d'identité"
                        className={styles['identity-verification__doc-image']}
                      />
                      <a 
                        href={selectedRequest.url_document} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles['identity-verification__doc-download']}
                      >
                        <Download size={16} />
                        Voir en plein écran
                      </a>
                    </div>
                  ) : (
                    <div className={styles['identity-verification__no-doc']}>
                      <AlertTriangle size={24} />
                      <p>Aucun document soumis</p>
                    </div>
                  )}
                </div>

                {/* Formulaire de décision (si en attente) */}
                {selectedRequest.statut === 'en_attente' && (
                  <div className={styles['identity-verification__decision-section']}>
                    <h4>
                      <Shield size={18} />
                      Décision de vérification
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
                        Approuver
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
                        Rejeter
                      </button>
                      <button
                        className={`${styles['identity-verification__decision-btn']} ${
                          decisionData.decision === 'complement_demande' ? styles['identity-verification__decision-btn--active-complement'] : ''
                        }`}
                        onClick={() => setDecisionData(prev => ({ ...prev, decision: 'complement_demande' }))}
                      >
                        <MessageSquare size={20} />
                        Demander complément
                      </button>
                    </div>

                    {decisionData.decision === 'rejete' && (
                      <div className={styles['identity-verification__form-group']}>
                        <label>Raison du rejet *</label>
                        <select
                          value={decisionData.raison_rejet}
                          onChange={(e) => setDecisionData(prev => ({ ...prev, raison_rejet: e.target.value }))}
                        >
                          <option value="">Sélectionner une raison</option>
                          <option value="document_illisible">Document illisible</option>
                          <option value="document_expire">Document expiré</option>
                          <option value="document_falsifie">Suspicion de falsification</option>
                          <option value="informations_incoherentes">Informations incohérentes</option>
                          <option value="photo_non_conforme">Photo non conforme</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                    )}

                    <div className={styles['identity-verification__form-group']}>
                      <label>Notes (optionnel)</label>
                      <textarea
                        value={decisionData.notes}
                        onChange={(e) => setDecisionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notes internes..."
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
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Shield size={18} />
                          Confirmer la décision
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
                        ? 'approuvée'
                        : selectedRequest.statut === 'rejete'
                          ? 'rejetée'
                          : 'traitée (complément demandé)'}
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
    <ModerationLayout title="Vérification d'identité" activeNav="identity">
      {content}
    </ModerationLayout>
  );
};

export default IdentityVerificationPage;
