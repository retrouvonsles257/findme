-- =====================================================
-- Rattrapage url_action + RPC rôles (404 get_user_main_role)
-- =====================================================

-- RPC rôles : DROP requis si une ancienne version utilisait un autre nom de paramètre (ex. user_id).
drop function if exists public.get_user_main_role(uuid);

create or replace function public.get_user_main_role(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select r.nom_role::text
      from public.utilisateur_role ur
      join public.role r on r.id = ur.id_role
      where ur.id_utilisateur = p_user_id
        and (ur.date_expiration is null or ur.date_expiration > now())
      order by r.niveau_accreditation desc nulls last
      limit 1
    ),
    'citoyen'
  );
$$;

grant execute on function public.get_user_main_role(uuid) to authenticated, anon;

-- =====================================================
-- Rattrapage url_action pour notifications existantes (clic push / centre notif)
-- Aligné avec src/utils/resolveNotificationActionPath.ts
-- =====================================================

-- Vérification identité (si trigger enrich n'a pas tourné)
update public.notification n
set url_action = case
  when n.donnees_supplementaires->>'kind' = 'identity_verification_pending'
    then '/authority/verifications-identite?demande=' || (n.donnees_supplementaires->>'demande_verification_id')
  else '/citizen/profile?verification=' || (n.donnees_supplementaires->>'demande_verification_id')
end
where nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.donnees_supplementaires->>'demande_verification_id' is not null
  and n.donnees_supplementaires->>'kind' in (
    'identity_verification_submitted',
    'identity_verification_pending',
    'identity_verification_processed'
  );

-- Signalement (priorité sur id_dossier)
update public.notification n
set url_action = '/citizen/signalement/' || (n.donnees_supplementaires->>'signalement_id')
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'grand_public'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and nullif(n.donnees_supplementaires->>'signalement_id', '') is not null
  and (
    n.type_notification::text = 'signalement_valide'
    or n.donnees_supplementaires->>'event' in (
      'signalement_validated',
      'signalement_messagerie_message',
      'signalement_received'
    )
  );

update public.notification n
set url_action = '/authority/signalements/' || (n.donnees_supplementaires->>'signalement_id')
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'autorite'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and nullif(n.donnees_supplementaires->>'signalement_id', '') is not null;

-- Pré-déclarations
update public.notification n
set url_action = case
  when u.type_compte::text = 'autorite'
    then '/authority/pre-declarations/' || (n.donnees_supplementaires->>'pre_declaration_id')
  else '/citizen/pre-declarations/' || (n.donnees_supplementaires->>'pre_declaration_id')
end
from public.utilisateur u
where n.id_utilisateur = u.id
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and nullif(n.donnees_supplementaires->>'pre_declaration_id', '') is not null;

-- Alertes
update public.notification n
set url_action = '/authority/alertes/' || n.id_alerte::text
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'autorite'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.id_alerte is not null;

update public.notification n
set url_action = '/citizen/alerts?alerte=' || n.id_alerte::text
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'grand_public'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.id_alerte is not null;

-- IA autorité
update public.notification n
set url_action = '/authority/ia-analysis?resultId=' || (n.donnees_supplementaires->>'resultat_ia_id')
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'autorite'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and nullif(n.donnees_supplementaires->>'resultat_ia_id', '') is not null;

-- SOS
update public.notification n
set url_action = '/authority/sos?focus=' || (n.donnees_supplementaires->>'sos_id')
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'autorite'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.donnees_supplementaires->>'event' = 'sos_dispatch'
  and nullif(n.donnees_supplementaires->>'sos_id', '') is not null;

update public.notification n
set url_action = '/citizen/sos'
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'grand_public'
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.donnees_supplementaires->>'event' = 'sos_handled';

-- Dossiers (après signalement / alerte)
update public.notification n
set url_action = case
  when u.type_compte::text = 'autorite' then '/authority/dossiers/' || n.id_dossier::text
  else '/citizen/dossier/' || n.id_dossier::text
end
from public.utilisateur u
where n.id_utilisateur = u.id
  and nullif(trim(coalesce(n.url_action, '')), '') is null
  and n.id_dossier is not null;
