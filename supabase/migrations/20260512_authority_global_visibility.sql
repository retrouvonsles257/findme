-- Visibilite inter-autorites.
-- Les policies de creation/modification restent limitees au createur / a l'organisation,
-- mais la lecture doit permettre la coordination police, gendarmerie, ONG, etc.

drop policy if exists dossier_authority_select_all on public.dossier_disparition;
create policy dossier_authority_select_all
on public.dossier_disparition
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists signalement_authority_select_all on public.signalement;
create policy signalement_authority_select_all
on public.signalement
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists alerte_authority_select_all on public.alerte;
create policy alerte_authority_select_all
on public.alerte
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists personne_authority_select_all on public.personne;
create policy personne_authority_select_all
on public.personne
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists photo_authority_select_all on public.photo;
create policy photo_authority_select_all
on public.photo
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists localisation_authority_select_all on public.localisation;
create policy localisation_authority_select_all
on public.localisation
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

drop policy if exists lien_filiation_authority_select_all on public.lien_filiation;
create policy lien_filiation_authority_select_all
on public.lien_filiation
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));
