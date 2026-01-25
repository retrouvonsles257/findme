/**
 * =====================================================
 * RETROUVONSLES - AlertePreview Component
 * Aperçu compact d'une alerte
 * =====================================================
 */

import React from 'react';
import styles from './AlerteList.module.css';
import type { AlerteDisplayData } from '../services/alerteService';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlertePreviewProps {
  alerte: AlerteDisplayData;
  onClick?: () => void;
  showStats?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const AlertePreview: React.FC<AlertePreviewProps> = ({
  alerte,
  onClick,
  showStats = true,
}) => {
  const statusColor: Record<string, string> = {
    brouillon: '#9CA3AF',
    programmee: '#F59E0B',
    en_cours: '#DC2626',
    terminee: '#10B981',
    annulee: '#6B7280',
  };

  const typeEmoji: Record<string, string> = {
    amber_alert: '🚨',
    disparition_enfant: '👧',
    disparition_adulte_vulnerable: '🆘',
    disparition_standard: '👤',
    mise_a_jour: '📢',
    personne_retrouvee: '✅',
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExpirationStatus = (): 'expired' | 'expiring_soon' | 'active' | 'inactive' => {
    if (alerte.statut_alerte === 'terminee' || alerte.statut_alerte === 'annulee') {
      return 'inactive';
    }

    if (alerte.est_expiration_proche) {
      return 'expiring_soon';
    }

    if (
      alerte.date_expiration &&
      new Date(alerte.date_expiration) < new Date()
    ) {
      return 'expired';
    }

    return 'active';
  };

  const expirationStatus = getExpirationStatus();

  return (
    <div
      className={`${styles.preview} ${styles[expirationStatus]}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Alerte: ${alerte.titre}`}
    >
      {/* Left Icon */}
      <div className={styles.previewIcon}>
        <span className={styles.emoji}>
          {typeEmoji[alerte.type_alerte] || '📢'}
        </span>
      </div>

      {/* Main Content */}
      <div className={styles.previewContent}>
        {/* Title and Status */}
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>{alerte.titre}</h3>
          <span
            className={styles.previewStatus}
            style={{ backgroundColor: statusColor[alerte.statut_alerte] }}
          >
            {alerte.statut_alerte}
          </span>
        </div>

        {/* Message Preview */}
        <p className={styles.previewMessage}>
          {alerte.message_court || alerte.message.substring(0, 100)}...
        </p>

        {/* Metadata */}
        <div className={styles.previewMeta}>
          <span className={styles.metaItem}>
            📅 {formatDate(alerte.date_diffusion || new Date())}
          </span>

          {alerte.rayon_km && (
            <span className={styles.metaItem}>
              📍 {alerte.rayon_km} km
            </span>
          )}

          {alerte.temps_avant_expiration && (
            <span
              className={`${styles.metaItem} ${
                expirationStatus === 'expiring_soon' ? styles.warning : ''
              }`}
            >
              ⏱️ {alerte.temps_avant_expiration}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className={styles.previewStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{alerte.nombre_vues || 0}</span>
            <span className={styles.statLabel}>Vues</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{alerte.nombre_partages || 0}</span>
            <span className={styles.statLabel}>Partages</span>
          </div>
          {alerte.nombre_destinataires && (
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {alerte.pourcentage_couverture || 0}%
              </span>
              <span className={styles.statLabel}>Couverture</span>
            </div>
          )}
        </div>
      )}

      {/* Arrow */}
      <div className={styles.previewArrow}>→</div>
    </div>
  );
};

AlertePreview.displayName = 'AlertePreview';
