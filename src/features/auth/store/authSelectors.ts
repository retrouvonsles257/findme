/**
 * =====================================================
 * RETROUVONSLES - Auth Redux Selectors
 * Fonctions de sélection pour accéder à l'état auth
 * =====================================================
 */

import type { AuthStoreState } from '../types';

// ============================================
// ROOT SELECTOR
// ============================================

/**
 * Sélecteur racine pour l'état d'authentification
 */
export const selectAuthState = (state: any): AuthStoreState | null => state?.auth || null;

// ============================================
// USER SELECTORS
// ============================================

/**
 * Sélectionne l'utilisateur actuel
 */
export const selectUser = (state: any) => selectAuthState(state)?.user || null;

/**
 * Sélectionne l'ID de l'utilisateur
 */
export const selectUserId = (state: any) => selectAuthState(state)?.user?.id || null;

/**
 * Sélectionne l'email de l'utilisateur
 */
export const selectUserEmail = (state: any) => selectAuthState(state)?.user?.email || null;

/**
 * Sélectionne le type de compte de l'utilisateur
 */
export const selectUserType = (state: any) => selectAuthState(state)?.user?.typeCompte || null;

/**
 * Sélectionne le rôle de l'utilisateur
 */
export const selectUserRole = (state: any) => selectAuthState(state)?.user?.role || null;

/**
 * Sélectionne l'ID de l'organisation de l'utilisateur
 */
export const selectOrganisationId = (state: any) => selectAuthState(state)?.user?.organisationId || null;

/**
 * Sélectionne le nom complet de l'utilisateur
 */
export const selectUserFullName = (state: any) => {
  const user = selectUser(state);
  if (!user) return null;
  return `${user.nom || ''} ${user.prenom || ''}`.trim() || null;
};

/**
 * Sélectionne si le profil de l'utilisateur est complet
 */
export const selectIsProfileComplete = (state: any) => {
  const user = selectUser(state);
  return user?.isProfileComplete || false;
};

/**
 * Sélectionne si l'email de l'utilisateur est vérifié
 */
export const selectIsEmailVerified = (state: any) => {
  const user = selectUser(state);
  return user?.emailVerified || false;
};

/**
 * Sélectionne les permissions de l'utilisateur
 */
export const selectUserPermissions = (state: any) => {
  const user = selectUser(state);
  return user?.permissions || [];
};

/**
 * Sélectionne les préférences de l'utilisateur
 */
export const selectUserPreferences = (state: any) => {
  const user = selectUser(state);
  return user?.preferences || null;
};

// ============================================
// SESSION SELECTORS
// ============================================

/**
 * Sélectionne la session actuelle
 */
export const selectSession = (state: any) => selectAuthState(state)?.session || null;

/**
 * Sélectionne le token d'accès
 */
export const selectAccessToken = (state: any) => 
  selectAuthState(state)?.session?.accessToken || 
  selectAuthState(state)?.session?.access_token || 
  null;

/**
 * Sélectionne le token de rafraîchissement
 */
export const selectRefreshToken = (state: any) => 
  selectAuthState(state)?.session?.refreshToken || 
  selectAuthState(state)?.session?.refresh_token || 
  null;

/**
 * Sélectionne l'expiration du token
 */
export const selectTokenExpiry = (state: any) => 
  selectAuthState(state)?.session?.expiresAt || 
  selectAuthState(state)?.session?.expires_at || 
  null;

/**
 * Sélectionne si la session est valide
 */
export const selectIsSessionValid = (state: any) => {
  const session = selectSession(state);
  if (!session) return false;
  const expiresAt = selectTokenExpiry(state);
  if (!expiresAt) return false;
  const expTime = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt * 1000;
  return expTime > Date.now();
};

/**
 * Sélectionne le temps restant avant expiration du token (en secondes)
 */
export const selectTokenExpiresIn = (state: any) => {
  const expiresAt = selectTokenExpiry(state);
  if (!expiresAt) return 0;
  const expTime = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt * 1000;
  const timeRemaining = Math.floor((expTime - Date.now()) / 1000);
  return Math.max(0, timeRemaining);
};

/**
 * Sélectionne si le token doit être rafraîchi (moins de 5 min restantes)
 */
export const selectShouldRefreshToken = (state: any) => {
  const expiresIn = selectTokenExpiresIn(state);
  return expiresIn < 300; // 5 minutes
};

// ============================================
// AUTHENTICATION STATUS SELECTORS
// ============================================

/**
 * Sélectionne si l'utilisateur est authentifié
 */
export const selectIsAuthenticated = (state: any) => {
  const user = selectUser(state);
  const session = selectSession(state);
  return Boolean(user && session && selectIsSessionValid(state));
};

/**
 * Sélectionne si l'authentification est en cours
 */
export const selectIsAuthenticating = (state: any) => selectAuthState(state)?.isAuthenticating || false;

/**
 * Sélectionne l'état de chargement auth (connexion en cours OU restauration de session).
 * Utilisé par les routes protégées pour afficher "Chargement..." avant de rediriger vers login.
 */
export const selectAuthLoading = (state: any) => {
  const auth = selectAuthState(state);
  return Boolean(auth?.isAuthenticating || auth?.isLoading);
};

/**
 * Sélectionne si la déconnexion est en cours
 */
export const selectIsLoggingOut = (state: any) => selectAuthState(state)?.isLogout || false;

/**
 * Sélectionne l'état de chargement général
 */
export const selectIsLoading = (state: any) => selectAuthState(state)?.isLoading || false;

/**
 * Sélectionne si la réinitialisation du mot de passe est en cours
 */
export const selectIsPasswordResetting = (state: any) =>
  selectAuthState(state)?.isPasswordResetting || false;

// ============================================
// ERROR SELECTORS
// ============================================

/**
 * Sélectionne le message d'erreur global
 */
export const selectAuthError = (state: any) => selectAuthState(state)?.error || null;

/**
 * Sélectionne les erreurs par champ
 */
export const selectAuthErrors = (state: any) => selectAuthState(state)?.errors || {};

/**
 * Sélectionne une erreur spécifique par champ
 */
export const selectErrorByField = (state: any, fieldName: string) =>
  selectAuthErrors(state)[fieldName] || null;

/**
 * Sélectionne si une erreur spécifique existe
 */
export const selectHasError = (state: any, fieldName?: string) => {
  if (fieldName) {
    return Boolean(selectErrorByField(state, fieldName));
  }
  return Boolean(selectAuthError(state)) || Object.keys(selectAuthErrors(state)).length > 0;
};

// ============================================
// ACCOUNT LOCK SELECTORS
// ============================================

/**
 * Sélectionne si le compte est verrouillé
 */
export const selectIsAccountLocked = (state: any) => selectAuthState(state)?.isAccountLocked || false;

/**
 * Sélectionne la date d'expiration du verrouillage
 */
export const selectLockoutExpiration = (state: any) => selectAuthState(state)?.lockoutExpiration || null;

/**
 * Sélectionne le nombre de tentatives de connexion
 */
export const selectLoginAttempts = (state: any) => selectAuthState(state)?.loginAttempts || 0;

/**
 * Sélectionne le temps restant de verrouillage (en secondes)
 */
export const selectLockoutTimeRemaining = (state: any) => {
  const expiration = selectLockoutExpiration(state);
  if (!expiration) return 0;
  const lockoutTime = new Date(expiration).getTime();
  const timeRemaining = Math.floor((lockoutTime - Date.now()) / 1000);
  return Math.max(0, timeRemaining);
};

/**
 * Sélectionne si le compte peut être déverrouillé
 */
export const selectCanUnlockAccount = (state: any) => {
  const timeRemaining = selectLockoutTimeRemaining(state);
  return timeRemaining <= 0 && selectIsAccountLocked(state);
};

// ============================================
// PASSWORD RESET SELECTORS
// =============================================

/**
 * Sélectionne le token de réinitialisation de mot de passe
 */
export const selectPasswordResetToken = (state: any) =>
  selectAuthState(state)?.passwordResetToken || null;

/**
 * Sélectionne l'email pour la réinitialisation de mot de passe
 */
export const selectPasswordResetEmail = (state: any) =>
  selectAuthState(state)?.passwordResetEmail || null;

/**
 * Sélectionne l'expiration du token de réinitialisation
 */
export const selectPasswordResetExpiration = (state: any) =>
  selectAuthState(state)?.passwordResetExpiration || null;

/**
 * Sélectionne si le token de réinitialisation est valide
 */
export const selectIsPasswordResetTokenValid = (state: any) => {
  const expiration = selectPasswordResetExpiration(state);
  if (!expiration) return false;
  return new Date(expiration).getTime() > Date.now();
};

// ============================================
// EMAIL VERIFICATION SELECTORS
// ============================================

/**
 * Sélectionne le token de vérification d'email
 */
export const selectEmailVerificationToken = (state: any) =>
  selectAuthState(state)?.emailVerificationToken || null;

/**
 * Sélectionne l'email en attente de vérification
 */
export const selectEmailVerificationEmail = (state: any) =>
  selectAuthState(state)?.emailVerificationEmail || null;

/**
 * Sélectionne si une vérification d'email est en cours
 */
export const selectIsEmailVerificationPending = (state: any) =>
  Boolean(selectEmailVerificationEmail(state));

// ============================================
// 2FA SELECTORS
// ============================================

/**
 * Sélectionne si la 2FA est activée
 */
export const selectIsTwoFactorEnabled = (state: any) => selectAuthState(state)?.twoFactorEnabled || false;

/**
 * Sélectionne si la 2FA est en attente
 */
export const selectIsTwoFactorPending = (state: any) => selectAuthState(state)?.twoFactorPending || false;

// ============================================
// PERMISSION CHECKERS
// ============================================

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export const selectHasPermission = (state: any, permission: string) => {
  const permissions = selectUserPermissions(state);
  return permissions.includes(permission);
};

/**
 * Vérifie si l'utilisateur a toutes les permissions spécifiées
 */
export const selectHasAllPermissions = (state: any, permissions: string[]) => {
  const userPermissions = selectUserPermissions(state);
  return permissions.every((permission) => userPermissions.includes(permission));
};

/**
 * Vérifie si l'utilisateur a au moins une permission spécifiée
 */
export const selectHasAnyPermission = (state: any, permissions: string[]) => {
  const userPermissions = selectUserPermissions(state);
  return permissions.some((permission) => userPermissions.includes(permission));
};

// ============================================
// ROLE CHECKERS
// ============================================

/**
 * Vérifie si l'utilisateur est un administrateur
 */
export const selectIsAdmin = (state: any) => {
  const role = selectUserRole(state);
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
};

/**
 * Vérifie si l'utilisateur est une organisation
 */
export const selectIsOrganisation = (state: any) => {
  const userType = selectUserType(state);
  return userType === 'AUTORITE';
};

/**
 * Vérifie si l'utilisateur est un utilisateur public
 */
export const selectIsPublicUser = (state: any) => {
  const userType = selectUserType(state);
  return userType === 'GRAND_PUBLIC';
};

// ============================================
// COMBINED STATUS SELECTORS
// ============================================

/**
 * Sélectionne l'état d'authentification complet
 */
export const selectAuthStatus = (state: any) => ({
  isAuthenticated: selectIsAuthenticated(state),
  isAuthenticating: selectIsAuthenticating(state),
  isLoggingOut: selectIsLoggingOut(state),
  isLoading: selectIsLoading(state),
  user: selectUser(state),
  session: selectSession(state),
  error: selectAuthError(state),
  isAccountLocked: selectIsAccountLocked(state),
  isTwoFactorEnabled: selectIsTwoFactorEnabled(state),
});
