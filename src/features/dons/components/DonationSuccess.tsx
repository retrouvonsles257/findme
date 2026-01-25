/**
 * =====================================================
 * RETROUVONSLES - DonationSuccess Component
 * Écran de confirmation du succès du don
 * =====================================================
 */

import React from 'react';

// ============================================
// COMPONENT PROPS
// ============================================

export interface DonationSuccessProps {
  donationAmount?: number;
  donationCurrency?: string;
  donorName?: string;
  transactionId?: string;
  receiptNumber?: string;
  onClose?: () => void;
  onPrintReceipt?: () => void;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Composant confirmation de don réussi
 */
export const DonationSuccess: React.FC<DonationSuccessProps> = ({
  donationAmount,
  donationCurrency = 'XAF',
  donorName,
  transactionId,
  receiptNumber,
  onClose,
  onPrintReceipt,
  className = '',
}) => {
  return (
    <div className={`donation-success ${className}`}>
      <div className="success-container">
        {/* Icône succès */}
        <div className="success-icon">✓</div>

        {/* Titre */}
        <h2>Merci pour votre don!</h2>

        {/* Message */}
        <p className="success-message">
          Votre donation a été enregistrée avec succès. Votre générosité nous aide à continuer
          notre mission de recherche de personnes disparues.
        </p>

        {/* Détails */}
        <div className="success-details">
          {donationAmount && (
            <div className="detail-row">
              <span>Montant:</span>
              <strong>
                {donationAmount.toLocaleString('fr-CM')} {donationCurrency}
              </strong>
            </div>
          )}

          {donorName && (
            <div className="detail-row">
              <span>Donateur:</span>
              <strong>{donorName}</strong>
            </div>
          )}

          {transactionId && (
            <div className="detail-row">
              <span>Référence:</span>
              <strong>{transactionId}</strong>
            </div>
          )}

          {receiptNumber && (
            <div className="detail-row">
              <span>Reçu fiscal:</span>
              <strong>{receiptNumber}</strong>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="success-actions">
          {onPrintReceipt && (
            <button className="print-btn" onClick={onPrintReceipt}>
              Imprimer le reçu
            </button>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              Fermer
            </button>
          )}
        </div>

        {/* Message informatif */}
        <div className="info-box">
          <p>
            Un email de confirmation avec votre reçu fiscal a été envoyé à votre adresse email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationSuccess;
