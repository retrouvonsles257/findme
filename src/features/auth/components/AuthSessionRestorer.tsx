/**
 * =====================================================
 * RETROUVONSLES - Auth Session Restorer
 * Restaure la session Redux au chargement de l'app (refresh, nouvel onglet).
 * Doit être monté une seule fois, à l'intérieur du Redux Provider.
 * =====================================================
 */

import { useEffect } from 'react';
import { useAppDispatch } from '../../../store/types';
import { restoreSessionThunk } from '../store/authThunks';

/**
 * Composant invisible qui dispatch restoreSessionThunk au montage.
 * Les routes protégées utilisent selectAuthLoading (isAuthenticating || isLoading)
 * et affichent "Chargement..." jusqu'à ce que la restauration soit terminée.
 */
export const AuthSessionRestorer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreSessionThunk());
  }, [dispatch]);

  return null;
};
