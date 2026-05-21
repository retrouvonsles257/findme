-- Notifications citoyen : lecture fiable + liens alerte (pas seulement dossier)

-- Ancienne politique « FOR ALL » (modele_donnee) peut bloquer des lectures croisées
drop policy if exists notification_utilisateur on public.notification;

-- RPC : liste des notifications du compte connecté (bypass RLS incohérent)
create or replace function public.get_my_notifications(p_limit int default 150)
returns setof public.notification
language sql
stable
security definer
set search_path = public
as $$
  select n.*
  from public.notification n
  where n.id_utilisateur = auth.uid()
  order by n.date_creation desc
  limit greatest(coalesce(p_limit, 150), 1);
$$;

grant execute on function public.get_my_notifications(int) to authenticated;

-- Rattrapage : nouvelle_alerte / alerte_updated → page alertes (pas dossier)
update public.notification n
set url_action = '/citizen/alerts?alerte=' || n.id_alerte::text
from public.utilisateur u
where n.id_utilisateur = u.id
  and u.type_compte::text = 'grand_public'
  and n.id_alerte is not null
  and n.type_notification::text in ('nouvelle_alerte', 'autre')
  and (
    nullif(trim(coalesce(n.url_action, '')), '') is null
    or n.url_action like '/citizen/dossier/%'
  )
  and (
    n.donnees_supplementaires->>'event' in ('nouvelle_alerte', 'alerte_updated', 'alerte_statut_changed')
    or n.type_notification::text = 'nouvelle_alerte'
  );
