/**
 * =====================================================
 * RETROUVONSLES - Alerte Detail Page
 * Vue détaillée d'une alerte
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts';
import { 
  getAlerteById, 
  updateAlerteStatut, 
  diffuserAlerte 
} from '../../features/alertes/services/alerteAPI';
import { AuthorityLayout } from '../../components/layout';
import {
  BarChart2,
  FolderOpen,
  FileEdit,
  Megaphone,
  Radio,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import styles from './AlerteDetailPage.module.css';

export const AlerteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [alerte, setAlerte] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Charger l'alerte
  useEffect(() => {
    const loadAlerte = async () => {
      if (!id) return;

      try {
        const data = await getAlerteById(id);
        setAlerte(data);
      } catch (err: any) {
        // Erreur gérée par la notification
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger l\'alerte',
          type: 'error',
        });
        navigate('/authority/alertes');
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerte();
  }, [id, addNotification, navigate]);

  // Changer le statut
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!id) return;

    setActionLoading(true);
    try {
      const updated = await updateAlerteStatut(id, newStatus as any);
      setAlerte(updated);
      addNotification({
        title: 'Statut mis à jour',
        message: `Alerte passée en statut: ${newStatus}`,
        type: 'success',
      });
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la mise à jour',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }, [id, addNotification]);

  // Diffuser l'alerte
  const handleDiffuse = useCallback(async () => {
    if (!id) return;

    setActionLoading(true);
    try {
      const result = await diffuserAlerte(id);
      addNotification({
        title: 'Alerte diffusée',
        message: `Alerte envoyée à ${result.nombre_destinataires} utilisateurs`,
        type: 'success',
      });
      // Refresh
      const updated = await getAlerteById(id);
      setAlerte(updated);
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la diffusion',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }, [id, addNotification]);

  // Obtenir l'info du statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'en_cours':
        return { label: 'Active', color: '#28a745', icon: <Megaphone size={14} /> };
      case 'terminee':
        return { label: 'Terminée', color: '#6c757d', icon: <CheckCircle size={14} /> };
      case 'annulee':
        return { label: 'Annulée', color: '#dc3545', icon: <XCircle size={14} /> };
      default:
        return { label: 'Brouillon', color: '#ffc107', icon: <FileEdit size={14} /> };
    }
  };

  if (isLoading) {
    return (
      <AuthorityLayout
      >
        <div style={{ padding: '40px', textAlign: 'center' }}>
          Chargement de l'alerte...
        </div>
      </AuthorityLayout>
    );
  }

  if (!alerte) {
    return (
      <AuthorityLayout
      >
        <div style={{ padding: '40px', textAlign: 'center' }}>
          Alerte non trouvée
        </div>
      </AuthorityLayout>
    );
  }

  const statusInfo = getStatusInfo(alerte.statut_alerte);
  const isDraft = alerte.statut_alerte === 'brouillon' || !alerte.statut_alerte;
  const isActive = alerte.statut_alerte === 'en_cours';

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate('/authority/alertes')} className={styles.backBtn}>
              ← Retour
            </button>
            <div>
              <h1>{alerte.titre || 'Alerte sans titre'}</h1>
              <p className={styles.alerteId}>
                {alerte.numero_alerte || `ALE-${alerte.id.substring(0, 8)}`}
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
          {/* Info Card */}
          <div className={styles.card}>
            <h2>📋 Informations</h2>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Type d'alerte</label>
                <span>{alerte.type_alerte || 'Standard'}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Date de création</label>
                <span>{new Date(alerte.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Date de diffusion</label>
                <span>
                  {alerte.date_diffusion 
                    ? new Date(alerte.date_diffusion).toLocaleDateString('fr-FR')
                    : 'Non diffusée'}
                </span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Rayon de diffusion</label>
                <span>{alerte.rayon_km || 50} km</span>
              </div>
            </div>
          </div>

          {/* Message Card */}
          <div className={styles.card}>
            <h2>💬 Message</h2>
            <div className={styles.messageContent}>
              <p>{alerte.message || 'Aucun message'}</p>
            </div>
            {alerte.message_court && (
              <div className={styles.shortMessage}>
                <label>Message court:</label>
                <p>{alerte.message_court}</p>
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className={styles.card}>
            <h2><BarChart2 size={20} /> Statistiques</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_destinataires || 0}</span>
                <span className={styles.statLabel}>Destinataires</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_vues || 0}</span>
                <span className={styles.statLabel}>Vues</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_partages || 0}</span>
                <span className={styles.statLabel}>Partages</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{alerte.nombre_signalements_generes || 0}</span>
                <span className={styles.statLabel}>Signalements</span>
              </div>
            </div>
          </div>

          {/* Dossier Link */}
          {alerte.dossier_disparition && (
            <div className={styles.card}>
              <h2><FolderOpen size={20} /> Dossier Lié</h2>
              <div 
                className={styles.dossierLink}
                onClick={() => navigate(`/authority/dossiers/${alerte.id_dossier}`)}
              >
                <span>{alerte.dossier_disparition.numero_dossier || 'Voir le dossier'}</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isDraft && (
            <>
              <button 
                onClick={() => navigate(`/authority/alertes/${id}/edit`)}
                className={styles.editBtn}
                disabled={actionLoading}
              >
                <FileEdit size={16} /> Modifier
              </button>
              <button 
                onClick={() => handleStatusChange('en_cours')}
                className={styles.publishBtn}
                disabled={actionLoading}
              >
                {actionLoading ? <><Loader2 size={16} className={styles.spinner} /> Traitement...</> : <><Megaphone size={16} /> Publier</>}
              </button>
            </>
          )}
          
          {isActive && (
            <>
              <button 
                onClick={handleDiffuse}
                className={styles.diffuseBtn}
                disabled={actionLoading}
              >
                {actionLoading ? <><Loader2 size={16} className={styles.spinner} /> Diffusion...</> : <><Radio size={16} /> Re-diffuser</>}
              </button>
              <button 
                onClick={() => handleStatusChange('terminee')}
                className={styles.completeBtn}
                disabled={actionLoading}
              >
                ✓ Terminer
              </button>
              <button 
                onClick={() => handleStatusChange('annulee')}
                className={styles.cancelBtn}
                disabled={actionLoading}
              >
                ✗ Annuler
              </button>
            </>
          )}
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default AlerteDetailPage;
