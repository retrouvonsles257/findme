-- Ne pas cibler les sessions Invité anonyme (email anon-…@guest) pour les alertes géo :
-- elles partagent souvent le GPS du navigateur de test et volent la diffusion au citoyen inscrit.

create or replace function public.list_citoyens_alerte_diffusion_candidates()
returns table (
  id uuid,
  latitude_actuelle double precision,
  longitude_actuelle double precision,
  rayon_notification_km numeric,
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
    u.rayon_notification_km,
    u.nom,
    u.prenom,
    u.email
  from public.utilisateur u
  where u.type_compte::text = 'grand_public'
    and u.statut_compte::text = 'actif'
    and coalesce(u.accepte_notifications, false) = true
    and coalesce(u.preferences_notification->>'partager_position', 'true') <> 'false'
    and coalesce(u.email, '') not like 'anon-%@guest.retrouvonsles.local';
$$;

-- Recréer diffuse_alerte_notifications avec le même filtre invité
create or replace function public.diffuse_alerte_notifications(
  p_alerte_id uuid,
  p_strict_geo_only boolean default true,
  p_allow_without_geo boolean default false,
  p_canal text default 'push'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alerte public.alerte%rowtype;
  v_lat double precision;
  v_lng double precision;
  v_rayon double precision;
  v_use_geo boolean;
  v_inserted int := 0;
  v_total_eligible int := 0;
  v_with_position int := 0;
  v_in_rayon int := 0;
  v_recipient_ids uuid[];
  v_trace text;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  select * into v_alerte from public.alerte a where a.id = p_alerte_id;
  if not found then
    raise exception 'Alerte introuvable: %', p_alerte_id;
  end if;

  v_lat := v_alerte.latitude_centre;
  v_lng := v_alerte.longitude_centre;
  v_rayon := coalesce(v_alerte.rayon_km, 50);
  v_use_geo := v_lat is not null and v_lng is not null
    and not (v_lat <> v_lat or v_lng <> v_lng);

  v_trace := 'diff-sql-' || replace(gen_random_uuid()::text, '-', '');

  select count(*)::int into v_total_eligible
  from public.utilisateur u
  where u.type_compte::text = 'grand_public'
    and u.statut_compte::text = 'actif'
    and coalesce(u.accepte_notifications, false) = true
    and coalesce(u.preferences_notification->>'partager_position', 'true') <> 'false'
    and coalesce(u.email, '') not like 'anon-%@guest.retrouvonsles.local';

  if not v_use_geo then
    if not p_allow_without_geo then
      return jsonb_build_object(
        'inserted', 0,
        'trace_id', v_trace,
        'use_geo', false,
        'sans_centre', true,
        'total_eligible', v_total_eligible,
        'recipient_ids', '[]'::jsonb,
        'hint', 'Alerte sans centre géographique'
      );
    end if;

    insert into public.notification (
      type_notification, titre, message, canal, lue, statut_envoi,
      date_creation, id_utilisateur, id_alerte, id_dossier, url_action, donnees_supplementaires
    )
    select
      'nouvelle_alerte'::public.type_notification,
      v_alerte.titre,
      coalesce(nullif(trim(v_alerte.message_court), ''), left(coalesce(v_alerte.message, v_alerte.titre), 500)),
      coalesce(nullif(trim(p_canal), ''), 'push')::public.canal_notification,
      false,
      'en_attente'::public.statut_envoi,
      now(),
      u.id,
      v_alerte.id,
      v_alerte.id_dossier,
      '/citizen/alerts?alerte=' || v_alerte.id::text,
      jsonb_build_object(
        'traceId', v_trace,
        'source', 'diffuse_alerte_notifications',
        'event', 'nouvelle_alerte',
        'distance_km', null
      )
    from public.utilisateur u
    where u.type_compte::text = 'grand_public'
      and u.statut_compte::text = 'actif'
      and coalesce(u.accepte_notifications, false) = true
      and coalesce(u.preferences_notification->>'partager_position', 'true') <> 'false'
      and coalesce(u.email, '') not like 'anon-%@guest.retrouvonsles.local';

    get diagnostics v_inserted = row_count;

    select coalesce(array_agg(sub.id), array[]::uuid[])
    into v_recipient_ids
    from (
      select n.id_utilisateur as id
      from public.notification n
      where n.id_alerte = p_alerte_id
        and n.date_creation >= now() - interval '2 minutes'
      limit 500
    ) sub;

    update public.alerte
    set nombre_destinataires = v_inserted,
        nombre_envois_reussis = v_inserted,
        updated_at = now()
    where id = p_alerte_id;

    return jsonb_build_object(
      'inserted', v_inserted,
      'trace_id', v_trace,
      'use_geo', false,
      'sans_centre', true,
      'geo_fallback', false,
      'total_eligible', v_total_eligible,
      'recipient_ids', to_jsonb(v_recipient_ids)
    );
  end if;

  with candidates as (
    select
      u.id,
      u.latitude_actuelle as lat,
      u.longitude_actuelle as lng,
      public.haversine_km(v_lat, v_lng, u.latitude_actuelle, u.longitude_actuelle) as dist_km,
      greatest(v_rayon, coalesce(u.rayon_notification_km, v_rayon)) as rayon_effectif_km
    from public.utilisateur u
    where u.type_compte::text = 'grand_public'
      and u.statut_compte::text = 'actif'
      and coalesce(u.accepte_notifications, false) = true
      and coalesce(u.preferences_notification->>'partager_position', 'true') <> 'false'
      and coalesce(u.email, '') not like 'anon-%@guest.retrouvonsles.local'
  ),
  in_rayon as (
    select c.id, c.dist_km
    from candidates c
    where c.lat is not null and c.lng is not null
      and c.dist_km is not null
      and c.dist_km <= c.rayon_effectif_km
  ),
  counts as (
    select
      (select count(*)::int from candidates) as total_eligible,
      (select count(*)::int from candidates where lat is not null and lng is not null) as with_position,
      (select count(*)::int from in_rayon) as in_rayon
  )
  select total_eligible, with_position, in_rayon into v_total_eligible, v_with_position, v_in_rayon from counts;

  if v_in_rayon = 0 and v_total_eligible > 0 and not p_strict_geo_only then
    insert into public.notification (
      type_notification, titre, message, canal, lue, statut_envoi,
      date_creation, id_utilisateur, id_alerte, id_dossier, url_action, donnees_supplementaires
    )
    select
      'nouvelle_alerte'::public.type_notification,
      v_alerte.titre,
      coalesce(nullif(trim(v_alerte.message_court), ''), left(coalesce(v_alerte.message, v_alerte.titre), 500)),
      coalesce(nullif(trim(p_canal), ''), 'push')::public.canal_notification,
      false,
      'en_attente'::public.statut_envoi,
      now(),
      c.id,
      v_alerte.id,
      v_alerte.id_dossier,
      '/citizen/alerts?alerte=' || v_alerte.id::text,
      jsonb_build_object(
        'traceId', v_trace,
        'source', 'diffuse_alerte_notifications',
        'event', 'nouvelle_alerte',
        'geo_fallback', true
      )
    from candidates c
    where c.lat is not null and c.lng is not null;

    get diagnostics v_inserted = row_count;
  else
    insert into public.notification (
      type_notification, titre, message, canal, lue, statut_envoi,
      date_creation, id_utilisateur, id_alerte, id_dossier, url_action, donnees_supplementaires
    )
    select
      'nouvelle_alerte'::public.type_notification,
      v_alerte.titre,
      coalesce(nullif(trim(v_alerte.message_court), ''), left(coalesce(v_alerte.message, v_alerte.titre), 500)),
      coalesce(nullif(trim(p_canal), ''), 'push')::public.canal_notification,
      false,
      'en_attente'::public.statut_envoi,
      now(),
      ir.id,
      v_alerte.id,
      v_alerte.id_dossier,
      '/citizen/alerts?alerte=' || v_alerte.id::text,
      jsonb_build_object(
        'traceId', v_trace,
        'source', 'diffuse_alerte_notifications',
        'event', 'nouvelle_alerte',
        'distance_km', round(ir.dist_km::numeric, 2)
      )
    from in_rayon ir;

    get diagnostics v_inserted = row_count;
  end if;

  select coalesce(array_agg(sub.id), array[]::uuid[])
  into v_recipient_ids
  from (
    select n.id_utilisateur as id
    from public.notification n
    where n.id_alerte = p_alerte_id
      and n.date_creation >= now() - interval '2 minutes'
  ) sub;

  update public.alerte
  set nombre_destinataires = v_inserted,
      nombre_envois_reussis = v_inserted,
      updated_at = now()
  where id = p_alerte_id;

  return jsonb_build_object(
    'inserted', v_inserted,
    'trace_id', v_trace,
    'use_geo', true,
    'centre', jsonb_build_object('lat', v_lat, 'lng', v_lng, 'rayon_km', v_rayon),
    'total_eligible', v_total_eligible,
    'with_position', v_with_position,
    'in_rayon', v_in_rayon,
    'geo_fallback', (v_in_rayon = 0 and v_inserted > 0 and not p_strict_geo_only),
    'strict_geo_only', p_strict_geo_only,
    'recipient_ids', to_jsonb(v_recipient_ids),
    'hint', case
      when v_inserted = 0 and v_with_position = 0 then 'Aucun citoyen inscrit avec GPS en base dans le rayon'
      when v_inserted = 0 then 'Aucun citoyen dans le rayon (centre alerte vs latitude_actuelle du compte inscrit)'
      else null
    end
  );
end;
$$;

create or replace function public.preview_alerte_diffusion(
  p_alerte_id uuid,
  p_strict_geo_only boolean default true,
  p_allow_without_geo boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_alerte public.alerte%rowtype;
  v_lat double precision;
  v_lng double precision;
  v_rayon double precision;
  v_use_geo boolean;
begin
  select * into v_alerte from public.alerte a where a.id = p_alerte_id;
  if not found then
    return '{"destinataires":0}'::jsonb;
  end if;

  v_lat := v_alerte.latitude_centre;
  v_lng := v_alerte.longitude_centre;
  v_rayon := coalesce(v_alerte.rayon_km, 50);
  v_use_geo := v_lat is not null and v_lng is not null;

  if not v_use_geo then
    return jsonb_build_object(
      'destinataires', case when p_allow_without_geo then (
        select count(*)::int from public.utilisateur u
        where u.type_compte::text = 'grand_public'
          and u.statut_compte::text = 'actif'
          and coalesce(u.accepte_notifications, false)
          and coalesce(u.email, '') not like 'anon-%@guest.retrouvonsles.local'
      ) else 0 end,
      'use_geo', false,
      'sans_centre', true
    );
  end if;

  return (
    with candidates as (
      select
        u.id,
        u.nom,
        u.prenom,
        u.email,
        u.latitude_actuelle as lat,
        u.longitude_actuelle as lng,
        public.haversine_km(v_lat, v_lng, u.latitude_actuelle, u.longitude_actuelle) as dist_km,
        greatest(v_rayon, coalesce(u.rayon_notification_km, v_rayon)) as rayon_effectif_km
      from public.utilisateur u
      where u.type_compte::text = 'grand_public'
        and u.statut_compte::text = 'actif'
        and coalesce(u.accepte_notifications, false) = true
        and coalesce(u.preferences_notification->>'partager_position', 'true') <> 'false'
        and coalesce(u.email, '') not like 'anon-%@guest.retrouvonsles.local'
    ),
    in_rayon as (
      select * from candidates c
      where c.lat is not null and c.lng is not null
        and c.dist_km is not null and c.dist_km <= c.rayon_effectif_km
    ),
    stats as (
      select
        (select count(*) from candidates) as total_eligible,
        (select count(*) from candidates where lat is not null) as with_position,
        (select count(*) from in_rayon) as in_rayon
    )
    select jsonb_build_object(
      'destinataires', (select in_rayon from stats),
      'total_eligible', (select total_eligible from stats),
      'with_position', (select with_position from stats),
      'in_rayon', (select in_rayon from stats),
      'use_geo', true,
      'centre', jsonb_build_object('lat', v_lat, 'lng', v_lng, 'rayon_km', v_rayon),
      'samples', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', left(ir.id::text, 8),
          'nom', ir.nom,
          'prenom', ir.prenom,
          'dist_km', round(ir.dist_km::numeric, 1),
          'rayon_effectif_km', ir.rayon_effectif_km
        )), '[]'::jsonb)
        from (select * from in_rayon order by dist_km limit 15) ir
      ),
      'excluded_hors_rayon_sample', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', left(c.id::text, 8),
          'dist_km', round(c.dist_km::numeric, 1),
          'rayon_effectif_km', c.rayon_effectif_km
        )), '[]'::jsonb)
        from (
          select * from candidates c
          where c.lat is not null and c.dist_km is not null and c.dist_km > c.rayon_effectif_km
          order by c.dist_km
          limit 10
        ) c
      )
    )
  );
end;
$$;
