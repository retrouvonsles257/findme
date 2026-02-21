/**
 * Contenu unique de la page Dons : même rendu pour tous (connecté / non connecté).
 * Aligné 100 % sur les maquettes donation-page-form.png et donation-confirmation-form.png.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DonationForm } from './DonationForm';
import { DonationHistory } from './DonationHistory';
import DonationSuccess from './DonationSuccess';
import * as donService from '../services/donService';
import styles from './DonationPageContent.module.css';

const DONATION_IMAGE = '/assets/images/donation-page.png';

export interface DonationPageContentProps {
  /** Clic sur le logo (ex: navigate vers accueil) */
  onLogoClick?: () => void;
  /** Afficher le bloc "Mes dons" / historique (utilisateurs connectés) */
  showHistory?: boolean;
  userId?: string;
  email?: string | null;
  /** Titre intégré (ex: "Dons") aligné verticalement avec le premier élément (layout sans titre) */
  pageTitle?: string;
}

export const DonationPageContent: React.FC<DonationPageContentProps> = ({
  onLogoClick,
  showHistory = false,
  userId,
  email,
  pageTitle,
}) => {
  const [searchParams] = useSearchParams();
  const [createdDonId, setCreatedDonId] = useState<string | null>(null);
  const [createdDon, setCreatedDon] = useState<any | null>(null);
  const [loadingDon, setLoadingDon] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadCreatedDon = useCallback(async (donId: string) => {
    try {
      setLoadingDon(true);
      setLoadError(null);
      const don = await donService.getDonWithDetails(donId);
      setCreatedDon(don);
    } catch (e: any) {
      setLoadError(e?.message || 'Erreur lors du chargement du don');
    } finally {
      setLoadingDon(false);
    }
  }, []);

  useEffect(() => {
    if (createdDonId) loadCreatedDon(createdDonId);
  }, [createdDonId, loadCreatedDon]);

  useEffect(() => {
    const trx = searchParams.get('transaction_id');
    if (!trx || createdDonId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const don = await donService.getDonByReferenceTransaction(trx);
        if (!cancelled) setCreatedDonId(don.id);
      } catch {
        // ignore
      }
    };
    run();
    return () => { cancelled = true; };
  }, [searchParams, createdDonId]);

  const handleSuccess = useCallback((donId: string) => {
    setCreatedDonId(donId);
    setRefreshTick((t) => t + 1);
  }, []);

  return (
    <>
      <main className={styles.main}>
        {createdDonId ? (
          <div className={styles.successWrap}>
            {loadError && <div className={styles.loadError} role="alert">{loadError}</div>}
            {!loadingDon && (
              <DonationSuccess
                  donationAmount={createdDon?.montant}
                  donationCurrency={createdDon?.devise || 'XAF'}
                  donorName={
                    createdDon?.donateur_anonyme
                      ? 'Anonyme'
                      : createdDon?.nom_donateur || createdDon?.organisation_donatrice || undefined
                  }
                  transactionId={createdDon?.reference_transaction || undefined}
                  receiptNumber={createdDon?.numero_recu || undefined}
                  status={createdDon?.statut_paiement || undefined}
                  paymentMethod={
                    createdDon?.methode_paiement === 'mobile_money'
                      ? 'Orange Money'
                      : createdDon?.methode_paiement || undefined
                  }
                  transactionDate={
                    createdDon?.date_don
                      ? new Date(createdDon.date_don).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : undefined
                  }
                  onClose={() => {
                    setCreatedDonId(null);
                    setCreatedDon(null);
                  }}
                  onDownloadReceipt={
                    createdDon?.recu_pdf_url
                      ? () => window.open(createdDon.recu_pdf_url, '_blank', 'noopener,noreferrer')
                      : undefined
                  }
                  returnToHomeLabel="Retourner à l'accueil"
                />
            )}
          </div>
        ) : (
          <>
            {pageTitle ? (
              <div className={styles.titleBlock}>
                <h1 className={styles.pageTitleTop}>{pageTitle}</h1>
                <div className={`${styles.grid} ${showHistory ? styles.gridThree : ''}`}>
                  <aside className={styles.left}>
                    <h1 className={styles.heroTitle}>
                    Soutenez <span className={styles.heroHighlight}>RetrouvonsLes</span>
                  </h1>
                  <p className={styles.mission}>
                    Chaque don nous aide à ramener un être cher à sa famille grâce à notre technologie de recherche et d'alerte instantanée au Cameroun.
                  </p>
                  <div className={styles.benefitCards}>
                    <div className={styles.benefitCard}>
                      <span className={styles.benefitIconGreen} aria-hidden>✓</span>
                      <div>
                        <strong>Transparence Totale</strong>
                        <p>100% de votre don est investi dans le développement de notre technologie de recherche.</p>
                      </div>
                    </div>
                    <div className={styles.benefitCard}>
                      <span className={styles.benefitIconBlue} aria-hidden>👥</span>
                      <div>
                        <strong>Impact Direct</strong>
                        <p>Nos algorithmes analysent des milliers de rapports chaque jour pour identifier des correspondances.</p>
                      </div>
                    </div>
                  </div>
                      <div className={styles.imageWrap}>
                        <img src={`${process.env.PUBLIC_URL || ''}${DONATION_IMAGE}`} alt="" />
                      </div>
                    </aside>

                    <div className={styles.center}>
                      <div className={styles.formCard}>
                        <DonationForm
                          prefilledAmount={1000}
                          prefilledType="ponctuel"
                          showPaymentOptions={true}
                          onSuccess={handleSuccess}
                        />
                      </div>
                    </div>

                    {showHistory && (
                      <div className={styles.right}>
                        <section className={styles.historyCard}>
                          <h2 className={styles.historyTitle}>Mes dons</h2>
                          <DonationHistory
                            key={`${userId || email || 'recent'}-${refreshTick}`}
                            userId={userId}
                            email={email || undefined}
                            showRecent={!userId && !email}
                          />
                        </section>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <div className={`${styles.grid} ${showHistory ? styles.gridThree : ''}`}>
                <aside className={styles.left}>
                  <h1 className={styles.heroTitle}>
                    Soutenez <span className={styles.heroHighlight}>RetrouvonsLes</span>
                  </h1>
                  <p className={styles.mission}>
                    Chaque don nous aide à ramener un être cher à sa famille grâce à notre technologie de recherche et d'alerte instantanée au Cameroun.
                  </p>
                  <div className={styles.benefitCards}>
                    <div className={styles.benefitCard}>
                      <span className={styles.benefitIconGreen} aria-hidden>✓</span>
                      <div>
                        <strong>Transparence Totale</strong>
                        <p>100% de votre don est investi dans le développement de notre technologie de recherche.</p>
                      </div>
                    </div>
                    <div className={styles.benefitCard}>
                      <span className={styles.benefitIconBlue} aria-hidden>👥</span>
                      <div>
                        <strong>Impact Direct</strong>
                        <p>Nos algorithmes analysent des milliers de rapports chaque jour pour identifier des correspondances.</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.imageWrap}>
                    <img src={`${process.env.PUBLIC_URL || ''}${DONATION_IMAGE}`} alt="" />
                  </div>
                </aside>

                <div className={styles.center}>
                  <div className={styles.formCard}>
                    <DonationForm
                      prefilledAmount={1000}
                      prefilledType="ponctuel"
                      showPaymentOptions={true}
                      onSuccess={handleSuccess}
                    />
                  </div>
                </div>

                {showHistory && (
                  <div className={styles.right}>
                    <section className={styles.historyCard}>
                      <h2 className={styles.historyTitle}>Mes dons</h2>
                      <DonationHistory
                        key={`${userId || email || 'recent'}-${refreshTick}`}
                        userId={userId}
                        email={email || undefined}
                        showRecent={!userId && !email}
                      />
                    </section>
                  </div>
                )}
              </div>
            )}

            <section className={styles.impactSection}>
                <h2 className={styles.impactTitle}>Impact de votre contribution</h2>
                <p className={styles.impactDesc}>Voyez concrètement comment votre argent aide à sauver des vies.</p>
                <div className={styles.impactGrid}>
                  <div className={styles.impactCard}>
                    <span className={styles.impactIcon} aria-hidden>📡</span>
                    <strong>10 000 XAF</strong>
                    <p>Finance une semaine complète d'hébergement de nos serveurs d'IA de reconnaissance faciale.</p>
                  </div>
                  <div className={styles.impactCard}>
                    <span className={styles.impactIcon} aria-hidden>💬</span>
                    <strong>5 000 XAF</strong>
                    <p>Permet l'envoi de 500 alertes SMS prioritaires aux communautés locales lors d'une disparition signalée.</p>
                  </div>
                  <div className={styles.impactCard}>
                    <span className={styles.impactIcon} aria-hidden>📢</span>
                    <strong>2 000 XAF</strong>
                    <p>Couvre la diffusion sponsorisée d'une fiche de recherche sur les réseaux sociaux pendant 24h.</p>
                  </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerRow}>
            <span className={styles.footerLogo}>RetrouvonsLes</span>
            <nav className={styles.footerNav} aria-label="Pied de page">
              <a href="/conditions">Conditions Générales</a>
              <a href="/confidentialite">Politique de Confidentialité</a>
              <a href="/apropos">À Propos</a>
              <a href="/contact">Contact</a>
            </nav>
            <div className={styles.footerSocial}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
            </div>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} RetrouvonsLes. Tous droits réservés. Association à but non lucratif enregistrée au Cameroun.
          </p>
        </div>
      </footer>
    </>
  );
};

export default DonationPageContent;
