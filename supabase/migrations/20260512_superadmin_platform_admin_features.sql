-- =====================================================
-- Superadmin : metriques systeme agregees sans donnees metier detaillees
-- =====================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.utilisateur u
    where u.id = auth.uid()
      and u.id_organisation is null
      and public.utilisateur_has_role(u.id, 'admin_systeme')
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.get_public_system_config()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_config jsonb := '{}'::jsonb;
begin
  select coalesce(valeur::jsonb, '{}'::jsonb)
  into v_config
  from public.configuration_systeme
  where categorie = 'system'
  order by updated_at desc nulls last
  limit 1;

  return jsonb_build_object(
    'system_name', coalesce(v_config->>'system_name', 'RETROUVONS-LES'),
    'system_version', coalesce(v_config->>'system_version', '1.0.0'),
    'default_language', coalesce(v_config->>'default_language', 'fr'),
    'maintenance_mode', coalesce((v_config->>'maintenance_mode')::boolean, false),
    'maintenance_message', coalesce(v_config->>'maintenance_message', 'Le système est en maintenance. Veuillez réessayer plus tard.'),
    'support_email', coalesce(v_config->>'support_email', 'support@retrouvonsles.fr'),
    'max_file_upload_mb', coalesce((v_config->>'max_file_upload_mb')::int, 10),
    'allowed_file_types', coalesce(v_config->>'allowed_file_types', 'jpg,jpeg,png,pdf'),
    'feature_flags', coalesce(v_config->'feature_flags', '{}'::jsonb)
  );
end;
$$;

grant execute on function public.get_public_system_config() to anon, authenticated;

create or replace function public.record_admin_login_event(
  p_user_agent text default null,
  p_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return;
  end if;

  if not (
    public.utilisateur_has_role(v_actor, 'admin_systeme')
    or public.utilisateur_has_role(v_actor, 'autorite')
  ) then
    return;
  end if;

  insert into public.journal_activite (
    id_utilisateur,
    type_action,
    action_detaillee,
    description,
    user_agent,
    date_action,
    donnees_apres
  )
  values (
    v_actor,
    'connexion'::public.type_action,
    'connexion_admin',
    'Connexion d''un compte a privileges',
    nullif(left(coalesce(p_user_agent, ''), 512), ''),
    now(),
    jsonb_build_object('path', nullif(left(coalesce(p_path, ''), 255), ''), 'security_event', true)
  );
end;
$$;

grant execute on function public.record_admin_login_event(text, text) to authenticated;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'statut_demande_acces_sensible') then
    create type public.statut_demande_acces_sensible as enum ('en_attente', 'approuvee', 'refusee', 'annulee');
  end if;
end $$;

create table if not exists public.demande_acces_sensible (
  id uuid primary key default gen_random_uuid(),
  id_utilisateur_cible uuid not null references public.utilisateur(id) on delete cascade,
  id_role_demande uuid not null references public.role(id) on delete restrict,
  motif text not null,
  statut public.statut_demande_acces_sensible not null default 'en_attente',
  id_demandeur uuid not null references public.utilisateur(id) on delete restrict,
  id_approbateur uuid references public.utilisateur(id) on delete restrict,
  commentaire_decision text,
  date_demande timestamptz not null default now(),
  date_decision timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.demande_acces_sensible enable row level security;

drop policy if exists demande_acces_sensible_platform_admin_select on public.demande_acces_sensible;
create policy demande_acces_sensible_platform_admin_select
  on public.demande_acces_sensible for select to authenticated
  using (public.is_platform_admin());

drop policy if exists demande_acces_sensible_platform_admin_insert on public.demande_acces_sensible;
create policy demande_acces_sensible_platform_admin_insert
  on public.demande_acces_sensible for insert to authenticated
  with check (public.is_platform_admin() and id_demandeur = auth.uid());

drop policy if exists demande_acces_sensible_platform_admin_update on public.demande_acces_sensible;
create policy demande_acces_sensible_platform_admin_update
  on public.demande_acces_sensible for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update on public.demande_acces_sensible to authenticated;

create table if not exists public.notification_push_delivery_event (
  id uuid primary key default gen_random_uuid(),
  id_notification bigint references public.notification(id) on delete set null,
  id_utilisateur uuid references public.utilisateur(id) on delete set null,
  canal text not null check (canal in ('fcm', 'web_push')),
  succes boolean not null default false,
  token_hash text,
  endpoint_hash text,
  device_id text,
  user_agent text,
  platform text,
  navigateur text,
  provider_status text,
  erreur text,
  invalide boolean not null default false,
  duree_ms int,
  created_at timestamptz not null default now()
);

create index if not exists notification_push_delivery_event_created_idx
  on public.notification_push_delivery_event(created_at desc);
create index if not exists notification_push_delivery_event_notification_idx
  on public.notification_push_delivery_event(id_notification);
create index if not exists notification_push_delivery_event_user_idx
  on public.notification_push_delivery_event(id_utilisateur);
create index if not exists notification_push_delivery_event_invalid_idx
  on public.notification_push_delivery_event(invalide)
  where invalide = true;

alter table public.notification_push_delivery_event enable row level security;

drop policy if exists notification_push_delivery_event_platform_admin_select on public.notification_push_delivery_event;
create policy notification_push_delivery_event_platform_admin_select
  on public.notification_push_delivery_event for select to authenticated
  using (public.is_platform_admin());

grant select on public.notification_push_delivery_event to authenticated;
grant insert on public.notification_push_delivery_event to service_role;

create or replace function public.request_sensitive_access(
  p_id_utilisateur_cible uuid,
  p_id_role_demande uuid,
  p_motif text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request_id uuid;
begin
  if v_actor is null or not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  if nullif(trim(coalesce(p_motif, '')), '') is null then
    raise exception 'Le motif est obligatoire pour un role sensible';
  end if;

  if not exists (select 1 from public.utilisateur where id = p_id_utilisateur_cible) then
    raise exception 'Utilisateur cible introuvable';
  end if;

  if not exists (select 1 from public.role where id = p_id_role_demande) then
    raise exception 'Role demande introuvable';
  end if;

  insert into public.demande_acces_sensible (
    id_utilisateur_cible,
    id_role_demande,
    motif,
    id_demandeur
  )
  values (
    p_id_utilisateur_cible,
    p_id_role_demande,
    left(trim(p_motif), 2000),
    v_actor
  )
  returning id into v_request_id;

  insert into public.journal_activite (
    id_utilisateur,
    type_action,
    action_detaillee,
    description,
    donnees_apres,
    date_action
  )
  values (
    v_actor,
    'attribution_role'::public.type_action,
    'demande_acces_sensible',
    'Demande d''acces sensible creee',
    jsonb_build_object('demande_id', v_request_id, 'utilisateur_cible', p_id_utilisateur_cible, 'role_demande', p_id_role_demande),
    now()
  );

  return v_request_id;
end;
$$;

grant execute on function public.request_sensitive_access(uuid, uuid, text) to authenticated;

create or replace function public.decide_sensitive_access_request(
  p_request_id uuid,
  p_decision text,
  p_commentaire text default null,
  p_date_expiration timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.demande_acces_sensible%rowtype;
  v_decision text := lower(trim(coalesce(p_decision, '')));
begin
  if v_actor is null or not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  if v_decision not in ('approuvee', 'refusee', 'annulee') then
    raise exception 'Decision invalide';
  end if;

  select *
  into v_request
  from public.demande_acces_sensible
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Demande introuvable';
  end if;

  if v_request.statut <> 'en_attente'::public.statut_demande_acces_sensible then
    raise exception 'Cette demande a deja ete traitee';
  end if;

  if v_request.id_demandeur = v_actor and v_decision = 'approuvee' then
    raise exception 'Un administrateur ne peut pas approuver sa propre demande sensible';
  end if;

  update public.demande_acces_sensible
  set statut = v_decision::public.statut_demande_acces_sensible,
      id_approbateur = v_actor,
      commentaire_decision = nullif(left(trim(coalesce(p_commentaire, '')), 2000), ''),
      date_decision = now(),
      updated_at = now()
  where id = p_request_id;

  if v_decision = 'approuvee' then
    insert into public.utilisateur_role (
      id_utilisateur,
      id_role,
      attribue_par,
      commentaire,
      date_expiration
    )
    values (
      v_request.id_utilisateur_cible,
      v_request.id_role_demande,
      v_actor,
      coalesce(nullif(left(trim(coalesce(p_commentaire, '')), 1000), ''), v_request.motif),
      p_date_expiration
    )
    on conflict (id_utilisateur, id_role)
    do update set
      attribue_par = excluded.attribue_par,
      commentaire = excluded.commentaire,
      date_expiration = excluded.date_expiration,
      date_attribution = now();
  end if;

  insert into public.journal_activite (
    id_utilisateur,
    type_action,
    action_detaillee,
    description,
    donnees_avant,
    donnees_apres,
    date_action
  )
  values (
    v_actor,
    'attribution_role'::public.type_action,
    'decision_acces_sensible',
    'Decision sur demande d''acces sensible',
    to_jsonb(v_request),
    jsonb_build_object('demande_id', p_request_id, 'decision', v_decision, 'date_expiration', p_date_expiration),
    now()
  );
end;
$$;

grant execute on function public.decide_sensitive_access_request(uuid, text, text, timestamptz) to authenticated;

create or replace function public.get_sensitive_access_requests()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', d.id,
      'statut', d.statut,
      'motif', d.motif,
      'commentaire_decision', d.commentaire_decision,
      'date_demande', d.date_demande,
      'date_decision', d.date_decision,
      'utilisateur_cible', jsonb_build_object(
        'id', cible.id,
        'nom', nullif(trim(concat_ws(' ', cible.prenom, cible.nom)), ''),
        'email', cible.email
      ),
      'role_demande', jsonb_build_object(
        'id', r.id,
        'nom_role', r.nom_role,
        'description', r.description
      ),
      'demandeur', jsonb_build_object(
        'id', demandeur.id,
        'nom', nullif(trim(concat_ws(' ', demandeur.prenom, demandeur.nom)), ''),
        'email', demandeur.email
      ),
      'approbateur', case when approbateur.id is null then null else jsonb_build_object(
        'id', approbateur.id,
        'nom', nullif(trim(concat_ws(' ', approbateur.prenom, approbateur.nom)), ''),
        'email', approbateur.email
      ) end
    ) order by d.date_demande desc), '[]'::jsonb)
    from public.demande_acces_sensible d
    join public.utilisateur cible on cible.id = d.id_utilisateur_cible
    join public.role r on r.id = d.id_role_demande
    join public.utilisateur demandeur on demandeur.id = d.id_demandeur
    left join public.utilisateur approbateur on approbateur.id = d.id_approbateur
  );
end;
$$;

grant execute on function public.get_sensitive_access_requests() to authenticated;

create or replace function public.get_platform_observability_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
  v_web_push_total bigint := 0;
  v_web_push_stale bigint := 0;
begin
  if not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  if to_regclass('public.utilisateur_web_push_subscription') is not null then
    execute 'select count(*) from public.utilisateur_web_push_subscription'
      into v_web_push_total;
    execute 'select count(*) from public.utilisateur_web_push_subscription where coalesce(last_seen_at, updated_at, created_at) < now() - interval ''30 days'''
      into v_web_push_stale;
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'organisations_total', (select count(*) from public.organisation),
    'users_total', (select count(*) from public.utilisateur),
    'roles_total', (select count(*) from public.role),
    'activity_last_24h', (
      select count(*) from public.journal_activite
      where date_action >= now() - interval '24 hours'
    ),
    'config_entries_total', (select count(*) from public.configuration_systeme),
    'fcm_tokens_total', (select count(*) from public.utilisateur_fcm_token),
    'fcm_tokens_stale_30d', (
      select count(*) from public.utilisateur_fcm_token
      where coalesce(last_seen_at, updated_at, created_at) < now() - interval '30 days'
    ),
    'web_push_subscriptions_total', v_web_push_total,
    'web_push_stale_30d', v_web_push_stale,
    'notifications_last_24h', (
      select count(*) from public.notification
      where date_creation >= now() - interval '24 hours'
    ),
    'notification_failures_last_24h', (
      select count(*) from public.notification
      where date_creation >= now() - interval '24 hours'
        and coalesce(statut_envoi::text, '') in ('echec', 'failed')
    ),
    'push_delivery_success_24h', (
      select count(*) from public.notification_push_delivery_event
      where created_at >= now() - interval '24 hours'
        and succes = true
    ),
    'push_delivery_failures_24h', (
      select count(*) from public.notification_push_delivery_event
      where created_at >= now() - interval '24 hours'
        and succes = false
    ),
    'invalid_push_targets_30d', (
      select count(*) from public.notification_push_delivery_event
      where created_at >= now() - interval '30 days'
        and invalide = true
    )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_platform_observability_metrics() to authenticated;

create or replace function public.get_system_notification_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'total', (select count(*) from public.notification),
    'last_24h', (
      select count(*) from public.notification
      where date_creation >= now() - interval '24 hours'
    ),
    'unread_total', (
      select count(*) from public.notification
      where lue = false
    ),
    'failed_total', (
      select count(*) from public.notification
      where coalesce(statut_envoi::text, '') in ('echec', 'failed')
    ),
    'push_success_last_24h', (
      select count(*) from public.notification_push_delivery_event
      where created_at >= now() - interval '24 hours'
        and succes = true
    ),
    'push_failures_last_24h', (
      select count(*) from public.notification_push_delivery_event
      where created_at >= now() - interval '24 hours'
        and succes = false
    ),
    'invalid_targets_last_30d', (
      select count(*) from public.notification_push_delivery_event
      where created_at >= now() - interval '30 days'
        and invalide = true
    ),
    'by_channel', (
      select coalesce(jsonb_object_agg(canal::text, total), '{}'::jsonb)
      from (
        select canal, count(*) as total
        from public.notification
        group by canal
      ) c
    ),
    'by_priority', (
      select coalesce(jsonb_object_agg(priorite::text, total), '{}'::jsonb)
      from (
        select priorite, count(*) as total
        from public.notification
        group by priorite
      ) p
    ),
    'push_by_browser_30d', (
      select coalesce(jsonb_object_agg(coalesce(navigateur, 'inconnu'), total), '{}'::jsonb)
      from (
        select navigateur, count(*) as total
        from public.notification_push_delivery_event
        where created_at >= now() - interval '30 days'
        group by navigateur
      ) b
    ),
    'push_failures_by_channel_30d', (
      select coalesce(jsonb_object_agg(canal, total), '{}'::jsonb)
      from (
        select canal, count(*) as total
        from public.notification_push_delivery_event
        where created_at >= now() - interval '30 days'
          and succes = false
        group by canal
      ) c
    )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_system_notification_metrics() to authenticated;

create or replace function public.get_security_access_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'active_users', (
      select count(*) from public.utilisateur
      where statut_compte::text = 'actif'
    ),
    'disabled_users', (
      select count(*) from public.utilisateur
      where statut_compte::text in ('desactive', 'suspendu', 'bloque')
    ),
    'platform_admins', (
      select count(distinct ur.id_utilisateur)
      from public.utilisateur_role ur
      join public.role r on r.id = ur.id_role
      join public.utilisateur u on u.id = ur.id_utilisateur
      where r.nom_role::text = 'admin_systeme'
        and u.id_organisation is null
    ),
    'organisation_admins', (
      select count(distinct ur.id_utilisateur)
      from public.utilisateur_role ur
      join public.role r on r.id = ur.id_role
      join public.utilisateur u on u.id = ur.id_utilisateur
      where r.nom_role::text = 'admin_systeme'
        and u.id_organisation is not null
    ),
    'authority_users', (
      select count(distinct ur.id_utilisateur)
      from public.utilisateur_role ur
      join public.role r on r.id = ur.id_role
      where r.nom_role::text = 'autorite'
    ),
    'expired_role_assignments', (
      select count(*) from public.utilisateur_role
      where date_expiration is not null
        and date_expiration < now()
    ),
    'roles_expiring_30d', (
      select count(*) from public.utilisateur_role
      where date_expiration is not null
        and date_expiration >= now()
        and date_expiration < now() + interval '30 days'
    ),
    'admin_logins_last_7d', (
      select count(*)
      from public.journal_activite ja
      where ja.type_action::text = 'connexion'
        and ja.date_action >= now() - interval '7 days'
        and (
          public.utilisateur_has_role(ja.id_utilisateur, 'admin_systeme')
          or public.utilisateur_has_role(ja.id_utilisateur, 'autorite')
        )
    ),
    'recent_role_changes', (
      select count(*)
      from public.journal_activite
      where type_action::text = 'attribution_role'
        and date_action >= now() - interval '30 days'
    ),
    'access_requests_pending', (
      select count(*) from public.demande_acces_sensible
      where statut = 'en_attente'
    ),
    'access_requests_approved_30d', (
      select count(*) from public.demande_acces_sensible
      where statut = 'approuvee'
        and coalesce(date_decision, updated_at) >= now() - interval '30 days'
    ),
    'access_requests_refused_30d', (
      select count(*) from public.demande_acces_sensible
      where statut = 'refusee'
        and coalesce(date_decision, updated_at) >= now() - interval '30 days'
    ),
    'recent_role_assignments', (
      select coalesce(jsonb_agg(item order by item->>'date_attribution' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'role', r.nom_role,
          'beneficiaire', coalesce(nullif(trim(concat_ws(' ', u.prenom, u.nom)), ''), u.email),
          'beneficiaire_email', u.email,
          'attribue_par', coalesce(nullif(trim(concat_ws(' ', actor.prenom, actor.nom)), ''), actor.email),
          'attribue_par_email', actor.email,
          'date_attribution', ur.date_attribution,
          'date_expiration', ur.date_expiration,
          'commentaire', ur.commentaire
        ) as item
        from public.utilisateur_role ur
        join public.role r on r.id = ur.id_role
        join public.utilisateur u on u.id = ur.id_utilisateur
        left join public.utilisateur actor on actor.id = ur.attribue_par
        order by ur.date_attribution desc nulls last
        limit 20
      ) recent
    )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_security_access_metrics() to authenticated;

create or replace function public.get_backup_retention_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_config jsonb := '{}'::jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  select coalesce(valeur::jsonb, '{}'::jsonb)
  into v_config
  from public.configuration_systeme
  where categorie = 'system'
  order by updated_at desc nulls last
  limit 1;

  return jsonb_build_object(
    'generated_at', now(),
    'data_retention_days', coalesce((v_config->>'data_retention_days')::int, 365),
    'anonymization_enabled', coalesce((v_config->>'anonymization_enabled')::boolean, false),
    'auto_backup_enabled', coalesce((v_config->>'auto_backup_enabled')::boolean, false),
    'backup_frequency_hours', coalesce((v_config->>'backup_frequency_hours')::int, 24),
    'last_backup_at', v_config->>'last_backup_at',
    'configuration_updated_at', (
      select updated_at from public.configuration_systeme
      where categorie = 'system'
      order by updated_at desc nulls last
      limit 1
    ),
    'audit_log_entries', (select count(*) from public.journal_activite),
    'old_audit_log_entries', (
      select count(*) from public.journal_activite
      where date_action < now() - make_interval(days => coalesce((v_config->>'data_retention_days')::int, 365))
    )
  );
end;
$$;

grant execute on function public.get_backup_retention_metrics() to authenticated;

create or replace function public.run_system_retention_policy(p_dry_run boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_config jsonb := '{}'::jsonb;
  v_days int := 365;
  v_cutoff timestamptz;
  v_old_logs bigint := 0;
  v_old_push_events bigint := 0;
  v_anonymization_enabled boolean := false;
begin
  if v_actor is null or not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  select coalesce(valeur::jsonb, '{}'::jsonb)
  into v_config
  from public.configuration_systeme
  where categorie = 'system'
  order by updated_at desc nulls last
  limit 1;

  v_days := greatest(coalesce((v_config->>'data_retention_days')::int, 365), 30);
  v_anonymization_enabled := coalesce((v_config->>'anonymization_enabled')::boolean, false);
  v_cutoff := now() - make_interval(days => v_days);

  select count(*) into v_old_logs
  from public.journal_activite
  where date_action < v_cutoff;

  select count(*) into v_old_push_events
  from public.notification_push_delivery_event
  where created_at < v_cutoff;

  if not p_dry_run and v_anonymization_enabled then
    update public.journal_activite
    set ip_utilisateur = null,
        user_agent = null,
        localisation_action = null
    where date_action < v_cutoff;

    delete from public.notification_push_delivery_event
    where created_at < v_cutoff;

    insert into public.journal_activite (
      id_utilisateur,
      type_action,
      action_detaillee,
      description,
      donnees_apres,
      date_action
    )
    values (
      v_actor,
      'autre'::public.type_action,
      'retention_systeme',
      'Execution de la politique de retention systeme',
      jsonb_build_object(
        'dry_run', p_dry_run,
        'retention_days', v_days,
        'old_logs', v_old_logs,
        'old_push_events', v_old_push_events
      ),
      now()
    );
  end if;

  return jsonb_build_object(
    'dry_run', p_dry_run,
    'executed', (not p_dry_run and v_anonymization_enabled),
    'anonymization_enabled', v_anonymization_enabled,
    'retention_days', v_days,
    'cutoff', v_cutoff,
    'old_logs', v_old_logs,
    'old_push_events', v_old_push_events
  );
end;
$$;

grant execute on function public.run_system_retention_policy(boolean) to authenticated;

create or replace function public.cleanup_invalid_push_targets(p_stale_days int default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_days int := greatest(coalesce(p_stale_days, 90), 30);
  v_deleted_fcm bigint := 0;
  v_deleted_web_push bigint := 0;
begin
  if v_actor is null or not public.is_platform_admin() then
    raise exception 'Acces reserve a l''administrateur de plateforme';
  end if;

  delete from public.utilisateur_fcm_token
  where coalesce(last_seen_at, updated_at, created_at) < now() - make_interval(days => v_days);
  get diagnostics v_deleted_fcm = row_count;

  if to_regclass('public.utilisateur_web_push_subscription') is not null then
    execute format(
      'delete from public.utilisateur_web_push_subscription where coalesce(last_seen_at, updated_at, created_at) < now() - make_interval(days => %s)',
      v_days
    );
    get diagnostics v_deleted_web_push = row_count;
  end if;

  insert into public.journal_activite (
    id_utilisateur,
    type_action,
    action_detaillee,
    description,
    donnees_apres,
    date_action
  )
  values (
    v_actor,
    'autre'::public.type_action,
    'cleanup_push_targets',
    'Nettoyage des cibles push obsoletes',
    jsonb_build_object('stale_days', v_days, 'deleted_fcm', v_deleted_fcm, 'deleted_web_push', v_deleted_web_push),
    now()
  );

  return jsonb_build_object(
    'stale_days', v_days,
    'deleted_fcm', v_deleted_fcm,
    'deleted_web_push', v_deleted_web_push
  );
end;
$$;

grant execute on function public.cleanup_invalid_push_targets(int) to authenticated;
