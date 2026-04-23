/**
 * RETROUVONSLES - DonationSuccess
 * Carte confirmation : récap, partage, actions.
 */

import React from 'react';
import styles from './DonationSuccess.module.css';

export interface DonationSuccessProps {
  donationAmount?: number;
  donationCurrency?: string;
  donorName?: string;
  transactionId?: string;
  receiptNumber?: string;
  status?: string;
  /** Méthode de paiement (ex. "Orange Money", "MTN MoMo") */
  paymentMethod?: string;
  /** Date de la transaction (affichée dans le récap) */
  transactionDate?: string;
  onClose?: () => void;
  onPrintReceipt?: () => void;
  /** Lien ou action téléchargement reçu PDF */
  onDownloadReceipt?: () => void;
  /** URL de retour (ex. "/" pour accueil). Si fourni, le bouton affiche "Retourner à l'accueil" et appelle onClose au clic. */
  returnToHomeLabel?: string;
  className?: string;
}

const DonationSuccess: React.FC<DonationSuccessProps> = ({
  donationAmount,
  donationCurrency = 'XAF',
  donorName,
  transactionId,
  receiptNumber,
  status,
  paymentMethod,
  transactionDate,
  onClose,
  onPrintReceipt,
  onDownloadReceipt,
  returnToHomeLabel = "Retourner à l'accueil",
  className = '',
}) => {
  const isPending = status && status !== 'reussi';
  const displayDate = transactionDate || (typeof window !== 'undefined' ? new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

  const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
  const shareText = donationAmount
    ? encodeURIComponent(`J'ai soutenu Retrouvons-Les avec un don de ${donationAmount.toLocaleString('fr-CM')} ${donationCurrency}. Rejoignez la cause !`)
    : encodeURIComponent('Je soutiens Retrouvons-Les. Rejoignez la cause !');

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${isPending ? styles.pending : styles.success}`}>
          {isPending ? (
            <span aria-hidden>⏳</span>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <h2 className={styles.title}>
          {isPending ? 'Paiement en attente' : 'Merci pour votre générosité !'}
        </h2>

        <p className={styles.message}>
          {isPending ? (
            'Votre don a été créé. Le paiement est en attente de confirmation.'
          ) : donationAmount ? (
            <>
              Votre don de <strong>{donationAmount.toLocaleString('fr-CM')} {donationCurrency}</strong> a bien été reçu.
              Vous aidez directement une famille à retrouver un proche.
            </>
          ) : (
            'Votre don a bien été reçu. Vous aidez directement une famille à retrouver un proche.'
          )}
        </p>

        <section className={styles.recap}>
          <h3 className={styles.recapTitle}>
            <span className={styles.recapDocIcon} aria-hidden>📄</span> RÉCAPITULATIF DE LA TRANSACTION
          </h3>
          {displayDate && (
            <div className={styles.recapRow}>
              <span className={styles.recapLabel}>Date</span>
              <span className={styles.recapValue}>{displayDate}</span>
            </div>
          )}
          {paymentMethod && (
            <div className={styles.recapRow}>
              <span className={styles.recapLabel}>Méthode de paiement</span>
              <span className={styles.recapValue}>
                <span className={styles.orangeDot} aria-hidden />
                {paymentMethod}
              </span>
            </div>
          )}
          {(transactionId || receiptNumber) && (
            <div className={styles.recapRow}>
              <span className={styles.recapLabel}>ID Transaction</span>
              <span className={styles.recapValue}>#{transactionId || receiptNumber || '—'}</span>
            </div>
          )}
          {donorName && !isPending && (
            <div className={styles.recapRow}>
              <span className={styles.recapLabel}>Donateur</span>
              <span className={styles.recapValue}>{donorName}</span>
            </div>
          )}
        </section>

        {!isPending && (
          <div className={styles.share}>
            <p className={styles.shareTitle}>Partager l'espoir</p>
            <div className={styles.shareButtons}>
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.whatsapp}`}
                title="Partager sur WhatsApp"
                aria-label="Partager sur WhatsApp"
              >
                💬
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.facebook}`}
                title="Partager sur Facebook"
                aria-label="Partager sur Facebook"
              >
                f
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.twitter}`}
                title="Partager sur X (Twitter)"
                aria-label="Partager sur X"
              >
                𝕏
              </a>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {(onDownloadReceipt || onPrintReceipt) && (
            <button
              type="button"
              className={styles.downloadLink}
              onClick={onDownloadReceipt || onPrintReceipt}
            >
              <span className={styles.downloadIcon} aria-hidden>↓</span> Télécharger mon reçu (PDF)
            </button>
          )}
          {onClose && (
            <button type="button" className={styles.primaryBtn} onClick={onClose}>
              <span className={styles.homeIcon} aria-hidden>⌂</span> {returnToHomeLabel}
            </button>
          )}
        </div>

        <p className={styles.footer}>
          © {new Date().getFullYear()} Retrouvons-Les. Tous droits réservés. Vos données sont sécurisées.
        </p>
      </div>
    </div>
  );
};

export default DonationSuccess;
