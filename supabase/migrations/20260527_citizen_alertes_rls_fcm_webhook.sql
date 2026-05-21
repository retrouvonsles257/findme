-- Citoyen : lecture des alertes diffusées + FCM via webhook Supabase (service role)

-- ---------- Lecture alertes (grand public authentifié) ----------
drop policy if exists alerte_citizen_select_diffused on public.alerte;
create policy alerte_citizen_select_diffused
  on public.alerte
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.utilisateur u
      where u.id = auth.uid()
        and u.type_compte::text = 'grand_public'
        and u.statut_compte::text = 'actif'
    )
    and statut_alerte::text in ('en_cours', 'terminee', 'annulee')
  );

-- ---------- RPC : une alerte par id (contourne RLS si politique manquante) ----------
create or replace function public.get_citizen_alerte_by_id(p_alerte_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.alerte%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if not exists (
    select 1 from public.utilisateur u
    where u.id = auth.uid()
      and u.type_compte::text = 'grand_public'
  ) then
    raise exception 'Accès réservé aux comptes citoyens';
  end if;

  select * into v_row
  from public.alerte a
  where a.id = p_alerte_id
    and a.statut_alerte::text in ('en_cours', 'terminee', 'annulee');

  if not found then
    return null;
  end if;

  return to_jsonb(v_row);
end;
$$;

grant execute on function public.get_citizen_alerte_by_id(uuid) to authenticated;

-- ---------- RPC : liste des alertes visibles citoyen ----------
create or replace function public.list_citizen_alertes(p_limit int default 80)
returns setof public.alerte
language sql
stable
security definer
set search_path = public
as $$
  select a.*
  from public.alerte a
  where auth.uid() is not null
    and exists (
      select 1
      from public.utilisateur u
      where u.id = auth.uid()
        and u.type_compte::text = 'grand_public'
        and u.statut_compte::text = 'actif'
    )
    and a.statut_alerte::text in ('en_cours', 'terminee', 'annulee')
  order by a.date_diffusion desc nulls last, a.created_at desc
  limit greatest(coalesce(p_limit, 80), 1);
$$;

grant execute on function public.list_citizen_alertes(int) to authenticated;
