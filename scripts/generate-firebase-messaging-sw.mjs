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

const config = {
  apiKey: env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.REACT_APP_FIREBASE_APP_ID || '',
};

const js = `/* Généré par scripts/generate-firebase-messaging-sw.mjs — ne pas éditer à la main */
importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function (payload) {
  var n = payload.notification || {};
  var title = n.title || 'RetrouvonsLes';
  var data = payload.data || {};
  var clickPath = data.clickUrl || '/citizen/notifications';
  var options = {
    body: n.body || '',
    icon: n.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'retrouvonsles-msg',
    vibrate: [180, 120, 180],
    renotify: true,
    silent: false,
    data: { clickUrl: clickPath, notificationId: data.notificationId || '' },
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
  var path = typeof d.clickUrl === 'string' ? d.clickUrl : '/citizen/notifications';
  var targetUrl = new URL(path, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          return client.focus().then(function (focused) {
            if (focused && 'navigate' in focused && typeof focused.navigate === 'function') {
              return focused.navigate(targetUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
`;

fs.writeFileSync(outPath, js, 'utf8');
if (!config.apiKey || !config.projectId) {
  console.warn(
    '[generate-firebase-messaging-sw] .env incomplet : firebase-messaging-sw.js peut être invalide jusqu’à configuration.',
  );
} else {
  console.log('[generate-firebase-messaging-sw] OK →', outPath);
}
