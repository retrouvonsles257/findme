import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../config';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { ModerationLayout } from './ModerationLayout';
import { DonationForm, DonationHistory } from '../../features/dons/components';
// Reuse the citizen donations styling for perfect consistency
import styles from '../citizen/DonationsPage.module.css';

export const ModeratorDonationsPage: React.FC = () => {
  const currentUser = useAppSelector(selectUser);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const emailFromStore = (currentUser as any)?.email as string | undefined;
      if (emailFromStore) {
        if (!cancelled) setResolvedEmail(emailFromStore);
        return;
      }
      try {
        const { data } = await (supabase as any).auth.getUser();
        const email = data?.user?.email as string | undefined;
        if (!cancelled) setResolvedEmail(email || null);
      } catch {
        if (!cancelled) setResolvedEmail(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Retour gateway: /moderator/donations?transaction_id=XXXX
  useEffect(() => {
    const trx = searchParams.get('transaction_id');
    if (trx) setRefreshTick((x) => x + 1);
  }, [searchParams]);

  return (
    <ModerationLayout title="Dons" activeNav="donations">
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <h1 className={styles.heroTitle}>Soutenir RetrouvonsLes</h1>
              <p className={styles.heroSubtitle}>
                Orange Money / MTN MoMo (mode dev/mock par défaut). Les confirmations réelles passent par webhook.
              </p>
            </div>
          </div>

          <div className={styles.pillRow}>
            <span className={styles.pill}>
              <strong>Orange Money</strong> + <strong>MTN MoMo</strong>
            </span>
            <span className={styles.pill}>
              Paiement <strong>sécurisé</strong> (webhook)
            </span>
            <span className={styles.pill}>
              Mode dev: <strong>mock</strong> par défaut
            </span>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Faire un don</h2>
              <span className={styles.cardHint}>Orange / MTN • XAF</span>
            </div>
            <DonationForm
              prefilledAmount={5000}
              prefilledType="ponctuel"
              availablePaymentMethods={['mobile_money']}
              onSuccess={() => setRefreshTick((x) => x + 1)}
            />
            <p className={styles.note}>
              En dev, le paiement est simulé via une Edge Function. En production, la confirmation viendra via webhook
              de la passerelle.
            </p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Mes dons</h2>
              <span className={styles.cardHint}>{resolvedEmail ? 'Compte connecté' : 'Dons récents'}</span>
            </div>
            <DonationHistory
              key={`${resolvedEmail || 'recent'}:${refreshTick}`}
              email={resolvedEmail || undefined}
              showRecent={!resolvedEmail}
            />
          </section>
        </div>
      </div>
    </ModerationLayout>
  );
};

export default ModeratorDonationsPage;

