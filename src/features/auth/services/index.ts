/**
 * =====================================================
 * Auth Services Barrel Export
 * Tous les services d'authentification
 * =====================================================
 */

// Session Service Exports
export {
  saveSessionLocally,
  getSessionFromStorage,
  saveUserLocally,
  getUserFromStorage,
  isSessionExpired,
  validateToken,
  clearSession,
  getCurrentSession,
  getCurrentUser,
  getSessionAndUser,
  onAuthStateChange,
  exportSessionData
} from './sessionService';

// Token Service Exports
export {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  decodeToken,
  isTokenExpired,
  shouldRefreshToken,
  refreshAccessToken,
  validateToken as validateTokenWithServer,
  getTokenExpiryTime,
  clearTokens,
  getStoredTokenInfo,
  exportTokenData,
  type TokenInfo,
  type DecodedToken
} from './tokenService';

// Auth Service Exports
export {
  initializeAuthService,
  getCurrentAuthState,
  isAuthenticated,
  ensureValidToken,
  getAuthHeader,
  setupAuthListener,
  logoutAuthService,
  exportAuthData,
  type AuthError,
  type AuthUser,
  type AuthSession,
  type AuthResponse
} from './authService';
