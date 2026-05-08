-- Réparation : RPC rôles absentes sur certains déploiements → 404 sur /rpc/get_user_main_role, etc.
-- Idempotent (CREATE OR REPLACE + GRANT).

CREATE OR REPLACE FUNCTION public.get_user_main_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.nom_role::text
      FROM public.utilisateur_role ur
      JOIN public.role r ON r.id = ur.id_role
      WHERE ur.id_utilisateur = p_user_id
        AND (ur.date_expiration IS NULL OR ur.date_expiration > now())
      ORDER BY r.niveau_accreditation DESC NULLS LAST
      LIMIT 1
    ),
    'citoyen'
  );
$$;

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

CREATE OR REPLACE FUNCTION public.get_user_with_role(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.utilisateur%ROWTYPE;
  main_role text;
  all_roles text[];
BEGIN
  SELECT * INTO rec FROM public.utilisateur WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  main_role := public.get_user_main_role(p_user_id);
  all_roles := public.get_user_all_roles(p_user_id);

  RETURN jsonb_build_object(
    'id', rec.id,
    'email', rec.email,
    'nom', rec.nom,
    'prenom', rec.prenom,
    'nom_complet', trim(both ' ' from coalesce(rec.prenom, '') || ' ' || coalesce(rec.nom, '')),
    'type_compte', rec.type_compte::text,
    'statut_compte', rec.statut_compte::text,
    'id_organisation', rec.id_organisation,
    'telephone', rec.telephone,
    'identite_verifiee', rec.identite_verifiee,
    'autorite_echelon', rec.autorite_echelon,
    'role', main_role,
    'roles', to_jsonb(all_roles)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_main_role(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_all_roles(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_with_role(uuid) TO authenticated, anon;
