-- =====================================================
-- 1) Jetons FCM : GRANT obligatoire (RLS seule ne suffit pas)
-- 2) Position citoyen : pas de UPDATE direct sur utilisateur pour authenticated
--    (GRANT SELECT seul en 20260209) → RPC SECURITY DEFINER ciblée.
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.utilisateur_fcm_token TO authenticated;
GRANT ALL ON public.utilisateur_fcm_token TO service_role;

CREATE OR REPLACE FUNCTION public.maj_position_citoyen(p_lat double precision, p_lng double precision)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'non authentifié';
  END IF;
  IF p_lat IS NULL OR p_lng IS NULL
     OR p_lat NOT BETWEEN -90::double precision AND 90::double precision
     OR p_lng NOT BETWEEN -180::double precision AND 180::double precision THEN
    RAISE EXCEPTION 'coordonnees_invalides';
  END IF;

  UPDATE public.utilisateur u
  SET
    latitude_actuelle = p_lat,
    longitude_actuelle = p_lng,
    derniere_maj_localisation = now(),
    updated_at = now()
  WHERE u.id = auth.uid()
    AND COALESCE(u.accepte_geolocalisation, false) = true
    AND NOT (COALESCE(u.preferences_notification, '{}'::jsonb) @> '{"partager_position": false}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.maj_position_citoyen(double precision, double precision) IS
  'Met à jour latitude_actuelle / longitude_actuelle pour auth.uid() (push géo alertes).';

GRANT EXECUTE ON FUNCTION public.maj_position_citoyen(double precision, double precision) TO authenticated;
