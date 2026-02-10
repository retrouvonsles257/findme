/**
 * Edge Function: admin-invite-user
 * Invite un utilisateur par email dans l'organisation (auth.admin.inviteUserByEmail).
 * Validation JWT via jose + JWKS (compatible clés asymétriques Supabase).
 *
 * Déploiement: supabase functions deploy admin-invite-user
 * Secrets: SUPABASE_SERVICE_ROLE_KEY (fourni par défaut)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'jsr:@panva/jose@6';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey, x-api-version, x-application-name, x-request-id',
  'Access-Control-Max-Age': '86400',
};

type InviteBody = {
  email: string;
  role: string;
  organisationId: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Vérifie le JWT avec le JWKS Supabase (clés asymétriques). Retourne le payload ou null. */
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  const jwtPayload = await verifySupabaseJwt(req);
  if (!jwtPayload?.sub) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }

  const userId = jwtPayload.sub;

  let body: InviteBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const role = typeof body.role === 'string' ? body.role : 'operateur_saisie';
  const organisationId = typeof body.organisationId === 'string' ? body.organisationId.trim() : '';

  if (!email || !organisationId) {
    return jsonResponse({ error: 'email and organisationId are required' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await (adminClient as any).from('utilisateur').select('id_organisation').eq('id', userId).maybeSingle();
  if (profileError) {
    const detail = profileError?.message || profileError?.code || String(profileError);
    return jsonResponse({ error: 'Erreur lecture profil', detail }, 500);
  }
  if (!profile) {
    return jsonResponse({ error: 'Profil utilisateur introuvable (table utilisateur)' }, 403);
  }
  const userOrgId = (profile.id_organisation ?? '') as string;

  const { data: rolesData } = await (adminClient as any).from('utilisateur_role').select('role:role(nom_role)').eq('id_utilisateur', userId);
  const roles = Array.isArray(rolesData) ? rolesData : rolesData ? [rolesData] : [];
  const hasAdminOrg = roles.some((r: any) => r?.role?.nom_role === 'admin_organisation');

  if (!hasAdminOrg) {
    return jsonResponse({ error: 'Rôle admin organisation requis' }, 403);
  }
  if (userOrgId !== organisationId) {
    return jsonResponse({ error: 'Vous n\'êtes pas admin de cette organisation' }, 403);
  }

  const redirectUrl = Deno.env.get('SITE_URL') || `${supabaseUrl.replace('.supabase.co', '')}`;
  const redirectTo = redirectUrl.startsWith('http')
    ? `${redirectUrl.replace(/\/$/, '')}/auth/callback`
    : undefined;

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        organisation_id: organisationId,
        role,
        invited_by: userId,
      },
      redirectTo,
    }
  );

  if (inviteError) {
    const code = inviteError.message?.toLowerCase().includes('already') ? 409 : 400;
    return jsonResponse({ error: inviteError.message || 'Invite failed' }, code);
  }

  return jsonResponse({
    success: true,
    message: 'Invitation sent',
    user: inviteData?.user ? { id: inviteData.user.id, email: inviteData.user.email } : null,
  });
});
