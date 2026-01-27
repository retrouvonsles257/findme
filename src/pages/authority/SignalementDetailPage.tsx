/**
 * =====================================================
 * RETROUVONSLES - Signalement Detail Page
 * Vue détaillée d'un signalement
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { supabase } from '../../config';
import { useSignalementValidation } from '../../features/signalements/hooks/useSignalementValidation';
import { AuthorityLayout } from '../../components/layout';
import {
  MapPin,
  FileText,
  User,
  Camera,
  FolderOpen,
  Search,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import styles from './SignalementDetailPage.module.css';

export const SignalementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { validateSignalement, isLoading: validationLoading } = useSignalementValidation();
  
  const [signalement, setSignalement] = useState<any>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approuve' | 'rejete' | null>(null);

  // Charger le signalement
  useEffect(() => {
    const loadSignalement = async () => {
      if (!id) return;

      try {
        const { data: sigData, error: sigError } = await (supabase as any)
          .from('signalement')
          .select('*')
          .eq('id', id)
          .single();

        if (sigError) throw sigError;
        setSignalement(sigData);

        // Charger le dossier lié si existe
        if (sigData.id_dossier) {
          const { data: dosData } = await (supabase as any)
            .from('dossier_disparition')
            .select('*, personne:id_personne(*)')
            .eq('id', sigData.id_dossier)
            .single();
          
          if (dosData) setDossier(dosData);
        }
      } catch (err: any) {
        // Erreur gérée par la notification
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger le signalement',
          type: 'error',
        });
        navigate('/authority/signalements');
      } finally {
        setIsLoading(false);
      }
    };

    loadSignalement();
  }, [id, addNotification, navigate]);

  // Ouvrir modal validation
  const openValidationModal = (decision: 'approuve' | 'rejete') => {
    setPendingDecision(decision);
    setValidationComment('');
    setShowValidationModal(true);
  };

  // Valider
  const handleValidate = useCallback(async () => {
    if (!id || !pendingDecision || !user?.id) return;

    try {
      await validateSignalement(id, user.id, {
        decision: pendingDecision,
        raison: validationComment || 'Validation par les autorités',
        score_confiance: pendingDecision === 'approuve' ? 80 : 30,
      });

      addNotification({
        title: 'Succès',
        message: `Signalement ${pendingDecision === 'approuve' ? 'validé' : 'rejeté'}`,
        type: 'success',
      });

      // Refresh
      const { data } = await (supabase as any)
        .from('signalement')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setSignalement(data);
      setShowValidationModal(false);
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la validation',
        type: 'error',
      });
    }
  }, [id, pendingDecision, user?.id, validationComment, validateSignalement, addNotification]);

  // Obtenir le statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'valide':
        return { label: 'Validé', color: '#28a745', icon: <CheckCircle size={14} /> };
      case 'invalide':
      case 'rejete':
        return { label: 'Rejeté', color: '#dc3545', icon: <XCircle size={14} /> };
      case 'en_verification':
        return { label: 'En vérification', color: '#17a2b8', icon: <Search size={14} /> };
      default:
        return { label: 'En attente', color: '#ffc107', icon: <Clock size={14} /> };
    }
  };

  if (isLoading) {
    return (
      <AuthorityLayout
      >
        <div style={{ padding: '40px', textAlign: 'center' }}>
          Chargement du signalement...
        </div>
      </AuthorityLayout>
    );
  }

  if (!signalement) {
    return (
      <AuthorityLayout
      >
        <div style={{ padding: '40px', textAlign: 'center' }}>
          Signalement non trouvé
        </div>
      </AuthorityLayout>
    );
  }

  const statusInfo = getStatusInfo(signalement.statut_validation || signalement.etat);
  const canValidate = signalement.statut_validation === 'en_attente' || 
                      signalement.statut_validation === 'en_verification' ||
                      !signalement.statut_validation;

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate('/authority/signalements')} className={styles.backBtn}>
              ← Retour
            </button>
            <div>
              <h1>Signalement</h1>
              <p className={styles.signalementId}>
                SIG-{signalement.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <span 
            className={styles.statusBadge}
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Info principale */}
          <div className={styles.card}>
            <h2><MapPin size={20} /> Informations de l'observation</h2>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Lieu d'observation</label>
                <span>{signalement.lieu_observation || 'Non renseigné'}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Ville</label>
                <span>{signalement.ville_observation || 'N/A'}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Date d'observation</label>
                <span>
                  {signalement.date_observation 
                    ? new Date(signalement.date_observation).toLocaleDateString('fr-FR')
                    : 'Non renseignée'}
                </span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Niveau de certitude</label>
                <span>{signalement.niveau_certitude || 'probable'}</span>
              </div>

              {signalement.latitude_observation && signalement.longitude_observation && (
                <div className={styles.infoItem}>
                  <label>Coordonnées GPS</label>
                  <span>
                    {signalement.latitude_observation.toFixed(4)}, {signalement.longitude_observation.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2><FileText size={20} /> Description</h2>
            <div className={styles.descriptionContent}>
              <p>{signalement.description || 'Aucune description fournie'}</p>
            </div>
          </div>

          {/* Témoin */}
          <div className={styles.card}>
            <h2><User size={20} /> Informations du témoin</h2>
            {signalement.temoin_anonyme ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                Ce signalement a été fait de manière anonyme
              </p>
            ) : (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Nom</label>
                  <span>{signalement.nom_temoin || 'Non renseigné'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Téléphone</label>
                  <span>{signalement.telephone_temoin || 'Non renseigné'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Email</label>
                  <span>{signalement.email_temoin || 'Non renseigné'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          {(signalement.photos && signalement.photos.length > 0) || signalement.photo_url ? (
            <div className={styles.card}>
              <h2><Camera size={20} /> Photos</h2>
              <div className={styles.photosGrid}>
                {signalement.photo_url && (
                  <img src={signalement.photo_url} alt="Photo du signalement" />
                )}
                {signalement.photos?.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt={`Photo ${idx + 1}`} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Dossier lié */}
          {dossier && (
            <div className={styles.card}>
              <h2><FolderOpen size={20} /> Dossier Lié</h2>
              <div 
                className={styles.dossierLink}
                onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
              >
                <div>
                  <strong>{dossier.numero_dossier}</strong>
                  {dossier.personne && (
                    <span> - {dossier.personne.prenom} {dossier.personne.nom}</span>
                  )}
                </div>
                <span>→</span>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className={styles.card}>
            <h2>📋 Métadonnées</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Créé le</label>
                <span>{new Date(signalement.created_at).toLocaleString('fr-FR')}</span>
              </div>
              {signalement.score_pertinence && (
                <div className={styles.infoItem}>
                  <label>Score de pertinence</label>
                  <span>{Math.round(signalement.score_pertinence * 100)}%</span>
                </div>
              )}
              {signalement.score_correspondance && (
                <div className={styles.infoItem}>
                  <label>Score de correspondance</label>
                  <span>{Math.round(signalement.score_correspondance * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {canValidate && (
          <div className={styles.actions}>
            <button 
              onClick={() => openValidationModal('approuve')}
              className={styles.approveBtn}
              disabled={validationLoading}
            >
              ✓ Valider
            </button>
            <button 
              onClick={() => openValidationModal('rejete')}
              className={styles.rejectBtn}
              disabled={validationLoading}
            >
              ✗ Rejeter
            </button>
          </div>
        )}

        {/* Modal de validation */}
        {showValidationModal && (
          <div 
            className={styles.modalOverlay}
            onClick={() => setShowValidationModal(false)}
          >
            <div 
              className={styles.modalContent}
              onClick={e => e.stopPropagation()}
            >
              <h2>
                {pendingDecision === 'approuve' ? '✓ Valider' : '✗ Rejeter'} le signalement
              </h2>
              
              <div className={styles.formGroup}>
                <label>Commentaire (optionnel):</label>
                <textarea
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  placeholder="Ajoutez un commentaire pour cette décision..."
                  rows={4}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  onClick={() => setShowValidationModal(false)}
                  className={styles.cancelBtn}
                >
                  Annuler
                </button>
                <button 
                  onClick={handleValidate}
                  className={pendingDecision === 'approuve' ? styles.approveBtn : styles.rejectBtn}
                  disabled={validationLoading}
                >
                  {validationLoading ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default SignalementDetailPage;
