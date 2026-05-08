/**
 * =====================================================
 * RETROUVONSLES - Token Service
 * Gestion des tokens JWT et tokens de session
 * =====================================================
 */

import { supabase } from '../../../config/supabase.config';

const TOKEN_STORAGE_KEY = 'retrouvonsles_token';
const REFRESH_TOKEN_STORAGE_KEY = 'retrouvonsles_refresh_token';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before actual expiry

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  type?: string;
}

export interface DecodedToken {
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email: string;
  [key: string]: any;
}

/**
 * Save tokens to localStorage
 */
export const saveTokens = (tokenInfo: TokenInfo): void => {
  try {
    const expiresAt = tokenInfo.expiresAt || Date.now() + (tokenInfo.expiresIn || 3600) * 1000;

    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({
        accessToken: tokenInfo.accessToken,
        expiresAt,
        type: tokenInfo.type || 'Bearer'
      })
    );

    if (tokenInfo.refreshToken) {
      localStorage.setItem(
        REFRESH_TOKEN_STORAGE_KEY,
        JSON.stringify({
          refreshToken: tokenInfo.refreshToken
        })
      );
    }
  } catch (err) {
    console.error('Error saving tokens:', err);
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokenData) return null;

    const { accessToken, expiresAt } = JSON.parse(tokenData);

    // Check if token is expired
    if (expiresAt && Date.now() > expiresAt) {
      clearTokens();
      return null;
    }

    return accessToken || null;
  } catch (err) {
    console.error('Error getting access token:', err);
    return null;
  }
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    const tokenData = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!tokenData) return null;

    const { refreshToken } = JSON.parse(tokenData);
    return refreshToken || null;
  } catch (err) {
    console.error('Error getting refresh token:', err);
    return null;
  }
};

/**
 * Decode JWT token (without verification)
 * @param token JWT token to decode
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded as DecodedToken;
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // Consider token expired if it expires within the buffer time
    const expiresAt = decoded.exp * 1000;
    return Date.now() > expiresAt - TOKEN_EXPIRY_BUFFER;
  } catch (err) {
    console.error('Error checking token expiry:', err);
    return true;
  }
};

/**
 * Check if token needs refresh
 */
export const shouldRefreshToken = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    // Refresh if token expires within the buffer time
    const expiresAt = decoded.exp * 1000;
    return Date.now() > expiresAt - TOKEN_EXPIRY_BUFFER;
  } catch (err) {
    console.error('Error checking token refresh status:', err);
    return false;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<TokenInfo | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      clearTokens();
      return null;
    }

    const tokenInfo: TokenInfo = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      type: 'Bearer'
    };

    saveTokens(tokenInfo);
    return tokenInfo;
  } catch (err) {
    console.error('Error refreshing access token:', err);
    clearTokens();
    return null;
  }
};

/**
 * Validate token with server
 */
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error validating token:', err);
    return false;
  }
};

/**
 * Get token expiry time in seconds
 */
export const getTokenExpiryTime = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    const secondsRemaining = Math.floor((expiresAt - now) / 1000);

    return Math.max(0, secondsRemaining);
  } catch (err) {
    console.error('Error getting token expiry time:', err);
    return null;
  }
};

/**
 * Clear all stored tokens
 */
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing tokens:', err);
  }
};

/**
 * Get all stored token info
 */
export const getStoredTokenInfo = (): TokenInfo | null => {
  try {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokenData) return null;

    const { accessToken, expiresAt, type } = JSON.parse(tokenData);
    const refreshToken = getRefreshToken();

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt,
      type
    };
  } catch (err) {
    console.error('Error getting stored token info:', err);
    return null;
  }
};

/**
 * Export token data for debugging/monitoring
 */
export const exportTokenData = (): { token: TokenInfo | null; isExpired: boolean; timeRemaining: number | null } => {
  try {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo) {
      return {
        token: null,
        isExpired: true,
        timeRemaining: null
      };
    }

    const isExpired = isTokenExpired(tokenInfo.accessToken);
    const timeRemaining = getTokenExpiryTime(tokenInfo.accessToken);

    return {
      token: tokenInfo,
      isExpired,
      timeRemaining
    };
  } catch (err) {
    console.error('Error exporting token data:', err);
    return {
      token: null,
      isExpired: true,
      timeRemaining: null
    };
  }
};
