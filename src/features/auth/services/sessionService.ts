/**
 * =====================================================
 * Session Service
 * Gestion de la session utilisateur
 * =====================================================
 */

import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../../config/supabase.config';

const SESSION_STORAGE_KEY = 'retrouvonsles_session';
const USER_STORAGE_KEY = 'retrouvonsles_user';

/**
 * Sauvegarde la session en stockage local
 */
export const saveSessionLocally = (session: Session | null): void => {
  if (session) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.error('[SessionService] Erreur lors de la sauvegarde de la session:', err);
    }
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

/**
 * Récupère la session du stockage local
 */
export const getSessionFromStorage = (): Session | null => {
  try {
    const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (err) {
    console.error('[SessionService] Erreur lors de la récupération de la session:', err);
    return null;
  }
};

/**
 * Sauvegarde l'utilisateur en stockage local
 */
export const saveUserLocally = (user: User | null): void => {
  if (user) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('[SessionService] Erreur lors de la sauvegarde de l\'utilisateur:', err);
    }
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

/**
 * Récupère l'utilisateur du stockage local
 */
export const getUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('[SessionService] Erreur lors de la récupération de l\'utilisateur:', err);
    return null;
  }
};

/**
 * Valide si la session est expirée
 */
export const isSessionExpired = (session: Session | null): boolean => {
  if (!session || !session.expires_at) {
    return true;
  }
  return Date.now() / 1000 > session.expires_at;
};

/**
 * Valide si le token est valide
 */
export const validateToken = (token: string | null): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  try {
    const parts = token.split('.');
    return parts.length === 3;
  } catch {
    return false;
  }
};

/**
 * Nettoie les données de session
 */
export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error('[SessionService] Erreur lors du nettoyage de la session:', err);
  }
};

/**
 * Récupère la session actuelle depuis Supabase
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[SessionService] Erreur lors de la récupération:', error);
      return null;
    }

    if (session) {
      saveSessionLocally(session);
    }

    return session;
  } catch (err) {
    console.error('[SessionService] Erreur inattendue:', err);
    return null;
  }
};

/**
 * Récupère l'utilisateur actuel depuis Supabase
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[SessionService] Erreur lors de la récupération:', error);
      return null;
    }

    if (user) {
      saveUserLocally(user);
    }

    return user;
  } catch (err) {
    console.error('[SessionService] Erreur inattendue:', err);
    return null;
  }
};

/**
 * Récupère la session et l'utilisateur
 */
export const getSessionAndUser = async (): Promise<{
  session: Session | null;
  user: User | null;
}> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[SessionService] Erreur:', error);
      return { session: null, user: null };
    }

    const user = session?.user || null;

    if (session) {
      saveSessionLocally(session);
    }
    if (user) {
      saveUserLocally(user);
    }

    return { session, user };
  } catch (err) {
    console.error('[SessionService] Erreur inattendue:', err);
    return { session: null, user: null };
  }
};

/**
 * Écoute les changements de session
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
): (() => void) => {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);

    if (session) {
      saveSessionLocally(session);
      if (session.user) {
        saveUserLocally(session.user);
      }
    } else {
      clearSession();
    }
  });

  return () => subscription?.unsubscribe();
};

/**
 * Exporte les informations de session
 */
export const exportSessionData = (): {
  session: Session | null;
  user: User | null;
  isExpired: boolean;
} => {
  const session = getSessionFromStorage();
  const user = getUserFromStorage();

  return {
    session,
    user,
    isExpired: isSessionExpired(session)
  };
};
