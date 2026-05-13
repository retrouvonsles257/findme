-- =====================================================
-- Fix: configuration_systeme.valeur peut être text (pas jsonb).
-- COALESCE(valeur, '{}'::jsonb) provoque ERROR 42804.
-- Recréation des fonctions avec coalesce(valeur::jsonb, '{}'::jsonb).
-- =====================================================

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
