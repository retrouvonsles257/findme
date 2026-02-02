/**
 * Supabase Edge Function - donations-webhook
 *
 * Objectif:
 * - Endpoint webhook (live) appelé par la passerelle de paiement.
 * - Met à jour la table `don` en fonction de l'évènement (success/fail/refund).
 *
 * Déploiement:
 *   supabase functions deploy donations-webhook
 *
 * Sécurité:
 * - Utilise `DONATIONS_WEBHOOK_SECRET` pour vérifier une signature simple.
 * - Chaque gateway a ses propres règles; ici on fournit un squelette dev-safe.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-token',
};

type WebhookBody = {
  provider?: string; // e.g. "mtn_momo" | "orange_money" | gateway name
  provider_reference?: string;
  status?: 'reussi' | 'echoue' | 'annule' | 'rembourse' | 'en_attente';
  event?: string;
  raw?: unknown;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function updateDonationByReference(
  supabase: ReturnType<typeof createClient>,
  providerReference: string,
  update: Record<string, unknown>,
) {
  // Prefer new column provider_reference; fallback to reference_transaction (legacy)
  let byProviderRef = await (supabase as any)
    .from('don')
    .update(update)
    .eq('provider_reference', providerReference)
    .select('*')
    .single();

  // Fallback for older schema (no updated_at/provider_reference columns)
  if (byProviderRef.error?.message?.includes('updated_at')) {
    const { updated_at, ...legacyUpdate } = update;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void updated_at;
    byProviderRef = await (supabase as any)
      .from('don')
      .update(legacyUpdate)
      .eq('provider_reference', providerReference)
      .select('*')
      .single();
  }

  if (!byProviderRef.error) return byProviderRef;

  let byLegacyRef = await (supabase as any)
    .from('don')
    .update(update)
    .eq('reference_transaction', providerReference)
    .select('*')
    .single();

  if (byLegacyRef.error?.message?.includes('updated_at')) {
    const { updated_at, ...legacyUpdate } = update;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void updated_at;
    byLegacyRef = await (supabase as any)
      .from('don')
      .update(legacyUpdate)
      .eq('reference_transaction', providerReference)
      .select('*')
      .single();
  }

  return byLegacyRef;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET') {
    // CinetPay pings notify_url via GET to ensure availability.
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResponse({ error: 'Supabase env not configured in function runtime' }, 500);
    }

    const secret = Deno.env.get('DONATIONS_WEBHOOK_SECRET') || '';
    const signature = req.headers.get('x-webhook-signature') || '';

    // Minimal signature guard (replace per real gateway spec)
    if (secret) {
      if (!signature || !timingSafeEqual(signature, secret)) {
        return jsonResponse({ error: 'Invalid signature' }, 401);
      }
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    );

    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    // ============================
    // CinetPay webhook (form-data)
    // ============================
    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await req.formData();
      const cpm_site_id = String(form.get('cpm_site_id') || '');
      const cpm_trans_id = String(form.get('cpm_trans_id') || '');
      const cpm_trans_date = String(form.get('cpm_trans_date') || '');
      const cpm_amount = String(form.get('cpm_amount') || '');
      const cpm_currency = String(form.get('cpm_currency') || '');
      const signatureField = String(form.get('signature') || '');
      const payment_method = String(form.get('payment_method') || '');
      const cel_phone_num = String(form.get('cel_phone_num') || '');
      const cpm_phone_prefixe = String(form.get('cpm_phone_prefixe') || '');
      const cpm_language = String(form.get('cpm_language') || '');
      const cpm_version = String(form.get('cpm_version') || '');
      const cpm_payment_config = String(form.get('cpm_payment_config') || '');
      const cpm_page_action = String(form.get('cpm_page_action') || '');
      const cpm_custom = String(form.get('cpm_custom') || '');
      const cpm_designation = String(form.get('cpm_designation') || '');
      const cpm_error_message = String(form.get('cpm_error_message') || '');

      if (!cpm_trans_id) {
        // CinetPay expects 200 OK; returning 4xx can cause retries.
        return new Response('ok', { status: 200, headers: corsHeaders });
      }

      // Optional HMAC verification (recommended)
      const CINETPAY_SECRET_KEY = Deno.env.get('CINETPAY_SECRET_KEY') || '';
      const receivedXToken = req.headers.get('x-token') || '';
      if (CINETPAY_SECRET_KEY) {
        const dataToSign =
          cpm_site_id +
          cpm_trans_id +
          cpm_trans_date +
          cpm_amount +
          cpm_currency +
          signatureField +
          payment_method +
          cel_phone_num +
          cpm_phone_prefixe +
          cpm_language +
          cpm_version +
          cpm_payment_config +
          cpm_page_action +
          cpm_custom +
          cpm_designation +
          cpm_error_message;

        const generated = await hmacSha256Hex(CINETPAY_SECRET_KEY, dataToSign);
        if (!receivedXToken || !timingSafeEqual(receivedXToken, generated)) {
          return jsonResponse({ error: 'Invalid x-token' }, 401);
        }
      }

      // Verify transaction status via CinetPay API (mandatory per docs)
      const CINETPAY_APIKEY = Deno.env.get('CINETPAY_APIKEY') || '';
      const CINETPAY_SITE_ID = Deno.env.get('CINETPAY_SITE_ID') || '';

      if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID) {
        // Still respond 200 OK to avoid retries loop
        console.error('[donations-webhook] Missing CINETPAY_APIKEY or CINETPAY_SITE_ID');
        return new Response('ok', { status: 200, headers: corsHeaders });
      }

      const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RetrouvonsLes/1.0 (Supabase Edge Function)',
        },
        body: JSON.stringify({
          apikey: CINETPAY_APIKEY,
          site_id: CINETPAY_SITE_ID,
          transaction_id: cpm_trans_id,
        }),
      });
      const checkJson = await checkRes.json().catch(() => null);

      const statusFromCinetPay = String((checkJson as any)?.data?.status || '').toUpperCase();
      let mapped: WebhookBody['status'] = 'en_attente';
      if (statusFromCinetPay === 'ACCEPTED') mapped = 'reussi';
      else if (statusFromCinetPay === 'REFUSED') mapped = 'echoue';
      else if (statusFromCinetPay === 'CANCELED' || (checkJson as any)?.message === 'TRANSACTION_CANCEL') mapped = 'annule';
      else if (statusFromCinetPay === 'WAITING_FOR_CUSTOMER') mapped = 'en_attente';

      const nowIso = new Date().toISOString();
      const update: Record<string, unknown> = {
        statut_paiement: mapped,
        updated_at: nowIso,
      };
      if (mapped === 'reussi') update.date_traitement = nowIso;

      const updated = await updateDonationByReference(supabase, cpm_trans_id, update);
      if (updated.error) {
        console.error('[donations-webhook] Donation update failed', updated.error);
      }

      // Always 200 OK for CinetPay
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // ============================
    // Generic JSON webhook fallback
    // ============================
    const body = (await req.json()) as WebhookBody;

    const providerReference = (body.provider_reference || '').trim();
    const status = body.status || 'en_attente';

    if (!providerReference) {
      return jsonResponse({ error: 'provider_reference is required' }, 400);
    }

    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = {
      statut_paiement: status,
      updated_at: nowIso, // column may not exist yet (migration optional)
    };
    if (status === 'reussi') update.date_traitement = nowIso;

    const updated = await updateDonationByReference(supabase, providerReference, update);
    if (updated.error) {
      return jsonResponse(
        { error: 'Donation not found', details: updated.error.message },
        404,
      );
    }

    return jsonResponse({ ok: true, donation: updated.data });
  } catch (error) {
    console.error('[donations-webhook] exception', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
});

