/**
 * Supabase Edge Function - donations-create
 *
 * Objectif:
 * - Créer un don et initier un paiement Mobile Money (Orange / MTN) via gateway.
 * - En dev, fonctionner en mode MOCK si les clés gateway ne sont pas définies.
 *
 * Auth: JWT vérifié en interne (jose + JWKS) si présent ; sinon don anonyme.
 * Déploiement: verify_jwt = false au gateway (voir config.toml / README_JWT_GATEWAY.md).
 *
 * Secrets: DONATIONS_MODE, DONATIONS_WEBHOOK_SECRET, (optionnel) CINETPAY_*
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'jsr:@panva/jose@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MobileMoneyOperator = 'mtn_momo' | 'orange_money';
type DonStatus = 'en_attente' | 'reussi' | 'echoue' | 'annule' | 'rembourse';

type CreateDonationBody = {
  montant: number;
  devise?: string;
  type_don?: string;
  methode_paiement?: string;
  donateur_anonyme?: boolean;
  nom_donateur?: string;
  email_donateur?: string;
  telephone_donateur?: string;
  organisation_donatrice?: string;
  message_donateur?: string;
  // Mobile Money specific
  mobile_money_operator?: MobileMoneyOperator;
  // Gateway URLs (for live mode)
  notify_url?: string;
  return_url?: string;
  lang?: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getMode(): 'mock' | 'live' {
  const envMode = (Deno.env.get('DONATIONS_MODE') || '').toLowerCase();
  if (envMode === 'live') return 'live';
  if (envMode === 'mock') return 'mock';
  return 'mock';
}

function safeString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length ? s : null;
}

function isOperator(v: unknown): v is MobileMoneyOperator {
  return v === 'mtn_momo' || v === 'orange_money';
}

function makeMockIds(operator: MobileMoneyOperator) {
  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const token = Math.random().toString(36).slice(2, 12);
  const providerReference = `MOCK_${operator.toUpperCase()}_${now}_${rand}`;
  const transactionId = `MOCK_TRX_${now}_${rand}_${token}`;
  return { providerReference, transactionId, token };
}

async function insertDonWithFallback(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, unknown>,
) {
  // 1) Try with extended columns (provider/metadata/etc)
  const attempt1 = await supabase.from('don').insert([row]).select('*').single();
  if (!attempt1.error) return attempt1;

  // 2) Fallback: remove "new" columns for older schema
  const { provider, provider_reference, checkout_url, metadata, updated_at, id_utilisateur, ...legacy } = row;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void provider;
  void provider_reference;
  void checkout_url;
  void metadata;
  void updated_at;
  void id_utilisateur;

  const attempt2 = await supabase.from('don').insert([legacy]).select('*').single();
  return attempt2;
}

async function updateDonWithFallback(
  supabase: ReturnType<typeof createClient>,
  id: string,
  patch: Record<string, unknown>,
) {
  // 1) Try with extended columns (checkout_url/metadata/etc)
  let attempt = await (supabase as any).from('don').update(patch).eq('id', id).select('*').single();
  if (!attempt.error) return attempt;

  // 2) Fallback: remove "new" columns for older schema
  const { provider, provider_reference, checkout_url, metadata, updated_at, id_utilisateur, ...legacy } = patch;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void provider;
  void provider_reference;
  void checkout_url;
  void metadata;
  void updated_at;
  void id_utilisateur;

  attempt = await (supabase as any).from('don').update(legacy).eq('id', id).select('*').single();
  return attempt;
}

function normalizeAmount(amount: number): number {
  // CinetPay expects an integer
  return Math.round(amount);
}

function mustBeMultipleOfFive(currency: string): boolean {
  // Per CinetPay docs: the restriction is not applied to USD.
  return currency.toUpperCase() !== 'USD';
}

/** Vérifie le JWT avec le JWKS Supabase. Retourne l'id utilisateur (sub) ou null si absent/invalide (don anonyme autorisé). */
async function getUserIdFromJwt(req: Request): Promise<string | null> {
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
    return sub && typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResponse({ error: 'Supabase env not configured in function runtime' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const body = (await req.json()) as CreateDonationBody;

    const rawMontant = typeof body.montant === 'number' ? body.montant : Number(body.montant);
    const devise = safeString(body.devise)?.toUpperCase() || 'XAF';
    const type_don = safeString(body.type_don) || 'ponctuel';
    const methode_paiement = safeString(body.methode_paiement) || 'mobile_money';

    if (!Number.isFinite(rawMontant) || rawMontant <= 0) {
      return jsonResponse({ error: 'Invalid montant' }, 400);
    }

    const montant = normalizeAmount(rawMontant);
    if (mustBeMultipleOfFive(devise) && montant % 5 !== 0) {
      return jsonResponse(
        { error: 'Le montant doit être un multiple de 5 pour la devise ' + devise + ' (ex: 5000, 10000).' },
        400,
      );
    }

    // Mobile Money operator (required for mobile_money)
    const operator: MobileMoneyOperator = isOperator(body.mobile_money_operator)
      ? body.mobile_money_operator
      : 'mtn_momo';

    // Identify user from JWT (if Bearer token present and valid)
    const userId = await getUserIdFromJwt(req);

    const mode = getMode();
    const nowIso = new Date().toISOString();

    const statut_paiement: DonStatus = 'en_attente';

    const CINETPAY_APIKEY = Deno.env.get('CINETPAY_APIKEY') || '';
    const CINETPAY_SITE_ID = Deno.env.get('CINETPAY_SITE_ID') || '';

    const wantsLive = mode === 'live' && Boolean(CINETPAY_APIKEY) && Boolean(CINETPAY_SITE_ID);

    // Always create a transaction identifier we can use as a stable reference.
    // For CinetPay, avoid special chars (use alphanum only).
    const transactionRef = crypto.randomUUID().replaceAll('-', '');

    const baseRow: Record<string, unknown> = {
      montant,
      devise,
      type_don,
      methode_paiement,
      donateur_anonyme: Boolean(body.donateur_anonyme),
      nom_donateur: safeString(body.nom_donateur),
      email_donateur: safeString(body.email_donateur),
      telephone_donateur: safeString(body.telephone_donateur),
      organisation_donatrice: safeString(body.organisation_donatrice),
      message_donateur: safeString(body.message_donateur),

      // Existing columns (compat schema)
      statut_paiement,
      reference_transaction: transactionRef,
      id_transaction_externe: null,
      date_don: nowIso,

      // New columns (if present)
      id_utilisateur: userId,
      provider: wantsLive ? 'cinetpay' : operator,
      provider_reference: transactionRef,
      checkout_url: null,
      metadata: {
        mode,
        mobile_money_operator: operator,
      },
      updated_at: nowIso,
    };

    // MOCK identifiers (used only when not live)
    const mock = makeMockIds(operator);
    const donRow: Record<string, unknown> = wantsLive
      ? baseRow
      : {
          ...baseRow,
          reference_transaction: mock.providerReference,
          provider_reference: mock.providerReference,
          id_transaction_externe: mock.transactionId,
          provider: operator,
          metadata: {
            mode,
            mobile_money_operator: operator,
            mock_token: mock.token,
          },
        };

    const { data: inserted, error } = await insertDonWithFallback(supabase, donRow);
    if (error) {
      console.error('[donations-create] insert error', error);
      return jsonResponse(
        { error: 'Failed to create donation', details: error.message },
        500,
      );
    }

    // Journalisation (audit) : best effort, ne pas faire échouer la requête
    try {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (serviceKey) {
        const serviceClient = createClient(SUPABASE_URL, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await (serviceClient as any).from('journal_activite').insert({
          type_action: 'autre',
          action_detaillee: 'don_created',
          description: `Don ${(inserted as any)?.id} créé — ${montant} ${devise} (${mode})`,
          id_utilisateur: userId ?? null,
          donnees_apres: {
            don_id: (inserted as any)?.id,
            montant,
            devise,
            mode,
            provider_reference: (inserted as any)?.provider_reference ?? (inserted as any)?.reference_transaction,
          },
          date_action: nowIso,
        });
      }
    } catch (journalErr) {
      console.error('[donations-create] journal_activite insert (non blocking)', journalErr);
    }

    // LIVE: initialize CinetPay payment and attach payment_url/payment_token to donation
    if (wantsLive) {
      const notifyUrl =
        safeString(body.notify_url) || `${SUPABASE_URL}/functions/v1/donations-webhook`;
      const returnUrl = safeString(body.return_url) || safeString(body.notify_url) || notifyUrl;
      const lang = (safeString(body.lang) || 'fr').toLowerCase();

      const phone = safeString(body.telephone_donateur);
      if (!phone) {
        return jsonResponse(
          { error: 'Telephone is required for Mobile Money (live)' },
          400,
        );
      }

      const description =
        safeString(body.message_donateur) || 'Donation RetrouvonsLes';

      const initPayload: Record<string, unknown> = {
        apikey: CINETPAY_APIKEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: (inserted as any)?.provider_reference || (inserted as any)?.reference_transaction || transactionRef,
        amount: montant,
        currency: devise,
        description,
        notify_url: notifyUrl,
        return_url: returnUrl,
        channels: 'MOBILE_MONEY',
        lang,
        metadata: String((inserted as any)?.id || ''),
        lock_phone_number: true,
        customer_phone_number: phone,
      };

      const cinetpayRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RetrouvonsLes/1.0 (Supabase Edge Function)',
        },
        body: JSON.stringify(initPayload),
      });
      const cinetpayJson = await cinetpayRes.json().catch(() => null);

      if (!cinetpayRes.ok) {
        console.error('[donations-create] cinetpay error', cinetpayJson);
        return jsonResponse(
          { error: 'CinetPay init failed', details: cinetpayJson || cinetpayRes.statusText },
          502,
        );
      }

      const paymentUrl = (cinetpayJson as any)?.data?.payment_url as string | undefined;
      const paymentToken = (cinetpayJson as any)?.data?.payment_token as string | undefined;

      const patch: Record<string, unknown> = {
        id_transaction_externe: paymentToken || null,
        checkout_url: paymentUrl || null,
        provider: 'cinetpay',
        provider_reference:
          (initPayload.transaction_id as string) ||
          (inserted as any)?.provider_reference ||
          null,
        metadata: {
          ...(inserted as any)?.metadata,
          cinetpay: {
            payment_token: paymentToken || null,
            api_response_id: (cinetpayJson as any)?.api_response_id || null,
          },
        },
        updated_at: nowIso,
      };

      const updatedRes = await updateDonWithFallback(supabase, (inserted as any).id, patch);
      if (updatedRes.error) {
        console.error('[donations-create] update after cinetpay failed', updatedRes.error);
        // Still return the created donation, but include payment_url to proceed.
        return jsonResponse({
          ok: true,
          mode: 'live',
          donation: inserted,
          payment: {
            methode: 'mobile_money',
            operator,
            status: statut_paiement,
            providerReference: (initPayload.transaction_id as string) || null,
            transactionId: paymentToken || null,
            checkoutUrl: paymentUrl || null,
            mock: null,
          },
        });
      }

      return jsonResponse({
        ok: true,
        mode: 'live',
        donation: updatedRes.data,
        payment: {
          methode: 'mobile_money',
          operator,
          status: statut_paiement,
          providerReference: (initPayload.transaction_id as string) || null,
          transactionId: paymentToken || null,
          checkoutUrl: paymentUrl || null,
          mock: null,
        },
      });
    }

    // MOCK: helper info the UI can use to simulate confirmation.
    return jsonResponse({
      ok: true,
      mode: 'mock',
      donation: inserted,
      payment: {
        methode: 'mobile_money',
        operator,
        status: statut_paiement,
        providerReference: mock.providerReference,
        transactionId: mock.transactionId,
        checkoutUrl: null,
        mock: {
          confirmToken: mock.token,
          // The frontend will call donations-mock-confirm
        },
      },
    });
  } catch (error) {
    console.error('[donations-create] exception', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
});

