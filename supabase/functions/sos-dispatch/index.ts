/**
 * Edge Function: sos-dispatch
 * Crée un événement SOS (envoyé ou trace annulée), notifie les autorités (ciblage pays / région du citoyen, repli toutes autorités),
 * envoie les e-mails aux contacts (Brevo si secrets présents).
 *
 * Secrets: BREVO_API_KEY + BREVO_SENDER_EMAIL (expéditeur vérifié dans Brevo). Optionnel: BREVO_SENDER_NAME
 * Déploiement: supabase functions deploy sos-dispatch --no-verify-jwt
 * (la vérification JWT est faite dans le corps via JWKS.)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'jsr:@panva/jose@6';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, content-type, x-client-info, apikey, x-api-version, x-application-name, x-request-id',
  'Access-Control-Max-Age': '86400',
};

type Body = {
  mode?: 'dispatch' | 'abort_trace';
  message?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  precisionMeters?: number | null;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function verifySupabaseJwt(req: Request): Promise<{ sub: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) return null;

  const issuer = Deno.env.get('SB_JWT_ISSUER') ?? `${supabaseUrl}/auth/v1`;
  const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

  try {
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer,
      audience: 'authenticated',
    });
    const sub = payload.sub as string;
    return sub ? { sub } : null;
  } catch {
    return null;
  }
}

/** Accepte `email@domaine` ou `Nom <email@domaine>` (souvent collé par erreur dans le secret Supabase). */
function parseBrevoSenderSecret(raw: string): { name?: string; email: string } {
  const t = raw.trim();
  const m = t.match(/^(.+?)\s*<([^>]+)>$/);
  if (m) {
    const name = m[1].trim().replace(/^["']|["']$/g, '');
    return { name: name || undefined, email: m[2].trim().toLowerCase() };
  }
  return { email: t.toLowerCase() };
}

type BrevoCreds =
  | { ok: true; apiKey: string; sender: { name: string; email: string } }
  | { ok: false; reason: string };

function getBrevoCredentials(): BrevoCreds {
  const apiKey = (Deno.env.get('BREVO_API_KEY') ?? '').trim().replace(/^\uFEFF/, '');
  const rawSender = (Deno.env.get('BREVO_SENDER_EMAIL') ?? '').trim();
  const defaultName = (Deno.env.get('BREVO_SENDER_NAME') ?? '').trim() || 'RetrouvonsLes';
  if (!apiKey) return { ok: false, reason: 'BREVO_API_KEY manquant (secret Supabase Edge).' };
  if (!rawSender) return { ok: false, reason: 'BREVO_SENDER_EMAIL manquant (secret Supabase Edge).' };
  const parsed = parseBrevoSenderSecret(rawSender);
  if (!parsed.email.includes('@')) {
    return { ok: false, reason: 'BREVO_SENDER_EMAIL invalide (attendu : email seul ou Nom <email>).' };
  }
  const name = parsed.name || defaultName;
  return { ok: true, apiKey, sender: { name, email: parsed.email } };
}

async function sendBrevoEmail(
  creds: { apiKey: string; sender: { name: string; email: string } },
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': creds.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: creds.sender,
        to: [{ email: to.trim().toLowerCase() }],
        subject,
        htmlContent: html,
        textContent: textContent || subject,
      }),
    });
    const txt = await res.text();
    if (!res.ok) {
      console.error('[sos-dispatch] Brevo HTTP', res.status, to, txt.slice(0, 500));
      return { ok: false, error: txt || res.statusText };
    }
    console.log('[sos-dispatch] Brevo OK', res.status, to);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sos-dispatch] Brevo fetch error', to, msg);
    return { ok: false, error: msg };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

serve(async (req) => {
  try {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  const jwt = await verifySupabaseJwt(req);
  if (!jwt?.sub) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }
  const userId = jwt.sub;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const mode = body.mode === 'abort_trace' ? 'abort_trace' : 'dispatch';
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (mode === 'dispatch') {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent, error: rErr } = await (admin as any)
      .from('sos_event')
      .select('id')
      .eq('id_utilisateur', userId)
      .eq('statut', 'envoye')
      .gte('created_at', oneHourAgo)
      .limit(4);
    if (rErr) {
      return jsonResponse({ error: 'Rate check failed', detail: rErr.message }, 500);
    }
    if ((recent?.length ?? 0) >= 3) {
      return jsonResponse({ error: 'Trop de demandes SOS récentes. Réessayez plus tard.' }, 429);
    }
  }

  if (mode === 'abort_trace') {
    const { data: row, error: insErr } = await (admin as any)
      .from('sos_event')
      .insert({
        id_utilisateur: userId,
        statut: 'annule',
        sans_position: true,
        message: null,
        latitude: null,
        longitude: null,
        precision_metres: null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (insErr) {
      return jsonResponse({ error: insErr.message }, 500);
    }
    return jsonResponse({ ok: true, id: row.id, statut: 'annule' });
  }

  const msgRaw = typeof body.message === 'string' ? body.message.trim() : '';
  const message = msgRaw.length > 0 ? msgRaw.slice(0, 2000) : "Je me sens en danger et j'ai besoin d'aide.";

  let lat = typeof body.latitude === 'number' && Number.isFinite(body.latitude) ? body.latitude : null;
  let lng = typeof body.longitude === 'number' && Number.isFinite(body.longitude) ? body.longitude : null;
  const acc =
    typeof body.precisionMeters === 'number' && Number.isFinite(body.precisionMeters) ? body.precisionMeters : null;

  let sansPosition = false;
  if (lat == null || lng == null) {
    lat = null;
    lng = null;
    sansPosition = true;
  }

  const { data: profile, error: pErr } = await (admin as any)
    .from('utilisateur')
    .select('nom, prenom, email, pays, region')
    .eq('id', userId)
    .maybeSingle();
  if (pErr) {
    return jsonResponse({ error: pErr.message }, 500);
  }
  const nomCitoyen = [profile?.prenom, profile?.nom].filter(Boolean).join(' ').trim() || 'Citoyen';
  const citizenPays = String(profile?.pays ?? 'Cameroun').trim() || 'Cameroun';
  const citizenRegion = String(profile?.region ?? '').trim();

  const { data: inserted, error: insErr } = await (admin as any)
    .from('sos_event')
    .insert({
      id_utilisateur: userId,
      latitude: lat,
      longitude: lng,
      precision_metres: acc,
      message,
      sans_position: sansPosition,
      statut: 'envoye',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insErr) {
    return jsonResponse({ error: insErr.message }, 500);
  }
  const sosId = inserted.id as string;

  const when = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
  const mapUrl =
    lat != null && lng != null ? `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lng}`)}` : null;
  const positionLine = sansPosition || !mapUrl
    ? '<p><strong>Position :</strong> non disponible (GPS refusé ou indisponible).</p>'
    : `<p><strong>Position approximative :</strong> <a href="${mapUrl}">Ouvrir dans Google Maps</a></p>`;

  const htmlContacts = `
    <p>Bonjour,</p>
    <p><strong>${nomCitoyen}</strong> a déclenché une <strong>alerte d'urgence SOS</strong> depuis RetrouvonsLes.</p>
    <p><strong>Message :</strong> ${escapeHtml(message)}</p>
    ${positionLine}
    <p><strong>Heure :</strong> ${when}</p>
    <p>Si vous pensez que la personne est en danger immédiat, contactez les services d'urgence de votre pays.</p>
  `;

  const { data: contacts, error: ctErr } = await (admin as any)
    .from('contact_urgence')
    .select('email, nom')
    .eq('id_utilisateur', userId);
  if (ctErr) {
    return jsonResponse({ error: ctErr.message }, 500);
  }

  const brevoCreds = getBrevoCredentials();
  const emailSubject = `[RetrouvonsLes] SOS - ${nomCitoyen}`.slice(0, 250);

  const emailResults: { to: string; ok: boolean; error?: string }[] = [];
  for (const c of contacts || []) {
    const to = String(c.email || '').trim();
    if (!to) continue;
    if (!brevoCreds.ok) {
      emailResults.push({ to, ok: false, error: brevoCreds.reason });
      continue;
    }
    const r = await sendBrevoEmail(brevoCreds, to, emailSubject, htmlContacts);
    emailResults.push({ to, ok: r.ok, error: r.error });
  }

  const { data: activeOrgs, error: orgErr } = await (admin as any)
    .from('organisation')
    .select('id, region')
    .eq('statut_actif', true)
    .eq('pays', citizenPays);
  if (orgErr) {
    return jsonResponse({ error: orgErr.message }, 500);
  }

  let orgIds: string[] = (activeOrgs || []).map((o: { id: string }) => o.id);
  if (citizenRegion.length > 0 && (activeOrgs || []).length > 0) {
    const cr = citizenRegion.toLowerCase();
    const narrowed = (activeOrgs as { id: string; region: string | null }[]).filter((o) => {
      const or = (o.region || '').trim();
      if (or.length === 0) return true;
      const ol = or.toLowerCase();
      return ol === cr || cr.includes(ol) || ol.includes(cr);
    }).map((o) => o.id);
    if (narrowed.length > 0) orgIds = narrowed;
  }

  let authorityIds: string[] = [];
  if (orgIds.length > 0) {
    const { data: scoped, error: sErr } = await (admin as any)
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true)
      .in('id_organisation', orgIds);
    if (sErr) {
      return jsonResponse({ error: sErr.message }, 500);
    }
    authorityIds = (scoped || []).map((u: { id: string }) => u.id);
  }

  if (authorityIds.length === 0) {
    const { data: fallback, error: aErr } = await (admin as any)
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true);
    if (aErr) {
      return jsonResponse({ error: aErr.message }, 500);
    }
    authorityIds = (fallback || []).map((u: { id: string }) => u.id);
  }

  const nowIso = new Date().toISOString();
  const urlAction = `/authority/sos?focus=${sosId}`;
  const notifRows = authorityIds.map((id) => ({
    id_utilisateur: id,
    type_notification: 'autre',
    titre: '🆘 Alerte SOS citoyen',
    message: `${nomCitoyen} a déclenché une alerte SOS${sansPosition ? ' (sans position GPS)' : ''}.`,
    canal: 'push',
    priorite: 'haute',
    lue: false,
    date_creation: nowIso,
    url_action: urlAction,
    donnees_supplementaires: {
      event: 'sos_dispatch',
      sos_id: sosId,
      id_utilisateur: userId,
      sans_position: sansPosition,
    },
  }));
  if (notifRows.length > 0) {
    const { error: nErr } = await (admin as any).from('notification').insert(notifRows);
    if (nErr) {
      console.error('[sos-dispatch] notification insert', nErr);
    }
  }

  return jsonResponse({
    ok: true,
    id: sosId,
    statut: 'envoye',
    sans_position: sansPosition,
    brevo_env_ok: brevoCreds.ok,
    contacts_for_email: (contacts || []).length,
    emails_attempted: emailResults,
  });
  } catch (e) {
    console.error('[sos-dispatch] unhandled', e);
    return jsonResponse(
      { error: 'Internal error', detail: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});
