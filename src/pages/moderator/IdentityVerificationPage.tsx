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
import { supabase } from '../../config';
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
} from 'lucide-react';
import styles from './IdentityVerificationPage.module.css';

// Helper to bypass Supabase typing issues
const db = () => supabase as any;

// Types
interface VerificationRequest {
  id: string;
  id_utilisateur: string;
  type_document: 'cni' | 'passeport' | 'autre';
  numero_document?: string;
  url_document: string;
  url_selfie?: string;
  date_soumission: string;
  statut: 'en_attente' | 'en_cours' | 'approuve' | 'rejete';
  raison_rejet?: string;
  verifie_par?: string;
  date_verification?: string;
  notes?: string;
  // Relations
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
  status: 'all' | 'en_attente' | 'en_cours' | 'approuve' | 'rejete';
  documentType: 'all' | 'cni' | 'passeport' | 'autre';
  dateRange: 'all' | '7days' | '30days';
  search: string;
}

export const IdentityVerificationPage: React.FC = () => {
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
  });
  const pageSize = 12;

  // Formulaire de décision
  const [decisionData, setDecisionData] = useState({
    decision: 'approuve' as 'approuve' | 'rejete',
    raison_rejet: '',
    notes: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Charger les demandes de vérification
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: Dans une vraie implémentation, cette table serait 'document_accreditation' ou similaire
      // Pour cet exemple, on simule avec une requête sur utilisateur en attente de vérification
      let query = supabase
        .from('utilisateur')
        .select('*', { count: 'exact' })
        .eq('type_compte', 'grand_public')
        .order('created_at', { ascending: false });

      // Filtrer par statut
      if (filters.status === 'en_attente') {
        query = query.eq('statut_compte', 'en_attente_verification');
      } else if (filters.status === 'approuve') {
        query = query.eq('statut_compte', 'actif');
      }

      // Filtrer par date
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const days = filters.dateRange === '7days' ? 7 : 30;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        query = query.gte('created_at', cutoff.toISOString());
      }

      // Recherche
      if (filters.search) {
        query = query.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Pagination
      const start = (currentPage - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      // Transformer en format VerificationRequest
      const transformedData: VerificationRequest[] = (data || []).map((user: any) => ({
        id: user.id,
        id_utilisateur: user.id,
        type_document: 'cni' as const,
        url_document: user.document_accreditation || '',
        date_soumission: user.created_at,
        statut: user.statut_compte === 'actif' ? 'approuve' : 
                user.statut_compte === 'en_attente_verification' ? 'en_attente' : 'rejete',
        utilisateur: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          date_naissance: user.date_naissance,
          ville: user.ville,
          region: user.region,
          pays: user.pays,
          created_at: user.created_at,
          score_fiabilite: user.score_fiabilite || 100,
          nombre_signalements_valides: user.nombre_signalements_valides || 0,
        },
      }));

      setRequests(transformedData);
      setTotalRequests(count || 0);

      // Charger les stats
      await loadStats();
    } catch (err) {
      console.error('Error loading verification requests:', err);
      setErrorMessage('Erreur lors du chargement des demandes');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const { data, error } = await db()
        .from('utilisateur')
        .select('statut_compte')
        .eq('type_compte', 'grand_public');

      if (!error && data) {
        setStats({
          total: data.length,
          enAttente: data.filter((u: any) => u.statut_compte === 'en_attente_verification').length,
          approuves: data.filter((u: any) => u.statut_compte === 'actif').length,
          rejetes: data.filter((u: any) => u.statut_compte === 'bloque' || u.statut_compte === 'suspendu').length,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Traiter la vérification
  const handleVerification = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const newStatus = decisionData.decision === 'approuve' ? 'actif' : 'bloque';

      // Mettre à jour le statut de l'utilisateur
      const { error: updateError } = await db()
        .from('utilisateur')
        .update({
          statut_compte: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id_utilisateur);

      if (updateError) throw updateError;

      // Si approuvé, ajouter le rôle citoyen_verifie
      if (decisionData.decision === 'approuve') {
        // Récupérer l'ID du rôle citoyen_verifie
        const { data: roleData, error: roleError } = await db()
          .from('role')
          .select('id')
          .eq('nom_role', 'citoyen_verifie')
          .single();

        if (!roleError && roleData) {
          await db().from('utilisateur_role').insert({
            id_utilisateur: selectedRequest.id_utilisateur,
            id_role: roleData.id,
            date_attribution: new Date().toISOString(),
            attribue_par: currentUser?.id,
            commentaire: decisionData.notes || 'Identité vérifiée par modérateur',
          });
        }
      }

      // Enregistrer dans le journal d'activité
      await db().from('journal_activite').insert({
        type_action: 'attribution_role',
        action_detaillee: decisionData.decision === 'approuve' 
          ? 'Identité vérifiée - Passage au niveau citoyen_verifie'
          : 'Vérification d\'identité rejetée',
        description: decisionData.decision === 'approuve'
          ? `Utilisateur ${selectedRequest.utilisateur?.prenom} ${selectedRequest.utilisateur?.nom} vérifié`
          : `Vérification rejetée: ${decisionData.raison_rejet}`,
        id_utilisateur: currentUser?.id,
      });

      // Envoyer une notification à l'utilisateur
      await db().from('notification').insert({
        type_notification: 'mise_a_jour_dossier',
        titre: decisionData.decision === 'approuve' 
          ? 'Identité vérifiée !' 
          : 'Vérification d\'identité non validée',
        message: decisionData.decision === 'approuve'
          ? 'Félicitations ! Votre identité a été vérifiée. Vous êtes maintenant un citoyen vérifié avec un badge spécial.'
          : `Votre demande de vérification n'a pas été validée. Raison: ${decisionData.raison_rejet}`,
        canal: 'in_app',
        priorite: 'haute',
        statut_envoi: 'en_attente',
        id_utilisateur: selectedRequest.id_utilisateur,
      });

      setSuccessMessage(
        decisionData.decision === 'approuve'
          ? 'Identité vérifiée avec succès !'
          : 'Demande rejetée'
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

  // Couleur du statut
  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string }> = {
      en_attente: { label: 'En attente', color: '#f59e0b' },
      en_cours: { label: 'En cours', color: '#3b82f6' },
      approuve: { label: 'Approuvé', color: '#10b981' },
      rejete: { label: 'Rejeté', color: '#ef4444' },
    };
    return info[status] || { label: status, color: '#6b7280' };
  };

  const totalPages = Math.ceil(totalRequests / pageSize);

  return (
    <ModerationLayout title="Vérification d'identité" activeNav="identity">
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
                      disabled={isProcessing || (decisionData.decision === 'rejete' && !decisionData.raison_rejet)}
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
                      Cette demande a été {selectedRequest.statut === 'approuve' ? 'approuvée' : 'rejetée'}
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
    </ModerationLayout>
  );
};

export default IdentityVerificationPage;
