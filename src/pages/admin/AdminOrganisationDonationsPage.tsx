/**
 * RETROUVONSLES - Admin Organisation Donations Page
 * Même rendu que les autres acteurs : DonationPageContent (formulaire + historique).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { DonationPageContent } from '../../features/dons/components';
import { useAuth } from '../../contexts';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';

export const AdminOrganisationDonationsPage: React.FC = () => {
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
    <AdminOrganisationLayout title={t('admin.donations') || 'Dons'} activeNav="donations">
      <DonationPageContent
        onLogoClick={() => navigate('/admin')}
        showHistory={true}
        userId={(user as any)?.id ?? undefined}
        email={resolvedEmail ?? (user as any)?.email ?? undefined}
      />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDonationsPage;
