-- =====================================================
-- Notifications actionnables pour la verification d'identite
-- =====================================================

create or replace function public.enrich_identity_verification_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_demande_id uuid;
  v_comment text;
begin
  v_kind := coalesce(new.donnees_supplementaires->>'kind', '');

  if v_kind not in (
    'identity_verification_submitted',
    'identity_verification_pending',
    'identity_verification_processed'
  ) then
    return new;
  end if;

  begin
    v_demande_id := nullif(new.donnees_supplementaires->>'demande_verification_id', '')::uuid;
  exception
    when invalid_text_representation then
      v_demande_id := null;
  end;

  if v_demande_id is null then
    return new;
  end if;

  if nullif(trim(coalesce(new.url_action, '')), '') is null then
    if v_kind = 'identity_verification_pending' then
      new.url_action := '/authority/verifications-identite?demande=' || v_demande_id::text;
    else
      new.url_action := '/citizen/profile?verification=' || v_demande_id::text;
    end if;
  end if;

  if v_kind = 'identity_verification_processed' then
    select nullif(trim(commentaire_moderateur), '')
    into v_comment
    from public.demande_verification_identite
    where id = v_demande_id;

    if v_comment is not null and new.message not ilike '%Message de l''autorite :%' then
      new.message := coalesce(new.message, '') || ' Message de l''autorite : ' || v_comment;
    end if;

    if v_comment is not null then
      new.donnees_supplementaires :=
        jsonb_set(
          coalesce(new.donnees_supplementaires, '{}'::jsonb),
          '{commentaire}',
          to_jsonb(v_comment),
          true
        );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enrich_identity_verification_notification on public.notification;
create trigger trg_enrich_identity_verification_notification
before insert on public.notification
for each row
execute function public.enrich_identity_verification_notification();

update public.notification n
set url_action = case
  when n.donnees_supplementaires->>'kind' = 'identity_verification_pending'
    then '/authority/verifications-identite?demande=' || (n.donnees_supplementaires->>'demande_verification_id')
  else '/citizen/profile?verification=' || (n.donnees_supplementaires->>'demande_verification_id')
end
where nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.donnees_supplementaires->>'kind' in (
    'identity_verification_submitted',
    'identity_verification_pending',
    'identity_verification_processed'
  )
  and nullif(n.donnees_supplementaires->>'demande_verification_id', '') is not null;

update public.notification n
set
  message = coalesce(n.message, '') || ' Message de l''autorite : ' || d.commentaire_moderateur,
  donnees_supplementaires = jsonb_set(
    coalesce(n.donnees_supplementaires, '{}'::jsonb),
    '{commentaire}',
    to_jsonb(d.commentaire_moderateur),
    true
  )
from public.demande_verification_identite d
where n.donnees_supplementaires->>'kind' = 'identity_verification_processed'
  and nullif(trim(coalesce(d.commentaire_moderateur, '')), '') is not null
  and n.message not ilike '%Message de l''autorite :%'
  and n.donnees_supplementaires->>'demande_verification_id' = d.id::text;

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
