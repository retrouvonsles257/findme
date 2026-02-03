/**
 * Edge Function: admin-invite-user
 * Invite un utilisateur par email dans l'organisation (auth.admin.inviteUserByEmail).
 * Nécessite le JWT de l'admin organisation et le service_role en secret.
 *
 * Déploiement: supabase functions deploy admin-invite-user
 * Secrets: SUPABASE_SERVICE_ROLE_KEY (fourni par défaut)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
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

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !user) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }

  const { data: profile } = await (adminClient as any).from('utilisateur').select('id_organisation').eq('id', user.id).single();
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
  let userOrgId = (profile?.id_organisation ?? metadata.organisation_id ?? appMeta.organisation_id ?? '') as string;

  const { data: ur } = await (adminClient as any).from('utilisateur_role').select('role:role(nom_role)').eq('id_utilisateur', user.id).limit(1).maybeSingle();
  const userRole = (ur?.role?.nom_role ?? metadata.role ?? appMeta.role ?? '') as string;

  if (userRole !== 'admin_organisation' || userOrgId !== organisationId) {
    return jsonResponse({ error: 'Forbidden: not admin of this organisation' }, 403);
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
        invited_by: user.id,
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
