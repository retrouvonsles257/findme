-- =====================================================
-- Correctifs production :
-- 1) SOS « marquer traité » : trigger notif citoyen (priorite invalide → 400)
-- 2) Accès messagerie citoyen (signalement / dossier lié)
-- 3) Autorité : rôle OU type_compte actif
-- 4) Dispatch FCM optionnel via pg_net + configuration_systeme
-- =====================================================

-- ---------- Autorité : rôle applicatif OU compte type autorite actif ----------
create or replace function public.is_utilisateur_authority(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user is not null
    and (
      public.utilisateur_has_role(p_user, 'autorite')
      or public.utilisateur_has_role(p_user, 'admin_systeme')
      or exists (
        select 1
        from public.utilisateur u
        where u.id = p_user
          and u.type_compte::text = 'autorite'
          and u.statut_compte::text = 'actif'
      )
    );
$$;

grant execute on function public.is_utilisateur_authority(uuid) to authenticated;

-- ---------- SOS : clôture ----------
create or replace function public.mark_sos_event_handled(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;
  if not public.is_utilisateur_authority(v_uid) then
    raise exception 'Droits insuffisants';
  end if;

  update public.sos_event
  set
    statut = 'traite',
    handled_at = v_now,
    handled_by = v_uid
  where id = p_event_id
    and statut = 'envoye';

  if not found then
    raise exception 'SOS introuvable ou déjà traité';
  end if;
end;
$$;

grant execute on function public.mark_sos_event_handled(uuid) to authenticated;

-- ---------- SOS : notif citoyen (priorite enum valide) ----------
create or replace function public.trg_sos_event_notify_citizen_traite()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op = 'UPDATE'
     and old.statut = 'envoye'
     and new.statut = 'traite'
     and new.id_utilisateur is not null
  then
    insert into public.notification (
      type_notification,
      titre,
      message,
      canal,
      priorite,
      lue,
      statut_envoi,
      date_creation,
      id_utilisateur,
      url_action,
      donnees_supplementaires
    )
    values (
      'autre'::public.type_notification,
      'SOS pris en charge',
      'Une autorité a indiqué que votre alerte SOS a été traitée. Consultez la page SOS pour l''historique.',
      'push'::public.canal_notification,
      'moyenne'::public.priorite_traitement,
      false,
      'en_attente',
      now(),
      new.id_utilisateur,
      '/citizen/sos',
      jsonb_build_object(
        'event', 'sos_handled',
        'sos_id', new.id::text
      )
    );
  end if;
  return new;
end
$fn$;

-- ---------- Messagerie : accès citoyen élargi (signalement / dossier) ----------
create or replace function public.conversation_user_can_access(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;
  if public.utilisateur_has_role(uid, 'admin_systeme') then
    return true;
  end if;

  return exists (
    select 1
    from public.conversation c
    where c.id = p_conversation_id
      and (
        (
          c.id_pre_declaration is not null
          and exists (
            select 1
            from public.pre_declaration_citoyenne p
            where p.id = c.id_pre_declaration
              and (
                p.id_utilisateur = uid
                or (
                  public.utilisateur_has_role(uid, 'autorite')
                  and public.get_my_org_id() is not null
                  and (
                    p.id_organisation = public.get_my_org_id()
                    or c.id_organisation_escalade = public.get_my_org_id()
                  )
                )
              )
          )
        )
        or (
          c.id_dossier is not null
          and exists (
            select 1
            from public.dossier_disparition d
            where d.id = c.id_dossier
              and (
                d.id_utilisateur_createur = uid
                or (
                  public.utilisateur_has_role(uid, 'autorite')
                  and public.get_my_org_id() is not null
                  and (
                    d.id_organisation_responsable = public.get_my_org_id()
                    or c.id_organisation_escalade = public.get_my_org_id()
                  )
                )
              )
          )
        )
        or (
          c.id_signalement is not null
          and exists (
            select 1
            from public.signalement s
            where s.id = c.id_signalement
              and (
                (s.id_utilisateur is not null and s.id_utilisateur = uid)
                or (
                  s.id_dossier is not null
                  and exists (
                    select 1
                    from public.dossier_disparition d2
                    where d2.id = s.id_dossier
                      and d2.id_utilisateur_createur = uid
                  )
                )
                or (
                  public.utilisateur_has_role(uid, 'autorite')
                  and public.get_my_org_id() is not null
                  and (
                    c.id_organisation_escalade = public.get_my_org_id()
                    or (
                      s.id_dossier is not null
                      and exists (
                        select 1
                        from public.dossier_disparition d3
                        where d3.id = s.id_dossier
                          and d3.id_organisation_responsable = public.get_my_org_id()
                      )
                    )
                  )
                )
              )
          )
        )
      )
  );
end;
$$;

grant execute on function public.conversation_user_can_access(uuid) to authenticated;

-- ---------- FCM : dispatch automatique après INSERT notification (pg_net) ----------
-- Prérequis optionnels dans configuration_systeme (categorie = 'notifications') :
--   notification_fcm_dispatch_url    → https://<ref>.supabase.co/functions/v1/notification-fcm-send
--   notification_fcm_dispatch_secret → même valeur que NOTIFICATION_FCM_SECRET (Edge Function)
-- Sinon : configurer le Database Webhook Supabase (INSERT public.notification).

create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_notification_fcm_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_secret text;
  v_body jsonb;
  v_cfg jsonb;
begin
  if coalesce(new.canal::text, 'push') not in ('push', 'in_app') then
    return new;
  end if;

  select coalesce(valeur::jsonb, '{}'::jsonb)
  into v_cfg
  from public.configuration_systeme
  where categorie = 'notifications'
  order by updated_at desc nulls last
  limit 1;

  v_url := nullif(trim(coalesce(v_cfg->>'notification_fcm_dispatch_url', '')), '');
  v_secret := nullif(trim(coalesce(v_cfg->>'notification_fcm_dispatch_secret', '')), '');

  if v_url is null or v_secret is null then
    return new;
  end if;

  v_body := jsonb_build_object(
    'type', 'INSERT',
    'table', 'notification',
    'schema', 'public',
    'record', to_jsonb(new)
  );

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notification-fcm-secret', v_secret
    ),
    body := v_body
  );

  return new;
exception
  when undefined_function then
    return new;
  when others then
    raise warning 'dispatch_notification_fcm_push: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists notification_dispatch_fcm_push on public.notification;
create trigger notification_dispatch_fcm_push
  after insert on public.notification
  for each row
  execute function public.dispatch_notification_fcm_push();
