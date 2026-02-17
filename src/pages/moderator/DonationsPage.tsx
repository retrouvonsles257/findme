import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../config';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { ModerationLayout } from './ModerationLayout';
import { DonationForm, DonationHistory } from '../../features/dons/components';
// Reuse the citizen donations styling for perfect consistency
import styles from '../citizen/DonationsPage.module.css';
import modStyles from './DonationsPage.module.css';

export const ModeratorDonationsPage: React.FC = () => {
  const { t } = useI18n();
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
    <ModerationLayout title={t('moderator.donationsTitle')} activeNav="donations">
      <div className={`${styles.page} ${modStyles.modPage}`}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <h1 className={styles.heroTitle}>{t('moderator.donationsHeroTitle')}</h1>
              <p className={styles.heroSubtitle}>
                {t('moderator.donationsHeroSubtitle')}
              </p>
            </div>
          </div>

          <div className={styles.pillRow}>
            <span className={styles.pill}>
              <strong>{t('moderator.donationsPillOrangeMtn')}</strong> + <strong>{t('moderator.donationsPillMtn')}</strong>
            </span>
            <span className={styles.pill}>
              {t('moderator.donationsPillSecure')}
            </span>
            <span className={styles.pill}>
              {t('moderator.donationsPillDevMode')}
            </span>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('moderator.makeDonation')}</h2>
              <span className={styles.cardHint}>{t('moderator.donationsCardHint')}</span>
            </div>
            <DonationForm
              prefilledAmount={5000}
              prefilledType="ponctuel"
              availablePaymentMethods={['mobile_money']}
              onSuccess={() => setRefreshTick((x) => x + 1)}
            />
            <p className={styles.note}>
              {t('moderator.donationsNote')}
            </p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('moderator.myDonations')}</h2>
              <span className={styles.cardHint}>{resolvedEmail ? t('moderator.donationsAccountConnected') : t('moderator.donationsRecent')}</span>
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

