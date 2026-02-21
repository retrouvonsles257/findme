/**
 * RETROUVONSLES - NGO Donations Page
 * Même rendu que les autres acteurs : DonationPageContent (formulaire + historique).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NGOLayout } from '../../components/layout';
import { DonationPageContent } from '../../features/dons/components';
import { useAuth } from '../../contexts';
import { supabase } from '../../config';

export const NGODonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const emailFromUser = user?.email as string | undefined;
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
    <NGOLayout>
      <DonationPageContent
        onLogoClick={() => navigate('/ngo')}
        showHistory={true}
        userId={(user as any)?.id ?? undefined}
        email={resolvedEmail ?? (user as any)?.email ?? undefined}
        pageTitle="Dons"
      />
    </NGOLayout>
  );
};
