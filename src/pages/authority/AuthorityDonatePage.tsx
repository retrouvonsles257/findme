/**
 * Page dédiée "Faire un don" pour les autorités.
 * Même rendu que citoyen/opérateur (DonationPageContent).
 * Accessible depuis la page Dons et campagnes, pas depuis la sidebar.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { DonationPageContent } from '../../features/dons/components';
import { useAuth } from '../../contexts';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';

export const AuthorityDonatePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const emailFromUser = (user as any)?.email as string | undefined;
      if (emailFromUser) {
        if (!cancelled) setResolvedEmail(emailFromUser);
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
    return () => { cancelled = true; };
  }, [user]);

  return (
    <AuthorityLayout>
      <DonationPageContent
        pageTitle={t('authority.donations.makeDonation') || 'Faire un don'}
        onLogoClick={() => navigate('/authority/donations')}
        showHistory={true}
        userId={(user as any)?.id ?? undefined}
        email={resolvedEmail ?? (user as any)?.email ?? undefined}
      />
    </AuthorityLayout>
  );
};

export default AuthorityDonatePage;
