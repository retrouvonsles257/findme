/**
 * =====================================================
 * RETROUVONSLES - Auth Helper Utilities
 * Fonctions utilitaires pour l'authentification
 * =====================================================
 */

import type { AuthUser, AuthSession } from '../types';

// ============================================
// USER FORMATTING FUNCTIONS
// ============================================

/**
 * Formate le nom complet de l'utilisateur
 */
export const formatUserName = (user: AuthUser | null | undefined): string => {
  if (!user) return '';
  const firstName = user.prenom || '';
  const lastName = user.nom || '';
  return `${firstName} ${lastName}`.trim();
};

/**
 * Formate le nom de l'utilisateur pour l'affichage
 */
export const formatUserDisplayName = (user: AuthUser | null | undefined): string => {
  if (!user) return 'Utilisateur inconnu';
  return formatUserName(user) || user.email || 'Utilisateur';
};

/**
 * Obtient les initiales de l'utilisateur
 */
export const getUserInitials = (user: AuthUser | null | undefined): string => {
  if (!user) return '';
  const firstName = user.prenom?.charAt(0)?.toUpperCase() || '';
  const lastName = user.nom?.charAt(0)?.toUpperCase() || '';
  return `${firstName}${lastName}`;
};

/**
 * Formate l'email de l'utilisateur
 */
export const formatUserEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

/**
 * Masque un email pour des raisons de confidentialité
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  const visibleChars = Math.max(1, Math.floor(localPart.length / 2));
  const maskedLocalPart = localPart.substring(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);
  return `${maskedLocalPart}@${domain}`;
};

// ============================================
// PHONE FORMATTING FUNCTIONS
// ============================================

/**
 * Formate un numéro de téléphone
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  // Format: +33 X XX XX XX XX (French format)
  if (cleaned.length === 10 || cleaned.length === 11) {
    if (cleaned.startsWith('0')) {
      const withoutZero = cleaned.substring(1);
      return `+33 ${withoutZero.charAt(0)} ${withoutZero.substring(1, 3)} ${withoutZero.substring(3, 5)} ${withoutZero.substring(5, 7)} ${withoutZero.substring(7)}`;
    }
  }

  // Format international: +XXX XXX XXX XX XX
  if (cleaned.length >= 10) {
    const countryCode = cleaned.substring(0, cleaned.length - 9);
    const number = cleaned.substring(cleaned.length - 9);
    return `+${countryCode} ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 8)} ${number.substring(8)}`;
  }

  return phone;
};

// ============================================
// DATE & TIME FORMATTING FUNCTIONS
// ============================================

/**
 * Formate une date ISO en format lisible
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

/**
 * Formate une date et heure
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Obtient le temps relatif depuis une date (ex: "il y a 2 heures")
 */
export const getRelativeTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

    return formatDate(date);
  } catch {
    return '';
  }
};

/**
 * Formate un temps en secondes (ex: "01:30:45")
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

/**
 * Obtient le temps restant (en format lisible)
 */
export const getTimeRemaining = (expiresAt: string | Date | null | undefined): string => {
  if (!expiresAt) return '';

  try {
    const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expiré';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs} secondes`;
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  } catch {
    return '';
  }
};

// ============================================
// SESSION & TOKEN FUNCTIONS
// ============================================

/**
 * Calcule la durée de la session
 */
export const calculateSessionDuration = (expiresAt: string | Date | null | undefined): string => {
  if (!expiresAt) return 'Durée inconnue';

  try {
    const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) return 'Session expirée';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    if (diffMins > 0) return `${diffMins}m`;
    return `${diffSecs}s`;
  } catch {
    return 'Durée inconnue';
  }
};

/**
 * Obtient l'expiration du token (en secondes)
 */
export const getTokenExpiry = (token: string | null | undefined): number => {
  if (!token) return 0;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded.exp || 0;
  } catch {
    return 0;
  }
};

/**
 * Vérifie si un token est expiré
 */
export const isTokenExpired = (token: string | null | undefined): boolean => {
  const exp = getTokenExpiry(token);
  if (exp === 0) return true;
  return Math.floor(Date.now() / 1000) > exp;
};

/**
 * Obtient le temps avant expiration du token (en secondes)
 */
export const getTokenTimeRemaining = (token: string | null | undefined): number => {
  const exp = getTokenExpiry(token);
  if (exp === 0) return 0;
  const remaining = exp - Math.floor(Date.now() / 1000);
  return Math.max(0, remaining);
};

/**
 * Vérifie si un token doit être rafraîchi
 */
export const shouldRefreshToken = (token: string | null | undefined): boolean => {
  const timeRemaining = getTokenTimeRemaining(token);
  return timeRemaining < 300; // 5 minutes
};

// ============================================
// JWT PARSING FUNCTIONS
// ============================================

/**
 * Parse un token JWT
 */
export const parseJWT = (token: string | null | undefined): Record<string, any> | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Obtient le payload d'un token JWT
 */
export const getJWTPayload = (token: string | null | undefined): Record<string, any> | null =>
  parseJWT(token);

/**
 * Obtient un claim spécifique du token
 */
export const getJWTClaim = (
  token: string | null | undefined,
  claimName: string,
): any => {
  const payload = parseJWT(token);
  return payload ? payload[claimName] : null;
};

// ============================================
// CREDENTIAL HANDLING FUNCTIONS
// ============================================

/**
 * Sécurise un mot de passe (le rend illisible)
 */
export const obscurePassword = (password: string): string => {
  return '*'.repeat(Math.min(password.length, 20));
};

/**
 * Obtient le message d'erreur d'authentification approprié
 */
export const getAuthErrorMessage = (errorCode: string | null | undefined): string => {
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    USER_NOT_FOUND: 'Aucun compte n\'existe avec cet email',
    ACCOUNT_LOCKED: 'Votre compte a été verrouillé après trop de tentatives. Réessayez dans 15 minutes.',
    EMAIL_NOT_VERIFIED: 'Votre email n\'a pas été vérifié',
    ACCOUNT_DISABLED: 'Votre compte a été désactivé',
    INVALID_TOKEN: 'Token d\'authentification invalide',
    TOKEN_EXPIRED: 'Token d\'authentification expiré',
    SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
    WEAK_PASSWORD: 'Le mot de passe est trop faible',
    PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
    EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
    INVALID_EMAIL: 'Format d\'email invalide',
    NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
    SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  };

  return messages[errorCode || ''] || 'Une erreur s\'est produite. Veuillez réessayer.';
};

// ============================================
// TYPE CHECKING FUNCTIONS
// ============================================

/**
 * Vérifie si un objet est un utilisateur valide
 */
export const isValidUser = (user: any): user is AuthUser => {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.email === 'string'
  );
};

/**
 * Vérifie si un objet est une session valide
 */
export const isValidSession = (session: any): session is AuthSession => {
  return (
    typeof session === 'object' &&
    session !== null &&
    typeof session.accessToken === 'string' &&
    typeof session.expiresAt === 'string'
  );
};

// ============================================
// ACCOUNT TYPE FUNCTIONS
// ============================================

/**
 * Obtient le label du type de compte
 */
export const getAccountTypeLabel = (typeCompte: string | null | undefined): string => {
  const labels: Record<string, string> = {
    GRAND_PUBLIC: 'Utilisateur public',
    AUTORITE: 'Autorité / Organisation',
  };
  return labels[typeCompte || ''] || 'Type inconnu';
};

/**
 * Obtient le label du rôle
 */
export const getRoleLabel = (role: string | null | undefined): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrateur',
    SUPER_ADMIN: 'Super Administrateur',
    MODERATOR: 'Modérateur',
    USER: 'Utilisateur',
  };
  return labels[role || ''] || 'Rôle inconnu';
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extrait les informations de l'utilisateur depuis un token
 */
export const extractUserInfoFromToken = (
  token: string | null | undefined,
): Partial<AuthUser> | null => {
  const payload = parseJWT(token);
  if (!payload) return null;

  return {
    id: payload.sub || payload.id,
    email: payload.email,
    prenom: payload.given_name,
    nom: payload.family_name,
    typeCompte: payload.type_compte,
    role: payload.role,
  };
};

/**
 * Obtient le statut de vérification d'email
 */
export const getEmailVerificationStatus = (user: AuthUser | null | undefined): string => {
  if (!user) return 'Non vérifié';
  return user.emailVerified ? 'Vérifié' : 'Non vérifié';
};

/**
 * Obtient le statut du compte
 */
export const getAccountStatus = (user: AuthUser | null | undefined): string => {
  if (!user) return 'Inactif';
  if (user.isProfileComplete === false) return 'Profil incomplet';
  if (user.emailVerified === false) return 'Email non vérifié';
  return 'Actif';
};
