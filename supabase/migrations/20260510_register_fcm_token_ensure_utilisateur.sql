-- Lors de l'enregistrement FCM, les comptes Supabase anonymes ont souvent une session
-- `auth.uid()` valide mais aucune ligne dans `public.utilisateur` tant qu'ils n'ont pas
-- passé par une inscription complète. La FK utilisateur_fcm_token → utilisateur bloque
-- alors tout INSERT de jeton. On garantit ici une ligne profil minimale (SECURITY DEFINER).

create or replace function public.register_fcm_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_token text;
  v_guest_email text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'non authentifié';
  end if;

  v_token := nullif(trim(p_token), '');
  if v_token is null then
    raise exception 'token fcm invalide';
  end if;

  -- Profil minimal si absent (ex. connexion anonyme sans passage par register()).
  if not exists (select 1 from public.utilisateur u where u.id = v_uid) then
    v_guest_email := 'anon-' || replace(v_uid::text, '-', '') || '@guest.retrouvonsles.local';
    insert into public.utilisateur (
      id,
      nom,
      prenom,
      email,
      statut_compte,
      type_compte,
      pays,
      accepte_notifications,
      accepte_geolocalisation
    )
    values (
      v_uid,
      'Invité',
      'Anonyme',
      v_guest_email,
      'actif',
      'grand_public',
      'Cameroun',
      true,
      true
    )
    on conflict (id) do nothing;
  end if;

  delete from public.utilisateur_fcm_token where token = v_token;

  insert into public.utilisateur_fcm_token (id_utilisateur, token, updated_at)
  values (v_uid, v_token, now())
  on conflict (token)
  do update set
    id_utilisateur = excluded.id_utilisateur,
    updated_at = now();

  update public.utilisateur
  set accepte_notifications = true,
      updated_at = now()
  where id = v_uid;
end;
$$;

grant execute on function public.register_fcm_token(text) to authenticated;
