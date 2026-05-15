-- =====================================================
-- Messagerie : contextes dossier/signalement, escalade org,
-- accès unifié (fonction), tâches de suivi, références + localisation,
-- SOS affectation org, contacts token vérification + RPC.
-- =====================================================

-- ---------- 1) Références : type localisation ----------
alter table public.message_reference
  drop constraint if exists message_reference_type_chk;

alter table public.message_reference
  add constraint message_reference_type_chk
    check (
      type_entite in (
        'dossier',
        'personne',
        'signalement',
        'alerte',
        'document',
        'pre_declaration',
        'message',
        'localisation'
      )
    );

-- ---------- 2) Conversation : contextes multiples + escalade ----------
alter table public.conversation
  add column if not exists id_dossier uuid references public.dossier_disparition (id) on delete cascade,
  add column if not exists id_signalement uuid references public.signalement (id) on delete cascade,
  add column if not exists id_organisation_escalade uuid references public.organisation (id) on delete set null;

comment on column public.conversation.id_organisation_escalade is 'Organisation partenaire ayant accès au fil (escalade).';

alter table public.conversation
  alter column id_pre_declaration drop not null;

alter table public.conversation
  drop constraint if exists conversation_one_context;

alter table public.conversation
  add constraint conversation_one_context check (
    (id_pre_declaration is not null)::int
    + (id_dossier is not null)::int
    + (id_signalement is not null)::int
    = 1
  );

alter table public.conversation
  drop constraint if exists conversation_unique_pre_declaration;

create unique index if not exists conversation_unique_pre_declaration
  on public.conversation (id_pre_declaration)
  where id_pre_declaration is not null;

create unique index if not exists conversation_unique_dossier
  on public.conversation (id_dossier)
  where id_dossier is not null;

create unique index if not exists conversation_unique_signalement
  on public.conversation (id_signalement)
  where id_signalement is not null;

-- ---------- 3) Tâches de suivi liées au fil ----------
create table if not exists public.messagerie_tache_suivi (
  id uuid primary key default gen_random_uuid(),
  id_conversation uuid not null references public.conversation (id) on delete cascade,
  titre text not null,
  description text,
  statut text not null default 'ouverte'
    constraint messagerie_tache_statut_chk
      check (statut in ('ouverte', 'en_cours', 'faite', 'annulee')),
  id_createur uuid not null references public.utilisateur (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messagerie_tache_conversation
  on public.messagerie_tache_suivi (id_conversation, created_at desc);

comment on table public.messagerie_tache_suivi is 'Tâches de suivi associées à une conversation (autorité).';

alter table public.messagerie_tache_suivi enable row level security;

-- ---------- 4) SOS : affectation organisation ----------
alter table public.sos_event
  add column if not exists id_organisation_assignee uuid references public.organisation (id) on delete set null;

comment on column public.sos_event.id_organisation_assignee is 'Organisation désignée pour coordonner la réponse (UI autorité).';

-- ---------- 5) Contacts : jeton vérification e-mail ----------
alter table public.contact_urgence
  add column if not exists token_verification text,
  add column if not exists token_expires_at timestamptz;

-- ---------- 6) Fonction d''accès conversation (tous contextes) ----------
create or replace function public.conversation_user_can_access(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;
  if public.utilisateur_has_role(uid, 'admin_systeme') then
    return true;
  end if;

  return exists (
    select 1
    from public.conversation c
    where c.id = p_conversation_id
      and (
        (
          c.id_pre_declaration is not null
          and exists (
            select 1
            from public.pre_declaration_citoyenne p
            where p.id = c.id_pre_declaration
              and (
                p.id_utilisateur = uid
                or (
                  public.utilisateur_has_role(uid, 'autorite')
                  and public.get_my_org_id() is not null
                  and (
                    p.id_organisation = public.get_my_org_id()
                    or c.id_organisation_escalade = public.get_my_org_id()
                  )
                )
              )
          )
        )
        or (
          c.id_dossier is not null
          and exists (
            select 1
            from public.dossier_disparition d
            where d.id = c.id_dossier
              and (
                d.id_utilisateur_createur = uid
                or (
                  public.utilisateur_has_role(uid, 'autorite')
                  and public.get_my_org_id() is not null
                  and (
                    d.id_organisation_responsable = public.get_my_org_id()
                    or c.id_organisation_escalade = public.get_my_org_id()
                  )
                )
              )
          )
        )
        or (
          c.id_signalement is not null
          and exists (
            select 1
            from public.signalement s
            where s.id = c.id_signalement
              and (
                (s.id_utilisateur is not null and s.id_utilisateur = uid)
                or (
                  public.utilisateur_has_role(uid, 'autorite')
                  and public.get_my_org_id() is not null
                  and (
                    c.id_organisation_escalade = public.get_my_org_id()
                    or (
                      s.id_dossier is not null
                      and exists (
                        select 1
                        from public.dossier_disparition d2
                        where d2.id = s.id_dossier
                          and d2.id_organisation_responsable = public.get_my_org_id()
                      )
                    )
                  )
                )
              )
          )
        )
      )
  );
end;
$$;

grant execute on function public.conversation_user_can_access(uuid) to authenticated;

-- ---------- 7) RLS conversation (remplace les politiques MVP) ----------
drop policy if exists conversation_access_select on public.conversation;
create policy conversation_access_select
  on public.conversation
  for select
  to authenticated
  using (public.conversation_user_can_access(id));

drop policy if exists conversation_owner_insert on public.conversation;
create policy conversation_owner_insert
  on public.conversation
  for insert
  to authenticated
  with check (
    (
      id_pre_declaration is not null
      and exists (
        select 1
        from public.pre_declaration_citoyenne p
        where p.id = id_pre_declaration
          and p.id_utilisateur = auth.uid()
      )
    )
    or (
      id_dossier is not null
      and exists (
        select 1
        from public.dossier_disparition d
        where d.id = id_dossier
          and d.id_utilisateur_createur = auth.uid()
      )
    )
    or (
      id_signalement is not null
      and exists (
        select 1
        from public.signalement s
        where s.id = id_signalement
          and s.id_utilisateur = auth.uid()
      )
    )
  );

drop policy if exists conversation_authority_org_update on public.conversation;
create policy conversation_authority_org_update
  on public.conversation
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.get_my_org_id() is not null
    and public.conversation_user_can_access(id)
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.get_my_org_id() is not null
    and public.conversation_user_can_access(id)
  );

-- ---------- 8) Messages : politiques via fonction ----------
drop policy if exists message_access_select on public.message;
create policy message_access_select
  on public.message
  for select
  to authenticated
  using (
    public.conversation_user_can_access(message.id_conversation)
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists message_participant_insert on public.message;
create policy message_participant_insert
  on public.message
  for insert
  to authenticated
  with check (
    id_auteur = auth.uid()
    and public.conversation_user_can_access(message.id_conversation)
    and exists (
      select 1
      from public.conversation c
      where c.id = message.id_conversation
        and (
          (
            c.id_pre_declaration is not null
            and exists (
              select 1
              from public.pre_declaration_citoyenne p
              where p.id = c.id_pre_declaration
                and p.statut in ('soumise', 'en_examen')
            )
          )
          or c.id_pre_declaration is null
        )
    )
  );

-- ---------- 9) Lecture messages ----------
drop policy if exists message_lecture_own_insert on public.message_lecture;
create policy message_lecture_own_insert
  on public.message_lecture
  for insert
  to authenticated
  with check (
    id_utilisateur = auth.uid()
    and exists (
      select 1
      from public.message m
      where m.id = message_lecture.id_message
        and public.conversation_user_can_access(m.id_conversation)
    )
  );

-- ---------- 10) Pièces jointes + références (select/insert) ----------
drop policy if exists message_piece_jointe_select on public.message_piece_jointe;
create policy message_piece_jointe_select
  on public.message_piece_jointe
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.message m
      where m.id = message_piece_jointe.id_message
        and public.conversation_user_can_access(m.id_conversation)
    )
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists message_piece_jointe_insert on public.message_piece_jointe;
create policy message_piece_jointe_insert
  on public.message_piece_jointe
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      where m.id = message_piece_jointe.id_message
        and m.id_auteur = auth.uid()
        and public.conversation_user_can_access(c.id)
        and (
          c.id_pre_declaration is null
          or exists (
            select 1
            from public.pre_declaration_citoyenne p
            where p.id = c.id_pre_declaration
              and p.statut in ('soumise', 'en_examen')
          )
        )
    )
  );

drop policy if exists message_reference_select on public.message_reference;
create policy message_reference_select
  on public.message_reference
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.message m
      where m.id = message_reference.id_message
        and public.conversation_user_can_access(m.id_conversation)
    )
    or public.utilisateur_has_role(auth.uid(), 'admin_systeme')
  );

drop policy if exists message_reference_insert on public.message_reference;
create policy message_reference_insert
  on public.message_reference
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.message m
      join public.conversation c on c.id = m.id_conversation
      where m.id = message_reference.id_message
        and m.id_auteur = auth.uid()
        and public.conversation_user_can_access(c.id)
        and (
          c.id_pre_declaration is null
          or exists (
            select 1
            from public.pre_declaration_citoyenne p
            where p.id = c.id_pre_declaration
              and p.statut in ('soumise', 'en_examen')
          )
        )
    )
  );

-- ---------- 11) Participants ----------
drop policy if exists conversation_participant_select on public.conversation_participant;
create policy conversation_participant_select
  on public.conversation_participant
  for select
  to authenticated
  using (public.conversation_user_can_access(conversation_participant.id_conversation));

drop policy if exists conversation_participant_insert on public.conversation_participant;
create policy conversation_participant_insert
  on public.conversation_participant
  for insert
  to authenticated
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.get_my_org_id() is not null
    and public.conversation_user_can_access(conversation_participant.id_conversation)
  );

drop policy if exists conversation_participant_update on public.conversation_participant;
create policy conversation_participant_update
  on public.conversation_participant
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.conversation_user_can_access(conversation_participant.id_conversation)
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.conversation_user_can_access(conversation_participant.id_conversation)
  );

drop policy if exists conversation_participant_delete on public.conversation_participant;
create policy conversation_participant_delete
  on public.conversation_participant
  for delete
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.conversation_user_can_access(conversation_participant.id_conversation)
  );

-- ---------- 12) Tâches RLS ----------
drop policy if exists messagerie_tache_select on public.messagerie_tache_suivi;
create policy messagerie_tache_select
  on public.messagerie_tache_suivi
  for select
  to authenticated
  using (public.conversation_user_can_access(messagerie_tache_suivi.id_conversation));

drop policy if exists messagerie_tache_insert on public.messagerie_tache_suivi;
create policy messagerie_tache_insert
  on public.messagerie_tache_suivi
  for insert
  to authenticated
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and id_createur = auth.uid()
    and public.conversation_user_can_access(messagerie_tache_suivi.id_conversation)
  );

drop policy if exists messagerie_tache_update on public.messagerie_tache_suivi;
create policy messagerie_tache_update
  on public.messagerie_tache_suivi
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.conversation_user_can_access(messagerie_tache_suivi.id_conversation)
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and public.conversation_user_can_access(messagerie_tache_suivi.id_conversation)
  );

grant select, insert, update, delete on public.messagerie_tache_suivi to authenticated;

-- ---------- 13) RPC suppression message : utilise la même logique d''accès ----------
create or replace function public.soft_delete_own_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv uuid;
  v_auteur uuid;
begin
  select m.id_conversation, m.id_auteur into v_conv, v_auteur
  from public.message m
  where m.id = p_message_id and m.deleted_at is null;

  if v_conv is null then
    raise exception 'Message introuvable ou déjà supprimé';
  end if;

  if v_auteur is distinct from auth.uid() then
    raise exception 'Seul l''auteur peut supprimer ce message';
  end if;

  if not public.conversation_user_can_access(v_conv)
     and not public.utilisateur_has_role(auth.uid(), 'admin_systeme') then
    raise exception 'Accès refusé';
  end if;

  update public.message
  set deleted_at = now()
  where id = p_message_id and id_auteur = auth.uid() and deleted_at is null;
end;
$$;

-- ---------- 14) SOS : affectation org (reste « envoye ») + clôture « traite » ----------
drop policy if exists sos_event_authority_update_traite on public.sos_event;
drop policy if exists sos_event_authority_update_assign on public.sos_event;
drop policy if exists sos_event_authority_update_draft on public.sos_event;

create policy sos_event_authority_update_draft
  on public.sos_event
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and statut = 'envoye'
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and statut = 'envoye'
  );

create policy sos_event_authority_update_traite
  on public.sos_event
  for update
  to authenticated
  using (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and statut = 'envoye'
  )
  with check (
    public.utilisateur_has_role(auth.uid(), 'autorite')
    and statut = 'traite'
    and handled_by = auth.uid()
    and handled_at is not null
  );

-- ---------- 15) RPC vérification contact (MVP : enregistre jeton ; e-mail envoyé hors scope DB) ----------
create or replace function public.contact_urgence_set_verification_token(p_contact_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  tok text;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  tok := encode(gen_random_bytes(24), 'hex');
  update public.contact_urgence
  set
    token_verification = tok,
    token_expires_at = now() + interval '7 days'
  where id = p_contact_id
    and id_utilisateur = auth.uid();
  if not found then
    raise exception 'Contact introuvable';
  end if;
  return tok;
end;
$$;

grant execute on function public.contact_urgence_set_verification_token(uuid) to authenticated;

create or replace function public.contact_urgence_confirm_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contact_urgence
  set
    email_verifie = true,
    date_verification = now(),
    token_verification = null,
    token_expires_at = null
  where token_verification = p_token
    and token_expires_at is not null
    and token_expires_at > now();
  if not found then
    raise exception 'Jeton invalide ou expiré';
  end if;
end;
$$;

grant execute on function public.contact_urgence_confirm_token(text) to anon, authenticated;
