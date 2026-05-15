-- =====================================================
-- MVP SOS : contacts d'urgence + événements SOS
-- RLS : contacts gérés par le citoyen ; sos_event lecture citoyen (ses lignes) / autorité (toutes) ;
--       insertion réservée au service role (Edge Function).
-- =====================================================

create table if not exists public.contact_urgence (
  id uuid primary key default gen_random_uuid(),
  id_utilisateur uuid not null references public.utilisateur (id) on delete cascade,
  nom text not null,
  email text not null,
  relation text,
  email_verifie boolean not null default false,
  date_ajout timestamptz not null default now(),
  date_verification timestamptz null,
  constraint contact_urgence_email_nonempty check (length(trim(email)) > 0 and char_length(email) <= 320),
  constraint contact_urgence_nom_nonempty check (length(trim(nom)) > 0 and char_length(nom) <= 200)
);

create index if not exists idx_contact_urgence_utilisateur on public.contact_urgence (id_utilisateur);

create table if not exists public.sos_event (
  id uuid primary key default gen_random_uuid(),
  id_utilisateur uuid not null references public.utilisateur (id) on delete cascade,
  latitude double precision,
  longitude double precision,
  precision_metres double precision,
  message text,
  sans_position boolean not null default false,
  statut text not null
    constraint sos_event_statut_chk
      check (statut in ('annule', 'envoye', 'traite')),
  handled_at timestamptz null,
  handled_by uuid null references public.utilisateur (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint sos_message_len check (message is null or char_length(message) <= 2000)
);

create index if not exists idx_sos_event_utilisateur_created on public.sos_event (id_utilisateur, created_at desc);
create index if not exists idx_sos_event_statut_created on public.sos_event (statut, created_at desc);

comment on table public.contact_urgence is 'Contacts e-mail d''urgence configurés par le citoyen (MVP SOS).';
comment on table public.sos_event is 'Événement SOS ; création via Edge Function (service role).';

alter table public.contact_urgence enable row level security;
alter table public.sos_event enable row level security;

-- Contacts : CRUD propriétaire
drop policy if exists contact_urgence_owner_all on public.contact_urgence;
create policy contact_urgence_owner_all
  on public.contact_urgence
  for all
  to authenticated
  using (id_utilisateur = auth.uid())
  with check (id_utilisateur = auth.uid());

drop policy if exists contact_urgence_admin_select on public.contact_urgence;
create policy contact_urgence_admin_select
  on public.contact_urgence
  for select
  to authenticated
  using (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- sos_event : lecture citoyen (ses événements)
drop policy if exists sos_event_owner_select on public.sos_event;
create policy sos_event_owner_select
  on public.sos_event
  for select
  to authenticated
  using (id_utilisateur = auth.uid());

-- sos_event : lecture toutes autorités
drop policy if exists sos_event_authority_select on public.sos_event;
create policy sos_event_authority_select
  on public.sos_event
  for select
  to authenticated
  using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists sos_event_admin_select on public.sos_event;
create policy sos_event_admin_select
  on public.sos_event
  for select
  to authenticated
  using (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- Marquer comme traité (autorité uniquement, depuis statut envoye)
drop policy if exists sos_event_authority_update_traite on public.sos_event;
create policy sos_event_authority_update_traite
  on public.sos_event
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and statut = 'envoye'
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and statut = 'traite'
    and handled_by = auth.uid()
    and handled_at is not null
  );

grant select, insert, update, delete on public.contact_urgence to authenticated;
grant select, update on public.sos_event to authenticated;
