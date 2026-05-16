-- =====================================================
-- Pré-déclaration : INSERT conversation bloqué par RLS
-- La politique WITH CHECK interroge pre_declaration_citoyenne
-- sous RLS ; la fonction security definer + RPC atomique
-- garantissent la création du fil après la pré-déclaration.
-- =====================================================

create or replace function public.pre_declaration_owned_by_auth_user(p_pre_declaration_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pre_declaration_citoyenne p
    where p.id = p_pre_declaration_id
      and p.id_utilisateur = auth.uid()
  );
$$;

comment on function public.pre_declaration_owned_by_auth_user(uuid) is
  'Vérifie que la pré-déclaration appartient à auth.uid() (hors RLS pour les politiques conversation).';

grant execute on function public.pre_declaration_owned_by_auth_user(uuid) to authenticated;

drop policy if exists conversation_owner_insert on public.conversation;
create policy conversation_owner_insert
  on public.conversation
  for insert
  to authenticated
  with check (
    (
      id_pre_declaration is not null
      and id_dossier is null
      and id_signalement is null
      and public.pre_declaration_owned_by_auth_user(id_pre_declaration)
    )
    or (
      id_dossier is not null
      and id_pre_declaration is null
      and id_signalement is null
      and (
        exists (
          select 1
          from public.dossier_disparition d
          where d.id = id_dossier
            and d.id_utilisateur_createur = auth.uid()
        )
        or (
          public.utilisateur_has_role(auth.uid(), 'autorite')
          and public.get_my_org_id() is not null
          and exists (
            select 1
            from public.dossier_disparition d
            where d.id = id_dossier
              and d.id_organisation_responsable = public.get_my_org_id()
          )
        )
      )
    )
    or (
      id_signalement is not null
      and id_pre_declaration is null
      and id_dossier is null
      and (
        exists (
          select 1
          from public.signalement s
          where s.id = id_signalement
            and s.id_utilisateur is not null
            and s.id_utilisateur = auth.uid()
        )
        or (
          public.utilisateur_has_role(auth.uid(), 'autorite')
          and public.get_my_org_id() is not null
          and exists (
            select 1
            from public.signalement s
            where s.id = id_signalement
              and s.id_dossier is not null
              and exists (
                select 1
                from public.dossier_disparition d
                where d.id = s.id_dossier
                  and d.id_organisation_responsable = public.get_my_org_id()
              )
          )
        )
      )
    )
  );

create or replace function public.create_pre_declaration_with_conversation(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pre public.pre_declaration_citoyenne;
  v_conv public.conversation;
  v_msg text;
  v_org uuid;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  v_org := (p_input->>'id_organisation')::uuid;
  if v_org is null then
    raise exception 'Organisation requise';
  end if;

  if nullif(trim(coalesce(p_input->>'nom_personne', '')), '') is null
     or nullif(trim(coalesce(p_input->>'circonstances', '')), '') is null then
    raise exception 'Champs obligatoires manquants';
  end if;

  v_msg := nullif(trim(coalesce(p_input->>'message_initial', '')), '');

  insert into public.pre_declaration_citoyenne (
    id_utilisateur,
    id_organisation,
    statut,
    id_dossier,
    nom_personne,
    prenom_personne,
    sexe,
    date_naissance,
    nationalite,
    date_disparition,
    lieu_disparition,
    ville_disparition,
    region_disparition,
    pays_disparition,
    latitude_disparition,
    longitude_disparition,
    type_disparition,
    niveau_urgence,
    circonstances,
    infos_complementaires,
    contact_nom,
    contact_telephone,
    contact_email
  ) values (
    v_uid,
    v_org,
    'soumise',
    null,
    trim(p_input->>'nom_personne'),
    trim(coalesce(p_input->>'prenom_personne', '')),
    coalesce(nullif(trim(p_input->>'sexe'), ''), 'non_precise'),
    nullif(p_input->>'date_naissance', '')::date,
    coalesce(nullif(trim(p_input->>'nationalite'), ''), 'Camerounaise'),
    (p_input->>'date_disparition')::date,
    nullif(trim(coalesce(p_input->>'lieu_disparition', '')), ''),
    nullif(trim(coalesce(p_input->>'ville_disparition', '')), ''),
    nullif(trim(coalesce(p_input->>'region_disparition', '')), ''),
    coalesce(nullif(trim(p_input->>'pays_disparition'), ''), 'Cameroun'),
    (p_input->>'latitude_disparition')::double precision,
    (p_input->>'longitude_disparition')::double precision,
    coalesce(nullif(trim(p_input->>'type_disparition'), ''), 'inconnue'),
    coalesce(nullif(trim(p_input->>'niveau_urgence'), ''), 'normal'),
    trim(p_input->>'circonstances'),
    nullif(trim(coalesce(p_input->>'infos_complementaires', '')), ''),
    nullif(trim(coalesce(p_input->>'contact_nom', '')), ''),
    nullif(trim(coalesce(p_input->>'contact_telephone', '')), ''),
    nullif(trim(coalesce(p_input->>'contact_email', '')), '')
  )
  returning * into v_pre;

  insert into public.conversation (
    id_pre_declaration,
    id_dossier,
    id_signalement,
    statut
  ) values (
    v_pre.id,
    null,
    null,
    'ouverte'
  )
  returning * into v_conv;

  insert into public.conversation_participant (id_conversation, id_utilisateur, role)
  values (v_conv.id, v_uid, 'citoyen')
  on conflict (id_conversation, id_utilisateur) do nothing;

  if v_msg is not null then
    insert into public.message (id_conversation, id_auteur, corps, type_message)
    values (v_conv.id, v_uid, v_msg, 'texte');
  end if;

  return jsonb_build_object(
    'pre_declaration', to_jsonb(v_pre),
    'conversation', to_jsonb(v_conv)
  );
end;
$$;

comment on function public.create_pre_declaration_with_conversation(jsonb) is
  'Crée pré-déclaration + conversation + participant citoyen (+ message initial optionnel) en une transaction.';

grant execute on function public.create_pre_declaration_with_conversation(jsonb) to authenticated;
