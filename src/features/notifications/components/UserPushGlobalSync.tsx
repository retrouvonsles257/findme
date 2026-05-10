import React, { useMemo } from 'react';
import { useAppSelector } from '../../../store/types';
import { selectUser } from '../../auth/store/authSelectors';
import { useCitizenPushSync } from '../hooks/useCitizenPushSync';

/**
 * FCM + Realtime « notification » pour tout compte Supabase connecté (citoyen, autorité, etc.),
 * avec la même chaîne que l’espace citoyen (seul chemin validé en production).
 */
export const UserPushGlobalSync: React.FC = () => {
  const user = useAppSelector(selectUser) as {
    id?: string;
    is_anonymous?: boolean;
    type_compte?: string;
    role?: string;
    organisation_id?: string;
  } | null;

  const userId = user?.id;
  /** Session anonyme : même `id` que auth.uid() → push FCM + demandes notif (pas « guest » ici). */
  const pushUserId = userId ? userId : undefined;

  const logContext = useMemo(
    () => ({
      type_compte: user?.type_compte,
      role: user?.role,
      organisation_id: user?.organisation_id,
    }),
    [user?.type_compte, user?.role, user?.organisation_id],
  );

  useCitizenPushSync(pushUserId, { isGuest: !pushUserId, logContext });

  return null;
};
