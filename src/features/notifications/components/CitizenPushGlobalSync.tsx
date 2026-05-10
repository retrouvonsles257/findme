/**
 * FCM + abonnement Realtime « notification » pour tout citoyen connecté,
 * quel que soit la route (/citizen, /auth, page d’accueil…).
 * Indispensable pour que le SW reste utilisable et que les pushes arrivent hors espace citoyen / onglet fermé (selon OS/navigateur).
 */
import React, { useMemo } from 'react';
import { useAppSelector } from '../../../store/types';
import { selectUser } from '../../auth/store/authSelectors';
import { TypeCompte } from '../../../@types/enums.types';
import { useCitizenPushSync } from '../hooks/useCitizenPushSync';

export const CitizenPushGlobalSync: React.FC = () => {
  const user = useAppSelector(selectUser) as {
    id?: string;
    typeCompte?: string;
    type_compte?: string;
    role?: string;
    organisation_id?: string;
    is_anonymous?: boolean;
  } | null;

  const userId = user?.id;
  const type = user?.typeCompte || user?.type_compte;
  const isCitizen = type === TypeCompte.GRAND_PUBLIC;
  /** Invité anonyme en `grand_public` : même `effectiveUserId` (pas exclu du sync si ce composant est monté). */
  const effectiveUserId = userId && isCitizen ? userId : undefined;

  const logContext = useMemo(
    () => ({
      type_compte: type,
      role: user?.role,
      organisation_id: user?.organisation_id,
    }),
    [type, user?.role, user?.organisation_id],
  );

  useCitizenPushSync(effectiveUserId, { isGuest: !effectiveUserId, logContext });

  return null;
};
