import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OperatorLayout } from './OperatorLayout';
import { DonationPageContent } from '../../features/dons/components';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { supabase } from '../../config';

export const OperatorDonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
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
    <OperatorLayout title="Dons">
      <DonationPageContent
        onLogoClick={() => navigate('/operator')}
        showHistory={true}
        userId={(currentUser as any)?.id ?? undefined}
        email={resolvedEmail}
      />
    </OperatorLayout>
  );
};

export default OperatorDonationsPage;
