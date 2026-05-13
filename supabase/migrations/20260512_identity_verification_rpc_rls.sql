-- Verification d'identite citoyenne : RLS stricte + RPC transactionnelles.
-- Les demandes peuvent etre traitees par toute autorite, quelle que soit son organisation.

alter table public.demande_verification_identite enable row level security;

drop policy if exists "demande_verification_identite_select" on public.demande_verification_identite;
drop policy if exists "demande_verification_identite_insert" on public.demande_verification_identite;
drop policy if exists "demande_verification_identite_update" on public.demande_verification_identite;
drop policy if exists demande_verification_identite_select_secure on public.demande_verification_identite;
drop policy if exists demande_verification_identite_insert_own_pending on public.demande_verification_identite;
drop policy if exists demande_verification_identite_update_authority on public.demande_verification_identite;

create policy demande_verification_identite_select_secure
on public.demande_verification_identite
for select
to authenticated
using (
  id_utilisateur = auth.uid()
  or public.utilisateur_has_role(auth.uid(), 'autorite')
  or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
);

-- On garde une policy d'insert tres stricte pour compatibilite, mais l'app passe par submit_identity_verification.
create policy demande_verification_identite_insert_own_pending
on public.demande_verification_identite
for insert
to authenticated
with check (
  id_utilisateur = auth.uid()
  and public.utilisateur_has_role(auth.uid(), 'citoyen')
  and statut = 'en_attente'::public.statut_demande_verification
  and id_organisation is null
  and traite_par is null
  and traite_le is null
);

create policy demande_verification_identite_update_authority
on public.demande_verification_identite
for update
to authenticated
using (
  public.utilisateur_has_role(auth.uid(), 'autorite')
  or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
)
with check (
  public.utilisateur_has_role(auth.uid(), 'autorite')
  or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
);

create or replace function public.submit_identity_verification(
  p_type_document text,
  p_url_document text,
  p_url_selfie text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_now timestamptz := now();
  v_user record;
  v_demande_id uuid;
  v_type_document text;
  v_authority_ids uuid[];
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  v_type_document := coalesce(nullif(trim(p_type_document), ''), 'autre');
  if v_type_document not in ('cni', 'passeport', 'autre') then
    raise exception 'Type de document invalide';
  end if;

  if p_url_document is null or length(trim(p_url_document)) < 8 then
    raise exception 'Document d''identite requis';
  end if;

  select id, id_organisation, identite_verifiee
  into v_user
  from public.utilisateur
  where id = v_uid
  for update;

  if not found then
    raise exception 'Profil utilisateur introuvable';
  end if;

  if not public.utilisateur_has_role(v_uid, 'citoyen') then
    raise exception 'Seul un citoyen peut demander une verification d''identite';
  end if;

  if coalesce(v_user.identite_verifiee, false) then
    raise exception 'Identite deja verifiee';
  end if;

  select id
  into v_demande_id
  from public.demande_verification_identite
  where id_utilisateur = v_uid
    and statut in (
      'en_attente'::public.statut_demande_verification,
      'complement_demande'::public.statut_demande_verification
    )
  order by created_at desc
  limit 1
  for update;

  if v_demande_id is null then
    insert into public.demande_verification_identite (
      id_utilisateur,
      id_organisation,
      statut,
      type_document,
      url_document,
      url_selfie,
      created_at,
      updated_at
    )
    values (
      v_uid,
      null,
      'en_attente'::public.statut_demande_verification,
      v_type_document,
      trim(p_url_document),
      nullif(trim(coalesce(p_url_selfie, '')), ''),
      v_now,
      v_now
    )
    returning id into v_demande_id;
  else
    update public.demande_verification_identite
    set
      id_organisation = null,
      statut = 'en_attente'::public.statut_demande_verification,
      type_document = v_type_document,
      url_document = trim(p_url_document),
      url_selfie = nullif(trim(coalesce(p_url_selfie, '')), ''),
      commentaire_moderateur = null,
      traite_par = null,
      traite_le = null,
      updated_at = v_now
    where id = v_demande_id;
  end if;

  update public.utilisateur
  set
    document_accreditation = trim(p_url_document),
    statut_compte = 'en_attente_verification'::public.statut_compte,
    identite_verifiee = false,
    updated_at = v_now
  where id = v_uid;

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
    'Demande de verification recue',
    'Votre demande de verification d''identite a ete recue. Une autorite va l''examiner.',
    'push'::public.canal_notification,
    'moyenne'::public.priorite_traitement,
    false,
    v_now,
    v_uid,
    '/citizen/profile?verification=' || v_demande_id::text,
    jsonb_build_object('kind', 'identity_verification_submitted', 'demande_verification_id', v_demande_id)
  );

  select coalesce(array_agg(u.id), array[]::uuid[])
  into v_authority_ids
  from public.utilisateur u
  where u.statut_compte::text = 'actif'
    and public.utilisateur_has_role(u.id, 'autorite');

  if coalesce(array_length(v_authority_ids, 1), 0) > 0 then
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
    select
      'autre'::public.type_notification,
      'Nouvelle verification d''identite',
      'Un citoyen a soumis une demande de verification d''identite.',
      'push'::public.canal_notification,
      'moyenne'::public.priorite_traitement,
      false,
      v_now,
      authority_id,
      '/authority/verifications-identite?demande=' || v_demande_id::text,
      jsonb_build_object('kind', 'identity_verification_pending', 'demande_verification_id', v_demande_id)
    from unnest(v_authority_ids) as a(authority_id);
  end if;

  insert into public.journal_activite (
    type_action,
    action_detaillee,
    description,
    id_utilisateur,
    date_action
  )
  values (
    'modification_profil'::public.type_action,
    'Soumission verification identite',
    'Demande de verification d''identite soumise par un citoyen.',
    v_uid,
    v_now
  );

  return v_demande_id;
end;
$$;

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

  if not (
    public.utilisateur_has_role(v_actor, 'autorite')
    or public.utilisateur_has_role(v_actor, 'admin_systeme')
  ) then
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

grant select, insert, update on public.demande_verification_identite to authenticated;
grant execute on function public.submit_identity_verification(text, text, text) to authenticated;
grant execute on function public.process_identity_verification(uuid, text, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'demande_verification_identite'
  ) then
    alter publication supabase_realtime add table public.demande_verification_identite;
  end if;
exception
  when undefined_object then
    raise notice 'Publication supabase_realtime introuvable (hors Supabase gere ?)';
  when duplicate_object then
    null;
end
$$;

alter table public.demande_verification_identite replica identity full;
