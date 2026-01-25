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
  email?: string;
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

  useEffect(() => {
    if (email) {
      fetchDonorHistory(email);
    } else if (showRecent) {
      fetchRecentDonations(limit);
    }
  }, [email, showRecent, limit, fetchDonorHistory, fetchRecentDonations]);

  const displayData = email ? donationHistory : recentDonations;

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
          {email
            ? 'Aucun don trouvé pour cet email'
            : 'Aucun don n\'a été enregistré'}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.donationHistory} ${className}`}>
      <div className={styles.header}>
        <h3>{email ? 'Mon historique de dons' : 'Dons récents'}</h3>
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
