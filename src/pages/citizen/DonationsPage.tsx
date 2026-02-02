import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CitizenLayout } from './CitizenLayout';
import { DonationForm, DonationHistory } from '../../features/dons/components';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import { useI18n } from '../../hooks';
import styles from './DonationsPage.module.css';

export const CitizenDonationsPage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchParams] = useSearchParams();

  const emailFromStore = (currentUser as any)?.email as string | undefined;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
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
  }, [emailFromStore]);

  const subtitle = useMemo(() => {
    return (
      t('citizen.donationsSubtitle') ||
      'Soutenez RetrouvonsLes avec Orange Money ou MTN MoMo (mode dev/mock).'
    );
  }, [t]);

  // Retour gateway (ex: CinetPay) : /citizen/donations?transaction_id=XXXX
  useEffect(() => {
    const trx = searchParams.get('transaction_id');
    if (trx) setRefreshTick((x) => x + 1);
  }, [searchParams]);

  return (
    <CitizenLayout activeNav="donations">
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <h1 className={styles.heroTitle}>{t('citizen.donations') || 'Dons'}</h1>
              <p className={styles.heroSubtitle}>{subtitle}</p>
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
              <h2 className={styles.cardTitle}>{t('citizen.makeDonation') || 'Faire un don'}</h2>
              <span className={styles.cardHint}>Orange / MTN • XAF</span>
            </div>
            <DonationForm
              prefilledAmount={5000}
              prefilledType="ponctuel"
              availablePaymentMethods={['mobile_money']}
              onSuccess={() => setRefreshTick((x) => x + 1)}
            />
            <p className={styles.note}>
              {t('citizen.donationsMockNote') ||
                'En dev, le paiement est simulé via une Edge Function. En production, la confirmation viendra via webhook de la passerelle.'}
            </p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('citizen.myDonations') || 'Mes dons'}</h2>
              <span className={styles.cardHint}>
                {resolvedEmail ? 'Compte connecté' : 'Dons récents'}
              </span>
            </div>
            <DonationHistory
              key={`${resolvedEmail || 'recent'}:${refreshTick}`}
              email={resolvedEmail || undefined}
              showRecent={!resolvedEmail}
            />
          </section>
        </div>
      </div>
    </CitizenLayout>
  );
};

