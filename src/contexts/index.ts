/**
 * =====================================================
 * RETROUVONSLES - Contexts Index
 * Exports centralisés pour tous les contextes
 * =====================================================
 */

// Auth Context & Provider
export { AuthContext, useAuth } from './AuthContext';
export type { AuthContextType } from './AuthContext';
export { AuthProvider } from './AuthProvider';

// Geolocation Context & Provider
export { GeolocationContext, useGeolocation } from './GeolocaltionContext';
export type { GeolocationContextType, GeolocationCoordinates } from './GeolocaltionContext';
export { GeolocationProvider } from './GeolocationProvider';

// Language Context & Provider
export { LanguageContext, useLanguage, useTranslation } from './LanguageContext';
export type { LanguageContextType, SupportedLanguage, Translations } from './LanguageContext';
export { LanguageProvider } from './LanguageProvider';

// Notification Context & Provider
export { NotificationContext, useNotification } from './NotificationContext';
export type { NotificationContextType, NotificationOptions } from './NotificationContext';
export { NotificationProvider } from './NotificationProvider';

// Theme Context & Provider
export { ThemeContext, useTheme } from './ThemeContext';
export type { ThemeContextType, ThemeMode, ThemeConfig } from './ThemeContext';
export { ThemeProvider } from './ThemeProvider';

// WebSocket Context & Provider
export { WebSocketContext, useWebSocket } from './WebSocketContext';
export type { WebSocketContextType, WebSocketMessage, ConnectionStatus } from './WebSocketContext';
export { WebSocketProvider } from './WebSocketProvider';
