-- Robust FCM token registration across account switches/devices.
-- Root cause fixed:
-- - unique(token) + RLS can block reassignment of an existing token to current auth user.
-- - this leads to notifications inserted in DB but no push sent (no usable token for user).

create or replace function public.register_fcm_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_token text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifié';
  end if;

  v_token := nullif(trim(p_token), '');
  if v_token is null then
    raise exception 'token fcm invalide';
  end if;

  -- Token must belong to the currently authenticated user.
  -- SECURITY DEFINER bypasses RLS and prevents conflicts when token existed for another account.
  delete from public.utilisateur_fcm_token where token = v_token;

  insert into public.utilisateur_fcm_token (id_utilisateur, token, updated_at)
  values (v_uid, v_token, now())
  on conflict (token)
  do update set
    id_utilisateur = excluded.id_utilisateur,
    updated_at = now();

  -- Keep backend push eligibility aligned with explicit browser grant.
  update public.utilisateur
  set accepte_notifications = true,
      updated_at = now()
  where id = v_uid;
end;
$$;

grant execute on function public.register_fcm_token(text) to authenticated;

