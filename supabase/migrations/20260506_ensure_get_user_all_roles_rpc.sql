-- Répare les projets Supabase où la RPC n’existe pas (PostgREST 404 sur /rpc/get_user_all_roles).
-- Idempotent : remplace la définition si déjà présente (aligné sur 20260423).

CREATE OR REPLACE FUNCTION public.get_user_all_roles(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  arr text[];
BEGIN
  SELECT coalesce(array_agg(DISTINCT r.nom_role::text), ARRAY[]::text[])
  INTO arr
  FROM public.utilisateur_role ur
  JOIN public.role r ON r.id = ur.id_role
  WHERE ur.id_utilisateur = p_user_id
    AND (ur.date_expiration IS NULL OR ur.date_expiration > now());

  IF arr IS NULL OR cardinality(arr) = 0 THEN
    RETURN ARRAY['citoyen']::text[];
  END IF;
  RETURN arr;
END;
$$;

COMMENT ON FUNCTION public.get_user_all_roles(uuid) IS
  'Liste des noms de rôles actifs pour un utilisateur (app auth).';

GRANT EXECUTE ON FUNCTION public.get_user_all_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_all_roles(uuid) TO anon;
