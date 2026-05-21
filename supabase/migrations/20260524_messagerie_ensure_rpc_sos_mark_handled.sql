-- RPC : ouvrir un fil messagerie (dossier / signalement) sans échec RLS silencieux
-- RPC : clôturer un SOS (autorité)

create or replace function public.ensure_messagerie_conversation(
  p_kind text,
  p_entity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conv_id uuid;
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  if p_kind not in ('dossier', 'signalement') then
    raise exception 'Type de fil invalide: %', p_kind;
  end if;

  if p_kind = 'dossier' then
    select c.id into v_conv_id
    from public.conversation c
    where c.id_dossier = p_entity_id
    limit 1;

    if v_conv_id is not null then
      return v_conv_id;
    end if;

    if not exists (
      select 1
      from public.dossier_disparition d
      where d.id = p_entity_id
        and (
          d.id_utilisateur_createur = v_uid
          or (
            public.utilisateur_has_role(v_uid, 'autorite')
            and public.get_my_org_id() is not null
            and d.id_organisation_responsable = public.get_my_org_id()
          )
          or public.utilisateur_has_role(v_uid, 'admin_systeme')
        )
    ) then
      raise exception 'Dossier inaccessible ou organisation non renseignée sur votre compte';
    end if;

    insert into public.conversation (
      id_dossier,
      id_pre_declaration,
      id_signalement,
      statut,
      created_at,
      updated_at
    )
    values (p_entity_id, null, null, 'ouverte', v_now, v_now)
    returning id into v_conv_id;

    return v_conv_id;
  end if;

  -- signalement
  select c.id into v_conv_id
  from public.conversation c
  where c.id_signalement = p_entity_id
  limit 1;

  if v_conv_id is not null then
    return v_conv_id;
  end if;

  if not exists (
    select 1
    from public.signalement s
    where s.id = p_entity_id
      and (
        (s.id_utilisateur is not null and s.id_utilisateur = v_uid)
        or (
          public.utilisateur_has_role(v_uid, 'autorite')
          and public.get_my_org_id() is not null
          and s.id_dossier is not null
          and exists (
            select 1
            from public.dossier_disparition d
            where d.id = s.id_dossier
              and d.id_organisation_responsable = public.get_my_org_id()
          )
        )
        or public.utilisateur_has_role(v_uid, 'admin_systeme')
      )
  ) then
    raise exception 'Signalement inaccessible, sans dossier lié, ou organisation manquante sur votre compte';
  end if;

  insert into public.conversation (
    id_dossier,
    id_pre_declaration,
    id_signalement,
    statut,
    created_at,
    updated_at
  )
  values (null, null, p_entity_id, 'ouverte', v_now, v_now)
  returning id into v_conv_id;

  return v_conv_id;
end;
$$;

grant execute on function public.ensure_messagerie_conversation(text, uuid) to authenticated;

create or replace function public.mark_sos_event_handled(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;
  if not public.utilisateur_has_role(v_uid, 'autorite')
     and not public.utilisateur_has_role(v_uid, 'admin_systeme') then
    raise exception 'Droits insuffisants';
  end if;

  update public.sos_event
  set
    statut = 'traite',
    handled_at = v_now,
    handled_by = v_uid
  where id = p_event_id
    and statut = 'envoye';

  if not found then
    raise exception 'SOS introuvable ou déjà traité';
  end if;
end;
$$;

grant execute on function public.mark_sos_event_handled(uuid) to authenticated;
