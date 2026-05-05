/**
 * =====================================================
 * RETROUVONSLES - AlerteDetail Component
 * Vue détaillée d'une alerte
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import styles from './AlerteDetail.module.css';
import { useAlertes, useAlerteDiffusion } from '../hooks';
import { useAuth } from '../../../contexts';
import type { StatutAlerte } from '../../../@types/enums.types';
import { StatutAlerte as StatutAlerteEnum, NomRole } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteDetailProps {
  alerteId: string;
  onClose?: () => void;
  onStatusChange?: (newStatus: StatutAlerte) => void;
}

// ============================================
// COMPONENT
// ============================================

export const AlerteDetail: React.FC<AlerteDetailProps> = ({
  alerteId,
  onClose,
  onStatusChange,
}) => {
  const { fetchAlerteById, selectedAlerte, loading, error, updateAlerteStatus } =
    useAlertes();
  const { diffuserAlerte } = useAlerteDiffusion();
  const { userRole } = useAuth();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ========== EFFECTS ==========

  useEffect(() => {
    fetchAlerteById(alerteId);
  }, [alerteId, fetchAlerteById]);

  // ========== HANDLERS ==========

  const handleStatusChange = async (newStatus: StatutAlerte) => {
    try {
      setIsProcessing(true);
      await updateAlerteStatus(alerteId, newStatus);
      onStatusChange?.(newStatus);
      setIsActionsOpen(false);
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBroadcast = async () => {
    try {
      setIsProcessing(true);
      await diffuserAlerte(alerteId, {
        canaux: ['push', 'in_app'],
        rayon_km: 50,
        zones_specifiques: [],
        planifiee: false,
        priorite_diffusion: 'haute',
      });
      setIsActionsOpen(false);
    } catch (err) {
      console.error('Erreur lors de la diffusion:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const canModify = userRole === NomRole.ADMIN_SYSTEME || userRole === NomRole.AUTORITE;

  // ========== RENDER ==========

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (error || !selectedAlerte) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'Alerte non trouvée'}
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  const alerte = selectedAlerte as any;
  const statusColor: Record<string, string> = {
    [StatutAlerteEnum.BROUILLON]: '#9CA3AF',
    [StatutAlerteEnum.PROGRAMMEE]: '#F59E0B',
    [StatutAlerteEnum.EN_COURS]: '#DC2626',
    [StatutAlerteEnum.TERMINEE]: '#10B981',
    [StatutAlerteEnum.ANNULEE]: '#6B7280',
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{alerte.titre}</h1>
          <div className={styles.meta}>
            <span
              className={styles.status}
              style={{ backgroundColor: statusColor[alerte.statut_alerte] }}
            >
              {alerte.statut_alerte}
            </span>
            <span className={styles.type}>{alerte.type_alerte}</span>
            {alerte.numero_alerte && (
              <span className={styles.numero}>{alerte.numero_alerte}</span>
            )}
          </div>
        </div>

        <button onClick={onClose} className={styles.closeButton} aria-label="Fermer">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Message */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <p className={styles.message}>{alerte.message}</p>
        </section>

        {/* Statistics */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Statistiques</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Destinataires</span>
              <span className={styles.statValue}>{alerte.nombre_destinataires || 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Envois réussis</span>
              <span className={styles.statValue}>{alerte.nombre_envois_reussis || 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Vues</span>
              <span className={styles.statValue}>{alerte.nombre_vues || 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Partages</span>
              <span className={styles.statValue}>{alerte.nombre_partages || 0}</span>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Détails</h2>
          <dl className={styles.detailsList}>
            <dt className={styles.detailLabel}>Type:</dt>
            <dd className={styles.detailValue}>{alerte.type_alerte}</dd>

            {alerte.rayon_km && (
              <>
                <dt className={styles.detailLabel}>Rayon de diffusion:</dt>
                <dd className={styles.detailValue}>{alerte.rayon_km} km</dd>
              </>
            )}

            {alerte.date_diffusion && (
              <>
                <dt className={styles.detailLabel}>Date de diffusion:</dt>
                <dd className={styles.detailValue}>
                  {new Date(alerte.date_diffusion).toLocaleString('fr-FR')}
                </dd>
              </>
            )}

            {alerte.date_expiration && (
              <>
                <dt className={styles.detailLabel}>Date d'expiration:</dt>
                <dd className={styles.detailValue}>
                  {new Date(alerte.date_expiration).toLocaleString('fr-FR')}
                </dd>
              </>
            )}
          </dl>
        </section>
      </div>

      {/* Actions */}
      {canModify && (
        <div className={styles.actions}>
          <div className={styles.actionDropdown}>
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className={styles.actionButton}
              disabled={isProcessing}
            >
              Actions ▼
            </button>

            {isActionsOpen && (
              <div className={styles.actionMenu}>
                {alerte.statut_alerte === StatutAlerteEnum.BROUILLON && (
                  <>
                    <button
                      onClick={() => handleStatusChange(StatutAlerteEnum.EN_COURS)}
                      className={styles.menuItem}
                      disabled={isProcessing}
                    >
                      Publier
                    </button>
                    <button
                      onClick={handleBroadcast}
                      className={styles.menuItem}
                      disabled={isProcessing}
                    >
                      Diffuser maintenant
                    </button>
                  </>
                )}

                {alerte.statut_alerte === StatutAlerteEnum.EN_COURS && (
                  <>
                    <button
                      onClick={() => handleStatusChange(StatutAlerteEnum.TERMINEE)}
                      className={styles.menuItem}
                      disabled={isProcessing}
                    >
                      Clôturer (retrouvée)
                    </button>
                    <button
                      onClick={() => handleStatusChange(StatutAlerteEnum.ANNULEE)}
                      className={`${styles.menuItem} ${styles.danger}`}
                      disabled={isProcessing}
                    >
                      Annuler
                    </button>
                  </>
                )}

                {(alerte.statut_alerte === StatutAlerteEnum.TERMINEE ||
                  alerte.statut_alerte === StatutAlerteEnum.ANNULEE) && (
                  <button
                    onClick={() => handleStatusChange(StatutAlerteEnum.BROUILLON)}
                    className={styles.menuItem}
                    disabled={isProcessing}
                  >
                    Revenir en brouillon
                  </button>
                )}
              </div>
            )}
          </div>

          {isProcessing && <span className={styles.processing}>Traitement en cours...</span>}
        </div>
      )}
    </div>
  );
};

AlerteDetail.displayName = 'AlerteDetail';
