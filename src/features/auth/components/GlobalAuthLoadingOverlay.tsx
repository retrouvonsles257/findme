/**
 * Overlay global : restauration de session au chargement / F5, déconnexion.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { useAppSelector } from '../../../store/hooks';
import { selectIsLoading, selectIsLoggingOut } from '../store/authSelectors';
import { AppLoadingShell } from '../../../components/shell/AppLoadingShell';

export const GlobalAuthLoadingOverlay: React.FC = () => {
  const isLogout = useAppSelector(selectIsLoggingOut);
  const isSessionLoading = useAppSelector(selectIsLoading);

  const show = isLogout || isSessionLoading;
  if (!show) {
    return null;
  }

  const variant = isLogout ? 'logout' : 'session';

  return createPortal(<AppLoadingShell variant={variant} fixed />, document.body);
};
