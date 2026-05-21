-- Compteur non-lues pour la cloche citoyen (auth.uid(), security definer)

create or replace function public.get_my_unread_notifications_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.notification n
  where n.id_utilisateur = auth.uid()
    and coalesce(n.lue, false) = false;
$$;

grant execute on function public.get_my_unread_notifications_count() to authenticated;
