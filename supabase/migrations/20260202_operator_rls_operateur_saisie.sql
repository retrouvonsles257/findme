-- =====================================================
-- RLS: OPÉRATEUR_SAISIE (niveau 2) - sécurisé (org-scoped)
-- À exécuter sur Supabase (SQL Editor ou via `supabase db push`)
--
-- Tables couvertes (côté opérateur):
-- - dossier_disparition: select org, insert/update own (pas de changement statut/flags via trigger)
-- - personne: select si liée à un dossier de l'org ou créée par l'utilisateur; insert/update own
-- - signalement: select org (via dossier.id_organisation_responsable); pas de validation/updates opérateur
-- - photo: select photos non approuvées org (via personne->dossier) + insert photo non publique par l'uploadeur
-- - localisation: select org (via dossier/signalement)
-- - lien_filiation: select org (via dossier->personne) + insert/update/delete own
--
-- Prérequis attendu (présent dans `modele_donnee.sql`): public.get_user_niveau_acces(uuid)
-- =====================================================

-- ---------- Helpers ----------
create or replace function public.get_my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id_organisation from public.utilisateur where id = auth.uid()
$$;

create or replace function public.is_niveau_at_least(min_niveau int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_user_niveau_acces(auth.uid()) >= min_niveau
$$;

grant execute on function public.get_my_org_id() to authenticated;
grant execute on function public.is_niveau_at_least(int) to authenticated;

-- =====================================================
-- DOSSIER_DISPARITION
-- =====================================================
alter table public.dossier_disparition enable row level security;

drop policy if exists dossier_public_select on public.dossier_disparition;
drop policy if exists dossier_operator_select_org on public.dossier_disparition;
drop policy if exists dossier_operator_insert on public.dossier_disparition;
drop policy if exists dossier_operator_update_own on public.dossier_disparition;

-- Public: dossiers publics visibles
create policy dossier_public_select
on public.dossier_disparition
for select
to anon, authenticated
using (visible_public = true);

-- Operator: lire dossiers de son org
create policy dossier_operator_select_org
on public.dossier_disparition
for select
to authenticated
using (
  public.is_niveau_at_least(2)
  and id_organisation_responsable = public.get_my_org_id()
);

-- Operator: créer dossiers (doit être créateur + org)
create policy dossier_operator_insert
on public.dossier_disparition
for insert
to authenticated
with check (
  public.is_niveau_at_least(2)
  and id_utilisateur_createur = auth.uid()
  and id_organisation_responsable = public.get_my_org_id()
);

-- Operator: modifier uniquement ses dossiers (RLS), le trigger ci-dessous bloque certaines colonnes
create policy dossier_operator_update_own
on public.dossier_disparition
for update
to authenticated
using (
  public.is_niveau_at_least(2)
  and id_utilisateur_createur = auth.uid()
)
with check (
  public.is_niveau_at_least(2)
  and id_utilisateur_createur = auth.uid()
  and id_organisation_responsable = public.get_my_org_id()
);

-- Garde-fou (RLS ne bloque pas les changements de colonnes)
create or replace function public.guard_operator_dossier_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_user_niveau_acces(auth.uid()) = 2 then
    if new.statut_dossier is distinct from old.statut_dossier then
      raise exception 'operateur_saisie: cannot change dossier statut_dossier';
    end if;

    if new.visible_public is distinct from old.visible_public then
      raise exception 'operateur_saisie: cannot change dossier visible_public';
    end if;

    if new.diffusion_autorisee is distinct from old.diffusion_autorisee
       or new.diffusion_reseaux_sociaux is distinct from old.diffusion_reseaux_sociaux
       or new.diffusion_medias is distinct from old.diffusion_medias then
      raise exception 'operateur_saisie: cannot change dossier diffusion flags';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_operator_dossier_update on public.dossier_disparition;
create trigger trg_guard_operator_dossier_update
before update on public.dossier_disparition
for each row execute function public.guard_operator_dossier_update();

-- =====================================================
-- PERSONNE (dossierAPI fait un join personne:id_personne(*))
-- =====================================================
alter table public.personne enable row level security;

drop policy if exists personne_operator_select_org on public.personne;
drop policy if exists personne_operator_insert on public.personne;
drop policy if exists personne_operator_update_own on public.personne;

create policy personne_operator_select_org
on public.personne
for select
to authenticated
using (
  public.is_niveau_at_least(2) and (
    cree_par = auth.uid()
    or exists (
      select 1 from public.dossier_disparition d
      where d.id_personne = personne.id
        and d.id_organisation_responsable = public.get_my_org_id()
    )
  )
);

create policy personne_operator_insert
on public.personne
for insert
to authenticated
with check (
  public.is_niveau_at_least(2)
  and cree_par = auth.uid()
);

create policy personne_operator_update_own
on public.personne
for update
to authenticated
using (public.is_niveau_at_least(2) and cree_par = auth.uid())
with check (public.is_niveau_at_least(2) and cree_par = auth.uid());

-- =====================================================
-- SIGNALEMENT (lecture org: nécessaire pour "signalements en attente")
-- =====================================================
alter table public.signalement enable row level security;

drop policy if exists signalement_owner_select on public.signalement;
drop policy if exists signalement_operator_select_org on public.signalement;

-- Le citoyen lit ses propres signalements
create policy signalement_owner_select
on public.signalement
for select
to authenticated
using (id_utilisateur = auth.uid());

-- Operator: lire les signalements liés à un dossier de son org
create policy signalement_operator_select_org
on public.signalement
for select
to authenticated
using (
  public.is_niveau_at_least(2)
  and exists (
    select 1
    from public.dossier_disparition d
    where d.id = signalement.id_dossier
      and d.id_organisation_responsable = public.get_my_org_id()
  )
);

-- =====================================================
-- PHOTO (lecture org: "photos en attente"; insert par uploader, non public / non approuvé)
-- =====================================================
alter table public.photo enable row level security;

drop policy if exists photo_public_select on public.photo;
drop policy if exists photo_operator_select_pending_org on public.photo;
drop policy if exists photo_operator_insert_own on public.photo;

-- Public: seulement photos approuvées & publiques
create policy photo_public_select
on public.photo
for select
to anon, authenticated
using (visible_public = true and approuvee = true);

-- Operator: voir photos non approuvées de son org (via personne->dossier)
create policy photo_operator_select_pending_org
on public.photo
for select
to authenticated
using (
  public.is_niveau_at_least(2)
  and approuvee = false
  and exists (
    select 1
    from public.dossier_disparition d
    where d.id_personne = photo.id_personne
      and d.id_organisation_responsable = public.get_my_org_id()
  )
);

-- Operator: insérer ses photos (non publiques / non approuvées)
create policy photo_operator_insert_own
on public.photo
for insert
to authenticated
with check (
  public.is_niveau_at_least(2)
  and uploadee_par = auth.uid()
  and visible_public = false
  and approuvee = false
);

-- =====================================================
-- LOCALISATION (lecture org)
-- =====================================================
alter table public.localisation enable row level security;

drop policy if exists localisation_operator_select_org on public.localisation;
drop policy if exists localisation_operator_insert_own on public.localisation;

create policy localisation_operator_select_org
on public.localisation
for select
to authenticated
using (
  public.is_niveau_at_least(2)
  and (
    (id_dossier is not null and exists (
      select 1 from public.dossier_disparition d
      where d.id = localisation.id_dossier
        and d.id_organisation_responsable = public.get_my_org_id()
    ))
    or
    (id_signalement is not null and exists (
      select 1
      from public.signalement s
      join public.dossier_disparition d on d.id = s.id_dossier
      where s.id = localisation.id_signalement
        and d.id_organisation_responsable = public.get_my_org_id()
    ))
  )
);

-- Operator: insérer une localisation (ex: point initial) pour un dossier de son org
create policy localisation_operator_insert_own
on public.localisation
for insert
to authenticated
with check (
  public.is_niveau_at_least(2)
  and enregistree_par = auth.uid()
  and (
    (id_dossier is not null and exists (
      select 1
      from public.dossier_disparition d
      where d.id = localisation.id_dossier
        and d.id_organisation_responsable = public.get_my_org_id()
    ))
    or
    (id_signalement is not null and exists (
      select 1
      from public.signalement s
      join public.dossier_disparition d on d.id = s.id_dossier
      where s.id = localisation.id_signalement
        and d.id_organisation_responsable = public.get_my_org_id()
    ))
  )
);

-- =====================================================
-- LIEN_FILIATION (lecture org, + gestion own)
-- =====================================================
alter table public.lien_filiation enable row level security;

drop policy if exists filiation_operator_select_org on public.lien_filiation;
drop policy if exists filiation_operator_insert_own on public.lien_filiation;
drop policy if exists filiation_operator_update_own on public.lien_filiation;
drop policy if exists filiation_operator_delete_own on public.lien_filiation;

create policy filiation_operator_select_org
on public.lien_filiation
for select
to authenticated
using (
  public.is_niveau_at_least(2)
  and exists (
    select 1
    from public.dossier_disparition d
    where d.id_personne in (lien_filiation.id_personne_source, lien_filiation.id_personne_cible)
      and d.id_organisation_responsable = public.get_my_org_id()
  )
);

create policy filiation_operator_insert_own
on public.lien_filiation
for insert
to authenticated
with check (
  public.is_niveau_at_least(2)
  and cree_par = auth.uid()
  and visible_public = false
);

create policy filiation_operator_update_own
on public.lien_filiation
for update
to authenticated
using (public.is_niveau_at_least(2) and cree_par = auth.uid())
with check (public.is_niveau_at_least(2) and cree_par = auth.uid());

create policy filiation_operator_delete_own
on public.lien_filiation
for delete
to authenticated
using (public.is_niveau_at_least(2) and cree_par = auth.uid());

