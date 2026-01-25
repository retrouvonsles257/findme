/**
 * =====================================================
 * useAuth Hook
 * Hook personnalisé pour accéder au contexte d'authentification
 * =====================================================
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '../../../contexts/AuthContext';

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * Doit être utilisé dans un composant enfant d'AuthProvider
 *
 * @returns {AuthContextType} Le contexte d'authentification
 * @throws {Error} Si utilisé en dehors d'un AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  return context;
};
