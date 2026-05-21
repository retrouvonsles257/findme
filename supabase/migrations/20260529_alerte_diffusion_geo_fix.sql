-- Diffusion alertes : liste fiable des citoyens + maj GPS pour comptes inscrits (pas seulement Invité anonyme)

-- ---------- Candidats diffusion (bypass RLS lecture positions) ----------
create or replace function public.list_citoyens_alerte_diffusion_candidates()
returns table (
  id uuid,
  latitude_actuelle double precision,
  longitude_actuelle double precision,
  nom text,
  prenom text,
  email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.latitude_actuelle,
    u.longitude_actuelle,
    u.nom,
    u.prenom,
    u.email
  from public.utilisateur u
  where u.type_compte::text = 'grand_public'
    and u.statut_compte::text = 'actif'
    and coalesce(u.accepte_notifications, false) = true;
$$;

grant execute on function public.list_citoyens_alerte_diffusion_candidates() to authenticated;

-- ---------- maj_position : enregistrer le GPS dès que le client appelle (permission navigateur) ----------
-- Avant : WHERE accepte_geolocalisation = true bloquait les comptes inscrits (défaut FALSE en base).
create or replace function public.maj_position_citoyen(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;
  if p_lat is null or p_lng is null
     or p_lat not between -90::double precision and 90::double precision
     or p_lng not between -180::double precision and 180::double precision then
    raise exception 'coordonnees_invalides';
  end if;

  update public.utilisateur u
  set
    latitude_actuelle = p_lat,
    longitude_actuelle = p_lng,
    accepte_geolocalisation = true,
    derniere_maj_localisation = now(),
    updated_at = now()
  where u.id = auth.uid()
    and not (
      coalesce(u.preferences_notification, '{}'::jsonb)
        @> '{"partager_position": false}'::jsonb
    );
end;
$$;

grant execute on function public.maj_position_citoyen(double precision, double precision) to authenticated;
