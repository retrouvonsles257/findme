-- =====================================================
-- Messagerie pré-déclaration : étapes 1 & 2 (doc reco)
-- Rejet tracé, messages typés + métadonnées, soft-delete, PJ, références,
-- assignation conversation, journal (RPC), Realtime sur message.
-- =====================================================

-- ---------- Pré-déclaration : rejet tracé ----------
alter table public.pre_declaration_citoyenne
  add column if not exists motif_rejet text,
  add column if not exists rejetee_par uuid references public.utilisateur (id) on delete set null,
  add column if not exists rejetee_at timestamptz;

comment on column public.pre_declaration_citoyenne.motif_rejet is 'Motif saisi par l''autorité lors du rejet (obligatoire côté app).';

-- ---------- Conversation : agent assigné ----------
alter table public.conversation
  add column if not exists id_utilisateur_assigne uuid references public.utilisateur (id) on delete set null;

comment on column public.conversation.id_utilisateur_assigne is 'Agent autorité référent sur le fil (réassignation interne).';

-- ---------- Message : type, métadonnées, suppression logique ----------
alter table public.message
  add column if not exists deleted_at timestamptz,
  add column if not exists type_message text not null default 'texte'
    constraint message_type_message_chk
      check (type_message in ('texte', 'demande_complement', 'demande_piece', 'note_systeme')),
  add column if not exists metadonnees jsonb not null default '{}'::jsonb;

comment on column public.message.type_message is 'Catégorie de message (demande officielle vs texte libre).';
comment on column public.message.metadonnees is 'Données structurées (références, actions, payload).';

-- ---------- Pièces jointes ----------
create table if not exists public.message_piece_jointe (
  id uuid primary key default gen_random_uuid(),
  id_message uuid not null references public.message (id) on delete cascade,
  nom_fichier text not null,
  mime_type text not null,
  taille_octets integer not null
    constraint message_piece_jointe_taille_chk
      check (taille_octets > 0 and taille_octets <= 20971520),
  url_storage text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_message_piece_jointe_message
  on public.message_piece_jointe (id_message);

comment on table public.message_piece_jointe is 'Fichiers liés à un message (URL Cloudinary ou autre stockage).';

-- ---------- Références entités ----------
create table if not exists public.message_reference (
  id uuid primary key default gen_random_uuid(),
  id_message uuid not null references public.message (id) on delete cascade,
  type_entite text not null
    constraint message_reference_type_chk
      check (type_entite in ('dossier', 'personne', 'signalement', 'alerte', 'document', 'pre_declaration', 'message')),
  id_entite uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_message_reference_message
  on public.message_reference (id_message);
create index if not exists idx_message_reference_entite
  on public.message_reference (type_entite, id_entite);

comment on table public.message_reference is 'Lien structuré message → entité métier.';

-- ---------- Participants (préparation multi-acteurs ; remplissage optionnel) ----------
create table if not exists public.conversation_participant (
  id uuid primary key default gen_random_uuid(),
  id_conversation uuid not null references public.conversation (id) on delete cascade,
  id_utilisateur uuid not null references public.utilisateur (id) on delete cascade,
  role text not null default 'autorite'
    constraint conversation_participant_role_chk
      check (role in ('citoyen', 'autorite')),
  created_at timestamptz not null default now(),
  constraint conversation_participant_unique unique (id_conversation, id_utilisateur)
);

create index if not exists idx_conversation_participant_conv
  on public.conversation_participant (id_conversation);

-- ---------- RPC : suppression logique (contrôle serveur) ----------
create or replace function public.soft_delete_own_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv uuid;
  v_auteur uuid;
begin
  select m.id_conversation, m.id_auteur into v_conv, v_auteur
  from public.message m
  where m.id = p_message_id and m.deleted_at is null;

  if v_conv is null then
    raise exception 'Message introuvable ou déjà supprimé';
  end if;

  if v_auteur is distinct from auth.uid() then
    raise exception 'Seul l''auteur peut supprimer ce message';
  end if;

  if not exists (
    select 1
    from public.conversation c
    join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
    where c.id = v_conv
      and (
        p.id_utilisateur = auth.uid()
        or (
          public.utilisateur_has_role(auth.uid(), 'autorite')
          and public.get_my_org_id() is not null
          and p.id_organisation = public.get_my_org_id()
        )
      )
  ) and not public.utilisateur_has_role(auth.uid(), 'admin_systeme') then
    raise exception 'Accès refusé';
  end if;

  update public.message
  set deleted_at = now()
  where id = p_message_id and id_auteur = auth.uid() and deleted_at is null;
end;
$$;

grant execute on function public.soft_delete_own_message(uuid) to authenticated;

-- ---------- RLS nouvelles tables ----------
alter table public.message_piece_jointe enable row level security;
alter table public.message_reference enable row level security;
alter table public.conversation_participant enable row level security;

drop policy if exists message_piece_jointe_select on public.message_piece_jointe;
create policy message_piece_jointe_select
  on public.message_piece_jointe
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where m.id = message_piece_jointe.id_message
        and (
          p.id_utilisateur = auth.uid()
          or (
            public.utilisateur_has_role(auth.uid(), 'autorite')
            and public.get_my_org_id() is not null
            and p.id_organisation = public.get_my_org_id()
          )
        )
    )
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists message_piece_jointe_insert on public.message_piece_jointe;
create policy message_piece_jointe_insert
  on public.message_piece_jointe
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where m.id = message_piece_jointe.id_message
        and m.id_auteur = auth.uid()
        and p.statut in ('soumise', 'en_examen')
        and (
          p.id_utilisateur = auth.uid()
          or (
            public.utilisateur_has_role(auth.uid(), 'autorite')
            and public.get_my_org_id() is not null
            and p.id_organisation = public.get_my_org_id()
          )
        )
    )
  );

drop policy if exists message_reference_select on public.message_reference;
create policy message_reference_select
  on public.message_reference
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where m.id = message_reference.id_message
        and (
          p.id_utilisateur = auth.uid()
          or (
            public.utilisateur_has_role(auth.uid(), 'autorite')
            and public.get_my_org_id() is not null
            and p.id_organisation = public.get_my_org_id()
          )
        )
    )
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists message_reference_insert on public.message_reference;
create policy message_reference_insert
  on public.message_reference
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where m.id = message_reference.id_message
        and m.id_auteur = auth.uid()
        and p.statut in ('soumise', 'en_examen')
    )
  );

drop policy if exists conversation_participant_select on public.conversation_participant;
create policy conversation_participant_select
  on public.conversation_participant
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = conversation_participant.id_conversation
        and (
          p.id_utilisateur = auth.uid()
          or (
            public.utilisateur_has_role(auth.uid(), 'autorite')
            and public.get_my_org_id() is not null
            and p.id_organisation = public.get_my_org_id()
          )
        )
    )
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists conversation_participant_insert on public.conversation_participant;
create policy conversation_participant_insert
  on public.conversation_participant
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = conversation_participant.id_conversation
        and public.utilisateur_has_role(auth.uid(), 'autorite')
        and public.get_my_org_id() is not null
        and p.id_organisation = public.get_my_org_id()
    )
  );

drop policy if exists conversation_participant_update on public.conversation_participant;
create policy conversation_participant_update
  on public.conversation_participant
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = conversation_participant.id_conversation
        and public.utilisateur_has_role(auth.uid(), 'autorite')
        and public.get_my_org_id() is not null
        and p.id_organisation = public.get_my_org_id()
    )
  )
  with check (
    exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = conversation_participant.id_conversation
        and public.utilisateur_has_role(auth.uid(), 'autorite')
        and public.get_my_org_id() is not null
        and p.id_organisation = public.get_my_org_id()
    )
  );

drop policy if exists conversation_participant_delete on public.conversation_participant;
create policy conversation_participant_delete
  on public.conversation_participant
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = conversation_participant.id_conversation
        and public.utilisateur_has_role(auth.uid(), 'autorite')
        and public.get_my_org_id() is not null
        and p.id_organisation = public.get_my_org_id()
    )
  );

grant select, insert, delete on public.message_piece_jointe to authenticated;
grant select, insert, delete on public.message_reference to authenticated;
grant select, insert, update, delete on public.conversation_participant to authenticated;

-- ---------- Realtime : message ----------
alter table public.message replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message'
  ) then
    alter publication supabase_realtime add table public.message;
  end if;
exception
  when undefined_object then
    raise notice 'Publication supabase_realtime absente';
  when duplicate_object then null;
end $$;
