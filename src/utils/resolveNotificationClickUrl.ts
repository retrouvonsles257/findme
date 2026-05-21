import { envConfig } from '../config/env.config';

const DEFAULT_CITIZEN_PATH = '/citizen/notifications';

/**
 * URL absolue pour le clic sur une notification push (FCM / SW).
 * Priorité : clickUrl absolu du payload → base publique (build) + chemin relatif.
 */
export function resolveNotificationClickUrl(
  clickUrl: string | null | undefined,
  fallbackPath: string = DEFAULT_CITIZEN_PATH,
): string {
  const raw = (typeof clickUrl === 'string' ? clickUrl : '').trim() || fallbackPath;
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const base = (envConfig.REACT_APP_API_BASE_URL || 'https://retrouvonsles.te-sea.com').replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}
