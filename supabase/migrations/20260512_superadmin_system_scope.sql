-- =====================================================
-- Superadmin : recentrage strict sur l'administration systeme
-- =====================================================
-- Le role admin_systeme ne doit pas intervenir dans les operations metier
-- (dossiers, signalements, alertes, moderation, verification d'identite).

-- 1) Retirer les lectures globales metier historiques du superadmin.
drop policy if exists dossier_admin_systeme_select on public.dossier_disparition;
drop policy if exists personne_admin_systeme_select on public.personne;
drop policy if exists signalement_admin_systeme_select on public.signalement;
drop policy if exists photo_admin_systeme_select on public.photo;
drop policy if exists localisation_admin_systeme_select on public.localisation;
drop policy if exists filiation_admin_systeme_select on public.lien_filiation;

-- 2) Dons : la consultation operationnelle reste cote Autorite.
drop policy if exists don_authority_select on public.don;
create policy don_authority_select
on public.don
for select
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'));

-- 3) Verification d'identite : le superadmin ne lit/traite plus les demandes.
drop policy if exists demande_verification_identite_select_secure on public.demande_verification_identite;
drop policy if exists demande_verification_identite_update_authority on public.demande_verification_identite;

create policy demande_verification_identite_select_secure
on public.demande_verification_identite
for select
to authenticated
using (
  id_utilisateur = auth.uid()
  or public.utilisateur_has_role(auth.uid(), 'autorite')
);

create policy demande_verification_identite_update_authority
on public.demande_verification_identite
for update
to authenticated
using (public.utilisateur_has_role(auth.uid(), 'autorite'))
with check (public.utilisateur_has_role(auth.uid(), 'autorite'));

create or replace function public.process_identity_verification(
  p_demande_id uuid,
  p_decision text,
  p_commentaire text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_now timestamptz := now();
  v_demande record;
  v_decision public.statut_demande_verification;
  v_title text;
  v_message text;
  v_comment text;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'Authentification requise';
  end if;

  if not public.utilisateur_has_role(v_actor, 'autorite') then
    raise exception 'Seule une autorite peut traiter une verification d''identite';
  end if;

  if p_decision not in ('approuve', 'refuse', 'complement_demande') then
    raise exception 'Decision de verification invalide';
  end if;
  v_decision := p_decision::public.statut_demande_verification;
  v_comment := nullif(trim(coalesce(p_commentaire, '')), '');

  select *
  into v_demande
  from public.demande_verification_identite
  where id = p_demande_id
  for update;

  if not found then
    raise exception 'Demande de verification introuvable';
  end if;

  update public.demande_verification_identite
  set
    statut = v_decision,
    commentaire_moderateur = v_comment,
    traite_par = v_actor,
    traite_le = v_now,
    updated_at = v_now
  where id = p_demande_id;

  if v_decision = 'approuve'::public.statut_demande_verification then
    update public.utilisateur
    set
      statut_compte = 'actif'::public.statut_compte,
      identite_verifiee = true,
      updated_at = v_now
    where id = v_demande.id_utilisateur;

    v_title := 'Compte verifie';
    v_message := 'Votre demande de verification d''identite a ete acceptee. Vous avez maintenant le statut citoyen verifie.';
  elsif v_decision = 'refuse'::public.statut_demande_verification then
    update public.utilisateur
    set
      statut_compte = 'actif'::public.statut_compte,
      identite_verifiee = false,
      updated_at = v_now
    where id = v_demande.id_utilisateur;

    v_title := 'Verification refusee';
    v_message := 'Votre demande de verification d''identite a ete refusee. Consultez le motif et soumettez une nouvelle demande si necessaire.';
  else
    update public.utilisateur
    set
      statut_compte = 'actif'::public.statut_compte,
      identite_verifiee = false,
      updated_at = v_now
    where id = v_demande.id_utilisateur;

    v_title := 'Complement demande';
    v_message := 'Un complement est necessaire pour finaliser votre verification d''identite. Consultez les details puis renvoyez les pieces demandees.';
  end if;

  if v_comment is not null then
    v_message := v_message || ' Message de l''autorite : ' || v_comment;
  end if;

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
    v_title,
    v_message,
    'push'::public.canal_notification,
    case
      when v_decision = 'approuve'::public.statut_demande_verification then 'moyenne'::public.priorite_traitement
      else 'haute'::public.priorite_traitement
    end,
    false,
    v_now,
    v_demande.id_utilisateur,
    '/citizen/profile?verification=' || p_demande_id::text,
    jsonb_build_object(
      'kind', 'identity_verification_processed',
      'demande_verification_id', p_demande_id,
      'statut', v_decision::text,
      'commentaire', v_comment
    )
  );

  insert into public.journal_activite (
    type_action,
    action_detaillee,
    description,
    id_utilisateur,
    date_action
  )
  values (
    'attribution_role'::public.type_action,
    'Traitement verification identite',
    format('Demande de verification identite %s : %s', p_demande_id, v_decision::text),
    v_actor,
    v_now
  );
end;
$$;

grant execute on function public.process_identity_verification(uuid, text, text) to authenticated;

-- 4) Permissions declaratives : eviter le libelle trompeur full_system_access.
update public.role
set
  permissions = jsonb_build_object(
    'can_admin_system', true,
    'can_manage_organisations', true,
    'can_manage_users', true,
    'can_manage_roles', true,
    'can_manage_system_settings', true,
    'can_view_audit_logs', true,
    'can_operate_cases', false,
    'can_moderate_reports', false,
    'can_process_identity_verifications', false
  ),
  description = 'Administrateur de la plateforme : configuration, acces, audit et supervision systeme uniquement.'
where nom_role::text = 'admin_systeme';
