-- =====================================================
-- MVP messagerie citoyen / autorité : pré-déclaration + fil texte
-- Tables : pre_declaration_citoyenne, conversation, message, message_lecture
-- =====================================================

-- ---------- 1) Tables ----------
create table if not exists public.pre_declaration_citoyenne (
  id uuid primary key default gen_random_uuid(),
  id_utilisateur uuid not null references public.utilisateur (id) on delete cascade,
  id_organisation uuid not null references public.organisation (id) on delete restrict,
  statut text not null default 'soumise'
    constraint pre_declaration_statut_chk
      check (statut in ('soumise', 'en_examen', 'convertie', 'rejetee')),
  id_dossier uuid null references public.dossier_disparition (id) on delete set null,
  nom_personne text not null,
  prenom_personne text not null default '',
  sexe text not null default 'non_precise'
    constraint pre_declaration_sexe_chk
      check (sexe in ('masculin', 'feminin', 'inconnu', 'non_precise')),
  date_naissance date null,
  nationalite text not null default 'Camerounaise',
  date_disparition date not null,
  lieu_disparition text,
  ville_disparition text,
  region_disparition text,
  pays_disparition text not null default 'Cameroun',
  latitude_disparition double precision,
  longitude_disparition double precision,
  type_disparition text not null default 'inconnue',
  niveau_urgence text not null default 'normal',
  circonstances text not null,
  infos_complementaires text,
  contact_nom text,
  contact_telephone text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pre_declaration_utilisateur
  on public.pre_declaration_citoyenne (id_utilisateur);
create index if not exists idx_pre_declaration_organisation
  on public.pre_declaration_citoyenne (id_organisation);
create index if not exists idx_pre_declaration_statut
  on public.pre_declaration_citoyenne (statut);

create table if not exists public.conversation (
  id uuid primary key default gen_random_uuid(),
  id_pre_declaration uuid not null references public.pre_declaration_citoyenne (id) on delete cascade,
  statut text not null default 'ouverte'
    constraint conversation_statut_chk
      check (statut in ('ouverte', 'en_attente', 'traitee', 'fermee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_unique_pre_declaration unique (id_pre_declaration)
);

create index if not exists idx_conversation_pre_declaration
  on public.conversation (id_pre_declaration);

create table if not exists public.message (
  id uuid primary key default gen_random_uuid(),
  id_conversation uuid not null references public.conversation (id) on delete cascade,
  id_auteur uuid not null references public.utilisateur (id) on delete restrict,
  corps text not null
    constraint message_corps_non_vide_chk check (length(trim(corps)) > 0 and char_length(corps) <= 8000),
  created_at timestamptz not null default now()
);

create index if not exists idx_message_conversation_created
  on public.message (id_conversation, created_at);

create table if not exists public.message_lecture (
  id_message uuid not null references public.message (id) on delete cascade,
  id_utilisateur uuid not null references public.utilisateur (id) on delete cascade,
  lu_at timestamptz not null default now(),
  primary key (id_message, id_utilisateur)
);

create index if not exists idx_message_lecture_utilisateur
  on public.message_lecture (id_utilisateur);

comment on table public.pre_declaration_citoyenne is
  'Déclaration citoyenne structurée avant dossier officiel ; messagerie liée via conversation.';
comment on table public.conversation is
  'Fil unique par pré-déclaration (MVP).';
comment on table public.message is
  'Messages texte entre citoyen et membres de l''organisation destinataire.';
comment on table public.message_lecture is
  'Accusés de lecture par utilisateur.';

-- ---------- 2) RLS ----------
alter table public.pre_declaration_citoyenne enable row level security;
alter table public.conversation enable row level security;
alter table public.message enable row level security;
alter table public.message_lecture enable row level security;

-- pre_declaration_citoyenne : citoyen (insert + lecture) ; pas de mise à jour côté citoyen (MVP)
drop policy if exists pre_declaration_owner_all on public.pre_declaration_citoyenne;
drop policy if exists pre_declaration_owner_insert on public.pre_declaration_citoyenne;
create policy pre_declaration_owner_insert
  on public.pre_declaration_citoyenne
  for insert
  to authenticated
  with check (
    id_utilisateur = auth.uid()
    and statut = 'soumise'
    and id_dossier is null
  );

drop policy if exists pre_declaration_owner_select on public.pre_declaration_citoyenne;
create policy pre_declaration_owner_select
  on public.pre_declaration_citoyenne
  for select
  to authenticated
  using (id_utilisateur = auth.uid());

drop policy if exists pre_declaration_authority_org_select on public.pre_declaration_citoyenne;
create policy pre_declaration_authority_org_select
  on public.pre_declaration_citoyenne
  for select
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.get_my_org_id() is not null
    and id_organisation = public.get_my_org_id()
  );

drop policy if exists pre_declaration_authority_org_update on public.pre_declaration_citoyenne;
create policy pre_declaration_authority_org_update
  on public.pre_declaration_citoyenne
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.get_my_org_id() is not null
    and id_organisation = public.get_my_org_id()
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.get_my_org_id() is not null
    and id_organisation = public.get_my_org_id()
  );

drop policy if exists pre_declaration_admin_systeme_select on public.pre_declaration_citoyenne;
create policy pre_declaration_admin_systeme_select
  on public.pre_declaration_citoyenne
  for select
  to authenticated
  using (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- conversation
drop policy if exists conversation_access_select on public.conversation;
create policy conversation_access_select
  on public.conversation
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.pre_declaration_citoyenne p
      where p.id = conversation.id_pre_declaration
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

drop policy if exists conversation_owner_insert on public.conversation;
create policy conversation_owner_insert
  on public.conversation
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.pre_declaration_citoyenne p
      where p.id = conversation.id_pre_declaration
        and p.id_utilisateur = auth.uid()
    )
  );

drop policy if exists conversation_authority_org_update on public.conversation;
create policy conversation_authority_org_update
  on public.conversation
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.pre_declaration_citoyenne p
      where p.id = conversation.id_pre_declaration
        and public.utilisateur_has_role(auth.uid(), 'autorite')
        and public.get_my_org_id() is not null
        and p.id_organisation = public.get_my_org_id()
    )
  )
  with check (
    exists (
      select 1
      from public.pre_declaration_citoyenne p
      where p.id = conversation.id_pre_declaration
        and public.utilisateur_has_role(auth.uid(), 'autorite')
        and public.get_my_org_id() is not null
        and p.id_organisation = public.get_my_org_id()
    )
  );

-- message : lecture si accès conversation ; insert si auteur = soi et pré-déclaration encore « ouverte » aux échanges
drop policy if exists message_access_select on public.message;
create policy message_access_select
  on public.message
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = message.id_conversation
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

drop policy if exists message_participant_insert on public.message;
create policy message_participant_insert
  on public.message
  for insert
  to authenticated
  with check (
    id_auteur = auth.uid()
    and exists (
      select 1
      from public.conversation c
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where c.id = message.id_conversation
        and p.statut in ('soumise', 'en_examen')
        and (
          (
            p.id_utilisateur = auth.uid()
          )
          or (
            public.utilisateur_has_role(auth.uid(), 'autorite')
            and public.get_my_org_id() is not null
            and p.id_organisation = public.get_my_org_id()
          )
        )
    )
  );

-- message_lecture
drop policy if exists message_lecture_own_select on public.message_lecture;
create policy message_lecture_own_select
  on public.message_lecture
  for select
  to authenticated
  using (
    id_utilisateur = auth.uid()
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists message_lecture_own_insert on public.message_lecture;
create policy message_lecture_own_insert
  on public.message_lecture
  for insert
  to authenticated
  with check (
    id_utilisateur = auth.uid()
    and exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      join public.pre_declaration_citoyenne p on p.id = c.id_pre_declaration
      where m.id = message_lecture.id_message
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

-- ---------- 3) Grants ----------
grant select, insert, update on public.pre_declaration_citoyenne to authenticated;
grant select, insert, update on public.conversation to authenticated;
grant select, insert on public.message to authenticated;
grant select, insert on public.message_lecture to authenticated;
