/**
 * Supabase Edge Function — envoi FCM (navigateur) quand une ligne `notification` est créée.
 *
 * Secrets à définir (Dashboard → Edge Functions → Secrets) :
 * - FIREBASE_SERVICE_ACCOUNT : JSON complet du compte de service Firebase (chaîne)
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
): Promise<{ name?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body: bodyText },
        data,
        webpush: {
          headers: { Urgency: 'high' },
          fcmOptions: { link },
        },
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`FCM send failed: ${res.status} ${t}`);
  }
  return res.json();
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

function strVal(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
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

/**
 * Chemin SPA citoyen pour le clic sur la notification (aligné avec CitizenRoutes).
 */
async function resolveCitizenClickPath(supabase: Supa, record: Record<string, unknown>): Promise<string> {
  const urlAction = strVal(record.url_action);
  if (urlAction?.startsWith('/')) {
    return urlAction;
  }

  const idDossier = strVal(record.id_dossier);
  if (idDossier) {
    return `/citizen/dossier/${idDossier}`;
  }

  const idAlerte = strVal(record.id_alerte);
  if (idAlerte) {
    const { data: al } = await supabase.from('alerte').select('id_dossier').eq('id', idAlerte).maybeSingle();
    const dossierFromAlert = al && typeof al === 'object' ? strVal((al as { id_dossier?: unknown }).id_dossier) : null;
    if (dossierFromAlert) {
      return `/citizen/dossier/${dossierFromAlert}`;
    }
    return `/citizen/alerts?alerte=${encodeURIComponent(idAlerte)}`;
  }

  const extra = readDonneesSupp(record);
  if (extra) {
    const sid = strVal(extra.signalement_id);
    if (sid) return `/citizen/signalement/${sid}`;
    const dIa = strVal(extra.dossier_id);
    if (dIa) return `/citizen/dossier/${dIa}`;
  }

  const typeN = strVal(record.type_notification);
  if (typeN === 'nouvelle_alerte') {
    return '/citizen/alerts';
  }

  return '/citizen/notifications';
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

  const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!saRaw) {
    logLine('config_fail', { reqId, missing: 'FIREBASE_SERVICE_ACCOUNT' });
    return json({ error: 'FIREBASE_SERVICE_ACCOUNT not configured', reqId }, 500);
  }

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
    .select('token')
    .eq('id_utilisateur', userId);

  if (tokErr) {
    logLine('tokens_query_error', { reqId, message: tokErr.message, code: tokErr.code });
    return json({ error: tokErr.message, reqId }, 500);
  }
  const rows = (tokens || []) as { token: string }[];
  if (rows.length === 0) {
    logLine('skip', {
      reqId,
      reason: 'no_fcm_tokens',
      hint: 'citoyen doit ouvrir lapp citoyen et accepter les notifications pour enregistrer utilisateur_fcm_token',
    });
    return json({ ok: true, skipped: true, reason: 'no fcm tokens', reqId });
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(saRaw) as ServiceAccount;
  } catch (e) {
    logLine('sa_parse_fail', { reqId, err: String(e) });
    return json({ error: 'invalid FIREBASE_SERVICE_ACCOUNT json', reqId }, 500);
  }

  logLine('firebase_project', { reqId, project_id: sa.project_id, client_email: sa.client_email });

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(sa);
  } catch (e) {
    logLine('oauth_fail', { reqId, err: String(e) });
    return json({ error: String(e), reqId }, 500);
  }

  const baseUrl = (Deno.env.get('PUBLIC_APP_URL') || 'https://localhost:3000').replace(/\/$/, '');
  const clickPath = await resolveCitizenClickPath(supabase, record);
  logLine('click_path', { reqId, clickPath: clickPath.slice(0, 120) });
  const link = `${baseUrl}${clickPath}`;
  const title = String(record.titre || 'RetrouvonsLes');
  const bodyText = String(record.message || '').slice(0, 400);
  const nid = record.id != null ? String(record.id) : '';

  const data: Record<string, string> = {
    clickUrl: clickPath,
    notificationId: nid,
    tag: nid ? `rll-${nid}` : 'retrouvonsles-msg',
  };

  let sent = 0;
  const errors: string[] = [];
  let idx = 0;
  for (const { token } of rows) {
    idx += 1;
    const tokenHint = token.length > 12 ? `${token.slice(0, 8)}…${token.slice(-4)}` : '(short)';
    try {
      await sendFcmV1(accessToken, sa.project_id, token, title, bodyText, data, link);
      sent++;
      logLine('fcm_ok', { reqId, idx, tokenHint });
    } catch (e) {
      const msg = String((e as Error).message || e);
      errors.push(msg);
      logLine('fcm_err', { reqId, idx, tokenHint, err: msg.slice(0, 400) });
      if (isUnregisteredFcmError(msg)) {
        const { error: delErr } = await supabase.from('utilisateur_fcm_token').delete().eq('token', token);
        if (delErr) {
          logLine('token_delete_fail', { reqId, tokenHint, message: delErr.message, code: delErr.code });
        } else {
          logLine('token_deleted_unregistered', { reqId, tokenHint });
        }
      }
    }
  }

  logLine('request_out', {
    reqId,
    ms: Date.now() - t0,
    sent,
    totalTokens: rows.length,
    errors: errors.length,
  });

  return json({ ok: true, sent, total: rows.length, errors: errors.length ? errors : undefined, reqId });
});
