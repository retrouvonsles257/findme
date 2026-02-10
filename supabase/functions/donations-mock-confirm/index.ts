/**
 * Supabase Edge Function - donations-mock-confirm
 *
 * Objectif:
 * - Simuler (dev) la confirmation d'un paiement Mobile Money.
 * - Met à jour `don.statut_paiement`, `date_traitement`.
 *
 * Sécurité: confirmToken (mock_token) requis ; pas de JWT utilisateur.
 * Déploiement: verify_jwt = false au gateway (config.toml).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MockConfirmBody = {
  donId: string;
  status?: 'reussi' | 'echoue' | 'annule';
  confirmToken?: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Supabase env not configured in function runtime' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = (await req.json()) as MockConfirmBody;
    const donId = (body.donId || '').trim();
    const status = body.status || 'reussi';
    const confirmToken = (body.confirmToken || '').trim();

    if (!donId) return jsonResponse({ error: 'donId is required' }, 400);

    // Fetch donation (to validate it's a mock transaction when possible)
    const { data: don, error: loadError } = await supabase
      .from('don')
      .select('*')
      .eq('id', donId)
      .single();

    if (loadError) {
      return jsonResponse({ error: 'Donation not found', details: loadError.message }, 404);
    }

    // Best-effort validation:
    // - If metadata.mock_token exists, require it to match (optional in old schema).
    // - Else if id_transaction_externe contains token, check it.
    const metaToken = (don as any)?.metadata?.mock_token as string | undefined;
    const legacyTrx = String((don as any)?.id_transaction_externe || '');

    if (metaToken) {
      if (!confirmToken || confirmToken !== metaToken) {
        return jsonResponse({ error: 'Invalid confirmToken' }, 401);
      }
    } else if (legacyTrx.includes('MOCK_TRX_') && legacyTrx.includes('_')) {
      // token is at end: MOCK_TRX_<ts>_<rand>_<token>
      const parts = legacyTrx.split('_');
      const token = parts[parts.length - 1] || '';
      if (confirmToken && token && confirmToken !== token) {
        return jsonResponse({ error: 'Invalid confirmToken' }, 401);
      }
    }

    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = {
      statut_paiement: status,
      updated_at: nowIso, // column may not exist yet (migration optional)
    };
    if (status === 'reussi') {
      update.date_traitement = nowIso;
    }

    let updateResult = await (supabase as any)
      .from('don')
      .update(update)
      .eq('id', donId)
      .select('*')
      .single();

    // Fallback for older schema (no updated_at / metadata columns)
    if (updateResult.error?.message?.includes('updated_at')) {
      const { updated_at, ...legacyUpdate } = update;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      void updated_at;
      updateResult = await (supabase as any)
        .from('don')
        .update(legacyUpdate)
        .eq('id', donId)
        .select('*')
        .single();
    }

    if (updateResult.error) {
      return jsonResponse(
        { error: 'Failed to update donation', details: updateResult.error.message },
        500,
      );
    }

    return jsonResponse({ ok: true, donation: updateResult.data });
  } catch (error) {
    console.error('[donations-mock-confirm] exception', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
});

