import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModerationLayout } from './ModerationLayout';
import { DonationPageContent } from '../../features/dons/components';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';

export const ModeratorDonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

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
    return () => { cancelled = true; };
  }, [currentUser]);

  return (
    <ModerationLayout title="Dons" activeNav="donations">
      <DonationPageContent
        onLogoClick={() => navigate('/moderator')}
        showHistory={true}
        userId={(currentUser as any)?.id ?? undefined}
        email={resolvedEmail}
      />
    </ModerationLayout>
  );
};

export default ModeratorDonationsPage;
