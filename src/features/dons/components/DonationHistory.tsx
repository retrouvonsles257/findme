/**
 * =====================================================
 * RETROUVONSLES - DonationHistory Component
 * Affichage de l'historique des dons
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useDonationHistory } from '../hooks/useDonationHistory';
import styles from './DonationHistory.module.css';

// ============================================
// COMPONENT PROPS
// ============================================

export interface DonationHistoryProps {
  /** Utilisateur connecté : priorité pour "Mes dons" (don.id_utilisateur). */
  userId?: string | null;
  /** Fallback si non connecté : filtre par email donateur. */
  email?: string | null;
  limit?: number;
  showRecent?: boolean;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Composant historique des dons
 */
export const DonationHistory: React.FC<DonationHistoryProps> = ({
  userId,
  email,
  limit = 10,
  showRecent = true,
  className = '',
}) => {
  const {
    donationHistory,
    recentDonations,
    isLoading,
    error,
    fetchDonorHistory,
    fetchRecentDonations,
  } = useDonationHistory();

  const hasDonorIdentity = Boolean(userId || email);

  useEffect(() => {
    if (hasDonorIdentity) {
      fetchDonorHistory({ userId, email, limit });
    } else if (showRecent) {
      fetchRecentDonations(limit);
    }
  }, [userId, email, hasDonorIdentity, showRecent, limit, fetchDonorHistory, fetchRecentDonations]);

  const displayData = hasDonorIdentity ? donationHistory : recentDonations;

  if (isLoading) {
    return (
      <div className={`${styles.donationHistory} ${className}`}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.donationHistory} ${className}`}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (displayData.length === 0) {
    return (
      <div className={`${styles.donationHistory} ${className}`}>
        <div className={styles.empty}>
          {hasDonorIdentity
            ? 'Aucun don trouvé pour votre compte'
            : 'Aucun don n\'a été enregistré'}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.donationHistory} ${className}`}>
      <div className={styles.header}>
        <h3>{hasDonorIdentity ? 'Mon historique de dons' : 'Dons récents'}</h3>
        <span className={styles.count}>{displayData.length}</span>
      </div>

      <div className={styles.list}>
        {displayData.map((don) => (
          <div key={don.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.montant}>{don.montant_formate}</span>
              <span className={`${styles.statut} ${styles[`statut-${don.statut_paiement}`]}`}>
                {don.statut_label}
              </span>
            </div>

            <div className={styles.itemDetails}>
              <span className={styles.type}>{don.type_don}</span>
              <span className={styles.date}>{don.date_relative}</span>
            </div>

            {(don as any).recu_pdf_url && (
              <a
                href={(don as any).recu_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.receiptLink}
              >
                📥 Télécharger le reçu (PDF)
              </a>
            )}

            {don.message_donateur && (
              <div className={styles.itemMessage}>{don.message_donateur}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationHistory;
