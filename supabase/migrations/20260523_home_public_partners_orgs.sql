-- Accueil public : lecture des partenaires actifs et organisations actives (noms uniquement côté UI).

grant select on public.partenariat_organisation to anon;
grant select on public.organisation to anon;

drop policy if exists partenariat_public_active_select on public.partenariat_organisation;
create policy partenariat_public_active_select
  on public.partenariat_organisation
  for select
  to anon, authenticated
  using (statut = 'active');

drop policy if exists organisation_public_active_select on public.organisation;
create policy organisation_public_active_select
  on public.organisation
  for select
  to anon, authenticated
  using (statut_actif = true);
