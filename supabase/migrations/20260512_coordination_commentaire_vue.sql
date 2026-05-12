-- Lecture des messages de coordination par utilisateur.
-- Une ligne = un message de coordination lu par un utilisateur connecté.

create table if not exists public.commentaire_vue (
  id uuid primary key default gen_random_uuid(),
  id_commentaire uuid not null references public.commentaire(id) on delete cascade,
  id_utilisateur uuid not null references public.utilisateur(id) on delete cascade,
  date_lecture timestamptz not null default now()
);

create unique index if not exists commentaire_vue_commentaire_utilisateur_idx
  on public.commentaire_vue(id_commentaire, id_utilisateur);

create index if not exists commentaire_vue_utilisateur_idx
  on public.commentaire_vue(id_utilisateur);

create index if not exists commentaire_vue_commentaire_idx
  on public.commentaire_vue(id_commentaire);

comment on table public.commentaire_vue is
  'Messages de coordination lus par utilisateur. Sert au badge non lu de l espace autorite.';

alter table public.commentaire_vue enable row level security;

drop policy if exists commentaire_vue_select_own on public.commentaire_vue;
create policy commentaire_vue_select_own
on public.commentaire_vue
for select
to authenticated
using (id_utilisateur = auth.uid());

drop policy if exists commentaire_vue_insert_own_coordination on public.commentaire_vue;
create policy commentaire_vue_insert_own_coordination
on public.commentaire_vue
for insert
to authenticated
with check (
  id_utilisateur = auth.uid()
  and exists (
    select 1
    from public.commentaire c
    where c.id = id_commentaire
      and c.type_commentaire::text = 'coordination'
  )
);

drop policy if exists commentaire_vue_update_own on public.commentaire_vue;
create policy commentaire_vue_update_own
on public.commentaire_vue
for update
to authenticated
using (id_utilisateur = auth.uid())
with check (id_utilisateur = auth.uid());

grant select, insert, update on public.commentaire_vue to authenticated;
