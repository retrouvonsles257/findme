/**
 * =====================================================
 * RETROUVONSLES - Signalements Validation Page
 * Validation et traitement des signalements
 * Connecté à Supabase avec vraies données
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { useSignalementValidation } from '../../features/signalements/hooks/useSignalementValidation';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { AuthorityLayout } from '../../components/layout';
import styles from './SignalementsPage.module.css';

type FilterType = 'all' | 'en_attente' | 'en_verification' | 'valide' | 'invalide';

export const SignalementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { signalements, isLoading, fetchSignalements } = useSignalements();
  const { 
    validateSignalement, 
    isLoading: validationLoading, 
    reset: resetValidation 
  } = useSignalementValidation();
  
  const [filter, setFilter] = useState<FilterType>('en_attente');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignalement, setSelectedSignalement] = useState<string | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approuve' | 'rejete' | null>(null);

  const filteredSignalements = signalements.filter((s) => {
    const status = s.statut_validation || s.etat || 'en_attente';
    const matchFilter = filter === 'all' || status === filter;
    const matchSearch =
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.lieu_observation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const countByStatus = {
    all: signalements.length,
    en_attente: signalements.filter(s => s.statut_validation === 'en_attente' || s.etat === 'nouveau').length,
    en_verification: signalements.filter(s => s.statut_validation === 'en_verification' || s.etat === 'en_cours').length,
    valide: signalements.filter(s => s.statut_validation === 'valide').length,
    invalide: signalements.filter(s => s.statut_validation === 'invalide' || s.etat === 'rejete').length,
  };

  const openValidationModal = useCallback((signalementId: string, decision: 'approuve' | 'rejete') => {
    setSelectedSignalement(signalementId);
    setPendingDecision(decision);
    setValidationComment('');
    setShowValidationModal(true);
    resetValidation();
  }, [resetValidation]);

  const closeValidationModal = useCallback(() => {
    setShowValidationModal(false);
    setSelectedSignalement(null);
    setPendingDecision(null);
    setValidationComment('');
  }, []);

  const handleValidate = useCallback(async () => {
    if (!selectedSignalement || !pendingDecision || !user?.id) {
      addNotification({
        title: 'Erreur',
        message: 'Données manquantes pour la validation',
        type: 'error',
      });
      return;
    }

    try {
      await validateSignalement(selectedSignalement, user.id, {
        decision: pendingDecision,
        raison: validationComment || 'Validation par les autorités',
        score_confiance: pendingDecision === 'approuve' ? 80 : 30,
      });

      addNotification({
        title: 'Succès',
        message: `Signalement ${pendingDecision === 'approuve' ? 'validé' : 'rejeté'} avec succès`,
        type: 'success',
      });

      fetchSignalements();
      closeValidationModal();
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la validation',
        type: 'error',
      });
    }
  }, [selectedSignalement, pendingDecision, user?.id, validationComment, validateSignalement, addNotification, fetchSignalements, closeValidationModal]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleQuickValidate = useCallback(async (signalementId: string, approved: boolean) => {
    if (!user?.id) {
      addNotification({
        title: 'Erreur',
        message: 'Utilisateur non authentifié',
        type: 'error',
      });
      return;
    }

    try {
      await validateSignalement(signalementId, user.id, {
        decision: approved ? 'approuve' : 'rejete',
        raison: approved ? 'Validation rapide - Approuvé' : 'Validation rapide - Rejeté',
        score_confiance: approved ? 80 : 30,
      });

      addNotification({
        title: 'Succès',
        message: `Signalement ${approved ? 'validé' : 'rejeté'} avec succès`,
        type: 'success',
      });

      fetchSignalements();
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la validation',
        type: 'error',
      });
    }
  }, [user?.id, validateSignalement, addNotification, fetchSignalements]);

  const getCertitudeColor = (certitude?: string) => {
    switch (certitude) {
      case 'certain': return '#22c55e';
      case 'tres_probable': return '#3b82f6';
      case 'probable': return '#eab308';
      case 'incertain': return '#f97316';
      default: return '#94a3b8';
    }
  };

  return (
    <AuthorityLayout>
      <div className={styles.authoritySignalements}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <FileSearch size={24} />
                Validation des Signalements
              </h1>
              <p className={styles.pageSubtitle}>
                {countByStatus.en_attente} signalement{countByStatus.en_attente > 1 ? 's' : ''} en attente de validation
              </p>
            </div>
            <button 
              className={styles.refreshButton}
              onClick={() => fetchSignalements()}
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
              <span>Actualiser</span>
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <button 
            className={`${styles.statCard} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            <FileSearch size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.all}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.pending} ${filter === 'en_attente' ? styles.active : ''}`}
            onClick={() => setFilter('en_attente')}
          >
            <Clock size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.en_attente}</span>
              <span className={styles.statLabel}>En attente</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.inProgress} ${filter === 'en_verification' ? styles.active : ''}`}
            onClick={() => setFilter('en_verification')}
          >
            <Search size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.en_verification}</span>
              <span className={styles.statLabel}>En vérification</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.success} ${filter === 'valide' ? styles.active : ''}`}
            onClick={() => setFilter('valide')}
          >
            <CheckCircle size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.valide}</span>
              <span className={styles.statLabel}>Validés</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.danger} ${filter === 'invalide' ? styles.active : ''}`}
            onClick={() => setFilter('invalide')}
          >
            <XCircle size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.invalide}</span>
              <span className={styles.statLabel}>Rejetés</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher par description ou lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Signalements Grid */}
        <div className={styles.signalementsGrid}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <RefreshCw size={24} className={styles.spinning} />
              <span>Chargement des signalements...</span>
            </div>
          ) : filteredSignalements.length > 0 ? (
            filteredSignalements.map((signalement: any) => {
              const status = signalement.statut_validation || signalement.etat || 'en_attente';
              const isPending = status === 'en_attente' || status === 'nouveau';
              
              return (
                <div 
                  key={signalement.id} 
                  className={`${styles.signalementCard} ${isPending ? styles.pending : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <span 
                      className={styles.certitudeBadge}
                      style={{ backgroundColor: getCertitudeColor(signalement.niveau_certitude) }}
                    >
                      {signalement.niveau_certitude || 'Non spécifié'}
                    </span>
                    <span className={styles.statusBadge} data-status={status}>
                      {status === 'en_attente' || status === 'nouveau' ? 'En attente' :
                       status === 'en_verification' ? 'En vérification' :
                       status === 'valide' ? 'Validé' : 'Rejeté'}
                    </span>
                  </div>

                  <p className={styles.cardDescription}>
                    {(signalement.description || 'Pas de description').substring(0, 150)}
                    {(signalement.description || '').length > 150 && '...'}
                  </p>

                  <div className={styles.cardMeta}>
                    {signalement.lieu_observation && (
                      <span className={styles.metaItem}>
                        <MapPin size={14} />
                        {signalement.lieu_observation}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <Calendar size={14} />
                      {signalement.date_observation 
                        ? new Date(signalement.date_observation).toLocaleDateString('fr-FR')
                        : 'Date inconnue'}
                    </span>
                    {signalement.temoin_anonyme === false && signalement.nom_temoin && (
                      <span className={styles.metaItem}>
                        <User size={14} />
                        {signalement.nom_temoin}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    {isPending && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.approve}`}
                          onClick={() => openValidationModal(signalement.id, 'approuve')}
                          title="Valider"
                        >
                          <ThumbsUp size={16} />
                          Valider
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.reject}`}
                          onClick={() => openValidationModal(signalement.id, 'rejete')}
                          title="Rejeter"
                        >
                          <ThumbsDown size={16} />
                          Rejeter
                        </button>
                      </>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={() => navigate(`/authority/signalements/${signalement.id}`)}
                      title="Voir détails"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <FileSearch size={48} />
              <h3>Aucun signalement</h3>
              <p>
                {searchQuery 
                  ? 'Aucun signalement ne correspond à votre recherche'
                  : filter !== 'all'
                    ? `Aucun signalement ${filter === 'en_attente' ? 'en attente' : filter}`
                    : 'Aucun signalement trouvé'}
              </p>
            </div>
          )}
        </div>

        {/* Validation Modal */}
        {showValidationModal && (
          <div className={styles.modalOverlay} onClick={closeValidationModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeValidationModal}>
                <X size={20} />
              </button>

              <div className={styles.modalHeader}>
                {pendingDecision === 'approuve' ? (
                  <CheckCircle size={24} className={styles.modalIconApprove} />
                ) : (
                  <XCircle size={24} className={styles.modalIconReject} />
                )}
                <h2>
                  {pendingDecision === 'approuve' ? 'Valider le signalement' : 'Rejeter le signalement'}
                </h2>
              </div>

              <div className={styles.modalInfo}>
                <AlertTriangle size={16} />
                {pendingDecision === 'approuve' 
                  ? 'Ce signalement sera marqué comme validé et pourra être utilisé dans l\'enquête.'
                  : 'Ce signalement sera marqué comme rejeté et ne sera pas pris en compte.'}
              </div>

              <div className={styles.modalField}>
                <label>Commentaire (optionnel)</label>
                <textarea
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  placeholder="Ajoutez un commentaire pour justifier votre décision..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelButton} onClick={closeValidationModal}>
                  Annuler
                </button>
                <button
                  className={`${styles.confirmButton} ${pendingDecision === 'approuve' ? styles.approve : styles.reject}`}
                  onClick={handleValidate}
                  disabled={validationLoading}
                >
                  {validationLoading ? (
                    <>
                      <RefreshCw size={16} className={styles.spinning} />
                      Traitement...
                    </>
                  ) : (
                    <>
                      {pendingDecision === 'approuve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default SignalementsPage;
