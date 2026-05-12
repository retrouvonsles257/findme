-- =====================================================
-- Web Push natif en secours quand Firebase getToken échoue
-- (ex. Brave / IndexedDB / SDK Firebase), avec rattachement
-- utilisateur + appareil comme pour les jetons FCM.
-- =====================================================

create table if not exists public.utilisateur_web_push_subscription (
  id uuid primary key default gen_random_uuid(),
  id_utilisateur uuid not null references public.utilisateur (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_id text not null,
  user_agent text,
  platform text,
  permission text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint utilisateur_web_push_subscription_endpoint_key unique (endpoint),
  constraint utilisateur_web_push_subscription_user_device_key unique (id_utilisateur, device_id)
);

create index if not exists utilisateur_web_push_subscription_user_idx
  on public.utilisateur_web_push_subscription (id_utilisateur);

alter table public.utilisateur_web_push_subscription enable row level security;

drop policy if exists "utilisateur_web_push_subscription_select_own" on public.utilisateur_web_push_subscription;
create policy "utilisateur_web_push_subscription_select_own"
  on public.utilisateur_web_push_subscription for select to authenticated
  using (id_utilisateur = auth.uid());

drop policy if exists "utilisateur_web_push_subscription_delete_own" on public.utilisateur_web_push_subscription;
create policy "utilisateur_web_push_subscription_delete_own"
  on public.utilisateur_web_push_subscription for delete to authenticated
  using (id_utilisateur = auth.uid());

grant select, insert, update, delete on public.utilisateur_web_push_subscription to authenticated;
grant all on public.utilisateur_web_push_subscription to service_role;

create or replace function public.register_web_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_device_id text,
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
  v_endpoint text;
  v_p256dh text;
  v_auth text;
  v_device_id text;
  v_permission text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifie';
  end if;

  v_endpoint := nullif(trim(p_endpoint), '');
  v_p256dh := nullif(trim(p_p256dh), '');
  v_auth := nullif(trim(p_auth), '');
  v_device_id := nullif(trim(p_device_id), '');

  if v_endpoint is null or v_p256dh is null or v_auth is null or v_device_id is null then
    raise exception 'subscription web push invalide';
  end if;

  v_permission := nullif(trim(p_permission), '');
  if v_permission not in ('granted', 'denied', 'default', 'unsupported') then
    v_permission := null;
  end if;

  perform public.ensure_current_user_profile();

  delete from public.utilisateur_web_push_subscription
  where endpoint = v_endpoint
    and (id_utilisateur <> v_uid or device_id <> v_device_id);

  insert into public.utilisateur_web_push_subscription (
    id_utilisateur,
    endpoint,
    p256dh,
    auth,
    device_id,
    user_agent,
    platform,
    permission,
    last_seen_at,
    updated_at
  )
  values (
    v_uid,
    v_endpoint,
    v_p256dh,
    v_auth,
    v_device_id,
    nullif(left(coalesce(p_user_agent, ''), 512), ''),
    nullif(left(coalesce(p_platform, ''), 100), ''),
    v_permission,
    now(),
    now()
  )
  on conflict (id_utilisateur, device_id)
  do update set
    endpoint = excluded.endpoint,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
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

grant execute on function public.register_web_push_subscription(text, text, text, text, text, text, text) to authenticated;

create or replace function public.unregister_current_web_push_device(p_device_id text, p_endpoint text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_device_id text;
  v_endpoint text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifie';
  end if;

  v_device_id := nullif(trim(p_device_id), '');
  v_endpoint := nullif(trim(p_endpoint), '');

  if v_device_id is not null then
    delete from public.utilisateur_web_push_subscription
    where id_utilisateur = v_uid
      and device_id = v_device_id;
  elsif v_endpoint is not null then
    delete from public.utilisateur_web_push_subscription
    where id_utilisateur = v_uid
      and endpoint = v_endpoint;
  end if;
end;
$$;

grant execute on function public.unregister_current_web_push_device(text, text) to authenticated;

create or replace function public.unregister_web_push_endpoint_value(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_endpoint text;
begin
  if auth.uid() is null then
    raise exception 'non authentifie';
  end if;

  v_endpoint := nullif(trim(p_endpoint), '');
  if v_endpoint is null then
    return;
  end if;

  delete from public.utilisateur_web_push_subscription
  where endpoint = v_endpoint;
end;
$$;

grant execute on function public.unregister_web_push_endpoint_value(text) to authenticated;
