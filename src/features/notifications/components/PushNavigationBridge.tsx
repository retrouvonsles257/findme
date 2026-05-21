/**
 * Navigation SPA depuis les clics notification (SW / FCM) quand l’app est déjà ouverte.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { envConfig } from '../../../config';

const PENDING_KEY = 'rll_pending_push_url';

function toInAppPath(url: string): string | null {
  const raw = (url || '').trim();
  if (!raw) return null;
  try {
    const base = (envConfig.REACT_APP_API_BASE_URL || window.location.origin).replace(/\/$/, '');
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      const baseOrigin = new URL(base).origin;
      if (u.origin !== baseOrigin && u.origin !== window.location.origin) return null;
      const path = `${u.pathname}${u.search}${u.hash}`;
      return path.length > 1 ? path : null;
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
  } catch {
    return raw.startsWith('/') ? raw : null;
  }
}

export const PushNavigationBridge: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const go = (url: string) => {
      const path = toInAppPath(url);
      if (!path) return;
      navigate(path);
    };

    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_KEY);
        go(pending);
      }
    } catch {
      /* ignore */
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | null;
      if (data?.type === 'NOTIFICATION_CLICK' && data.url) {
        go(data.url);
      }
    };

    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [navigate]);

  return null;
};

export function stashPendingPushUrl(url: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, url);
  } catch {
    /* ignore */
  }
}
