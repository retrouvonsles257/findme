-- =====================================================
-- Messagerie : création conversation dossier/signalement
-- par l'autorité responsable ; participants (soi) ;
-- RPC marquer un message comme traité (métadonnées).
-- =====================================================

-- ---------- 1) Création conversation : autorité sur dossier / signalement lié ----------
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
      and exists (
        select 1
        from public.pre_declaration_citoyenne p
        where p.id = id_pre_declaration
          and p.id_utilisateur = auth.uid()
      )
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

-- ---------- 2) Participant : tout utilisateur ayant accès au fil peut s’ajouter ----------
drop policy if exists conversation_participant_insert on public.conversation_participant;
create policy conversation_participant_insert
  on public.conversation_participant
  for insert
  to authenticated
  with check (
    conversation_participant.id_utilisateur = auth.uid()
    and public.conversation_user_can_access(conversation_participant.id_conversation)
  );

-- ---------- 3) RPC : marquer un message comme traité (métadonnées JSON) ----------
create or replace function public.message_messagerie_marquer_traite(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  if not public.utilisateur_has_role(auth.uid(), 'autorite') then
    raise exception 'Reserve aux comptes autorite';
  end if;

  update public.message m
  set
    metadonnees = coalesce(m.metadonnees, '{}'::jsonb)
      || jsonb_build_object(
        'traite_messagerie',
        true,
        'traite_messagerie_at',
        to_jsonb(now()),
        'traite_messagerie_par',
        to_jsonb(auth.uid())
      )
  where m.id = p_message_id
    and public.conversation_user_can_access(m.id_conversation);

  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'Message introuvable ou acces refuse';
  end if;
end;
$$;

grant execute on function public.message_messagerie_marquer_traite(uuid) to authenticated;
