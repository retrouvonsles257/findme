-- Suivi dédié des vues de fiche dossier (personnes uniques)
-- Objectif: connaître précisément combien de personnes distinctes ont consulté un dossier.

create table if not exists public.dossier_vue (
  id uuid primary key default gen_random_uuid(),
  id_dossier uuid not null references public.dossier_disparition(id) on delete cascade,
  id_utilisateur uuid null references public.utilisateur(id) on delete set null,
  viewer_fingerprint text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  vues_count integer not null default 1,
  source text not null default 'web'
);

create unique index if not exists uq_dossier_vue_unique_viewer
  on public.dossier_vue(id_dossier, viewer_fingerprint);

create index if not exists idx_dossier_vue_dossier
  on public.dossier_vue(id_dossier);

create index if not exists idx_dossier_vue_user
  on public.dossier_vue(id_utilisateur);

comment on table public.dossier_vue is
  'Historique des vues uniques des dossiers. Une ligne = un viewer unique par dossier.';

comment on column public.dossier_vue.viewer_fingerprint is
  'Identifiant stable du viewer: user:<uuid> si connecté, sinon visitor:<device_id>.';

-- RLS
alter table public.dossier_vue enable row level security;

drop policy if exists dossier_vue_insert_public on public.dossier_vue;
create policy dossier_vue_insert_public
on public.dossier_vue
for insert
to anon, authenticated
with check (true);

drop policy if exists dossier_vue_update_public on public.dossier_vue;
create policy dossier_vue_update_public
on public.dossier_vue
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists dossier_vue_read_authority on public.dossier_vue;
create policy dossier_vue_read_authority
on public.dossier_vue
for select
to authenticated
using (
  public.get_user_niveau_acces(auth.uid()) >= 3
  or id_utilisateur = auth.uid()
);

-- Recalcule du compteur historique à partir de la table dédiée
update public.dossier_disparition d
set nombre_vues_fiche = coalesce(v.cnt, 0)
from (
  select id_dossier, count(*)::int as cnt
  from public.dossier_vue
  group by id_dossier
) v
where d.id = v.id_dossier;

