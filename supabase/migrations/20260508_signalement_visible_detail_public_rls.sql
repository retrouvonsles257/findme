-- Visibilité grand public du détail d'un signalement (hors autorités / propriétaire).
-- Les autorités continuent de voir tout via les politiques existantes sur signalement.

alter table public.signalement
  add column if not exists visible_detail_public boolean not null default false;

comment on column public.signalement.visible_detail_public is
  'Si vrai, le contenu peut être lu sur les vues publiques (dossier visible_public + statut valide). Les membres org / admin voient le détail sans ce garde-fou.';

-- Comportement historique : signalements déjà validés étaient implicitement visibles sur les fiches publiques.
update public.signalement
set visible_detail_public = true
where statut_validation = 'valide';

drop policy if exists signalement_public_select_visible on public.signalement;

create policy signalement_public_select_visible
on public.signalement
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.dossier_disparition d
    where d.id = signalement.id_dossier
      and coalesce(d.visible_public, false) = true
  )
  and signalement.statut_validation = 'valide'
  and coalesce(signalement.visible_detail_public, false) = true
);
