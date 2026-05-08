import React from 'react';
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
  } | null;

  const userId = user?.id;
  const pushUserId = userId ? userId : undefined;

  useCitizenPushSync(pushUserId, { isGuest: !pushUserId });

  return null;
};
