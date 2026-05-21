/**
 * Génère public/firebase-messaging-sw.js depuis .env (clés Firebase Web = publiques).
 * Exécuté en prestart / prebuild pour garder le SW aligné avec REACT_APP_FIREBASE_*.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const outPath = path.join(root, 'public', 'firebase-messaging-sw.js');

const env = {};
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
}

/** Valeurs publiques Firebase Web (fallback si build sans .env — évite SW sans projectId en prod). */
const FIREBASE_WEB_DEFAULTS = {
  apiKey: 'AIzaSyDTW6ke_Qgpt4wXkkoCYUtgBTz1FhDDLPk',
  authDomain: 'retrouvonsles-57693.firebaseapp.com',
  projectId: 'retrouvonsles-57693',
  storageBucket: 'retrouvonsles-57693.firebasestorage.app',
  messagingSenderId: '168282453701',
  appId: '1:168282453701:web:2a6bbed8ff9384922462ac',
};

const config = {
  apiKey: env.REACT_APP_FIREBASE_API_KEY || FIREBASE_WEB_DEFAULTS.apiKey,
  authDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN || FIREBASE_WEB_DEFAULTS.authDomain,
  projectId: env.REACT_APP_FIREBASE_PROJECT_ID || FIREBASE_WEB_DEFAULTS.projectId,
  storageBucket: env.REACT_APP_FIREBASE_STORAGE_BUCKET || FIREBASE_WEB_DEFAULTS.storageBucket,
  messagingSenderId:
    env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_WEB_DEFAULTS.messagingSenderId,
  appId: env.REACT_APP_FIREBASE_APP_ID || FIREBASE_WEB_DEFAULTS.appId,
};

const appPublicBaseUrl = (
  env.REACT_APP_API_BASE_URL ||
  env.PUBLIC_APP_URL ||
  'https://retrouvonsles.te-sea.com'
).replace(/\/$/, '');

const js = `/* Généré par scripts/generate-firebase-messaging-sw.mjs — ne pas éditer à la main */
importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config)});
var APP_PUBLIC_BASE_URL = ${JSON.stringify(appPublicBaseUrl)};
function resolveNotificationTarget(clickUrl, fallbackPath) {
  var raw = (typeof clickUrl === 'string' && clickUrl.trim()) ? clickUrl.trim() : (fallbackPath || '/citizen/notifications');
  if (raw.indexOf('http://') === 0 || raw.indexOf('https://') === 0) {
    return raw;
  }
  var base = APP_PUBLIC_BASE_URL.replace(/\\/$/, '');
  var path = raw.charAt(0) === '/' ? raw : '/' + raw;
  return base + path;
}
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function (payload) {
  var n = payload.notification || {};
  var title = n.title || 'RetrouvonsLes';
  var data = payload.data || {};
  var clickTarget = resolveNotificationTarget(data.clickUrl || data.clickPath, '/citizen/notifications');
  var options = {
    body: n.body || '',
    icon: n.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'retrouvonsles-msg',
    vibrate: [180, 120, 180],
    renotify: true,
    silent: false,
    data: { clickUrl: clickTarget, notificationId: data.notificationId || '' },
  };
  return self.registration.showNotification(title, options);
});
self.addEventListener('push', function (event) {
  // Fallback Web Push natif sans payload chiffré : FCM gère ses propres messages avec data.
  if (event.data) return;
  event.waitUntil(
    self.registration.showNotification('RetrouvonsLes', {
      body: 'Vous avez une nouvelle notification.',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'retrouvonsles-webpush-fallback',
      renotify: true,
      vibrate: [180, 120, 180],
      data: { clickUrl: '/citizen/notifications' },
    }),
  );
});
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var d = event.notification.data || {};
  var targetUrl = resolveNotificationTarget(d.clickUrl, '/citizen/notifications');
  var targetOrigin = '';
  try {
    targetOrigin = new URL(targetUrl).origin;
  } catch (e) {
    targetOrigin = self.location.origin;
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf(targetOrigin) === 0 && 'focus' in client) {
          return client.focus().then(function (focused) {
            if (focused && 'postMessage' in focused) {
              focused.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
            }
            if (focused && 'navigate' in focused && typeof focused.navigate === 'function') {
              return focused.navigate(targetUrl).catch(function () {
                if (focused && 'postMessage' in focused) {
                  focused.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
                }
              });
            }
          });
        }
      }
      try {
        sessionStorage.setItem('rll_pending_push_url', targetUrl);
      } catch (e) { /* ignore */ }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
`;

fs.writeFileSync(outPath, js, 'utf8');
if (!config.apiKey || !config.projectId) {
  console.error('[generate-firebase-messaging-sw] projectId/apiKey manquants — build annulé.');
  process.exit(1);
}
console.log('[generate-firebase-messaging-sw] OK →', outPath, '(projectId:', config.projectId, ')');
