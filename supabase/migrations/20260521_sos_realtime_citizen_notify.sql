-- =====================================================
-- SOS : Realtime (liste / pastille autorité) + notif citoyen quand alerte prise en charge
-- =====================================================

-- Publication Realtime (idempotent)
do $body$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sos_event'
  ) then
    execute 'alter publication supabase_realtime add table public.sos_event';
  end if;
end
$body$;

-- Notifier le citoyen lors du passage envoye → traite
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
      'normale'::public.priorite_traitement,
      false,
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

drop trigger if exists sos_event_notify_citizen_traite on public.sos_event;
create trigger sos_event_notify_citizen_traite
  after update on public.sos_event
  for each row
  execute function public.trg_sos_event_notify_citizen_traite();

grant update on public.contact_urgence to service_role;
