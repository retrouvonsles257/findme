-- =====================================================
-- FCM Web Push : rattacher le jeton a l'utilisateur connecte
-- et a l'appareil/navigateur courant, pas seulement au token.
-- =====================================================

alter table public.utilisateur_fcm_token
  add column if not exists device_id text,
  add column if not exists user_agent text,
  add column if not exists platform text,
  add column if not exists permission text,
  add column if not exists last_seen_at timestamptz not null default now();

update public.utilisateur_fcm_token
set device_id = coalesce(device_id, 'legacy:' || id::text),
    last_seen_at = coalesce(last_seen_at, updated_at, created_at, now())
where device_id is null;

alter table public.utilisateur_fcm_token
  alter column device_id set not null;

create unique index if not exists utilisateur_fcm_token_user_device_idx
  on public.utilisateur_fcm_token (id_utilisateur, device_id);

create index if not exists utilisateur_fcm_token_last_seen_idx
  on public.utilisateur_fcm_token (last_seen_at);

comment on column public.utilisateur_fcm_token.device_id is
  'Identifiant local du navigateur/appareil. Il permet de remplacer seulement le token de cet appareil pour l''utilisateur courant.';
comment on column public.utilisateur_fcm_token.last_seen_at is
  'Derniere synchronisation reussie de ce token FCM.';

create or replace function public.ensure_current_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_guest_email text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifie';
  end if;

  if not exists (select 1 from public.utilisateur u where u.id = v_uid) then
    v_guest_email := 'anon-' || replace(v_uid::text, '-', '') || '@guest.retrouvonsles.local';
    insert into public.utilisateur (
      id,
      nom,
      prenom,
      email,
      statut_compte,
      type_compte,
      pays,
      accepte_notifications,
      accepte_geolocalisation
    )
    values (
      v_uid,
      'Invite',
      'Anonyme',
      v_guest_email,
      'actif',
      'grand_public',
      'Cameroun',
      true,
      true
    )
    on conflict (id) do nothing;
  end if;
end;
$$;

grant execute on function public.ensure_current_user_profile() to authenticated;

drop function if exists public.register_fcm_token(text);
drop function if exists public.register_fcm_token(text, text, text, text, text);

create or replace function public.register_fcm_token(
  p_token text,
  p_device_id text default null,
  p_permission text default null,
  p_user_agent text default null,
  p_platform text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_token text;
  v_device_id text;
  v_permission text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifie';
  end if;

  v_token := nullif(trim(p_token), '');
  if v_token is null then
    raise exception 'token fcm invalide';
  end if;

  v_device_id := nullif(trim(p_device_id), '');
  if v_device_id is null then
    v_device_id := 'legacy:' || md5(v_token);
  end if;

  v_permission := nullif(trim(p_permission), '');
  if v_permission not in ('granted', 'denied', 'default', 'unsupported') then
    v_permission := null;
  end if;

  perform public.ensure_current_user_profile();

  -- Un token FCM ne doit jamais rester attache a un autre utilisateur/appareil.
  delete from public.utilisateur_fcm_token
  where token = v_token
    and (id_utilisateur <> v_uid or device_id <> v_device_id);

  insert into public.utilisateur_fcm_token (
    id_utilisateur,
    token,
    device_id,
    user_agent,
    platform,
    permission,
    last_seen_at,
    updated_at
  )
  values (
    v_uid,
    v_token,
    v_device_id,
    nullif(left(coalesce(p_user_agent, ''), 512), ''),
    nullif(left(coalesce(p_platform, ''), 100), ''),
    v_permission,
    now(),
    now()
  )
  on conflict (id_utilisateur, device_id)
  do update set
    token = excluded.token,
    user_agent = excluded.user_agent,
    platform = excluded.platform,
    permission = excluded.permission,
    last_seen_at = now(),
    updated_at = now();

  update public.utilisateur
  set accepte_notifications = true,
      updated_at = now()
  where id = v_uid;
end;
$$;

grant execute on function public.register_fcm_token(text, text, text, text, text) to authenticated;

create or replace function public.unregister_current_fcm_device(p_device_id text, p_token text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_device_id text;
  v_token text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifie';
  end if;

  v_device_id := nullif(trim(p_device_id), '');
  v_token := nullif(trim(p_token), '');

  if v_device_id is not null then
    delete from public.utilisateur_fcm_token
    where id_utilisateur = v_uid
      and device_id = v_device_id;
  elsif v_token is not null then
    delete from public.utilisateur_fcm_token
    where id_utilisateur = v_uid
      and token = v_token;
  end if;
end;
$$;

grant execute on function public.unregister_current_fcm_device(text, text) to authenticated;

create or replace function public.unregister_fcm_token_value(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'non authentifie';
  end if;

  v_token := nullif(trim(p_token), '');
  if v_token is null then
    return;
  end if;

  -- Utilise pendant un changement de compte : l'ancien auth.uid() n'est plus actif,
  -- mais le navigateur connait encore son ancien token local.
  delete from public.utilisateur_fcm_token
  where token = v_token;
end;
$$;

grant execute on function public.unregister_fcm_token_value(text) to authenticated;
