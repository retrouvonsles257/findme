/**
 * Edge Function: admin-create-user
 * Création manuelle d'un utilisateur avec mot de passe temporaire (auth.admin.createUser).
 * Validation JWT via jose + JWKS (compatible clés asymétriques Supabase).
 *
 * Déploiement: supabase functions deploy admin-create-user
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

type CreateBody = {
  email: string;
  role: string;
  organisationId: string;
  password: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const MIN_PASSWORD_LENGTH = 8;

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

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const role = typeof body.role === 'string' ? body.role : 'operateur_saisie';
  const organisationId = typeof body.organisationId === 'string' ? body.organisationId.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !organisationId || !password) {
    return jsonResponse({ error: 'email, organisationId and password are required' }, 400);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, 400);
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

  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organisation_id: organisationId,
      role,
      created_by_admin: userId,
    },
  });

  if (createError) {
    const code = createError.message?.toLowerCase().includes('already') ? 409 : 400;
    return jsonResponse({ error: createError.message || 'User creation failed' }, code);
  }

  const newUser = createData?.user;
  if (!newUser) {
    return jsonResponse({ error: 'User creation failed' }, 500);
  }

  const { data: roleRow, error: roleError } = await (adminClient as any)
    .from('role')
    .select('id')
    .eq('nom_role', role)
    .maybeSingle();

  if (roleError || !roleRow?.id) {
    return jsonResponse({ error: `Role '${role}' not found` }, 400);
  }

  const { error: insertUserError } = await (adminClient as any)
    .from('utilisateur')
    .insert({
      id: newUser.id,
      email: newUser.email,
      nom: 'À compléter',
      prenom: 'À compléter',
      id_organisation: organisationId,
      statut_compte: 'actif',
      type_compte: 'autorite',
    });

  if (insertUserError) {
    return jsonResponse({ error: insertUserError.message || 'Failed to create profile' }, 500);
  }

  const { error: insertRoleError } = await (adminClient as any)
    .from('utilisateur_role')
    .insert({
      id_utilisateur: newUser.id,
      id_role: roleRow.id,
      attribue_par: userId,
    });

  if (insertRoleError) {
    return jsonResponse({ error: insertRoleError.message || 'Failed to assign role' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'User created',
    user: { id: newUser.id, email: newUser.email },
  });
});
