/**
 * Edge Function: sos-contact-verification-email
 * Génère un jeton de vérification pour un contact d'urgence et envoie l'e-mail (Brevo).
 *
 * Secrets: BREVO_API_KEY + BREVO_SENDER_EMAIL (+ optionnel BREVO_SENDER_NAME), PUBLIC_APP_URL
 * Déploiement: supabase functions deploy sos-contact-verification-email --no-verify-jwt
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

type Body = { contact_id?: string };

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
    return { ok: false, reason: 'BREVO_SENDER_EMAIL invalide.' };
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
      console.error('[sos-contact-verification-email] Brevo HTTP', res.status, to, txt.slice(0, 500));
      return { ok: false, error: txt || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
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

function randomTokenHex(bytesLen: number): string {
  const bytes = new Uint8Array(bytesLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
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

    const contactId = typeof body.contact_id === 'string' ? body.contact_id.trim() : '';
    if (!contactId) {
      return jsonResponse({ error: 'contact_id requis' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: row, error: selErr } = await (admin as any)
      .from('contact_urgence')
      .select('id, id_utilisateur, nom, email')
      .eq('id', contactId)
      .eq('id_utilisateur', userId)
      .maybeSingle();

    if (selErr) {
      return jsonResponse({ error: selErr.message }, 500);
    }
    if (!row) {
      return jsonResponse({ error: 'Contact introuvable' }, 404);
    }

    const tok = randomTokenHex(24);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: upErr } = await (admin as any)
      .from('contact_urgence')
      .update({
        token_verification: tok,
        token_expires_at: expiresAt,
      })
      .eq('id', contactId)
      .eq('id_utilisateur', userId);

    if (upErr) {
      return jsonResponse({ error: upErr.message }, 500);
    }

    const brevo = getBrevoCredentials();
    if (!brevo.ok) {
      return jsonResponse({ ok: false, error: brevo.reason, token_saved: true }, 503);
    }

    const baseUrl = (Deno.env.get('PUBLIC_APP_URL') ?? '').replace(/\/$/, '');
    if (!baseUrl) {
      return jsonResponse({ error: 'PUBLIC_APP_URL manquant pour construire le lien de vérification' }, 500);
    }

    const verifyUrl = `${baseUrl}/verify-sos-contact?token=${encodeURIComponent(tok)}`;
    const toEmail = String(row.email || '').trim();
    if (!toEmail) {
      return jsonResponse({ error: 'E-mail du contact vide' }, 400);
    }

    const html = `
    <p>Bonjour ${escapeHtml(String(row.nom || ''))},</p>
    <p>Vous avez été désigné(e) comme <strong>contact d'urgence</strong> sur RetrouvonsLes.</p>
    <p>Pour confirmer cette adresse e-mail, ouvrez le lien ci-dessous (valide 7 jours) :</p>
    <p><a href="${verifyUrl}">Confirmer mon e-mail</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
  `;

    const r = await sendBrevoEmail(brevo, toEmail, '[RetrouvonsLes] Confirmez votre contact d''urgence', html);
    if (!r.ok) {
      return jsonResponse({ ok: false, error: r.error || 'Envoi e-mail échoué', token_saved: true }, 502);
    }

    return jsonResponse({ ok: true, email_sent: true });
  } catch (e) {
    console.error('[sos-contact-verification-email] unhandled', e);
    return jsonResponse(
      { error: 'Internal error', detail: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});
