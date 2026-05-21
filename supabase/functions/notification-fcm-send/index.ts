/**
 * Supabase Edge Function — envoi FCM (navigateur) quand une ligne `notification` est créée.
 *
 * Secrets à définir (Dashboard → Edge Functions → Secrets) :
 * - FIREBASE_SERVICE_ACCOUNT : JSON complet du compte de service Firebase (chaîne)
 * - WEB_PUSH_VAPID_PUBLIC_KEY / WEB_PUSH_VAPID_PRIVATE_KEY : secours Web Push natif (Brave / FCM indisponible)
 * - WEB_PUSH_VAPID_SUBJECT   : contact VAPID (ex. mailto:admin@example.com)
 * - NOTIFICATION_FCM_SECRET  : secret partagé (header x-notification-fcm-secret)
 * - PUBLIC_APP_URL           : URL publique du site (ex. https://app.example.com) pour les liens Web Push
 *
 * Webhook Database (INSERT public.notification) :
 * - URL : https://<project-ref>.supabase.co/functions/v1/notification-fcm-send
 * - HTTP Headers : x-notification-fcm-secret: <NOTIFICATION_FCM_SECRET>
 *
 * Déploiement : supabase functions deploy notification-fcm-send --no-verify-jwt
 * (--no-verify-jwt car le webhook n’envoie pas le JWT utilisateur ; le secret HTTP suffit.)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import * as jose from 'https://deno.land/x/jose@v5.2.2/index.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-notification-fcm-secret',
};

const LOG = '[notification-fcm-send]';

function logLine(phase: string, data: Record<string, unknown>) {
  try {
    console.log(LOG, phase, JSON.stringify(data));
  } catch {
    console.log(LOG, phase, data);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ServiceAccount = {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
};

type WebPushRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  device_id?: string | null;
  user_agent?: string | null;
  platform?: string | null;
};

type FcmRow = {
  token: string;
  device_id?: string | null;
  user_agent?: string | null;
  platform?: string | null;
};

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const pk = await jose.importPKCS8(sa.private_key.replace(/\\n/g, '\n'), 'RS256');
  const assertion = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(pk);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const tr = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!tr.ok) {
    const t = await tr.text();
    throw new Error(`oauth2 token failed: ${tr.status} ${t}`);
  }
  const j = await tr.json();
  return j.access_token as string;
}

async function sendFcmV1(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  bodyText: string,
  data: Record<string, string>,
  link: string,
  opts?: { priorityHigh?: boolean },
): Promise<{ name?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const message: Record<string, unknown> = {
    token,
    notification: { title, body: bodyText },
    data,
    webpush: {
      headers: { Urgency: 'high' },
      fcmOptions: { link },
    },
  };
  if (opts?.priorityHigh) {
    message.android = { priority: 'HIGH' };
    message.apns = { headers: { 'apns-priority': '10' } };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`FCM send failed: ${res.status} ${t}`);
  }
  return res.json();
}

function b64urlToBytes(value: string): Uint8Array {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const b64 = `${value}${pad}`.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function getVapidJwt(endpoint: string, publicKey: string, privateKey: string, subject: string): Promise<string> {
  const publicBytes = b64urlToBytes(publicKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) {
    throw new Error('invalid WEB_PUSH_VAPID_PUBLIC_KEY');
  }
  const privateBytes = b64urlToBytes(privateKey);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: b64url(publicBytes.slice(1, 33)),
    y: b64url(publicBytes.slice(33, 65)),
    d: b64url(privateBytes),
  };
  const key = await jose.importJWK(jwk, 'ES256');
  return new jose.SignJWT({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject || 'mailto:admin@retrouvonsles.local',
  })
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .sign(key);
}

async function sendWebPushNoPayload(
  row: WebPushRow,
  publicKey: string,
  privateKey: string,
  subject: string,
): Promise<void> {
  const jwt = await getVapidJwt(row.endpoint, publicKey, privateKey, subject);
  const res = await fetch(row.endpoint, {
    method: 'POST',
    headers: {
      TTL: '2419200',
      Urgency: 'high',
      Authorization: `vapid t=${jwt}, k=${publicKey}`,
      'Crypto-Key': `p256ecdsa=${publicKey}`,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WebPush send failed: ${res.status} ${t}`);
  }
}

/** Jeton FCM révoqué / obsolète (changement SW, reset navigateur, autre app). */
function isUnregisteredFcmError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('unregistered') ||
    m.includes('"errorcode":"unregistered"') ||
    m.includes('not a valid fcm registration token') ||
    m.includes('registration-token-not-registered')
  );
}

function isExpiredWebPushError(message: string): boolean {
  return message.includes('WebPush send failed: 404') || message.includes('WebPush send failed: 410');
}

function strVal(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function detectBrowser(userAgent?: string | null): string {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'inconnu';
  if (ua.includes('brave')) return 'brave';
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) return 'safari';
  if (ua.includes('chrome') || ua.includes('chromium')) return 'chrome';
  return 'autre';
}

function readDonneesSupp(record: Record<string, unknown>): Record<string, unknown> | null {
  const raw = record.donnees_supplementaires;
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      if (typeof p === 'object' && p != null && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  return null;
}

type Supa = ReturnType<typeof createClient>;

async function recordPushDelivery(
  supabase: Supa,
  event: {
    notificationId: string;
    userId: string;
    canal: 'fcm' | 'web_push';
    succes: boolean;
    token?: string;
    endpoint?: string;
    deviceId?: string | null;
    userAgent?: string | null;
    platform?: string | null;
    providerStatus?: string | null;
    erreur?: string | null;
    invalide?: boolean;
    dureeMs?: number;
  },
) {
  try {
    const tokenHash = event.token ? await sha256Hex(event.token) : null;
    const endpointHash = event.endpoint ? await sha256Hex(event.endpoint) : null;
    const notificationId = event.notificationId && /^\d+$/.test(event.notificationId)
      ? Number(event.notificationId)
      : null;
    const { error } = await supabase.from('notification_push_delivery_event').insert({
      id_notification: notificationId,
      id_utilisateur: event.userId,
      canal: event.canal,
      succes: event.succes,
      token_hash: tokenHash,
      endpoint_hash: endpointHash,
      device_id: event.deviceId || null,
      user_agent: event.userAgent ? event.userAgent.slice(0, 512) : null,
      platform: event.platform ? event.platform.slice(0, 100) : null,
      navigateur: detectBrowser(event.userAgent),
      provider_status: event.providerStatus || null,
      erreur: event.erreur ? event.erreur.slice(0, 1000) : null,
      invalide: Boolean(event.invalide),
      duree_ms: event.dureeMs ?? null,
    });
    if (error && error.code !== '42P01') {
      logLine('push_delivery_event_error', { message: error.message, code: error.code });
    }
  } catch (e) {
    logLine('push_delivery_event_exception', { err: String(e) });
  }
}

/**
 * Chemin SPA pour le clic notification — garder aligné avec src/utils/resolveNotificationActionPath.ts
 */
function resolveClickPath(
  record: Record<string, unknown>,
  userType: string | null | undefined,
): string {
  const isAuthority = userType === 'autorite';
  const base = isAuthority ? '/authority' : '/citizen';
  const fallback = `${base}/notifications`;

  const urlAction = strVal(record.url_action);
  if (urlAction?.startsWith('/')) return urlAction;
  if (urlAction && /^https?:\/\//i.test(urlAction)) {
    try {
      const u = new URL(urlAction);
      const path = `${u.pathname}${u.search}${u.hash}`;
      return path.length > 1 ? path : fallback;
    } catch {
      /* inférence */
    }
  }

  const extra = readDonneesSupp(record);
  if (extra) {
    const kind = strVal(extra.kind);
    const demandeId = strVal(extra.demande_verification_id) || strVal(extra.demande_id);
    if (demandeId) {
      if (kind === 'identity_verification_pending') {
        return `/authority/verifications-identite?demande=${encodeURIComponent(demandeId)}`;
      }
      if (
        kind === 'identity_verification_submitted' ||
        kind === 'identity_verification_processed'
      ) {
        return `/citizen/profile?verification=${encodeURIComponent(demandeId)}`;
      }
      return isAuthority
        ? `/authority/verifications-identite?demande=${encodeURIComponent(demandeId)}`
        : `/citizen/profile?verification=${encodeURIComponent(demandeId)}`;
    }

    const evName = strVal(extra.event);
    if (evName === 'sos_dispatch' && isAuthority) {
      const sosId = strVal(extra.sos_id);
      return sosId ? `/authority/sos?focus=${encodeURIComponent(sosId)}` : '/authority/sos';
    }
    if (evName === 'sos_handled' && !isAuthority) return '/citizen/sos';
    if (evName === 'alerte_lifecycle' && isAuthority) {
      const alerteId = strVal(record.id_alerte);
      if (alerteId) return `/authority/alertes/${alerteId}`;
    }
    if (
      (evName === 'alerte_updated' ||
        evName === 'alerte_statut_changed' ||
        evName === 'nouvelle_alerte') &&
      !isAuthority
    ) {
      const alerteId = strVal(record.id_alerte) || strVal(extra.alerte_id);
      if (alerteId) return `/citizen/alerts?alerte=${encodeURIComponent(alerteId)}`;
    }
    if (evName === 'signalement_validated' && !isAuthority) {
      const sid = strVal(extra.signalement_id);
      if (sid) return `/citizen/signalement/${sid}`;
    }
    if (
      (evName === 'signalement_created' ||
        evName === 'signalement_moderation' ||
        evName === 'signalement_messagerie_reply') &&
      isAuthority
    ) {
      const sid = strVal(extra.signalement_id);
      if (sid) return `/authority/signalements/${sid}`;
    }
    if (evName === 'signalement_messagerie_message' && !isAuthority) {
      const sid = strVal(extra.signalement_id);
      if (sid) return `/citizen/signalement/${sid}`;
    }
    if (
      evName === 'pre_declaration_created' ||
      evName === 'pre_declaration_citizen_reply' ||
      evName === 'pre_declaration_rejected' ||
      evName === 'pre_declaration_message'
    ) {
      const preId = strVal(extra.pre_declaration_id);
      if (preId) {
        return isAuthority
          ? `/authority/pre-declarations/${preId}`
          : `/citizen/pre-declarations/${preId}`;
      }
    }
    if (evName === 'dossier_messagerie_message' && !isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return `/citizen/dossier/${d}`;
    }
    if (evName === 'dossier_messagerie_citizen_reply' && isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return `/authority/dossiers/${d}`;
    }
    if (evName === 'dossier_status_changed' || evName === 'ia_match_prioritaire_citoyen') {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) {
        return isAuthority ? `/authority/dossiers/${d}` : `/citizen/dossier/${d}`;
      }
    }

    const preId = strVal(extra.pre_declaration_id);
    if (preId) {
      return isAuthority
        ? `/authority/pre-declarations/${preId}`
        : `/citizen/pre-declarations/${preId}`;
    }
    const sid = strVal(extra.signalement_id);
    if (sid) {
      return isAuthority ? `/authority/signalements/${sid}` : `/citizen/signalement/${sid}`;
    }
    const resultatIaId = strVal(extra.resultat_ia_id);
    if (resultatIaId && isAuthority) {
      return `/authority/ia-analysis?resultId=${encodeURIComponent(resultatIaId)}`;
    }
    if (resultatIaId && !isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return `/citizen/dossier/${d}`;
    }
    const dFromExtra = strVal(extra.dossier_id);
    if (dFromExtra) {
      return isAuthority ? `/authority/dossiers/${dFromExtra}` : `/citizen/dossier/${dFromExtra}`;
    }
  }

  const typeN = strVal(record.type_notification);
  if (typeN === 'signalement_valide' && !isAuthority) {
    const sid = extra && strVal(extra.signalement_id);
    if (sid) return `/citizen/signalement/${sid}`;
    return '/citizen/my-signalements';
  }
  if (typeN === 'message_autorite' && !isAuthority) {
    const sid = extra && strVal(extra.signalement_id);
    if (sid) return `/citizen/signalement/${sid}`;
    const preId = extra && strVal(extra.pre_declaration_id);
    if (preId) return `/citizen/pre-declarations/${preId}`;
    const d = strVal(record.id_dossier);
    if (d) return `/citizen/dossier/${d}`;
  }
  if (typeN === 'message_autorite' && isAuthority) {
    const sid = extra && strVal(extra.signalement_id);
    if (sid) return `/authority/signalements/${sid}`;
    const d = strVal(record.id_dossier);
    if (d) return `/authority/dossiers/${d}`;
  }
  if (typeN === 'nouvelle_alerte') {
    const alerteId = strVal(record.id_alerte);
    if (isAuthority) return alerteId ? `/authority/alertes/${alerteId}` : '/authority/alertes';
    return alerteId
      ? `/citizen/alerts?alerte=${encodeURIComponent(alerteId)}`
      : '/citizen/alerts';
  }
  if (typeN === 'correspondance_ia') {
    if (isAuthority) {
      const rid = extra && strVal(extra.resultat_ia_id);
      return rid
        ? `/authority/ia-analysis?resultId=${encodeURIComponent(rid)}`
        : '/authority/ia-analysis';
    }
    const d = strVal(record.id_dossier);
    if (d) return `/citizen/dossier/${d}`;
  }
  if (typeN === 'personne_retrouvee' || typeN === 'mise_a_jour_dossier') {
    const d = strVal(record.id_dossier);
    if (d) return isAuthority ? `/authority/dossiers/${d}` : `/citizen/dossier/${d}`;
  }

  const idAlerte = strVal(record.id_alerte);
  if (idAlerte) {
    return isAuthority
      ? `/authority/alertes/${idAlerte}`
      : `/citizen/alerts?alerte=${encodeURIComponent(idAlerte)}`;
  }
  const idDossier = strVal(record.id_dossier);
  if (idDossier) {
    return isAuthority ? `/authority/dossiers/${idDossier}` : `/citizen/dossier/${idDossier}`;
  }

  return fallback;
}

serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const t0 = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    logLine('healthcheck_get', { reqId, note: 'function reachable' });
    return json({ ok: true, function: 'notification-fcm-send', reqId });
  }

  if (req.method !== 'POST') {
    logLine('method_not_allowed', { reqId, method: req.method });
    return json({ error: 'method_not_allowed', reqId }, 405);
  }

  logLine('request_in', {
    reqId,
    method: req.method,
    url: req.url,
    contentType: req.headers.get('content-type') || '',
    hasAuth: !!req.headers.get('authorization'),
    hasXNotifSecret: !!req.headers.get('x-notification-fcm-secret'),
    hasXNotifLegacy: !!req.headers.get('x-notification-fcm-send'),
    hasXApyKey: !!req.headers.get('apikey'),
  });

  const secret = Deno.env.get('NOTIFICATION_FCM_SECRET') || '';
  const hdrPrimary = req.headers.get('x-notification-fcm-secret') || '';
  const hdrLegacy = req.headers.get('x-notification-fcm-send') || '';
  const authHeader = req.headers.get('authorization') || '';
  const authBearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const hdr = hdrPrimary || hdrLegacy || authBearer;
  if (!secret || hdr !== secret) {
    logLine('auth_fail', {
      reqId,
      hasEnvSecret: !!secret,
      headerPrimaryPresent: !!hdrPrimary,
      headerLegacyPresent: !!hdrLegacy,
      authBearerPresent: !!authBearer,
      selectedHeaderLen: hdr.length,
      envSecretLen: secret.length,
    });
    return json({ error: 'unauthorized', reqId }, 401);
  }

  const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '';

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    logLine('body_parse_fail', { reqId, err: String(e) });
    return json({ error: 'invalid json', reqId }, 400);
  }

  logLine('body_raw_keys', {
    reqId,
    keys: raw && typeof raw === 'object' ? Object.keys(raw as object) : [],
  });

  // Corps direct ou enveloppé (proxy / outil d’intégration)
  let payload = raw as { type?: string; record?: Record<string, unknown>; table?: string; payload?: unknown };
  if (payload && typeof payload === 'object' && 'payload' in payload && payload.payload != null) {
    const inner = payload.payload as typeof payload;
    if (inner && typeof inner === 'object' && 'record' in inner) {
      payload = inner;
    }
  }

  const record = payload.record;
  if (!record) {
    logLine('skip', { reqId, reason: 'no_record', type: payload.type, table: payload.table });
    return json({ ok: true, skipped: true, reason: 'no record', reqId });
  }

  const tableName = payload.table;
  const tableOk =
    tableName == null ||
    tableName === 'notification' ||
    tableName === 'notifications';
  if (!tableOk) {
    logLine('skip', { reqId, reason: 'wrong_table', table: tableName });
    return json({ ok: true, skipped: true, reason: 'not notification table', table: tableName, reqId });
  }

  const userId = record.id_utilisateur as string | null | undefined;
  if (!userId) {
    logLine('skip', { reqId, reason: 'no_id_utilisateur', notifId: record.id });
    return json({ ok: true, skipped: true, reason: 'no user', reqId });
  }

  logLine('record', {
    reqId,
    notifId: record.id,
    userId: String(userId).slice(0, 8) + '…',
    type_notification: record.type_notification,
    titre: String(record.titre || '').slice(0, 60),
  });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: user, error: userErr } = await supabase
    .from('utilisateur')
    .select('id, accepte_notifications, type_compte, statut_compte')
    .eq('id', userId)
    .maybeSingle();

  if (userErr) {
    logLine('user_lookup_error', { reqId, message: userErr.message, code: userErr.code });
    return json({ error: userErr.message, reqId }, 500);
  }
  if (!user) {
    logLine('skip', { reqId, reason: 'user_not_found', userId: String(userId).slice(0, 8) + '…' });
    return json({ ok: true, skipped: true, reason: 'user not found', reqId });
  }
  const u = user as { accepte_notifications?: boolean; type_compte?: string; statut_compte?: string };
  if (!u.accepte_notifications) {
    logLine('skip', {
      reqId,
      reason: 'accepte_notifications_false',
      type_compte: u.type_compte,
      statut_compte: u.statut_compte,
    });
    return json({ ok: true, skipped: true, reason: 'notifications disabled for user', reqId });
  }

  const { data: tokens, error: tokErr } = await supabase
    .from('utilisateur_fcm_token')
    .select('token, device_id, user_agent, platform')
    .eq('id_utilisateur', userId);

  if (tokErr) {
    logLine('tokens_query_error', { reqId, message: tokErr.message, code: tokErr.code });
    return json({ error: tokErr.message, reqId }, 500);
  }
  const rows = (tokens || []) as FcmRow[];

  const { data: webPushRowsRaw, error: webPushErr } = await supabase
    .from('utilisateur_web_push_subscription')
    .select('endpoint, p256dh, auth, device_id, user_agent, platform')
    .eq('id_utilisateur', userId);

  if (webPushErr && webPushErr.code !== '42P01') {
    logLine('webpush_query_error', { reqId, message: webPushErr.message, code: webPushErr.code });
  }
  const webPushRows = (webPushRowsRaw || []) as WebPushRow[];

  if (rows.length === 0 && webPushRows.length === 0) {
    logLine('skip', {
      reqId,
      reason: 'no_push_tokens',
      userId: String(userId).slice(0, 8) + '…',
      type_compte: u.type_compte,
      accepte_notifications: u.accepte_notifications,
      hint: 'client doit enregistrer register_fcm_token ou register_web_push_subscription (logs navigateur [PushFCM])',
    });
    return json({ ok: true, skipped: true, reason: 'no push tokens', reqId });
  }

  const baseUrl = (Deno.env.get('PUBLIC_APP_URL') || 'https://retrouvonsles.te-sea.com').replace(/\/$/, '');
  const clickPath = resolveClickPath(record, u.type_compte);
  const clickUrlAbsolute = `${baseUrl}${clickPath.startsWith('/') ? clickPath : `/${clickPath}`}`;
  logLine('click_path', {
    reqId,
    baseUrl,
    clickPath: clickPath.slice(0, 120),
    clickUrlAbsolute: clickUrlAbsolute.slice(0, 160),
  });
  const link = clickUrlAbsolute;
  const title = String(record.titre || 'RetrouvonsLes');
  const bodyText = String(record.message || '').slice(0, 400);
  const nid = record.id != null ? String(record.id) : '';

  const data: Record<string, string> = {
    clickUrl: clickUrlAbsolute,
    clickPath,
    notificationId: nid,
    tag: nid ? `rll-${nid}` : 'retrouvonsles-msg',
  };

  const extraForPriority = readDonneesSupp(record);
  const isSosPush = strVal(extraForPriority?.event) === 'sos_dispatch';
  const priorityHigh = strVal(record.priorite as string | undefined) === 'haute' || isSosPush;

  let sent = 0;
  const errors: string[] = [];

  if (rows.length > 0) {
    if (!saRaw) {
      logLine('config_fail', { reqId, missing: 'FIREBASE_SERVICE_ACCOUNT', fcmTokens: rows.length });
      errors.push('FIREBASE_SERVICE_ACCOUNT not configured');
    } else {
      let sa: ServiceAccount | null = null;
      try {
        sa = JSON.parse(saRaw) as ServiceAccount;
      } catch (e) {
        logLine('sa_parse_fail', { reqId, err: String(e) });
        errors.push('invalid FIREBASE_SERVICE_ACCOUNT json');
      }

      let accessToken: string | null = null;
      if (sa) {
        logLine('firebase_project', { reqId, project_id: sa.project_id, client_email: sa.client_email });
        try {
          accessToken = await getGoogleAccessToken(sa);
        } catch (e) {
          logLine('oauth_fail', { reqId, err: String(e) });
          errors.push(String(e));
        }
      }

      if (sa && accessToken) {
        const fcmResults = await Promise.all(
          rows.map(async (row, idx) => {
            const { token } = row;
            const tokenHint = token.length > 12 ? `${token.slice(0, 8)}…${token.slice(-4)}` : '(short)';
            const sendStart = Date.now();
            try {
              await sendFcmV1(accessToken, sa.project_id, token, title, bodyText, data, link, {
                priorityHigh,
              });
              void recordPushDelivery(supabase, {
                notificationId: nid,
                userId,
                canal: 'fcm',
                succes: true,
                token,
                deviceId: row.device_id,
                userAgent: row.user_agent,
                platform: row.platform,
                providerStatus: 'ok',
                dureeMs: Date.now() - sendStart,
              });
              logLine('fcm_ok', { reqId, idx: idx + 1, tokenHint });
              return { ok: true as const, token, invalid: false };
            } catch (e) {
              const msg = String((e as Error).message || e);
              logLine('fcm_err', { reqId, idx: idx + 1, tokenHint, err: msg.slice(0, 400) });
              const invalid = isUnregisteredFcmError(msg);
              void recordPushDelivery(supabase, {
                notificationId: nid,
                userId,
                canal: 'fcm',
                succes: false,
                token,
                deviceId: row.device_id,
                userAgent: row.user_agent,
                platform: row.platform,
                providerStatus: invalid ? 'invalid_token' : 'error',
                erreur: msg,
                invalide: invalid,
                dureeMs: Date.now() - sendStart,
              });
              return { ok: false as const, token, invalid, msg };
            }
          }),
        );
        for (const r of fcmResults) {
          if (r.ok) {
            sent++;
          } else {
            errors.push(r.msg);
            if (r.invalid) {
              const tokenHint = r.token.length > 12
                ? `${r.token.slice(0, 8)}…${r.token.slice(-4)}`
                : '(short)';
              const { error: delErr } = await supabase.from('utilisateur_fcm_token').delete().eq('token', r.token);
              if (delErr) {
                logLine('token_delete_fail', { reqId, tokenHint, message: delErr.message, code: delErr.code });
              } else {
                logLine('token_deleted_unregistered', { reqId, tokenHint });
              }
            }
          }
        }
      }
    }
  }

  const vapidPublicKey =
    Deno.env.get('WEB_PUSH_VAPID_PUBLIC_KEY') ||
    Deno.env.get('REACT_APP_FIREBASE_VAPID_KEY') ||
    Deno.env.get('REACT_APP_PUSH_VAPID_PUBLIC_KEY') ||
    '';
  const vapidPrivateKey = Deno.env.get('WEB_PUSH_VAPID_PRIVATE_KEY') || '';
  const vapidSubject = Deno.env.get('WEB_PUSH_VAPID_SUBJECT') || 'mailto:admin@retrouvonsles.local';
  if (webPushRows.length > 0) {
    if (!vapidPublicKey || !vapidPrivateKey) {
      logLine('webpush_config_missing', {
        reqId,
        totalSubscriptions: webPushRows.length,
        hasPublicKey: !!vapidPublicKey,
        hasPrivateKey: !!vapidPrivateKey,
      });
      errors.push('WEB_PUSH_VAPID_PUBLIC_KEY / WEB_PUSH_VAPID_PRIVATE_KEY not configured');
    } else {
      const webResults = await Promise.all(
        webPushRows.map(async (row, idx) => {
          const endpointHint = row.endpoint.length > 32 ? `${row.endpoint.slice(0, 24)}…` : row.endpoint;
          const sendStart = Date.now();
          try {
            await sendWebPushNoPayload(row, vapidPublicKey, vapidPrivateKey, vapidSubject);
            void recordPushDelivery(supabase, {
              notificationId: nid,
              userId,
              canal: 'web_push',
              succes: true,
              endpoint: row.endpoint,
              deviceId: row.device_id,
              userAgent: row.user_agent,
              platform: row.platform,
              providerStatus: 'ok',
              dureeMs: Date.now() - sendStart,
            });
            logLine('webpush_ok', { reqId, idx: idx + 1, endpointHint });
            return { ok: true as const, row, invalid: false, msg: '' };
          } catch (e) {
            const msg = String((e as Error).message || e);
            logLine('webpush_err', { reqId, idx: idx + 1, endpointHint, err: msg.slice(0, 400) });
            const invalid = isExpiredWebPushError(msg);
            void recordPushDelivery(supabase, {
              notificationId: nid,
              userId,
              canal: 'web_push',
              succes: false,
              endpoint: row.endpoint,
              deviceId: row.device_id,
              userAgent: row.user_agent,
              platform: row.platform,
              providerStatus: invalid ? 'expired_subscription' : 'error',
              erreur: msg,
              invalide: invalid,
              dureeMs: Date.now() - sendStart,
            });
            return { ok: false as const, row, invalid, msg };
          }
        }),
      );
      for (const r of webResults) {
        if (r.ok) {
          sent++;
        } else {
          errors.push(r.msg);
          if (r.invalid) {
            const endpointHint = r.row.endpoint.length > 32
              ? `${r.row.endpoint.slice(0, 24)}…`
              : r.row.endpoint;
            const { error: delErr } = await supabase
              .from('utilisateur_web_push_subscription')
              .delete()
              .eq('endpoint', r.row.endpoint);
            if (delErr) {
              logLine('webpush_delete_fail', { reqId, endpointHint, message: delErr.message, code: delErr.code });
            } else {
              logLine('webpush_deleted_expired', { reqId, endpointHint });
            }
          }
        }
      }
    }
  }

  logLine('request_out', {
    reqId,
    ms: Date.now() - t0,
    sent,
    totalTokens: rows.length,
    totalWebPush: webPushRows.length,
    errors: errors.length,
  });

  if (nid) {
    const nextStatus = sent > 0 ? 'envoyee' : errors.length > 0 ? 'echec' : 'annulee';
    const { error: updateNotifErr } = await supabase
      .from('notification')
      .update({ statut_envoi: nextStatus })
      .eq('id', nid);
    if (updateNotifErr) {
      logLine('notification_status_update_fail', { reqId, message: updateNotifErr.message, code: updateNotifErr.code });
    }
  }

  return json({ ok: true, sent, total: rows.length + webPushRows.length, errors: errors.length ? errors : undefined, reqId });
});
